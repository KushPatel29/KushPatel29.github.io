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

   Usage:
     node tools/make-link.mjs acme "BI Analyst"
     node tools/make-link.mjs acme "BI Analyst" --to '#p-wholesale'
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
/* `toIndex + 1` is 0 when --to is absent, which silently ate the first
   positional and turned `make-link.mjs acme "BI Analyst"` into a link
   tagged for a company called "BI Analyst". Guard the flag's value
   index on the flag actually being present. */
const skip = toIndex >= 0 ? toIndex + 1 : -1;
const positional = argv.filter((a, i) => !a.startsWith("--") && i !== skip);
const [company, role] = positional;

if (!company) {
  console.error(
    "usage: node tools/make-link.mjs <company> [role] [--to '#anchor']\n" +
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

const url = new URL(SITE);
url.searchParams.set("utm_source", "application");
url.searchParams.set("utm_campaign", tag);
if (anchor) url.hash = anchor.replace(/^#?/, "#");

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
console.log(`  logged: tools/links.tsv`);
console.log(
  `\n  In GoatCounter this shows under Campaigns as "${tag}".\n` +
    "  Referrers still work on their own for anything you did not tag."
);
