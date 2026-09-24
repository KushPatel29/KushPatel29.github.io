/* ============================================================
   check-role-fit-skill.mjs — the job-fit skill argues from
   evidence, so its evidence has to be current.

   .claude/skills/role-fit-analysis compares each job posting with
   what Kush can prove. Most of that it reads live from the
   published files (scripts/evidence-snapshot.mjs), but its
   fallback ledger (references/evidence-inventory.md) is a copy,
   and a copy drifts: a project gains tests, a date moves, a
   seventeenth card appears, and the skill starts telling a
   hiring decision something the site no longer says.

   Checked:
     - SKILL.md frontmatter names the skill and its description
       fits the 1024-character limit skills are loaded with
     - every file SKILL.md points at exists
     - the inventory's project table is the manifest's: same
       titles, anchors and test counts, nothing extra
     - the inventory's totals line matches the manifest totals
     - both employment periods match the résumé
     - the snapshot script runs and covers every project and
       every Role fit view
     - tmp/ is still gitignored, because that is where the skill
       is told to keep application reports

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILL_DIR = path.join(ROOT, ".claude", "skills", "role-fit-analysis");
const rel = (p) => path.relative(ROOT, p);

const failures = [];
const fail = (msg) => failures.push(msg);
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);

/* ---------- SKILL.md ---------- */
const skillPath = path.join(SKILL_DIR, "SKILL.md");
const skill = read(skillPath);
if (!skill) {
  console.error(`✗ ${rel(skillPath)} is missing`);
  process.exit(1);
}
const front = skill.match(/^---\n([\s\S]*?)\n---\n/);
if (!front) {
  fail("SKILL.md has no YAML frontmatter");
} else {
  const name = front[1].match(/^name:\s*(.+)$/m)?.[1].trim();
  const description = front[1].match(/^description:\s*(.+)$/m)?.[1].trim();
  if (name !== "role-fit-analysis") fail(`SKILL.md name is "${name}", expected "role-fit-analysis" (the folder name)`);
  if (!description) fail("SKILL.md has no description — nothing would ever trigger it");
  else if (description.length > 1024) fail(`SKILL.md description is ${description.length} characters; the limit is 1024`);
}

for (const ref of new Set(skill.match(/(?:references|scripts)\/[\w.-]+/g) || [])) {
  if (!fs.existsSync(path.join(SKILL_DIR, ref))) fail(`SKILL.md points at ${ref}, which does not exist`);
}

/* ---------- inventory vs manifest ---------- */
const manifest = JSON.parse(read(path.join(ROOT, "portfolio-manifest.json")));
const invPath = path.join(SKILL_DIR, "references", "evidence-inventory.md");
const inv = read(invPath) || "";
if (!inv) fail(`${rel(invPath)} is missing`);

const totals = inv.match(/^manifest-totals:\s*(\d+) projects · (\d+) tests$/m);
if (!totals) {
  fail('inventory has no "manifest-totals: N projects · M tests" line');
} else {
  if (Number(totals[1]) !== manifest.totals.promotedProjects)
    fail(`inventory says ${totals[1]} projects; the manifest has ${manifest.totals.promotedProjects}`);
  if (Number(totals[2]) !== manifest.totals.automatedTests)
    fail(`inventory says ${totals[2]} tests; the manifest has ${manifest.totals.automatedTests}`);
}

/* The §7 table: | Title | anchor | tests | data | live | strongest for | */
const section = inv.split(/^## 7\. Projects$/m)[1] || "";
const rows = new Map();
for (const line of section.split("\n")) {
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length < 5 || !/^p-/.test(cells[2] || "")) continue;
  rows.set(cells[1], { anchor: cells[2], tests: Number(cells[3]), data: cells[4] });
}
if (!rows.size) fail("inventory §7 project table not found or empty");

for (const p of manifest.projects) {
  const row = rows.get(p.title);
  if (!row) {
    fail(`inventory §7 has no row for "${p.title}"`);
    continue;
  }
  if (row.anchor !== p.cardId) fail(`"${p.title}": inventory anchor ${row.anchor}, manifest ${p.cardId}`);
  if (row.tests !== p.testCount) fail(`"${p.title}": inventory says ${row.tests} tests, manifest ${p.testCount}`);
  if (row.data !== p.dataClassification) fail(`"${p.title}": inventory data "${row.data}", manifest "${p.dataClassification}"`);
  rows.delete(p.title);
}
for (const title of rows.keys()) fail(`inventory §7 lists "${title}", which is not in the manifest`);

/* ---------- employment periods vs résumé ---------- */
const resume = read(path.join(ROOT, "resume", "resume.html")) || "";
const norm = (s) => s.replace(/&ndash;|–/g, "-").replace(/\s+/g, " ");
const jobs = [...resume.matchAll(/<span class="job-org">([^<]+)<\/span>\s*<span class="job-when">([^<]+?)\s*(?:&middot;|·)/g)];
if (!jobs.length) fail("could not read employment periods from resume/resume.html");
for (const [, org, when] of jobs) {
  const want = norm(when).trim();
  const line = inv.split("\n").find((l) => l.includes(org.trim()));
  if (!line) fail(`inventory §2 does not mention ${org.trim()}`);
  else if (!norm(line).includes(want)) fail(`inventory §2 dates for ${org.trim()} do not include "${want}" from the résumé`);
}

/* ---------- snapshot runs and covers everything ---------- */
let snapshot = "";
try {
  snapshot = execFileSync(process.execPath, [path.join(SKILL_DIR, "scripts", "evidence-snapshot.mjs")], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch (e) {
  fail(`evidence-snapshot.mjs failed: ${(e.stderr || e.message).trim().split("\n")[0]}`);
}
if (snapshot) {
  for (const p of manifest.projects) if (!snapshot.includes(p.title)) fail(`snapshot output is missing "${p.title}"`);
  const html = read(path.join(ROOT, "index.html"));
  const views = [...html.matchAll(/<article class="fit-panel" id="fit-([a-z-]+)"/g)].map((m) => m[1]);
  for (const v of views) {
    const block = snapshot.split(`### ${v}`)[1]?.split("\n### ")[0] || "";
    if (!/^- \[(PAID|PROJECT|DEGREE)\]/m.test(block)) fail(`snapshot shows no sourced rows for the ${v} Role fit view`);
  }
  if (!/Two Rivers Specialty Meats/.test(snapshot)) fail("snapshot résumé section lost the Experience entries");
}

/* ---------- privacy ---------- */
const ignore = read(path.join(ROOT, ".gitignore")) || "";
if (!/^tmp\/$/m.test(ignore)) fail("tmp/ is no longer gitignored, but the skill saves application reports there");

if (failures.length) {
  console.error("✗ role-fit skill has drifted from the evidence it cites:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`✓ role-fit skill: ${manifest.projects.length} projects, résumé dates and Role fit views match the published evidence`);
