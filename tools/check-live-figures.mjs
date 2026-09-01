/* ============================================================
   check-live-figures.mjs — the flagship card quotes nineteen numbers
   off the live demo. This fails the build when the demo stops saying
   them.

   Why this exists: the card used to quote $51.0M revenue at 23.0%
   margin while the site it links to read $8,281,387 at 20.1%. Those
   figures came from a local development run and were published under
   a heading that implied the deployed snapshot. It is the one kind of
   wrong a reader catches in a single click, on a page whose argument
   is that every number can prove itself — and nothing on either side
   could notice, because the two live in different repositories.

   The other checkers here hold the page consistent with itself. This
   one holds it consistent with something it does not control, which
   is the harder half and the half that actually went wrong.

   Tolerance is derived, not configured. The card rounds ("$8.28M");
   the demo does not ("$8,281,387"). So each claim is allowed half a
   unit of the last place the *card* chose to show — 8.28M carries two
   decimals of a million, so ±5,000. Quote a number more precisely and
   this check gets stricter on its own.

   Network failure and figure drift are deliberately not the same
   outcome. A demo that is mid-deploy or briefly unreachable is not a
   broken claim, and a red build for someone else's outage is a red
   build people learn to ignore. So:

     unreachable after retries  -> loud SKIPPED, exit 0
     page loads, pattern misses -> FAIL, exit 1   (the page changed shape)
     page loads, number differs -> FAIL, exit 1   (the claim went stale)

   The middle case matters: a pattern that stops matching is how this
   check would otherwise go quietly vacuous, which is the failure it
   was written to prevent.

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://kushpatel29.github.io/wholesale-analytics-platform";

/* Each claim: where the demo says it, and where the card repeats it.
   `live` runs against the demo page's visible text; `site` against
   index.html. Both capture one number in group 1. */
const CLAIMS = [
  { label: "Revenue",              page: "/",                live: /REVENUE \$([\d,]+)/i,                  site: /Revenue \/ profit<\/span><b>\$([\d.]+)M/ },
  { label: "Profit",               page: "/",                live: /PROFIT \$([\d,]+)/i,                   site: /Revenue \/ profit<\/span><b>\$[\d.]+M[^<]*\$([\d.]+)M/ },
  { label: "Margin %",             page: "/",                live: /MARGIN % ([\d.]+)%/i,                  site: /Margin %<\/span><b>([\d.]+)%/ },
  { label: "NRR",                  page: "/customers/kpis",  live: /NRR ([\d.]+)%/i,                       site: /Net revenue retention · GRR<\/span><b>([\d.]+)%/ },
  { label: "GRR",                  page: "/customers/kpis",  live: /GRR ([\d.]+)%/i,                       site: /Net revenue retention · GRR<\/span><b>[\d.]+% · ([\d.]+)%/ },
  { label: "Orders",               page: "/customers/kpis",  live: /ORDERS ([\d,]+)/i,                     site: /Orders · AOV<\/span><b>([\d,]+)/ },
  { label: "AOV",                  page: "/customers/kpis",  live: /AOV \$([\d,.]+)/i,                     site: /Orders · AOV<\/span><b>[\d,]+ · \$([\d,]+)/ },
  { label: "HHI (customers)",      page: "/customers/kpis",  live: /HHI \(customers\): ([\d,]+)/i,         site: /Concentration<\/span><b>HHI ([\d,]+)/ },
  { label: "Gross margin FY2025",  page: "/finance/",        live: /GROSS PROFIT MARGIN ([\d.]+)%/i,       site: /Gross · net margin<\/span><b>([\d.]+)%/ },
  { label: "Net margin FY2025",    page: "/finance/",        live: /NET PROFIT MARGIN ([\d.]+)%/i,         site: /Gross · net margin<\/span><b>[\d.]+% · ([\d.]+)%/ },
  { label: "Current ratio",        page: "/finance/",        live: /CURRENT RATIO ([\d.]+)/i,              site: /Current ratio<\/span><b>([\d.]+)×/ },
  { label: "Working capital",      page: "/finance/",        live: /WORKING CAPITAL \$([\d,]+)/i,          site: /Working capital<\/span><b>\$([\d,]+)/ },
  { label: "AR turnover",          page: "/finance/",        live: /AR TURNOVER ([\d.]+)/i,                site: /AR turnover · ROA<\/span><b>([\d.]+)×/ },
  { label: "ROA",                  page: "/finance/",        live: /RETURN ON ASSETS ([\d.]+)%/i,          site: /AR turnover · ROA<\/span><b>[\d.]+× · ([\d.]+)%/ },
  { label: "CAC",                  page: "/marketing/",      live: /CUSTOMER ACQUISITION COST \$([\d,]+)/i, site: /CAC · payback<\/span><b>\$([\d,]+)/ },
  { label: "CAC payback",          page: "/marketing/",      live: /CAC PAYBACK ([\d.]+) mo/i,             site: /CAC · payback<\/span><b>\$[\d,]+ · ([\d.]+) mo/ },
  { label: "CLV:CAC",              page: "/marketing/",      live: /CLV:CAC ([\d.]+)/i,                    site: /CLV:CAC \(12-mo basis\)<\/span><b>([\d.]+)×/ },
  { label: "Forecast WAPE",        page: "/planning/",       live: /WAPE ([\d.]+)%/i,                      site: /Forecast WAPE · hit rate<\/span><b>([\d.]+)%/ },
  { label: "Forecast hit rate",    page: "/planning/",       live: /HIT RATE ([\d.]+)%/i,                  site: /Forecast WAPE · hit rate<\/span><b>[\d.]+% · ([\d.]+)%/ },
];

/* "8.28" shown to two decimals means the writer claimed precision to
   0.01 of whatever unit follows, so anything within half of that is
   the same number said shorter. An integer claims precision to 1. */
function halfUnit(shown) {
  const bare = shown.replace(/[^\d.]/g, "");
  const dot = bare.indexOf(".");
  return dot < 0 ? 0.5 : 0.5 * Math.pow(10, -(bare.length - dot - 1));
}

const toNumber = (s) => Number(String(s).replace(/[^\d.]/g, ""));

function visibleText(html) {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, " ");
  t = t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  return t
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&([a-z]+);/gi, " ");
}

async function fetchText(url, attempts = 3) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "portfolio-live-figures-check" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return visibleText(await res.text());
    } catch (e) {
      last = e;
      if (i < attempts) await new Promise((r) => setTimeout(r, i * 2000));
    }
  }
  throw last;
}

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const pages = [...new Set(CLAIMS.map((c) => c.page))];

let live;
try {
  const texts = await Promise.all(pages.map((p) => fetchText(BASE + p)));
  live = Object.fromEntries(pages.map((p, i) => [p, texts[i]]));
} catch (e) {
  console.log(`• SKIPPED — could not reach ${BASE} (${e.message}).`);
  console.log("  The card's figures were NOT verified against the live demo on this run.");
  process.exit(0);
}

const bad = [];
const rows = [];

for (const claim of CLAIMS) {
  const onSite = html.match(claim.site);
  const onLive = live[claim.page].match(claim.live);

  /* A pattern that stopped matching is a finding, not a skip. Either the
     card dropped the figure or the demo changed shape; both mean this
     check is no longer watching what it claims to watch. */
  if (!onSite) {
    bad.push(`${claim.label}: not found on the card — index.html no longer matches ${claim.site}`);
    continue;
  }
  if (!onLive) {
    bad.push(`${claim.label}: not found on ${claim.page} — the demo no longer matches ${claim.live}`);
    continue;
  }

  const shown = onSite[1];
  const scale = /M$/.test(html.slice(onSite.index, onSite.index + onSite[0].length + 1))
    || /\$[\d.]+M/.test(onSite[0]) ? 1e6 : 1;
  const siteValue = toNumber(shown) * scale;
  const liveValue = toNumber(onLive[1]);
  const allowed = halfUnit(shown) * scale;
  const diff = Math.abs(siteValue - liveValue);

  rows.push(
    `  ${claim.label.padEnd(22)} card ${shown.padStart(10)}   demo ${onLive[1].padStart(11)}` +
    `   ${diff <= allowed ? "ok" : "DRIFTED"}`
  );
  if (diff > allowed) {
    bad.push(
      `${claim.label}: the card says ${shown} (${siteValue.toLocaleString()}) but ` +
      `${claim.page} says ${onLive[1]} — off by ${diff.toLocaleString()}, ` +
      `tolerance ±${allowed.toLocaleString()}`
    );
  }
}

console.log(`checked ${CLAIMS.length} figures across ${pages.length} live pages`);
console.log(rows.join("\n"));

if (bad.length) {
  console.error(
    `\n✗ ${bad.length} of ${CLAIMS.length} figures on the flagship card no longer match the demo:\n` +
    bad.map((b) => `  - ${b}`).join("\n") +
    "\n\n  Read the numbers off the live pages and update index.html — the card's\n" +
    "  metrics panel, the report paragraphs, and the screenshot's alt text.\n"
  );
  process.exit(1);
}

console.log("\n✓ every figure the flagship card quotes is still on the page it links to.");
