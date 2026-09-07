/* ============================================================
   check-live-demos.mjs — the internal-link gate stops at the
   edge of this repository. Every external link on the page is
   a claim too, and the ones that matter most are the live
   demos: a hiring manager who clicks one and lands on a 404,
   a renamed repository, or a "this app has gone to sleep"
   screen has learned something about the portfolio that no
   passing badge can undo.

   So: request every external href on the page, follow
   redirects, and fail on anything that is not reachable. For
   Streamlit Community Cloud links the body is read as well as
   the status line, because a sleeping app answers 200 with a
   wake-up page.

   Runs on a schedule rather than on every push: these are other
   people's servers, and a transient outage should not block a
   commit. `--strict` makes sleeping apps and warnings fatal.

   No dependencies. Node 18+.
   ============================================================ */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = ["index.html", "404.html"];
const STRICT = process.argv.includes("--strict");
const TMP = os.tmpdir();
const COOKIE_JAR = path.join(TMP, "portfolio-demo-cookies.txt");
const BODY_FILE = path.join(TMP, "portfolio-demo-body.html");
const TIMEOUT_MS = 45_000;

/* Hosts that rate-limit or block unattended HEAD requests. They are still
   checked, with a GET and a browser-ish user agent. */
const NEEDS_GET = [/linkedin\.com/i, /streamlit\.app/i];

/* Streamlit's sleep screen. A 200 that says this is not a working demo. */
const ASLEEP = /has gone to sleep|get this app back up/i;

/* LinkedIn answers unattended requests with 999. It is not a broken link, it
   is a profile that refuses to be scraped, which is a different thing. */
const OK_ANYWAY = [{ host: /linkedin\.com/i, status: 999 }];

const UA =
  "Mozilla/5.0 (compatible; portfolio-link-check/1.0; +https://kushpatel29.github.io)";
const UA_BROWSER =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function externalLinks() {
  const found = new Map();
  for (const page of PAGES) {
    const file = path.join(ROOT, page);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/gi)) {
      const url = m[1].replace(/#.*$/, "");
      if (!found.has(url)) found.set(url, page);
    }
  }
  return [...found.entries()].sort();
}

/* Redirects have to be walked by hand, carrying cookies.

   Streamlit Community Cloud answers the first request with a 303 to
   /-/login?payload=... , sets a cookie, and bounces back. `fetch` with
   redirect:"follow" drops the cookie on every hop, so the handshake never
   completes and the app looks like an infinite redirect loop. It is not: with
   a cookie jar it settles in three hops. That false alarm is exactly what this
   gate must not produce. */
async function walk(url, useGet) {
  const jar = new Map();
  let current = url;
  let res;
  for (let hop = 0; hop < 8; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    try {
      res = await fetch(current, {
        method: useGet ? "GET" : "HEAD",
        redirect: "manual",
        headers: {
          "user-agent": UA,
          accept: "*/*",
          ...(cookie ? { cookie } : {}),
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(";");
      const idx = pair.indexOf("=");
      if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location"), current).toString();
      continue;
    }
    return { res, final: current };
  }
  return { res, final: current, looped: true };
}

/* Streamlit's sign-in handshake is browser-specific: it 303s to
   share.streamlit.io/-/auth/app, which answers 404 to a hand-rolled follower
   however the cookies are carried, and 200 to curl with a cookie jar. Rather
   than reverse-engineer someone else's auth flow, use the tool that already
   completes it. curl is on every GitHub runner. */
function checkWithCurl(url) {
  try {
    const out = execFileSync(
      "curl",
      // The cookie jar goes to a file, not to stdout: `-c -` interleaves the
      // jar with `-w`'s output and the status code comes back unparseable.
      ["-sS", "-L", "--max-time", "60",
       "-c", COOKIE_JAR, "-b", COOKIE_JAR,
       "-o", BODY_FILE, "-w", "%{http_code}", "-A", UA_BROWSER, url],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    const status = Number(out.trim());
    const body = fs.existsSync(BODY_FILE) ? fs.readFileSync(BODY_FILE, "utf8") : "";
    return { status, ok: status >= 200 && status < 400, asleep: ASLEEP.test(body) };
  } catch (err) {
    return { status: 0, ok: false, asleep: false, error: "curl: " + err.message };
  }
}

async function check(url) {
  if (/streamlit\.app/i.test(url)) return checkWithCurl(url);
  const useGet = NEEDS_GET.some((re) => re.test(url));
  try {
    const { res, looped } = await walk(url, useGet);
    const tolerated = OK_ANYWAY.some(
      (r) => r.host.test(url) && r.status === res.status,
    );
    const ok = (res.ok || tolerated) && !looped;
    let asleep = false;
    if (useGet && ok && /streamlit\.app/i.test(url)) {
      asleep = ASLEEP.test(await res.text());
    }
    return { status: res.status, ok, asleep, looped };
  } catch (err) {
    return { status: 0, ok: false, asleep: false, error: err.message };
  }
}

const links = externalLinks();
if (links.length === 0) {
  console.error("✗ no external links found — has the page changed shape?");
  process.exit(1);
}

let failures = 0;
let sleeping = 0;

for (const [url, page] of links) {
  const r = await check(url);
  if (!r.ok) {
    failures += 1;
    console.error(
      `✗ ${url}  (${page})  ${r.status || r.error || "unreachable"}`,
    );
  } else if (r.asleep) {
    sleeping += 1;
    console.error(`⚠ ${url}  (${page})  200 but the app is asleep`);
  } else {
    console.log(`✓ ${url}  ${r.status}`);
  }
}

console.log(
  `\n${links.length} external links checked, ` +
    `${failures} unreachable, ${sleeping} asleep`,
);

if (failures > 0 || (STRICT && sleeping > 0)) {
  console.error("\n✗ a link on the page does not lead anywhere useful");
  process.exit(1);
}
console.log("✓ every external link answers");
