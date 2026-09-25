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
   Streamlit Community Cloud links the platform is also asked
   whether the app is running, because a sleeping app answers
   200 with a wake-up page. (wake-streamlit-demos.mjs is the job
   that keeps them from sleeping; this one only reports.)
   Windows uses the installed Playwright browser when available:
   Schannel can fail before HTTP in restricted sessions, which is
   not evidence that eight unrelated demos are unavailable.

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
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
let localBrowser = null;

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

/* Demos advertised in a repository README but never linked from this page.
   They used to fall outside this gate entirely, because it only reads the
   two pages above -- and cost-to-price-calculator duly went to sleep while
   its README still called it a "Live app" and the project section here sent
   readers to that repo by name. A demo is a claim wherever it is published,
   so the ones this site does not itself link are listed explicitly. */
const OFF_PAGE_DEMOS = [
  ["https://cost-to-price-calculator.streamlit.app", "cost-to-price-calculator README"],
  ["https://inventory-analytics-app.onrender.com", "inventory-analytics-app README"],
  ["https://wholesale-analytics-platform.onrender.com", "wholesale-analytics-platform README"],
];

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
  for (const [url, where] of OFF_PAGE_DEMOS) {
    if (!found.has(url)) found.set(url, where);
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

/* GitHub's HTML endpoints rate-limit shared Actions runner IPs even when every
   link exists. Validate the same repository objects through GitHub's API and
   use the workflow's read-only token in CI. This still fails deleted repos,
   branches, files and folders, without turning a transient 429 into a red
   portfolio build. */
function githubApiUrl(value) {
  const parsed = new URL(value);
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length === 1) {
    return `https://api.github.com/users/${encodeURIComponent(parts[0])}`;
  }
  if (parts.length < 2) return null;
  const [owner, repo, kind, ref, ...rest] = parts;
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  if (!["blob", "tree", "raw"].includes(kind)) return base;
  if (!ref) return null;
  const resource = rest.map(encodeURIComponent).join("/");
  return `${base}/contents/${resource}?ref=${encodeURIComponent(ref)}`;
}

async function checkGithub(url) {
  const apiUrl = githubApiUrl(url);
  if (!apiUrl) return { status: 0, ok: false, asleep: false, error: "unsupported GitHub URL" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(apiUrl, {
      headers: {
        "user-agent": UA,
        accept: "application/vnd.github+json",
        ...(GITHUB_TOKEN ? { authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
      },
      signal: controller.signal,
    });
    return { status: res.status, ok: res.ok, asleep: false, api: true };
  } catch (error) {
    return { status: 0, ok: false, asleep: false, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

/* Reading the body never catches a sleeping app under curl: the sleep screen
   is drawn by JavaScript, so a sleeping app's HTML is the same shell a running
   one serves. The platform's own status endpoint does say, with the cookie the
   page visit just set: 5 is running, 12 is asleep. */
function platformSaysAsleep(url) {
  try {
    const out = execFileSync(
      "curl",
      ["-sS", "-L", "--max-time", "30", "-c", COOKIE_JAR, "-b", COOKIE_JAR,
       "-A", UA_BROWSER, `${url.replace(/\/+$/, "")}/api/v2/app/status`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return JSON.parse(out).status === 12;
  } catch {
    return false;
  }
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
    const ok = status >= 200 && status < 400;
    return { status, ok, asleep: ASLEEP.test(body) || (ok && platformSaysAsleep(url)) };
  } catch (err) {
    return { status: 0, ok: false, asleep: false, error: "curl: " + err.message };
  }
}

function localChromiumPath() {
  const browserRoot = path.join(ROOT, ".cache", "ms-playwright");
  if (!fs.existsSync(browserRoot)) return null;
  const builds = fs.readdirSync(browserRoot).sort().reverse();
  for (const build of builds) {
    const candidates = [
      path.join(browserRoot, build, "chrome-headless-shell-win64", "chrome-headless-shell.exe"),
      path.join(browserRoot, build, "chrome-win64", "chrome.exe"),
    ];
    for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function checkWithBrowser(url) {
  try {
    const { chromium } = await import("@playwright/test");
    if (!localBrowser) {
      const executablePath = localChromiumPath();
      localBrowser = await chromium.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {}),
      });
    }
    const page = await localBrowser.newPage({ userAgent: UA_BROWSER });
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUT_MS,
      });
      await page.waitForTimeout(1_000);
      const body = await page.locator("body").innerText().catch(() => "");
      const status = response?.status() || 0;
      return {
        status,
        ok: status >= 200 && status < 400,
        asleep: ASLEEP.test(body),
        browserFallback: true,
      };
    } finally {
      await page.close();
    }
  } catch (error) {
    return { status: 0, ok: false, asleep: false, error: `browser: ${error.message}` };
  }
}

async function check(url) {
  if (/^https:\/\/github\.com\//i.test(url)) {
    const apiResult = await checkGithub(url);
    if (!apiResult.ok && !GITHUB_TOKEN && [403, 429].includes(apiResult.status)) {
      try {
        const { res, looped } = await walk(url, false);
        return { status: res.status, ok: res.ok && !looped, asleep: false, looped };
      } catch (error) {
        return { status: 0, ok: false, asleep: false, error: error.message };
      }
    }
    return apiResult;
  }
  if (/streamlit\.app/i.test(url)) {
    if (process.platform === "win32") {
      const browserResult = await checkWithBrowser(url);
      if (browserResult.ok || !/Cannot find package|browserType\.launch/i.test(browserResult.error || "")) {
        return browserResult;
      }
    }
    return checkWithCurl(url);
  }
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
let slow = 0;

/* One retry, on failure only.
   A free-tier Render dyno that has been idle for a fortnight can take longer
   than the timeout above to answer its first request, and does answer the
   second. That happened on 2026-09-09: thirty links, all reachable from a
   laptop minutes later, and the build was red. A one-shot check against thirty
   third-party hosts will do that periodically, and a gate that cries wolf is a
   gate people stop reading.

   This does not weaken it. A link that is genuinely dead fails twice, and one
   that needed a second ask is reported as such rather than quietly passed —
   a demo that takes a minute to wake is worth knowing about, just not worth
   failing a build over. */
async function checkTwice(url) {
  const first = await check(url);
  if (first.ok) return first;
  await new Promise((r) => setTimeout(r, 5_000));
  const second = await check(url);
  return second.ok ? { ...second, retried: true } : second;
}

for (const [url, page] of links) {
  const r = await checkTwice(url);
  if (!r.ok) {
    failures += 1;
    console.error(
      `✗ ${url}  (${page})  ${r.status || r.error || "unreachable"}`,
    );
  } else if (r.retried) {
    slow += 1;
    console.log(`✓ ${url}  ${r.status}  (answered on the second ask)`);
  } else if (r.asleep) {
    sleeping += 1;
    console.error(`⚠ ${url}  (${page})  200 but the app is asleep`);
  } else if (r.browserFallback) {
    console.log(`✓ ${url}  ${r.status}  (checked in Chromium)`);
  } else {
    console.log(`✓ ${url}  ${r.status}`);
  }
}

console.log(
  `\n${links.length} external links checked, ` +
    `${failures} unreachable, ${sleeping} asleep` +
    (slow ? `, ${slow} answered only on the second ask` : ""),
);

if (localBrowser) await localBrowser.close();

if (failures > 0 || (STRICT && sleeping > 0)) {
  console.error("\n✗ a link on the page does not lead anywhere useful");
  process.exit(1);
}
console.log("✓ every external link answers");
