/* ============================================================
   check-headline-counts.mjs — the page states how many projects
   there are and how many run live: in the hero band, in the
   descriptions a link preview shows, and in the prose. Those are
   the same two facts the manifest records, so they are held to it.

   Every phrase listed must be present. A rewrite that drops one
   should update COUNT_CLAIMS rather than leave a number nobody
   checks — "Fifteen" in a heading drifts as easily as "15" in a
   badge, and nothing else on the page reads headings.

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "portfolio-manifest.json"), "utf8"));
const errors = [];
const fail = (message) => errors.push(message);

function textOnly(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&amp;", "&")
    .replace(/\s+/g, " ")
    .trim();
}

const manifestCount = (manifest.projects ?? []).length;
const liveCount = (manifest.projects ?? []).filter((item) => item.liveStatus === "live-demo").length;
const WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};
const asNumber = (token) => (/^\d+$/.test(token) ? Number(token) : WORDS[token.toLowerCase()]);
const plain = textOnly(html);
const COUNT_CLAIMS = [
  ["hero project counter", /data-count="(\d+)" data-metric="projects"/g, manifestCount, html],
  ["hero live-demo counter", /data-count="(\d+)" data-metric="live-demos"/g, liveCount, html],
  ["description: public projects", /content="[^"]*?\b(\d+) public projects\b/g, manifestCount, html],
  ["description: live demos", /content="[^"]*?\b(\d+) live demos\b/g, liveCount, html],
  ["work heading", /\b([A-Z][a-z]+) projects, each ending in a finding\b/g, manifestCount, plain],
  ["work summary", /\b([A-Z][a-z]+) run live in the browser\b/g, liveCount, plain],
  ["role fit CI row", /\bAll (\d+) public repositories run their test suites\b/g, manifestCount, plain],
  ["FAQ: repositories", /\bAll (\d+) repositories are public\b/g, manifestCount, plain],
  ["FAQ: live demos", /\b(\d+) also run as live demos\b/g, liveCount, plain],
];
for (const [label, pattern, expected, source] of COUNT_CLAIMS) {
  const hits = [...source.matchAll(pattern)].map((m) => asNumber(m[1]));
  if (hits.length === 0) {
    fail(`${label}: phrase not found — update COUNT_CLAIMS if the copy changed`);
  }
  for (const value of hits) {
    if (value !== expected) fail(`${label}: says ${value}, manifest says ${expected}`);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} headline count(s) disagree with the manifest:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`✓ ${COUNT_CLAIMS.length} count claims: ${manifestCount} projects, ${liveCount} live demos, matching the manifest`);
