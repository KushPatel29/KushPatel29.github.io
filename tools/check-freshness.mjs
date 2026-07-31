/* ============================================================
   check-freshness.mjs — the footer prints a "LAST UPDATED" date.
   A hardcoded date that nobody remembers to bump is worse than no
   date at all: it actively tells a recruiter the site is staler
   than it is, or fresher than it is.

   So it gets a test, like everything else here. If a content file
   changes and the footer date isn't moved to match, the build goes
   red and you find out before a visitor does.

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* Files whose change means the visible site changed. Deliberately not
   the CI scripts or the README — editing those isn't a site update. */
const CONTENT = ["index.html", "styles.css", "main.js", "404.html"];

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const stamp = html.match(
  /<span class="footer-updated">[^<]*<time datetime="(\d{4}-\d{2}-\d{2})">/
);

if (!stamp) {
  console.error('✗ could not find the footer "LAST UPDATED" <time datetime="…"> in index.html');
  process.exit(1);
}

const shown = stamp[1];

/* What git thinks the last real content change was. */
let lastChange = null;
try {
  /* %ct (raw Unix timestamp) rather than %cs (pre-formatted date), because
     %cs renders in the machine's local zone while `today` below is UTC. On a
     machine east of Greenwich those disagree for the first hours of the local
     day — the checker would call the commit 1 Aug and today 31 Jul, and reject
     every possible footer date. CI runs in UTC and never sees it. Formatting
     the timestamp ourselves makes the check mean the same thing everywhere. */
  const committedAt = execFileSync(
    "git",
    ["log", "-1", "--format=%ct", "--", ...CONTENT],
    { cwd: ROOT, encoding: "utf8" }
  ).trim();
  lastChange = committedAt
    ? new Date(Number(committedAt) * 1000).toISOString().slice(0, 10)
    : "";
} catch (e) {
  console.log("• git unavailable or no history here — skipping the freshness check.");
  process.exit(0);
}

if (!lastChange) {
  console.log("• no commits touching content files yet — skipping.");
  process.exit(0);
}

/* Both are YYYY-MM-DD, so a string compare is a date compare. */
console.log(`footer says:        ${shown}`);
console.log(`last content commit: ${lastChange}`);

if (shown < lastChange) {
  console.error(
    `\n✗ The footer says the site was last updated ${shown}, but content ` +
    `changed on ${lastChange}.\n` +
    `  Update the <time> in the footer of index.html to ${lastChange} ` +
    `(and the visible text next to it).\n`
  );
  process.exit(1);
}

/* A date in the future is a different kind of wrong. */
const today = new Date().toISOString().slice(0, 10);
if (shown > today) {
  console.error(`\n✗ The footer claims a last-updated date in the future (${shown} > ${today}).\n`);
  process.exit(1);
}

console.log("\n✓ the last-updated date matches the last content commit.");
