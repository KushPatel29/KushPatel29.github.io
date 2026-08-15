/* ============================================================
   check-links.mjs — the site argues that a claim should carry a
   test. A "Download Resume" button that 404s is a claim that
   didn't. So: serve the repo exactly the way GitHub Pages does,
   HEAD-request every internal href and asset path in the HTML,
   and fail the build on anything that isn't 200.

   Also resolves every in-page #fragment against the real ids, so
   a renamed section anchor can't quietly become a dead link.

   No dependencies. Node 18+.
   ============================================================ */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://kushpatel29.github.io";

/* Pages to crawl, and extra paths that nothing links to from the HTML
   but that must exist anyway. */
const PAGES = ["index.html", "404.html"];
const EXTRA_PATHS = ["/robots.txt", "/sitemap.xml", "/styles.css", "/main.js"];

/* B1: these three CTAs all have to point at exactly one file. */
const RESUME_PATH = "assets/Kush-Patel-Resume.pdf";
const RESUME_MIN_LINKS = 3;

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

/* ---------- a static server that behaves like GitHub Pages ---------- */

function resolveRequest(urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const abs = path.resolve(ROOT, "." + rel);
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return null; // no traversal
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    const index = path.join(abs, "index.html");
    return fs.existsSync(index) ? index : null;
  }
  return fs.existsSync(abs) && fs.statSync(abs).isFile() ? abs : null;
}

function startServer() {
  const server = http.createServer((req, res) => {
    const file = resolveRequest(req.url);
    if (!file) {
      res.writeHead(404, { "content-type": "text/html" });
      res.end(req.method === "HEAD" ? undefined : "not found");
      return;
    }
    const { size } = fs.statSync(file);
    res.writeHead(200, {
      "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "content-length": size,
    });
    if (req.method === "HEAD") res.end();
    else fs.createReadStream(file).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

function head(port, urlPath) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: urlPath, method: "HEAD", timeout: 10000 },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      }
    );
    req.on("timeout", () => { req.destroy(); resolve(0); });
    req.on("error", () => resolve(0));
    req.end();
  });
}

/* ---------- extract every link the browser would actually follow ---------- */

const SKIP_SCHEME = /^(mailto:|tel:|data:|javascript:|#$)/i;

function extractRefs(html) {
  const refs = new Set();

  // href="…" and src="…", single or double quoted.
  for (const m of html.matchAll(/(?:href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    refs.add((m[2] ?? m[3] ?? "").trim());
  }

  /* Absolute self-references: og:image, canonical, and the JSON-LD "url"
     fields. JSON-LD "@id" values are dropped first — they're stable
     identifiers for the graph, not anchors anyone can navigate to, so
     holding them to a real element id would be wrong. */
  const navigable = html.replace(/"@id"\s*:\s*"[^"]*"/g, '"@id":""');
  for (const m of navigable.matchAll(/https:\/\/kushpatel29\.github\.io[^\s"'<>)\\]*/gi)) {
    refs.add(m[0]);
  }

  return [...refs].filter((r) => r && !SKIP_SCHEME.test(r));
}

function idsIn(html) {
  const ids = new Set();
  for (const m of html.matchAll(/\sid\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    ids.add(m[2] ?? m[3]);
  }
  return ids;
}

/* Turn a raw href into { path, fragment } relative to the site root,
   or null if it points somewhere we don't own. */
/* Paths on this origin that are served by a sibling repo's GitHub Pages
   deployment rather than by a file in this repository. */
const PROJECT_PAGES = ["/wholesale-analytics-platform/"];

function classify(ref, fromPage) {
  let raw = ref;

  if (/^https?:\/\//i.test(raw)) {
    if (!raw.startsWith(ORIGIN)) return null; // external — not ours to verify
    raw = raw.slice(ORIGIN.length) || "/";
    /* GitHub project pages share this origin but are published from a
       different repository, so there is no file for them in this checkout.
       Resolving them locally reported a live 200 URL as a 404. They are as
       external to this repo as any other host. */
    if (PROJECT_PAGES.some((prefix) => raw.startsWith(prefix))) return null;
  } else if (/^\/\//.test(raw)) {
    return null; // protocol-relative external
  }

  const hashAt = raw.indexOf("#");
  let fragment = "";
  if (hashAt > -1) {
    fragment = raw.slice(hashAt + 1);
    raw = raw.slice(0, hashAt);
  }

  let target;
  if (raw === "") {
    target = "/" + fromPage; // same-document fragment
  } else if (raw.startsWith("/")) {
    target = raw;
  } else {
    const dir = path.posix.dirname("/" + fromPage);
    target = path.posix.normalize(path.posix.join(dir, raw));
  }

  if (target.endsWith("/")) target += "index.html";
  return { target, fragment, ref };
}

/* ---------- run ---------- */

const failures = [];
const checkedPaths = new Map(); // path -> status
let linkCount = 0;

const { server, port } = await startServer();

async function checkPath(target, context) {
  if (!checkedPaths.has(target)) {
    checkedPaths.set(target, await head(port, target));
  }
  const status = checkedPaths.get(target);
  if (status !== 200) {
    failures.push(`${context}: HEAD ${target} -> ${status || "no response"}`);
  }
  return status;
}

const pageHtml = new Map();
for (const page of PAGES) {
  const abs = path.join(ROOT, page);
  if (!fs.existsSync(abs)) {
    failures.push(`missing page: ${page}`);
    continue;
  }
  pageHtml.set(page, fs.readFileSync(abs, "utf8"));
}

for (const [page, html] of pageHtml) {
  for (const ref of extractRefs(html)) {
    const hit = classify(ref, page);
    if (!hit) continue;
    linkCount++;

    const status = await checkPath(hit.target, `${page} "${ref}"`);

    if (hit.fragment && status === 200 && hit.target.endsWith(".html")) {
      const targetFile = hit.target.replace(/^\//, "");
      const targetHtml =
        pageHtml.get(targetFile) ??
        (fs.existsSync(path.join(ROOT, targetFile))
          ? fs.readFileSync(path.join(ROOT, targetFile), "utf8")
          : null);
      if (targetHtml && !idsIn(targetHtml).has(hit.fragment)) {
        failures.push(`${page} "${ref}": no element with id="${hit.fragment}" in ${targetFile}`);
      }
    }
  }
}

for (const extra of EXTRA_PATHS) {
  linkCount++;
  await checkPath(extra, "required file");
}

/* B1: the three resume CTAs, by exact path. */
const indexHtml = pageHtml.get("index.html") ?? "";
const resumeLinks = [...indexHtml.matchAll(/href\s*=\s*"([^"]*Resume[^"]*)"/gi)].map((m) => m[1]);
const wrongPath = resumeLinks.filter((h) => h !== RESUME_PATH);
if (wrongPath.length) {
  failures.push(`resume links must all be "${RESUME_PATH}", found: ${wrongPath.join(", ")}`);
}
if (resumeLinks.length < RESUME_MIN_LINKS) {
  failures.push(`expected at least ${RESUME_MIN_LINKS} resume links, found ${resumeLinks.length}`);
}

server.close();

/* ---------- report ---------- */

console.log(`checked ${linkCount} references across ${pageHtml.size} page(s), ` +
            `${checkedPaths.size} unique paths`);
console.log(`resume CTAs found: ${resumeLinks.length} (all -> ${RESUME_PATH})`);

if (failures.length) {
  console.error(`\n✗ ${failures.length} broken reference(s):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

console.log("\n✓ every internal href and asset path returns 200, every #anchor resolves.");
