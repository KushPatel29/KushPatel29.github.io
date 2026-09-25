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
const fixture = data.fixture;
if (fixture?.visitors !== "5" || fixture?.sessions !== "6") errors.push("headline fixture metrics drifted");

// Every trend the page draws must come from the fixture's daily rows: no
// hard-coded sparkline paths, and the daily rows must add up to the window.
for (const [, body] of html.matchAll(/<svg class="sparkline[^"]*"[^>]*>([\s\S]*?)<\/svg>/g)) {
  if (body.trim()) errors.push("a sparkline carries hard-coded drawing instead of fixture data");
}
requireText(app, "renderSparklines(data.daily", "sparkline binding");
const daily = fixture?.daily || [];
if (daily.length !== data.metadata.windowDays) errors.push(`daily rows (${daily.length}) do not cover the ${data.metadata.windowDays}-day window`);
const total = key => daily.reduce((sum, day) => sum + day[key], 0);
if (String(total("sessions")) !== fixture?.sessions) errors.push("daily sessions do not add up to the fixture total");

// One fixture window means one set of numbers: a date-range control that
// cannot change anything reads as broken or staged.
if (/data-range=/.test(html)) errors.push("a date-range control is back, but the fixture has a single window");

if (errors.length) {
  console.error(`✗ public analytics contract has ${errors.length} error(s):`);
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}
console.log("✓ public analytics contract: dbt fixture, disclosures, provider boundary, generated-data binding and data-driven sparklines agree");
