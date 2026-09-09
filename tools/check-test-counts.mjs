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
  /<div class="metric-value" data-count="(\d+)">(\d+)<\/div>\s*<div class="metric-label">Automated tests[^<]*<\/div>/i,
);

if (!hero) {
  console.error("✗ could not find the CI-verified test hero counter");
  process.exit(1);
}

const heroTarget = Number(hero[1]);
const heroText = Number(hero[2]);
const metadataCounts = [...html.matchAll(/content="[^"]*\b([\d,]+) Automated tests\b/gi)]
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

/*
   A card can also print its test count a second time, in a "CI TESTS" stat
   tile a few centimetres under its own badge. Nothing read those tiles, so
   three of them sat at numbers the cards had long outgrown -- healthcare
   showed 182 against 171, migration 88 against 11. On a page whose whole
   argument is that its numbers are checked, a card disagreeing with itself
   is the most expensive kind of stale. Each tile must equal the badge on
   the card it belongs to.
*/
const cards = [...html.matchAll(/<article\b[^>]*\bid="(p-[a-z-]+)"[\s\S]*?<\/article>/gi)];
const tileMismatches = [];

for (const [cardHtml, cardId] of cards) {
  const badge = cardHtml.match(
    /<(?:p|li)\s+class="(?:card-tests|tag-tests)">\s*(\d+)(?:\s+dbt)?\s+tests\b/i,
  );
  if (!badge) continue;

  for (const tile of cardHtml.matchAll(
    /<div class="stat-v">([\d,]+)<\/div>\s*<div class="stat-k">[^<]*\bTESTS?\b[^<]*<\/div>/gi,
  )) {
    const tileCount = Number(tile[1].replaceAll(",", ""));
    if (tileCount !== Number(badge[1])) {
      tileMismatches.push(`${cardId}: badge ${badge[1]}, stat tile ${tile[1]}`);
    }
  }
}

if (tileMismatches.length > 0) {
  console.error(`\n✗ ${tileMismatches.length} card(s) disagree with themselves:`);
  for (const line of tileMismatches) console.error(`    ${line}`);
  console.error("  a card's CI TESTS tile must match its own badge");
  process.exit(1);
}

/*
   A card can print its count a third time, in prose. The marketing card's
   badge said 91 while the sentence four lines under it said 90 -- the badge
   and the stat tile agreed with each other and with the repo, so every gate
   above this one passed. On a page whose whole argument is that its numbers
   are checked, a card contradicting itself in the paragraph a reader actually
   reads is the most expensive kind of stale. Any count written as "N tests"
   anywhere inside a card must equal that card's badge.
*/
const proseMismatches = [];

for (const [cardHtml, cardId] of cards) {
  const badge = cardHtml.match(
    /<(?:p|li)\s+class="(?:card-tests|tag-tests)">\s*(\d+)(?:\s+dbt)?\s+tests\b/i,
  );
  if (!badge) continue;

  const prose = cardHtml
    .replace(/<(p|li)\s+class="(?:card-tests|tag-tests)">[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  for (const hit of prose.matchAll(/([\d,]+)\s+(?:dbt\s+)?(?:unit\s+)?tests?\b/gi)) {
    const said = Number(hit[1].replaceAll(",", ""));
    if (said !== Number(badge[1])) {
      proseMismatches.push(`${cardId}: badge ${badge[1]}, prose says ${hit[1]}`);
    }
  }
}

if (proseMismatches.length > 0) {
  console.error(`\n✗ ${proseMismatches.length} card(s) contradict their own badge in prose:`);
  for (const line of proseMismatches) console.error(`    ${line}`);
  console.error("  a card's prose must not quote a test count its badge disagrees with");
  process.exit(1);
}

console.log(`prose counts:   every "N tests" written inside a card matches its badge`);

console.log(`stat tiles:     ${cards.length} cards scanned, every CI TESTS tile matches its badge`);
console.log("✓ every published test total reconciles");
