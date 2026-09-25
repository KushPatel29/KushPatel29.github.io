import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "dist", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "dist", "app.js"), "utf8");
const data = JSON.parse(fs.readFileSync(path.join(root, "dist", "data", "dashboard.json"), "utf8"));
const errors = [];
const requireText = (source, text, label) => { if (!source.includes(text)) errors.push(`${label}: missing ${text}`); };

for (const token of ["1,284", "58.1%", "12.3%", "Pipeline healthy", "kush007.chatgpt.site"]) {
  if (html.includes(token) || app.includes(token)) errors.push(`unsupported public token remains: ${token}`);
}
requireText(html, "SYNTHETIC CASE STUDY", "disclosure");
requireText(html, "not from real portfolio visitors", "disclosure");
requireText(html, "../analytics/tracking.js", "instrumentation");
requireText(html, "REFERENCE ADAPTERS · NOT ACTIVATED", "provider boundary");
requireText(app, 'fetch("./data/dashboard.json")', "generated-data binding");

if (data.metadata.eventRows !== 20) errors.push("fixture must contain exactly 20 raw events");
if (data.metadata.eligibleEvents !== 17 || data.metadata.excludedEvents !== 3) errors.push("fixture eligibility counts drifted");
if (data.datasets?.["90"]?.visitors !== "5" || data.datasets?.["90"]?.sessions !== "6") errors.push("headline fixture metrics drifted");

if (errors.length) {
  console.error(`✗ public analytics contract has ${errors.length} error(s):`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}
console.log("✓ public analytics contract: dbt fixture, disclosures, provider boundary, and generated-data binding agree");
