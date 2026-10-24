// Shared, versioned HR facts drive the public example. --verify-upstream also
// catches a newer HR snapshot so a green layout check cannot hide stale claims.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const receipt = JSON.parse(fs.readFileSync(path.join(ROOT, "evidence/hr-fairness.json"), "utf8"));
const { upstream, evidence } = receipt;
const START = "<!-- fairness-evidence:start -->";
const END = "<!-- fairness-evidence:end -->";
if (upstream.repository !== "KushPatel29/hr-attrition-analytics" || upstream.path !== "output/fairness_evidence.json"
    || !/^[a-f0-9]{40}$/.test(upstream.revision) || evidence.data_classification !== "synthetic") {
  throw new Error("Fairness evidence must name an immutable, synthetic HR source");
}
const escape = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const source = `https://github.com/${upstream.repository}/blob/${upstream.revision}/${upstream.path}`;
const block = `${START}\n        <p class="loss-stat">${escape(evidence.display.stat)}</p>\n`
  + `        <h3>${escape(evidence.display.title)}</h3>\n`
  + `        <p>${escape(evidence.display.summary)} <a href="${source}" target="_blank" rel="noopener">Audit counts and limitations ↗</a></p>\n        ${END}`;
const file = path.join(ROOT, "index.html");
const html = fs.readFileSync(file, "utf8");
if (html.split(START).length !== 2 || html.split(END).length !== 2) throw new Error("Exactly one fairness block is required");
const a = html.indexOf(START), b = html.indexOf(END) + END.length;
const expected = html.slice(0, a) + block + html.slice(b);
if (process.argv.includes("--write")) fs.writeFileSync(file, expected);
else if (html !== expected) throw new Error("Fairness facts drifted: run node tools/sync-evidence-claims.mjs --write");

// These checks guard the concrete scope regressions found in the final review.
for (const relative of ["index.html", "resume/resume.html", "resume/roles/financial-analyst.html"]) {
  const text = fs.readFileSync(path.join(ROOT, relative), "utf8");
  for (const m of text.matchAll(/100\.9M([\s\S]{0,150})/g)) {
    if (!m[1].includes("independently modelled plan")) throw new Error(`${relative}: identify the independent planning baseline beside $100.9M`);
  }
}
const ds = fs.readFileSync(path.join(ROOT, "resume/roles/data-scientist.html"), "utf8");
if (/decided by a pre-registered experiment|randomized pilot rather than offline recall decides/i.test(expected + ds)
    || !ds.includes("A proposed, pre-registered randomized pilot would measure commercial lift; no online lift has been established.")) {
  throw new Error("The recommender pilot must remain explicitly proposed, with no online-lift claim");
}
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "portfolio-manifest.json"), "utf8"));
const tableau = manifest.projects.find(p => p.id === "gl-reconciliation");
if (!tableau.liveApp.startsWith("https://public.tableau.com/views/")) throw new Error("Tableau's primary demo must open the verified direct view");
if (process.argv.includes("--verify-upstream")) {
  const base = `https://raw.githubusercontent.com/${upstream.repository}/`;
  for (const ref of [upstream.revision, upstream.branch]) {
    const response = await fetch(`${base}${ref}/${upstream.path}`, {signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`Fairness source ${ref}: HTTP ${response.status}`);
    const payload = (await response.text()).replaceAll("\r\n", "\n");
    const digest = crypto.createHash("sha256").update(payload).digest("hex");
    if (digest !== upstream.sha256 || JSON.stringify(JSON.parse(payload)) !== JSON.stringify(evidence)) {
      throw new Error(`HR evidence changed at ${ref}; review and refresh the pinned snapshot, source hash and public example together`);
    }
  }
}
console.log("✓ public fairness facts and provenance agree; proposed experiments, modelled plans and direct demo routing retain their scope");
