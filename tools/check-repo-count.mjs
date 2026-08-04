/* ============================================================
   check-repo-count.mjs — the filter bar prints "SHOWING n / N REPOS".

   main.js overwrites that span on load, computing N from the number
   of .project cards actually in the DOM. But the static HTML carries
   a hardcoded fallback, and anything that doesn't execute JS — a
   crawler, a text browser, a recruiter with scripts off, the preview
   card a link unfurls into — reads the fallback instead.

   A fallback that nobody remembers to bump is the same failure mode
   as a stale "last updated" date: it quietly understates the work.
   So the two get tied together here. Add or remove a project card
   and this goes red until the fallback matches.

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const js = fs.readFileSync(path.join(ROOT, "main.js"), "utf8");

/* The selector main.js actually uses. If someone changes it there, the
   two sides have stopped agreeing and this check is measuring the wrong
   thing — so assert it rather than assume it. */
if (!js.includes('querySelectorAll(".project")')) {
  console.error(
    '✗ main.js no longer counts with querySelectorAll(".project").\n' +
    "  This check counts .project cards to mirror it. Update both together."
  );
  process.exit(1);
}

/* Count elements carrying the `project` class, matching CSS semantics:
   class="feature-main project" and class="project card" both count,
   class="projects-intro" does not. */
const cards = [...html.matchAll(/<[a-z]+\b[^>]*\sclass="([^"]*)"/gi)].filter(
  (m) => m[1].split(/\s+/).includes("project")
).length;

const shown = html.match(
  /<span class="filter-count" id="work-count"[^>]*>SHOWING (\d+) \/ (\d+) REPOS<\/span>/
);

if (!shown) {
  console.error('✗ could not find the #work-count "SHOWING n / N REPOS" fallback in index.html');
  process.exit(1);
}

const [, fallbackShown, fallbackTotal] = shown.map(Number);

console.log(`.project cards in the DOM: ${cards}`);
console.log(`hardcoded fallback:        SHOWING ${fallbackShown} / ${fallbackTotal} REPOS`);

if (cards === 0) {
  console.error("\n✗ no .project cards found — the parser or the markup changed.\n");
  process.exit(1);
}

/* Unfiltered is the state the static HTML ships in, so both halves are N. */
if (fallbackTotal !== cards || fallbackShown !== cards) {
  console.error(
    `\n✗ The no-JS fallback says "SHOWING ${fallbackShown} / ${fallbackTotal} REPOS", ` +
    `but there are ${cards} .project cards on the page.\n` +
    `  Set it to "SHOWING ${cards} / ${cards} REPOS" in index.html.\n`
  );
  process.exit(1);
}

console.log("\n✓ the no-JS repo count matches the number of project cards.");
