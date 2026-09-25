#!/usr/bin/env node
/* ============================================================
   evidence-snapshot.mjs — the candidate side of a role-fit
   analysis, read from the files that are actually published.

   A role-fit analysis is only as honest as the evidence it
   compares against. A copy of the résumé pasted into a prompt
   goes stale the day a project gains a test or a date moves, so
   this prints the current evidence straight from its sources:

     resume/resume.html       the résumé the site hands out
     portfolio-manifest.json  every promoted project and its status
     index.html               the Role fit rows (paid / project / degree)
     role-readiness.json      the per-role portfolio evidence scores

   Usage (from anywhere inside the portfolio repo):
     node .claude/skills/role-fit-analysis/scripts/evidence-snapshot.mjs
     node …/evidence-snapshot.mjs --only resume,projects,fit,scores
     node …/evidence-snapshot.mjs --root /path/to/KushPatel29.github.io

   Exit 2 when the repo cannot be found: fall back to
   references/evidence-inventory.md and say so in the analysis.

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};

const SECTIONS = ["resume", "projects", "fit", "scores"];
const only = (flag("--only") || SECTIONS.join(",")).split(",").map((s) => s.trim());
const unknown = only.filter((s) => !SECTIONS.includes(s));
if (unknown.length) {
  console.error(`✗ unknown section(s): ${unknown.join(", ")} — choose from ${SECTIONS.join(", ")}`);
  process.exit(1);
}

/* Walk up from the script (or the working directory) to the repo root,
   recognised by the manifest that only this repository carries. */
function findRoot() {
  const explicit = flag("--root");
  if (explicit) return fs.existsSync(path.join(explicit, "portfolio-manifest.json")) ? path.resolve(explicit) : null;
  for (const start of [path.dirname(fileURLToPath(import.meta.url)), process.cwd()]) {
    let dir = path.resolve(start);
    for (;;) {
      if (fs.existsSync(path.join(dir, "portfolio-manifest.json"))) return dir;
      const up = path.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
  }
  return null;
}

const ROOT = findRoot();
if (!ROOT) {
  console.error(
    "✗ portfolio repo not found (no portfolio-manifest.json above this script or the working directory).\n" +
      "  Use references/evidence-inventory.md instead, and state in the analysis that the evidence\n" +
      "  came from the inventory snapshot, not the live files."
  );
  process.exit(2);
}

const read = (rel) => {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
};

const ENTITIES = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'",
  "&nbsp;": " ", "&middot;": "·", "&ndash;": "–", "&mdash;": "—", "&rarr;": "→",
  "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”", "&hellip;": "…",
};
const decode = (s) =>
  s
    .replace(/&[a-z]+;|&#\d+;/g, (e) => ENTITIES[e] ?? (e.startsWith("&#") ? String.fromCharCode(Number(e.slice(2, -1))) : e))
    .replace(/[ \t]+/g, " ")
    .trim();
const text = (html) => decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+([,.;:)])/g, "$1");

const out = [];
const say = (s = "") => out.push(s);

const manifest = JSON.parse(read("portfolio-manifest.json"));
say(`# Evidence snapshot — ${manifest.owner}`);
say(`Source: ${ROOT}`);
say(`Manifest last verified: ${manifest.lastVerified} · ${manifest.totals.promotedProjects} projects · ${manifest.totals.automatedTests.toLocaleString("en-US")} automated tests`);
say("Tiers used below: PAID = done in a job (Experience section) · PROJECT = public repo · DEGREE = master's coursework.");

/* ---------- résumé ---------- */
if (only.includes("resume")) {
  const html = read("resume/resume.html");
  say();
  say("## Résumé (resume/resume.html)");
  if (!html) {
    say("(missing — résumé source not found)");
  } else {
    const body = html
      .replace(/<head[\s\S]*?<\/head>/i, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "");
    /* Keep the document's structure: headings, jobs, bullets and projects
       become their own lines so a requirement can be cited to one of them. */
    const lines = body
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n### $1\n")
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n### $1\n")
      .replace(/<div class="job-head"[^>]*>([\s\S]*?)<\/div>/gi, (_, inner) => `\n#### ${text(inner)}\n`)
      .replace(/<div class="(job-title|proj-head|proj-url|edu)"[^>]*>([\s\S]*?)<\/div>/gi, "\n$2\n")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<p[^>]*>/gi, "\n")
      .split("\n")
      .map((l) => text(l))
      .filter(Boolean);
    lines.forEach((l) => say(l));
  }
}

/* ---------- projects ---------- */
if (only.includes("projects")) {
  say();
  say("## Public projects (portfolio-manifest.json)");
  say("Claim policy: " + Object.entries(manifest.claimPolicy).map(([k, v]) => `${k} = ${v}`).join(" | "));
  for (const p of manifest.projects) {
    say();
    say(`### ${p.title}  [${p.priority}]`);
    say(`- repo: ${p.repository}${p.liveApp ? ` · live: ${p.liveApp}` : ""} · status: ${p.liveStatus}`);
    say(`- data: ${p.dataClassification} · tests: ${p.testCount} (${p.testCommand}) · portfolio anchor: #${p.cardId}`);
    say(`- shape: ${p.productShape}`);
    say(`- decision: ${p.primaryDecision}`);
    say(`- capabilities: ${p.capabilities.join(", ")}`);
  }
}

/* ---------- Role fit rows ---------- */
if (only.includes("fit")) {
  const html = read("index.html");
  say();
  say("## Role fit rows (index.html #fit) — each row is a published, sourced claim");
  const panels = [...html.matchAll(/<article class="fit-panel" id="fit-([a-z-]+)"[\s\S]*?<\/article>/g)];
  for (const [block, view] of panels) {
    const score = block.match(/class="fit-score"[^>]*>([^<]+)</);
    say();
    say(`### ${view}${score ? ` — portfolio evidence score ${decode(score[1])}` : ""}  (link view: ?role=${view}#fit)`);
    for (const row of block.matchAll(/<tr data-source="([a-z]+)"><th scope="row">([\s\S]*?)<\/th><td>([\s\S]*?)<\/td>/g)) {
      say(`- [${row[1].toUpperCase()}] ${text(row[2])}: ${text(row[3])}`);
    }
  }
}

/* ---------- scores ---------- */
if (only.includes("scores")) {
  const raw = read("role-readiness.json");
  say();
  say("## Portfolio evidence scores (role-readiness.json)");
  if (!raw) {
    say("(missing)");
  } else {
    const r = JSON.parse(raw);
    say(`${r.purpose} Weights: ${Object.entries(r.weights).map(([k, v]) => `${k} ${v}`).join(", ")}.`);
    for (const role of r.roles) say(`- ${role.role}: ${role.score} — ${role.evidence.join("; ")}`);
    say("These scores describe the portfolio in general; they are NOT a fit score for any specific posting.");
  }
}

console.log(out.join("\n"));
