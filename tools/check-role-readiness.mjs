/* Keep the visible role scores tied to the certification-free scorecard. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scorecard = JSON.parse(fs.readFileSync(path.join(root, "role-readiness.json"), "utf8"));
const failures = [];

if (scorecard.schemaVersion !== 1) failures.push("schemaVersion must be 1");
if (scorecard.certificationsIncluded !== false) failures.push("certifications must remain excluded");
const weight = Object.values(scorecard.weights ?? {}).reduce((sum, value) => sum + value, 0);
if (Math.abs(weight - 1) > 1e-9) failures.push(`weights add to ${weight}, not 1`);

const slugs = {
  "Data Analyst": "data-analyst",
  "BI / Power BI Developer": "bi-developer",
  "Analytics Engineer": "analytics-engineer",
  "Data Engineer": "data-engineer",
  "Business Analyst": "business-analyst",
  "Financial Analyst": "financial-analyst",
  "Supply Chain & Operations Analyst": "supply-chain-analyst",
  "Data Scientist": "data-scientist",
};

for (const item of scorecard.roles ?? []) {
  if (!(item.role in slugs)) failures.push(`unknown role: ${item.role}`);
  if (typeof item.score !== "number" || item.score < 9 || item.score > 10) {
    failures.push(`${item.role}: score ${item.score} is outside 9–10`);
  }
  if (!Array.isArray(item.evidence) || item.evidence.length < 3) {
    failures.push(`${item.role}: evidence list is too short`);
  }
  if ((item.evidence ?? []).some((value) => /certif/i.test(value))) {
    failures.push(`${item.role}: certification text appears in evidence`);
  }
  const slug = slugs[item.role];
  const panel = html.match(new RegExp(`<article class="fit-panel" id="fit-${slug}"[\\s\\S]*?<\\/article>`));
  if (!panel) {
    failures.push(`${item.role}: panel not found`);
    continue;
  }
  const shown = panel[0].match(/<span class="fit-score"[^>]*>([\d.]+) \/ 10<\/span>/);
  if (!shown || Number(shown[1]) !== item.score) {
    failures.push(`${item.role}: site score does not match scorecard`);
  }
}

if ((scorecard.roles ?? []).length !== Object.keys(slugs).length) {
  failures.push(`expected ${Object.keys(slugs).length} roles, found ${scorecard.roles?.length ?? 0}`);
}

if (failures.length) {
  console.error("Role-readiness scorecard failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("✓ eight role scores are 9+, certification-free, and match the visible evidence panels");
