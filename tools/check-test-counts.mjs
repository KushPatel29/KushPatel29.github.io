/*
   The site's headline test count is the sum of the project-card badges.
   This gate keeps that arithmetic true across the visible hero and every
   description search engines or social previews read.
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const cardCounts = [...html.matchAll(
  /<(?:p|li)\s+class="(?:card-tests|tag-tests)">\s*(\d+)(?:\s+dbt)?\s+tests\b/gi,
)].map((match) => Number(match[1]));

if (cardCounts.length === 0) {
  console.error("✗ no project test badges found");
  process.exit(1);
}

const total = cardCounts.reduce((sum, count) => sum + count, 0);
const hero = html.match(
  /<div class="metric-value" data-count="(\d+)">(\d+)<\/div>\s*<div class="metric-label">CI-verified tests<\/div>/i,
);

if (!hero) {
  console.error("✗ could not find the CI-verified test hero counter");
  process.exit(1);
}

const heroTarget = Number(hero[1]);
const heroText = Number(hero[2]);
const metadataCounts = [...html.matchAll(/content="[^"]*\b([\d,]+) CI-verified tests\b/gi)]
  .map((match) => Number(match[1].replaceAll(",", "")));

console.log(`project badges: ${cardCounts.join(" + ")} = ${total}`);
console.log(`hero:           target ${heroTarget}, text ${heroText}`);
console.log(`metadata:       ${metadataCounts.join(", ")}`);

const wrongMetadata = metadataCounts.filter((count) => count !== total);
if (
  heroTarget !== total
  || heroText !== total
  || metadataCounts.length !== 3
  || wrongMetadata.length > 0
) {
  console.error("\n✗ test totals disagree; update cards, hero, and all three descriptions together");
  process.exit(1);
}

console.log("✓ every published test total reconciles");
