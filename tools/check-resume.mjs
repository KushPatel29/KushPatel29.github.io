/* ============================================================
   check-resume.mjs — the résumé and the page are read in the
   same sitting, so they are one document with two layouts.

   They had drifted into contradicting each other. The PDF said
   the Two Rivers role was current; the experience section here
   said it ended in June 2026. It put Toronto in the header
   while the byline said Vancouver. Five calls-to-action on this
   page link to that file, so a reader hit both claims within a
   minute of each other — and the only reading available to them
   is that one of the two was being dressed up.

   Nothing could catch it: every gate here reads index.html, and
   the résumé was a binary blob with no source. It has a source
   now (resume/resume.html), which makes the three facts they
   share checkable as text.

   Checked: employment end date, city, and the published test
   total. Not the PDF itself — parsing one without dependencies
   is fragile, and resume/build.sh already asserts the PDF's
   shape at the point it is produced.

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const RESUME_SRC = path.join(ROOT, "resume", "resume.html");
if (!fs.existsSync(RESUME_SRC)) {
  console.error("✗ resume/resume.html is missing — the PDF has no source again");
  process.exit(1);
}
const resume = fs.readFileSync(RESUME_SRC, "utf8");

/* The PDF the site actually hands out has to exist, whatever the source says. */
const PDF = path.join(ROOT, "assets", "Kush-Patel-Resume.pdf");
if (!fs.existsSync(PDF)) {
  console.error("✗ assets/Kush-Patel-Resume.pdf is missing");
  process.exit(1);
}

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const failures = [];
const rows = [];

function compare(label, siteValue, resumeValue) {
  const ok = siteValue !== null && resumeValue !== null
    && String(siteValue).toLowerCase() === String(resumeValue).toLowerCase();
  rows.push([label, siteValue ?? "not found", resumeValue ?? "not found", ok]);
  if (!ok) failures.push(label);
}

/* ---- 1. when the Two Rivers role ended ------------------------------ */
/* The site states it as a machine-readable <time datetime="YYYY-MM">. */
const siteEnd = html.match(
  /<time datetime="2023-12">[^<]*<\/time>\s*—\s*<time datetime="(\d{4})-(\d{2})">/i,
);
const resumeEnd = resume.match(
  /Dec 2023\s*&ndash;\s*([A-Z][a-z]{2}) (\d{4})/,
);
compare(
  "Two Rivers end date",
  siteEnd ? `${siteEnd[1]}-${siteEnd[2]}` : null,
  resumeEnd
    ? `${resumeEnd[2]}-${String(MONTHS.indexOf(resumeEnd[1].toLowerCase()) + 1).padStart(2, "0")}`
    : null,
);

/* ---- 2. which city he says he is in --------------------------------- */
const siteCity = html.match(/<span class="byline-role">[^<]*·\s*([A-Za-z .]+?,\s*[A-Z]{2})\s*<\/span>/);
const resumeCity = resume.match(/<span class="item">([A-Za-z .]+?,\s*[A-Z]{2})<\/span>/);
compare(
  "stated location",
  siteCity ? siteCity[1].trim() : null,
  resumeCity ? resumeCity[1].trim() : null,
);

/* ---- 3. the test total both of them quote --------------------------- */
/* Anchored on its label: the hero band opens with a repo counter that also
   matches a bare data-count, and reading that instead compares 14 to 4,763. */
const siteTotal = html.match(
  /<div class="metric-value" data-count="(\d+)">\d+<\/div>\s*<div class="metric-label">CI-verified tests<\/div>/i,
);
const resumeTotal = resume.match(/([\d,]+) automated tests/);
compare(
  "published test total",
  siteTotal ? Number(siteTotal[1]) : null,
  resumeTotal ? Number(resumeTotal[1].replaceAll(",", "")) : null,
);

const width = Math.max(...rows.map((r) => r[0].length));
for (const [label, a, b, ok] of rows) {
  console.log(`${ok ? "✓" : "✗"} ${label.padEnd(width)}  site: ${String(a).padEnd(14)} résumé: ${b}`);
}

if (failures.length > 0) {
  console.error(
    `\n✗ the résumé and the page disagree on: ${failures.join(", ")}.`,
  );
  console.error("  They are handed to the same reader minutes apart — fix both together,");
  console.error("  then rebuild the PDF with `bash resume/build.sh`.");
  process.exit(1);
}

console.log("\n✓ the résumé and the page tell the same story");
