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

   Checked: employment end date, city, master's end date, and that
   every project the résumé names is on the page. Not the PDF itself — parsing one without dependencies
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

/* Role variants: the same person, dates and projects, ordered for one role
   family. Each is held to every check below, and its PDF must exist and be
   offered on the page, or a reader could be handed a CV the site never shows. */
const ROLES_DIR = path.join(ROOT, "resume", "roles");
const SOURCES = [["resume.html", RESUME_SRC, "Kush-Patel-Resume.pdf"]];
if (fs.existsSync(ROLES_DIR)) {
  for (const file of fs.readdirSync(ROLES_DIR).filter((f) => f.endsWith(".html")).sort()) {
    const text = fs.readFileSync(path.join(ROLES_DIR, file), "utf8");
    const pdf = (text.match(/<meta name="resume-pdf" content="([^"]+)">/) || [])[1];
    SOURCES.push([`roles/${file}`, path.join(ROLES_DIR, file), pdf ?? null]);
  }
}


const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const failures = [];
const rows = [];

function compareAs(label, siteValue, resumeValue) {
  const ok = siteValue !== null && resumeValue !== null
    && String(siteValue).toLowerCase() === String(resumeValue).toLowerCase();
  rows.push([label, siteValue ?? "not found", resumeValue ?? "not found", ok]);
  if (!ok) failures.push(label);
}

for (const [label, file, pdf] of SOURCES) {
  const resume = fs.readFileSync(file, "utf8");
  const compare = (what, a, b) => compareAs(`${label}: ${what}`, a, b);

  /* The PDF the site hands out has to exist, and a variant's has to be offered. */
  if (!pdf || !fs.existsSync(path.join(ROOT, "assets", pdf))) {
    rows.push([`${label}: PDF`, "", pdf ?? "no <meta name=resume-pdf>", false]);
    failures.push(`${label} PDF`);
  } else if (label !== "resume.html") {
    const linked = html.includes(`href="assets/${pdf}"`);
    rows.push([`${label}: offered on the page`, linked ? "linked" : "not linked", pdf, linked]);
    if (!linked) failures.push(`${label} not linked`);
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

  /* ---- 3. no headline test total on either ----------------------------- */
  /* Test counts left the page: a total mostly measures parametrization, and a
     reviewer who checks discounts it. The résumé must not bring one back. */
  if (/[\d,]{3,}\s+automated tests/i.test(resume)) {
    rows.push([`${label}: no headline test total`, "none", "present", false]);
    failures.push(`${label} headline test total`);
  }

  /* ---- 4. when the master's finished ---------------------------------- */
  /* The site said MAR 2024 and the PDF said APR 2024. Small, and exactly the
     kind of thing a reader notices while cross-checking two documents. */
  const siteEdu = html.match(
    /<p class="edu-period"><time datetime="2022-09">[^<]*<\/time>\s*—\s*<time datetime="(\d{4})-(\d{2})">/i,
  );
  const resumeEdu = resume.match(/Sep 2022\s*&ndash;\s*([A-Z][a-z]{2}) (\d{4})/);
  compare(
    "master's end date",
    siteEdu ? `${siteEdu[1]}-${siteEdu[2]}` : null,
    resumeEdu
      ? `${resumeEdu[2]}-${String(MONTHS.indexOf(resumeEdu[1].toLowerCase()) + 1).padStart(2, "0")}`
      : null,
  );

  /* ---- 5. every project the résumé names is on the page ---------------- */
  /* The résumé lists a few projects by repository. Each must be a card here,
     so a reader who follows the résumé to the site finds the same work. */
  const cardRepos = new Set();
  for (const [cardHtml] of html.matchAll(/<article\b[^>]*\bid="p-[a-z-]+"[\s\S]*?<\/article>/gi)) {
    for (const m of cardHtml.matchAll(/github\.com\/KushPatel29\/([A-Za-z0-9_.-]+)/g)) cardRepos.add(m[1].toLowerCase());
  }
  const resumeRepos = [...new Set([...resume.matchAll(/<div class="proj-url"><a href="https:\/\/github\.com\/KushPatel29\/([A-Za-z0-9_.-]+)"/g)].map((m) => m[1]))];
  if (resumeRepos.length === 0) {
    rows.push([`${label}: projects`, "", "none found", false]);
    failures.push(`${label} has no projects`);
  }
  for (const repo of resumeRepos) {
    const ok = cardRepos.has(repo.toLowerCase());
    rows.push([`${label}: ${repo} on the page`, ok ? "card" : "missing", "listed", ok]);
    if (!ok) failures.push(`${label} ${repo} card`);
  }
}

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
