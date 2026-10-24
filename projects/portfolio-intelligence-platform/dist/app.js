const $ = (s) => document.querySelector(s);
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : "Unavailable");
const names = {
  growthops: "GrowthOps OS",
  "control-tower": "Supply Chain Control Tower",
  "bc-finance": "B.C. Finance",
  wildfire: "Canada Wildfire Risk",
};
let payload;
function cell(row, value, tag = "td") {
  const node = document.createElement(tag);
  node.textContent = value;
  row.append(node);
  return node;
}
function table(selector, values) {
  const body = $(selector);
  body.replaceChildren();
  values.forEach((values) => {
    const row = document.createElement("tr");
    values.forEach((value) => cell(row, value));
    body.append(row);
  });
}
function bars(selector, values) {
  const list = $(selector);
  list.replaceChildren();
  const max = Math.max(1, ...values.map((x) => x[1]));
  for (const [label, count] of values) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = label;
    const value = document.createElement("strong");
    value.textContent = count.toLocaleString();
    const meter = document.createElement("meter");
    meter.min = 0;
    meter.max = max;
    meter.value = count;
    meter.setAttribute("aria-label", `${label}: ${count}`);
    li.append(name, value, meter);
    list.append(li);
  }
}
function render() {
  const d = payload.windows[$("#fixture-range").value],
    f = d.facts;
  for (const [key, value] of Object.entries({
    visitors: f.users,
    sessions: f.sessions,
    engagement: pct(f.engagedSessions, f.sessions),
    conversion: pct(f.intentSessions, f.sessions),
  }))
    document
      .querySelectorAll(`[data-metric="${key}"]`)
      .forEach((n) => (n.textContent = value));
  $("#fixture-window").textContent = `${d.start} to ${d.end} · UTC · synthetic`;
  $("#funnel-rows").replaceChildren();
  for (const [key, label] of [
    ["landing", "Page viewed"],
    ["project", "Then project viewed"],
    ["caseStudy", "Then case study viewed"],
    ["intent", "Then high-intent action"],
  ]) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = label;
    const b = document.createElement("strong");
    b.textContent = `${d.funnel[key]} / ${f.sessions} (${pct(d.funnel[key], f.sessions)})`;
    const meter = document.createElement("meter");
    meter.min = 0;
    meter.max = Math.max(1, f.sessions);
    meter.value = d.funnel[key];
    meter.setAttribute(
      "aria-label",
      `${label}: ${d.funnel[key]} of ${f.sessions}`,
    );
    li.append(span, b, meter);
    $("#funnel-rows").append(li);
  }
  bars(
    "#source-rows",
    d.sources.map((s) => [
      `${s.source} · ${pct(s.sessions, f.sessions)}`,
      s.sessions,
    ]),
  );
  table(
    "#project-rows",
    d.projects.map((p) => [
      names[p.project_id] || p.project_id,
      p.sessions,
      `${p.deepSessions} / ${p.sessions} (${pct(p.deepSessions, p.sessions)})`,
      `${p.actionSessions} / ${p.sessions} (${pct(p.actionSessions, p.sessions)})`,
    ]),
  );
  table(
    "#daily-table",
    d.daily.map((x) => [x.day, x.sessions, x.users]),
  );
  const chart = $("#fixture-chart");
  chart.replaceChildren();
  const max = Math.max(1, ...d.daily.map((x) => x.sessions));
  for (const day of d.daily) {
    const wrap = document.createElement("div");
    wrap.className = "day";
    wrap.title = `${day.day}: ${day.sessions} sessions`;
    const bar = document.createElement("i");
    bar.style.height = `${(100 * day.sessions) / max}%`;
    wrap.append(bar);
    chart.append(wrap);
  }
  chart.setAttribute(
    "aria-label",
    `${d.daily.length} days. ${f.sessions} sessions; detailed daily counts available below.`,
  );
}
function renderEvidence() {
  const m = payload.metadata;
  $("#fixture-meta").textContent =
    `${m.rawEvents.toLocaleString()} delivered events · ${m.dataTests} dbt tests · ${m.windowDays} days`;
  $("#quality-summary").textContent =
    `${m.dataTests} / ${m.dataTests} data tests passed across ${m.dbtNodes} dbt nodes. An independent Python oracle checks every session partition, first touch and ordered journey in CI.`;
  bars(
    "#quality-rows",
    payload.quality.map((q) => [q.disposition.replaceAll("_", " "), q.rows]),
  );
  $("#seed-hash").textContent = `Fixture seed SHA-256: ${m.seedSha256}`;
  const groups = new Map();
  for (const row of payload.cohorts) {
    if (!groups.has(row.cohort)) groups.set(row.cohort, []);
    groups.get(row.cohort).push(row);
  }
  const body = $("#cohort-rows");
  body.replaceChildren();
  for (const [cohort, rows] of groups) {
    const tr = document.createElement("tr");
    const th = cell(tr, cohort, "th");
    th.scope = "row";
    cell(tr, rows[0].cohort_users);
    for (const row of rows) {
      const td = cell(
        tr,
        row.is_mature
          ? `${row.retained_users}/${row.cohort_users} · ${pct(row.retained_users, row.cohort_users)}`
          : "—",
      );
      if (!row.is_mature) {
        td.className = "unavailable";
        td.title = "Incomplete observation week";
      } else
        td.style.background = `rgba(8,105,94,${0.04 + 0.2 * row.retention_rate})`;
    }
    body.append(tr);
  }
}
$("#fixture-range").addEventListener("change", () => {
  if (payload) render();
});
$("#fixture-export").addEventListener("click", () => {
  if (!payload) return;
  const blob = new Blob(
    [
      JSON.stringify(
        {
          metadata: payload.metadata,
          selectedWindow: payload.windows[$("#fixture-range").value],
          cohorts: payload.cohorts,
          quality: payload.quality,
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "synthetic-portfolio-analysis.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
fetch("./data/dashboard.json", {cache:'no-cache'})
  .then((r) => {
    if (!r.ok) throw Error("Unavailable");
    return r.json();
  })
  .then((data) => {
    if (
      data.metadata?.schemaVersion !== 2 ||
      data.metadata?.classification !== "synthetic_fixture"
    )
      throw Error("Invalid contract");
    payload = data;
    render();
    renderEvidence();
  })
  .catch(() => {
    $("#fixture-meta").textContent =
      "Aggregate unavailable or incompatible. Rebuild the documented pipeline; no fallback data is shown.";
    $("#fixture-export").disabled = true;
  });
