import fs from "node:fs";
const root = new URL("../", import.meta.url),
  data = JSON.parse(
    fs.readFileSync(new URL("dist/data/dashboard.json", root), "utf8"),
  );
const html = fs.readFileSync(new URL("dist/case-study.html", root), "utf8");
const fail = (m) => {
  throw Error(m);
};
for(const file of ['dist/index.html','dist/case-study.html','dist/experiment.html']){
  const pageUrl=new URL(file,root),source=fs.readFileSync(pageUrl,'utf8');
  for(const [,href] of source.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(?:https?:|data:|#)/.test(href))continue;
    const target=new URL(href,pageUrl);target.search='';target.hash='';
    if(!fs.existsSync(target))fail(`Missing project link or asset: ${href}`);
  }
}
for (const text of [
  "SYNTHETIC CASE STUDY",
  "not from real portfolio visitors",
  "REFERENCE ADAPTERS · NOT ACTIVATED",
])
  if (!html.includes(text)) fail("Missing disclosure: " + text);
if (
  data.metadata.schemaVersion !== 2 ||
  data.metadata.classification !== "synthetic_fixture" ||
  data.metadata.windowDays !== 90 ||
  data.metadata.dataTests !== 31
)
  fail("Unreviewed fixture contract");
if (data.quality.reduce((s, x) => s + x.rows, 0) !== data.metadata.rawEvents)
  fail("Delivered-event accounting does not reconcile");
for (const [days, w] of Object.entries(data.windows)) {
  if (
    w.daily.length !== Number(days) ||
    w.daily.reduce((s, x) => s + x.sessions, 0) !== w.facts.sessions
  )
    fail("Daily/window reconciliation failed");
  const f = w.funnel;
  if (
    !(
      w.facts.sessions >= f.landing &&
      f.landing >= f.project &&
      f.project >= f.caseStudy &&
      f.caseStudy >= f.intent
    )
  )
    fail("Invalid ordered funnel");
  if (w.sources.reduce((s, x) => s + x.sessions, 0) !== w.facts.sessions)
    fail("Attribution denominator mismatch");
  for (const p of w.projects)
    if (p.deepSessions > p.sessions || p.actionSessions > p.sessions)
      fail("Inflated project rate");
}
if (
  !data.cohorts.some((c) => !c.is_mature) ||
  !data.cohorts.some((c) => c.is_mature && c.week_number === 4)
)
  fail("Fixture does not exercise mature and censored retention");
for (const c of data.cohorts)
  if (!c.is_mature && (c.retained_users !== null || c.retention_rate !== null))
    fail("Immature cohort presented as observed");
if (html.includes("../analytics/tracking.js"))
  fail("Public fixture must not collect visitor identifiers");
console.log(
  "Public aggregate contract passed: accounting, denominators, ordered journey, cohort censoring and synthetic boundary.",
);
