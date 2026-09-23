/* ============================================================
   check-role-fit.mjs — Role fit is a worksheet of claims: each row
   says a requirement was met, and where. The page's whole argument
   is that its claims are checkable, so this one is checked too.

   Per role panel:
     - its id, data-role and tab agree, so ?role=<slug> and
       #fit-<slug> both land on it;
     - every row names its source (paid / project / degree), and the
       chip a reader sees says the same thing as the tick;
     - the "Tied out" totals equal the rows above them — a footer
       that says 5 paid roles over a column holding 4 is exactly the
       kind of sum this page exists to refuse;
     - its reading list is three links to things on this page.

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const LABELS = { paid: "Paid role", project: "Public project", degree: "Master’s" };
const failures = [];
const fail = (message) => failures.push(message);

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const tabs = new Map(
  [...html.matchAll(/<a class="fit-tab" id="fit-tab-([a-z-]+)" href="#fit-([a-z-]+)">/g)]
    .map((m) => [m[1], m[2]]),
);
const panels = [...html.matchAll(
  /<article class="fit-panel" id="fit-([a-z-]+)" data-role="([a-z-]+)"[\s\S]*?<\/article>/g,
)];

if (panels.length === 0) {
  console.error("✗ no role-fit panels found — did the markup change shape?");
  process.exit(1);
}
if (tabs.size !== panels.length) {
  fail(`${tabs.size} role tabs for ${panels.length} panels`);
}

const summary = [];

for (const [panelHtml, idSlug, dataSlug] of panels) {
  const label = `fit-${idSlug}`;
  if (idSlug !== dataSlug) fail(`${label}: id says ${idSlug}, data-role says ${dataSlug}`);
  if (tabs.get(idSlug) !== idSlug) fail(`${label}: no tab points at this panel`);

  const rows = [...panelHtml.matchAll(/<tr data-source="([a-z]+)">([\s\S]*?)<\/tr>/g)];
  if (rows.length < 4) fail(`${label}: only ${rows.length} requirement rows`);

  const counts = { paid: 0, project: 0, degree: 0 };
  rows.forEach(([, source, rowHtml], index) => {
    if (!(source in counts)) {
      fail(`${label} row ${index + 1}: unknown source "${source}"`);
      return;
    }
    counts[source] += 1;
    const chip = rowHtml.match(/<span class="src src-([a-z]+)">([^<]+)<\/span>/);
    if (!chip) {
      fail(`${label} row ${index + 1}: no source chip`);
    } else if (chip[1] !== source || chip[2].trim() !== LABELS[source]) {
      fail(`${label} row ${index + 1}: tick says ${source}, chip says "${chip[2].trim()}"`);
    }
    if (!/<th scope="row">[^<]+<\/th>/.test(rowHtml)) {
      fail(`${label} row ${index + 1}: requirement is not a row header`);
    }
  });

  const foot = panelHtml.match(
    /<tfoot><tr data-paid="(\d+)" data-project="(\d+)" data-degree="(\d+)">([\s\S]*?)<\/tr><\/tfoot>/,
  );
  if (!foot) {
    fail(`${label}: no totals row`);
  } else {
    const [, paid, project, degree, footHtml] = foot;
    const declared = { paid: Number(paid), project: Number(project), degree: Number(degree) };
    for (const key of Object.keys(counts)) {
      if (declared[key] !== counts[key]) {
        fail(`${label}: totals row says ${declared[key]} ${key}, rows hold ${counts[key]}`);
      }
    }
    const shown = [...footHtml.matchAll(/<span class="tie"><span>([^<]+)<\/span><b>(\d+)<\/b><\/span>/g)]
      .map((m) => [m[1], Number(m[2])]);
    const expectShown = [
      ["Paid roles", counts.paid],
      ["Public projects", counts.project],
      ...(counts.degree ? [["Master’s", counts.degree]] : []),
    ];
    if (JSON.stringify(shown) !== JSON.stringify(expectShown)) {
      fail(`${label}: visible totals ${JSON.stringify(shown)} != rows ${JSON.stringify(expectShown)}`);
    }
  }

  const reading = [...panelHtml.matchAll(/<ol class="fit-start">([\s\S]*?)<\/ol>/g)];
  const targets = reading.length
    ? [...reading[0][1].matchAll(/<a href="#([^"]+)">/g)].map((m) => m[1])
    : [];
  if (targets.length !== 3) fail(`${label}: reading list has ${targets.length} links, not 3`);
  for (const target of targets) {
    if (!ids.has(target)) fail(`${label}: reading list points at #${target}, which does not exist`);
    if (!target.startsWith("p-") && target !== "business-analysis") {
      fail(`${label}: reading list should open a project card, not #${target}`);
    }
  }

  const mail = panelHtml.match(/href="mailto:[^"?]+\?subject=([^"]+)"/);
  if (!mail) fail(`${label}: no role-specific email link`);

  summary.push(`${idSlug.padEnd(22)} ${rows.length} rows · paid ${counts.paid} · project ${counts.project}` +
    (counts.degree ? ` · degree ${counts.degree}` : ""));
}

for (const line of summary) console.log(`  ${line}`);

if (failures.length) {
  console.error(`\n✗ role fit has ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`\n✓ ${panels.length} role panels: every row is sourced, every total adds up, every link lands`);
