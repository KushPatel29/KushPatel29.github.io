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
// Keep the reviewer's first wildfire result tied to an immutable, dated grade.
// A historical backtest is a different population from as-published forecasts.
const wildfire = JSON.parse(fs.readFileSync(path.join(ROOT, "evidence/wildfire-evaluation.json"), "utf8"));
const w = wildfire.evidence;
if (wildfire.schemaVersion !== 1 || wildfire.upstream.repository !== "KushPatel29/wildfire-prediction-app"
    || !/^[a-f0-9]{40}$/.test(wildfire.upstream.revision)
    || !Number.isInteger(w.gridCells) || w.gridCells < 1
    || !Number.isInteger(w.targetDays) || w.targetDays < 1
    || !/^\d{4}-\d{2}-\d{2}$/.test(w.lastTargetDay)
    || ![w.rocAuc, w.topDecileCapture, ...w.rocAucInterval].every(v => Number.isFinite(v) && v >= 0 && v <= 1)
    || w.rocAucInterval.length !== 2 || w.rocAucInterval[0] > w.rocAuc || w.rocAucInterval[1] < w.rocAuc
    || ![w.captureEdgeOnNormalInterval, w.captureEdgeOnNextDoorInterval].every(ci => ci.length === 2 && ci[0] <= 0 && ci[1] >= 0)) {
  throw new Error("Wildfire evidence must retain a valid dated evaluation and its inconclusive capture intervals");
}
const gradedThrough = new Date(`${w.lastTargetDay}T12:00:00Z`).toLocaleDateString("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
});
const wildfireSummary = `Forecasts for ${w.gridCells} cells, refreshed twice daily. First ${w.targetDays} graded target days through ${gradedThrough}: `
  + `ROC-AUC ${w.rocAuc.toFixed(3)} (95% CI ${w.rocAucInterval.map(v => v.toFixed(3)).join("–")}). `
  + `Top-10% capture is ${(w.topDecileCapture * 100).toFixed(1)}%; its advantage over the baselines remains uncertain.`;
const wStart = "<!-- wildfire-evidence:start -->", wEnd = "<!-- wildfire-evidence:end -->";
if (expected.split(wStart).length !== 2 || expected.split(wEnd).length !== 2) throw new Error("Exactly one dated wildfire result is required");
const wa = expected.indexOf(wStart), wb = expected.indexOf(wEnd) + wEnd.length;
const wildfireBlock = `${wStart}\n        <p class="archive-outcome">${escape(wildfireSummary)}</p>\n        ${wEnd}`;
const withWildfire = expected.slice(0, wa) + wildfireBlock + expected.slice(wb);
if (process.argv.includes("--write")) fs.writeFileSync(file, withWildfire);
else if (withWildfire !== expected) throw new Error("Wildfire card drifted from its dated source or lost the uncertainty qualifier");
const wildfireProject = manifest.projects.find(p => p.id === "canada-wildfire-risk");
if (!wildfireProject.primaryDecision.includes(`${w.gridCells} fire cells`)) throw new Error("Wildfire manifest grid differs from the reviewed model");
if (/HubSpot run as a production integration/.test(expected)) throw new Error("Describe the executed HubSpot developer-account integration without implying customer production tenure");
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
  const documents = new Map(await Promise.all(wildfire.upstream.sources.map(async source => {
    const allowed = new Set(["README.md", "models/cells.parquet", "reports/metrics.json", "data/published/track_record.json"]);
    if (!allowed.has(source.path) || !/^[a-f0-9]{64}$/.test(source.sha256)) throw new Error("Unexpected wildfire evidence source");
    const url = `https://raw.githubusercontent.com/${wildfire.upstream.repository}/${wildfire.upstream.revision}/${source.path}`;
    const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`Wildfire source ${source.path}: HTTP ${response.status}`);
    const payload = Buffer.from(await response.arrayBuffer());
    if (crypto.createHash("sha256").update(payload).digest("hex") !== source.sha256) throw new Error(`Wildfire source hash differs: ${source.path}`);
    return [source.path, payload];
  })));
  if (documents.size !== 4) throw new Error("All four immutable wildfire sources are required");
  const grade = JSON.parse(documents.get("data/published/track_record.json").toString("utf8"));
  const historical = JSON.parse(documents.get("reports/metrics.json").toString("utf8"));
  if (!documents.get("README.md").toString("utf8").includes(`| Grid | ${w.gridCells} one-degree cells`)
      || historical.targets.has_fire.splits.test.model.roc_auc !== w.historicalRocAuc
      || grade.last_target_day !== w.lastTargetDay || grade.prospective.target_days !== w.targetDays
      || grade.prospective.model.roc_auc !== w.rocAuc || grade.prospective.model.top_decile_capture !== w.topDecileCapture
      || JSON.stringify(grade.prospective_intervals.model_auc) !== JSON.stringify(w.rocAucInterval)
      || JSON.stringify(grade.prospective_intervals.edge_on_normal_capture) !== JSON.stringify(w.captureEdgeOnNormalInterval)
      || JSON.stringify(grade.prospective_intervals.edge_on_fire_next_door_capture) !== JSON.stringify(w.captureEdgeOnNextDoorInterval)) {
    throw new Error("Wildfire public facts differ from the pinned source grade");
  }
}
console.log("✓ fairness and dated wildfire facts match their sources; experiment, cloud-account and planning boundaries retain their scope");
