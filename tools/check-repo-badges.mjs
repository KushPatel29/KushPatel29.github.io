/* ============================================================
   check-repo-badges.mjs — a project card's test count is a
   claim about a repository this site does not contain.

   Every other gate here checks the page against itself:
   check-test-counts proves the badges sum to the hero and to
   all three metadata strings. That arithmetic can be perfect
   and every number still wrong, and on 2026-09-08 it was — the
   healthcare card, its repository's own badge and the profile
   README all agreed on 182 while the suite collected 345. Five
   surfaces, one number, nothing comparing it to a test run.

   Inside each repository the badge is now pinned to what pytest
   collects. This closes the other half: the card here must
   equal the badge in the repository it links to, so the chain
   runs suite -> repo badge -> card -> hero -> metadata with no
   unchecked link in it.

   Same failure policy as check-live-figures, and for the same
   reason — GitHub being unreachable is not a stale claim:

     raw.githubusercontent unreachable -> loud SKIPPED, exit 0
     README has no test badge          -> FAIL (shape changed)
     badge and card disagree           -> FAIL (a claim is stale)

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const TIMEOUT_MS = 20_000;

/* Repositories whose README carries no `tests-N passing` badge. Their card
   counts are covered by the suite guard inside the repository itself; there is
   simply nothing here to compare against, and inventing a second source of
   truth for them would be worse than saying so. */
const NO_BADGE = new Set([
  "wholesale-analytics-platform",
  "supply-chain-analytics-dbt",
]);

/* Card -> (badge, repo). Each card's own markup names the repository it
   links to, so the pairing is read off the page rather than hardcoded. */
function cardsFromPage() {
  const out = [];
  for (const [cardHtml, cardId] of html.matchAll(
    /<article\b[^>]*\bid="(p-[a-z-]+)"[\s\S]*?<\/article>/gi,
  )) {
    const badge = cardHtml.match(
      /<(?:p|li)\s+class="(?:card-tests|tag-tests)">\s*(\d+)(?:\s+dbt)?\s+tests\b/i,
    );
    const repo = cardHtml.match(/github\.com\/KushPatel29\/([A-Za-z0-9_.-]+)/);
    if (badge && repo) {
      out.push({ cardId, count: Number(badge[1]), repo: repo[1] });
    }
  }
  return out;
}

async function readme(repo) {
  for (const branch of ["main", "master"]) {
    const url = `https://raw.githubusercontent.com/KushPatel29/${repo}/${branch}/README.md`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) return await res.text();
    } catch {
      /* try the other branch, then report unreachable */
    }
  }
  return null;
}

const cards = cardsFromPage();
if (cards.length === 0) {
  console.error("✗ no project cards with a test badge and a repository link");
  process.exit(1);
}

const bad = [];
let unreachable = 0;
let skipped = 0;

for (const { cardId, count, repo } of cards) {
  if (NO_BADGE.has(repo)) {
    skipped += 1;
    console.log(`- ${cardId}  ${repo}  no README badge to compare (card says ${count})`);
    continue;
  }

  const body = await readme(repo);
  if (body === null) {
    unreachable += 1;
    console.log(`? ${cardId}  ${repo}  README unreachable`);
    continue;
  }

  /* Thousands separators are percent-encoded in shields.io URLs: 1,098 is
     written tests-1%2C098%20passing. Strip the encoding, not the digits — a
     regex that grabs runs of digits also finds the "20" in %20passing. */
  const m = body.match(/badge\/tests-([\d%C,]+)%20passing/i);
  if (!m) {
    bad.push(`${cardId}: ${repo}/README.md has no \`tests-N passing\` badge`);
    continue;
  }
  const claimed = Number(m[1].replaceAll("%2C", "").replaceAll(",", ""));

  if (claimed !== count) {
    bad.push(`${cardId}: card says ${count}, ${repo}/README.md says ${claimed}`);
  } else {
    console.log(`✓ ${cardId}  ${repo}  ${count}`);
  }
}

if (bad.length > 0) {
  console.error(`\n✗ ${bad.length} card(s) disagree with the repository they link to:`);
  for (const line of bad) console.error(`    ${line}`);
  process.exit(1);
}

if (unreachable === cards.length - skipped) {
  console.log("\n! SKIPPED — no repository README could be reached");
  process.exit(0);
}

console.log(
  `\n${cards.length} cards: ${cards.length - skipped - unreachable} verified against ` +
    `their repository, ${skipped} without a badge, ${unreachable} unreachable`,
);
console.log("✓ every card matches the repository it links to");
