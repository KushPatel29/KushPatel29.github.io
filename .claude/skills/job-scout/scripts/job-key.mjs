#!/usr/bin/env node
/* ============================================================
   job-key.mjs — one stable key per job posting.

   Job boards give no stable id: Indeed's "JOBSEARCH_…" ids are a
   per-session counter and its short links change on every call,
   and the same role shows up on Indeed and ZipRecruiter under
   slightly different titles. Dedupe therefore keys on what does
   not change: company, title and city, normalised.

   Usage:
     node job-key.mjs "<company>" "<title>" "<location>"
   Prints JSON: {"key":"JK-3f9a…","slug":"2026-09-24-northwind-grocers-bi-analyst…","basis":"…"}

   The key goes into the title of the Drive marker file, so the
   next run finds it with `title contains 'JK-…'`.

   No dependencies. Node 18+.
   ============================================================ */

import { createHash } from "node:crypto";

const [company, title, location] = process.argv.slice(2);
if (!company || !title) {
  console.error('usage: node job-key.mjs "<company>" "<title>" "<location>"');
  process.exit(1);
}

const STOP = new Set(["the", "inc", "ltd", "llc", "corp", "corporation", "limited", "co", "company"]);

/* Lowercase, drop punctuation and noise words, and drop the bracketed or
   trailing qualifiers boards add ("(Remote)", "- Full time", "12-Month
   Contract") so a repost or a cross-post lands on the same key. */
function norm(s = "", { title = false } = {}) {
  let t = s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  if (title) {
    t = t
      .replace(/\([^)]*\)/g, " ")
      .replace(/\b(full[- ]?time|part[- ]?time|permanent|temporary|contract|remote|hybrid|on[- ]?site)\b/g, " ")
      .replace(/\b\d+[- ]?(month|year)s?\b/g, " ")
      .replace(/\b(rq|req|job)[- ]?\d+\b/g, " ");
  }
  return t
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .join(" ");
}

/* City only: "Vancouver, BC" and "Vancouver, British Columbia" must agree. */
const city = norm((location || "").split(",")[0]);
const basis = [norm(company), norm(title, { title: true }), city].join("|");
const key = "JK-" + createHash("sha1").update(basis).digest("hex").slice(0, 10);

const today = new Date().toISOString().slice(0, 10);
const slug = `${today}-${norm(company)}-${norm(title, { title: true })}`
  .replace(/ /g, "-")
  .slice(0, 70)
  .replace(/-+$/, "");

console.log(JSON.stringify({ key, slug, basis }));
