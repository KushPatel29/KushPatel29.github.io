/* ============================================================
   make-link.mjs — a tagged link per application.

   Analytics cannot tell you who is reading. Nothing honest can:
   a visitor is an IP and a user agent, and the tools that try to
   turn that into a name are the ones the footer promises not to
   load.

   What you can know is which *link* was opened. Send a different
   one with each application and the campaign column in GoatCounter
   stops being anonymous traffic and starts being "Acme opened the
   portfolio twice, both times on the day after I applied".

   The link also opens the page on the matching Role fit view, so the
   reader lands on their own job's requirements, ticked against
   evidence, rather than the top of a generic page. The view is
   inferred from the role title; --as picks one, --as none turns it off.

   Usage:
     node tools/make-link.mjs acme "BI Analyst"
     node tools/make-link.mjs acme "Reporting Analyst" --as bi-developer
     node tools/make-link.mjs acme "BI Analyst" --to '#p-wholesale'
     node tools/make-link.mjs --roles                 (the views to pick from)
     node tools/make-link.mjs --list                  (from links.tsv)

   Every link generated is appended to tools/links.tsv so the tag in
   the dashboard can be traced back to the application six weeks
   later, which is exactly when you will want it and will not
   remember.

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://kushpatel29.github.io/";
const LOG = path.join(ROOT, "tools", "links.tsv");

const argv = process.argv.slice(2);

/* The Role fit views that exist, read from the page itself so this list
   cannot drift from the panels it links to. */
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const ROLE_VIEWS = [...html.matchAll(/<article class="fit-panel" id="fit-([a-z-]+)"/g)].map((m) => m[1]);

/* First match wins, so specific titles sit above general ones: a
   "BI Analyst" is a BI role before it is an analyst role. */
const ROLE_RULES = [
  [/data\s*scien|machine learning|\bml\b|\bai\b/i, "data-scientist"],
  [/analytics engineer/i, "analytics-engineer"],
  [/data engineer|\betl\b|pipeline|data platform/i, "data-engineer"],
  [/business (systems )?analyst|\bba\b|product owner|process analyst/i, "business-analyst"],
  [/financ|fp&a|\bfpa\b|accounting|controller|pricing/i, "financial-analyst"],
  [/supply chain|operations|inventory|logistics|procurement|demand plan/i, "supply-chain-analyst"],
  [/\bbi\b|power bi|business intelligence|report|dashboard|tableau/i, "bi-developer"],
  [/analyst|analytics|insight/i, "data-analyst"],
];

function inferView(title) {
  if (!title) return null;
  for (const [pattern, view] of ROLE_RULES) {
    if (pattern.test(title)) return view;
  }
  return null;
}

if (argv.includes("--roles")) {
  console.log(ROLE_VIEWS.join("\n"));
  process.exit(0);
}

if (argv.includes("--list")) {
  if (!fs.existsSync(LOG)) {
    console.log("No links generated yet.");
    process.exit(0);
  }
  console.log(fs.readFileSync(LOG, "utf8").trimEnd());
  process.exit(0);
}

const toIndex = argv.indexOf("--to");
const anchor = toIndex >= 0 ? argv[toIndex + 1] : "";
const asIndex = argv.indexOf("--as");
const asValue = asIndex >= 0 ? argv[asIndex + 1] || "" : "";
/* `toIndex + 1` is 0 when --to is absent, which silently ate the first
   positional and turned `make-link.mjs acme "BI Analyst"` into a link
   tagged for a company called "BI Analyst". Guard each flag's value
   index on the flag actually being present. */
const skip = new Set([toIndex >= 0 ? toIndex + 1 : -1, asIndex >= 0 ? asIndex + 1 : -1]);
const positional = argv.filter((a, i) => !a.startsWith("--") && !skip.has(i));
const [company, role] = positional;

if (!company) {
  console.error(
    "usage: node tools/make-link.mjs <company> [role] [--as <view>|none] [--to '#anchor']\n" +
      "       node tools/make-link.mjs --roles\n" +
      "       node tools/make-link.mjs --list\n"
  );
  process.exit(1);
}

/* Lowercase, hyphenated, no punctuation — it has to survive being
   pasted into an application form and read back off a dashboard. */
const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const tag = [slug(company), role ? slug(role) : null].filter(Boolean).join("--");

const view = asValue === "none" ? null : asValue || inferView(role);
if (view && !ROLE_VIEWS.includes(view)) {
  console.error(`unknown Role fit view "${view}". Pick one of:\n  ${ROLE_VIEWS.join("\n  ")}`);
  process.exit(1);
}

const url = new URL(SITE);
url.searchParams.set("utm_source", "application");
url.searchParams.set("utm_campaign", tag);
if (view) url.searchParams.set("role", view);
if (anchor) url.hash = anchor.replace(/^#?/, "#");
else if (view) url.hash = "#fit";

/* Stamped by the caller's clock, not derived from anything, so the
   log stays readable when a link resurfaces months later. */
const stamp = new Date().toISOString().slice(0, 10);
const row = [stamp, company, role || "", tag, url.toString()].join("\t");

if (!fs.existsSync(LOG)) {
  fs.writeFileSync(LOG, "date\tcompany\trole\ttag\turl\n", "utf8");
}
fs.appendFileSync(LOG, row + "\n", "utf8");

console.log(url.toString());
console.log(`\n  tag:    ${tag}`);
console.log(
  `  opens:  ${view ? `Role fit, ${view}` : "the top of the page"}` +
    (view && !asValue ? "  (inferred from the title; override with --as)" : ""),
);
console.log(`  logged: tools/links.tsv`);
console.log(
  `\n  In GoatCounter this shows under Campaigns as "${tag}".\n` +
    "  Referrers still work on their own for anything you did not tag."
);
