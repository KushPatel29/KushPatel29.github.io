const datasets = {
  30: {
    visitors: "486", sessions: "651", engagement: "61.4%", projectRate: "70.2%", conversion: "13.7%",
    changes: { visitors: "+11.8%", engagement: "+3.1 pts", projectRate: "+5.4 pts", conversion: "+1.8 pts" },
    funnel: { landing:[651,"100%"], project:[457,"70.2%"], caseStudy:[245,"37.6%"], resume:[139,"21.4%"], contact:[46,"7.1%"] },
    projects: [
      ["Customer Intelligence", "Product analytics", 318, "44.2%", "17.6%"],
      ["Wholesale Analytics", "BI & dimensional modeling", 284, "39.5%", "15.8%"],
      ["Wildfire Risk Prediction", "ML & geospatial", 227, "36.8%", "13.2%"],
      ["Mobility Operations", "Operations analytics", 194, "31.4%", "10.9%"]
    ]
  },
  90: {
    visitors: "1,284", sessions: "1,743", engagement: "58.1%", projectRate: "67.4%", conversion: "12.3%",
    changes: { visitors: "+18.6%", engagement: "+4.2 pts", projectRate: "+7.8 pts", conversion: "+2.1 pts" },
    funnel: { landing:[1743,"100%"], project:[1175,"67.4%"], caseStudy:[610,"35.0%"], resume:[331,"19.0%"], contact:[105,"6.0%"] },
    projects: [
      ["Wholesale Analytics", "BI & dimensional modeling", 842, "42.1%", "16.9%"],
      ["Customer Intelligence", "Product analytics", 716, "39.8%", "15.3%"],
      ["Wildfire Risk Prediction", "ML & geospatial", 604, "35.6%", "12.8%"],
      ["Mobility Operations", "Operations analytics", 491, "32.2%", "11.4%"]
    ]
  },
  365: {
    visitors: "4,918", sessions: "6,804", engagement: "55.9%", projectRate: "63.8%", conversion: "10.8%",
    changes: { visitors: "+32.7%", engagement: "+5.8 pts", projectRate: "+9.3 pts", conversion: "+2.9 pts" },
    funnel: { landing:[6804,"100%"], project:[4341,"63.8%"], caseStudy:[2177,"32.0%"], resume:[1157,"17.0%"], contact:[354,"5.2%"] },
    projects: [
      ["Wholesale Analytics", "BI & dimensional modeling", 3018, "40.7%", "15.1%"],
      ["Customer Intelligence", "Product analytics", 2754, "38.4%", "14.6%"],
      ["Wildfire Risk Prediction", "ML & geospatial", 2310, "34.9%", "12.1%"],
      ["Mobility Operations", "Operations analytics", 1892, "30.6%", "10.2%"]
    ]
  }
};

const definitions = {
  unique_visitors: { title: "Unique visitors", body: "Distinct consented anonymous visitor IDs observed in eligible sessions. Internal, automated, and synthetic activity is excluded.", grain: "Visitor × period", owner: "Analytics Engineering" },
  engagement_rate: { title: "Engagement rate", body: "Eligible sessions with at least 60 engaged seconds, two or more content views, or one governed high-intent action, divided by eligible sessions.", grain: "Session × day", owner: "Product Analytics" },
  project_view_rate: { title: "Project view rate", body: "Eligible sessions containing at least one project_viewed event divided by all eligible sessions.", grain: "Session × day", owner: "Portfolio Analytics" },
  high_intent_rate: { title: "High-intent rate", body: "Eligible sessions containing a resume view, resume download, LinkedIn click, or contact action, counted once per session.", grain: "Session × day", owner: "Portfolio Analytics" }
};

const metricFamilies = {
  acquisition: [
    ["Users", "1,284", "consented anonymous people"], ["New users", "876", "first observed in period"],
    ["Sessions", "1,743", "eligible visit windows"], ["Sessions / user", "1.36", "return frequency proxy"],
    ["Organic share", "46.8%", "last non-direct attribution"], ["Campaign conversion", "14.2%", "high-intent sessions"]
  ],
  engagement: [
    ["Engaged sessions", "1,013", "60s, 2 views, or intent"], ["Engagement rate", "58.1%", "engaged / eligible sessions"],
    ["Avg engaged time", "2m 18s", "foreground time only"], ["Views / session", "3.4", "governed content views"],
    ["Scroll completion", "63.7%", "reached 90% depth"], ["Project depth", "2.4", "distinct projects / session"]
  ],
  conversion: [
    ["High-intent rate", "12.3%", "deduplicated by session"], ["Resume view rate", "19.0%", "resume views / sessions"],
    ["Resume download", "8.6%", "downloads / sessions"], ["GitHub CTR", "11.8%", "outbound repo clicks"],
    ["Contact rate", "6.0%", "contact actions / sessions"], ["Funnel completion", "6.0%", "landing to contact"]
  ],
  retention: [
    ["Returning-user rate", "31.6%", "seen before period"], ["W1 retention", "36.0%", "cohort returned in week 1"],
    ["W4 retention", "20.0%", "cohort returned in week 4"], ["Return frequency", "1.8", "sessions / returning user"],
    ["Evaluator return", "42.7%", "technical visitors returning"], ["Median return", "9 days", "between eligible sessions"]
  ],
  experience: [
    ["LCP p75", "1.84s", "good: ≤ 2.5 seconds"], ["INP p75", "148ms", "good: ≤ 200 ms"],
    ["CLS p75", "0.04", "good: ≤ 0.10"], ["TTFB p75", "410ms", "origin response latency"],
    ["Good CWV visits", "92.4%", "all assessed vitals good"], ["Error-free sessions", "99.3%", "no observed JS error"]
  ],
  health: [
    ["Contract coverage", "100%", "events matching schema"], ["Consent coverage", "100%", "state recorded on events"],
    ["Known attribution", "96.1%", "source / medium resolved"], ["Duplicate rate", "0.3%", "same event identity"],
    ["Late arrivals", "0.8%", "after daily cutoff"], ["Bot/internal excluded", "100%", "rules applied in marts"]
  ]
};

function renderMetricFamily(family) {
  const target = document.querySelector("#metric-catalog");
  if (!target || !metricFamilies[family]) return;
  target.innerHTML = metricFamilies[family].map(([name, value, note]) => `
    <article><span>${name}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
}

document.querySelectorAll("[data-metric-tab]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-metric-tab]").forEach(item => {
    item.classList.toggle("selected", item === button);
    item.setAttribute("aria-selected", item === button ? "true" : "false");
  });
  renderMetricFamily(button.dataset.metricTab);
}));

const lineageDefinitions = {
  resume_conversion: { title:"Resume conversion rate", formula:"sessions_with_resume_action / eligible_sessions", value:"19.0%", owner:"Analytics Engineering", grain:"Session × day", freshness:"< 24 hours", note:"Excludes internal, bot, synthetic, and consent-denied sessions. A resume view or download qualifies once per session.", nodes:["GA4 events_*","stg_ga4_events","fct_sessions","mart_conversion"] },
  engagement_rate: { title:"Engagement rate", formula:"engaged_sessions / eligible_sessions", value:"58.1%", owner:"Product Analytics", grain:"Session × day", freshness:"< 24 hours", note:"An engaged session has at least 60 active seconds, two content views, or a governed high-intent event.", nodes:["PostHog events","stg_events","int_sessions","mart_engagement"] },
  project_depth: { title:"Average project depth", formula:"sum(distinct_projects_viewed) / project_sessions", value:"2.4", owner:"Content Analytics", grain:"Session × day", freshness:"< 24 hours", note:"Repeated opens of the same project are deduplicated within a session before aggregation.", nodes:["GA4 events_*","stg_projects","int_project_engagement","mart_content"] },
  contact_rate: { title:"Contact conversion rate", formula:"sessions_with_contact_action / eligible_sessions", value:"6.0%", owner:"Portfolio Analytics", grain:"Session × day", freshness:"< 24 hours", note:"Contact clicks are session-deduplicated and attributed using last non-direct session source.", nodes:["GA4 events_*","stg_events","int_attribution","mart_conversion"] }
};

function renderProjects(rows) {
  const target = document.querySelector("#project-rows");
  target.innerHTML = rows.map((row, index) => `
    <div class="project-row" role="row">
      <span class="project-name" role="cell"><span class="project-rank">0${index + 1}</span><span><b>${row[0]}</b><small>${row[1]}</small></span></span>
      <span role="cell">${row[2].toLocaleString()}</span>
      <span role="cell">${row[3]}</span>
      <span class="rate-cell" role="cell"><span class="mini-bar"><i style="width:${Math.min(parseFloat(row[4]) * 4, 100)}%"></i></span>${row[4]}</span>
    </div>`).join("");
}

function setRange(range) {
  const data = datasets[range];
  ["visitors","sessions","engagement","projectRate","conversion"].forEach(key => {
    document.querySelectorAll(`[data-metric="${key}"]`).forEach(el => el.textContent = data[key]);
  });
  Object.entries(data.changes).forEach(([key,value]) => {
    const el = document.querySelector(`[data-change="${key}"]`); if (el) el.textContent = value;
  });
  Object.entries(data.funnel).forEach(([key,[count,rate]]) => {
    const countEl = document.querySelector(`[data-funnel-value="${key}"]`);
    const rateEl = document.querySelector(`[data-funnel-rate="${key}"]`);
    if (countEl) countEl.textContent = count.toLocaleString();
    if (rateEl) rateEl.textContent = rate;
    if (countEl) {
      const bar = countEl.closest(".funnel-row")?.querySelector(".bar-track i");
      if (bar) bar.style.setProperty("--w", rate);
    }
  });
  renderProjects(data.projects);
}

document.querySelectorAll(".range-control button").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".range-control button").forEach(b => { b.classList.remove("selected"); b.setAttribute("aria-pressed","false"); });
  button.classList.add("selected"); button.setAttribute("aria-pressed","true"); setRange(button.dataset.range);
}));

const dialog = document.querySelector("#definition-dialog");
document.querySelectorAll(".info").forEach(button => button.addEventListener("click", () => {
  const item = definitions[button.dataset.definition];
  dialog.querySelector("#dialog-title").textContent = item.title;
  dialog.querySelector("#dialog-description").textContent = item.body;
  dialog.querySelector("#dialog-meta").innerHTML = `<div><span>GRAIN</span><b>${item.grain}</b></div><div><span>OWNER</span><b>${item.owner}</b></div>`;
  dialog.showModal();
}));

function renderLineage(key) {
  const item = lineageDefinitions[key];
  const target = document.querySelector("#lineage-detail");
  target.innerHTML = `<div class="definition-head"><div><p class="kicker">METRIC CONTRACT</p><h3>${item.title}</h3></div><span class="certified">✓ Certified</span></div>
    <p class="formula"><code>${item.formula}</code></p>
    <div class="contract-grid"><div><span>VALUE</span><b>${item.value}</b></div><div><span>OWNER</span><b>${item.owner}</b></div><div><span>GRAIN</span><b>${item.grain}</b></div><div><span>FRESHNESS</span><b>${item.freshness}</b></div></div>
    <div class="lineage-flow" aria-label="Metric lineage">${item.nodes.map((node,i) => `${i ? "<i>→</i>" : ""}<button type="button" class="${i === item.nodes.length - 1 ? "active-node" : ""}"><small>${["SOURCE","STAGING","FACT","MART"][i]}</small><b>${node}</b></button>`).join("")}</div>
    <p class="contract-note">${item.note}</p>`;
}

document.querySelectorAll("[data-lineage]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-lineage]").forEach(b => b.setAttribute("aria-selected","false"));
  button.setAttribute("aria-selected","true"); renderLineage(button.dataset.lineage);
}));

const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  document.querySelectorAll("nav a").forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
}), { rootMargin: "-30% 0px -60%", threshold: 0 });
document.querySelectorAll("main section[id]").forEach(section => sectionObserver.observe(section));

renderProjects(datasets[90].projects);
