let datasets = {};
let metadata = {};
let currentRange = "90";

const definitions = {
  unique_visitors: { title:"Eligible fixture users", body:"Distinct pseudonymous users remaining after bot, internal, and synthetic exclusions in the deterministic seed.", grain:"User × fixture", owner:"Analytics Engineering" },
  engagement_rate: { title:"Engagement rate", body:"Sessions with 60 engaged seconds, two page views, or a governed high-intent action divided by eligible sessions.", grain:"Session × fixture", owner:"Product Analytics" },
  project_view_rate: { title:"Project view rate", body:"Eligible sessions containing at least one project_viewed event divided by eligible sessions.", grain:"Session × fixture", owner:"Portfolio Analytics" },
  high_intent_rate: { title:"High-intent rate", body:"Eligible sessions containing a resume, LinkedIn, or contact action, counted once per session.", grain:"Session × fixture", owner:"Portfolio Analytics" }
};

function pct(n, d) { return `${d ? (100 * n / d).toFixed(1) : "0.0"}%`; }
function minutes(seconds) { return `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }

function metricFamilies(data) {
  const facts = data.facts;
  const sessions = Number(data.sessions);
  return {
    acquisition: [["Eligible users",data.visitors,"dbt-modeled fixture"],["New users","—","first-seen history not modeled"],["Sessions",data.sessions,"30-minute inactivity rule"],["Sessions / user",(sessions/Number(data.visitors)).toFixed(2),"fixture frequency"],["Organic share",data.sources.find(x=>x[0]==="google")?.[2]||"0.0%","source field in seed"],["Campaign conversion","—","campaign IDs not present"]],
    engagement: [["Engaged sessions",String(Math.round(sessions*parseFloat(data.engagement)/100)),"tested session rule"],["Engagement rate",data.engagement,"engaged / eligible"],["Avg engaged time",minutes(Math.round(facts.engagedSeconds/sessions)),"event seconds / session"],["Page views / session",(facts.pageviews/sessions).toFixed(2),"governed page views"],["Scroll completion","—","event not present in fixture"],["Project view rate",data.projectRate,"project sessions / sessions"]],
    conversion: [["High-intent rate",data.conversion,"deduplicated by session"],["Resume session rate",pct(facts.resumeSessions,sessions),"view or download"],["Contact rate",pct(facts.contactSessions,sessions),"contact sessions / sessions"],["GitHub CTR","—","event not present in fixture"],["Funnel completion",data.funnel.contact[1],"landing to contact"],["Attribution lift","—","experiment not modeled"]],
    retention: [["Returning-user rate","—","requires prior-period history"],["W1 retention","—","four-day fixture is insufficient"],["W4 retention","—","four-day fixture is insufficient"],["Return frequency","—","requires cohort window"],["Evaluator return","—","requires cohort window"],["Median return","—","requires cohort window"]],
    experience: [["LCP p75","—","collector implemented; no RUM data"],["INP p75","—","collector implemented; no RUM data"],["CLS p75","—","collector implemented; no RUM data"],["FCP p75","—","collector implemented; no RUM data"],["TTFB p75","—","collector implemented; no RUM data"],["Error-free sessions","—","no provider activated"]],
    health: [["dbt data tests","15 / 15","root CI contract"],["Raw event rows",String(metadata.eventRows),"deterministic seed"],["Eligible events",String(metadata.eligibleEvents),"after exclusions"],["Excluded events",String(metadata.excludedEvents),"bot, internal, synthetic"],["Duplicate event IDs",String(metadata.duplicateEventIds),"dedupe key check"],["Direct PII fields","0","contract prohibition"]]
  };
}

function renderMetricFamily(family) {
  const data = datasets[currentRange];
  const target = document.querySelector("#metric-catalog");
  if (!data || !target) return;
  target.innerHTML = metricFamilies(data)[family].map(([name,value,note]) => `<article><span>${name}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
}

function renderProjects(rows) {
  document.querySelector("#project-rows").innerHTML = rows.map((row,index) => `<div class="project-row" role="row"><span class="project-name" role="cell"><span class="project-rank">0${index+1}</span><span><b>${row[0]}</b><small>${row[1]}</small></span></span><span role="cell">${row[2]}</span><span role="cell">${row[3]}</span><span class="rate-cell" role="cell"><span class="mini-bar"><i style="width:${parseFloat(row[4])}%"></i></span>${row[4]}</span></div>`).join("");
}

function renderSources(data) {
  const classes = ["c1","c2","c3","c4","c5"];
  const labels = {google:"Organic search",linkedin:"LinkedIn","(direct)":"Direct",github:"GitHub"};
  document.querySelector("#traffic-legend").innerHTML = data.sources.map((row,index) => `<li><i class="${classes[index]}"></i><span>${labels[row[0]]||row[0]}</span><b>${row[2]}</b></li>`).join("");
}

function setRange(range) {
  const data = datasets[range];
  if (!data) return;
  currentRange = range;
  ["visitors","sessions","engagement","projectRate","conversion"].forEach(key => document.querySelectorAll(`[data-metric="${key}"]`).forEach(el => el.textContent=data[key]));
  Object.entries(data.changes).forEach(([key,value]) => { const el=document.querySelector(`[data-change="${key}"]`); if(el) el.textContent=value; });
  Object.entries(data.funnel).forEach(([key,[count,rate]]) => { const value=document.querySelector(`[data-funnel-value="${key}"]`); const rateEl=document.querySelector(`[data-funnel-rate="${key}"]`); if(value) value.textContent=count; if(rateEl) rateEl.textContent=rate; const bar=value?.closest(".funnel-row")?.querySelector(".bar-track i"); if(bar) bar.style.setProperty("--w",rate); });
  renderProjects(data.projects); renderSources(data);
  const active=document.querySelector("[data-metric-tab][aria-selected='true']"); renderMetricFamily(active?.dataset.metricTab||"acquisition");
}

document.querySelectorAll(".range-control button").forEach(button => button.addEventListener("click",()=>{ document.querySelectorAll(".range-control button").forEach(b=>{b.classList.remove("selected");b.setAttribute("aria-pressed","false")}); button.classList.add("selected");button.setAttribute("aria-pressed","true");setRange(button.dataset.range); }));
document.querySelectorAll("[data-metric-tab]").forEach(button => button.addEventListener("click",()=>{ document.querySelectorAll("[data-metric-tab]").forEach(item=>{item.classList.toggle("selected",item===button);item.setAttribute("aria-selected",item===button?"true":"false")});renderMetricFamily(button.dataset.metricTab); }));

const dialog=document.querySelector("#definition-dialog");
document.querySelectorAll(".info").forEach(button=>button.addEventListener("click",()=>{ const item=definitions[button.dataset.definition];dialog.querySelector("#dialog-title").textContent=item.title;dialog.querySelector("#dialog-description").textContent=item.body;dialog.querySelector("#dialog-meta").innerHTML=`<div><span>GRAIN</span><b>${item.grain}</b></div><div><span>OWNER</span><b>${item.owner}</b></div>`;dialog.showModal(); }));

const lineage = {
  resume_conversion:["Resume conversion rate","sessions_with_resume_action / eligible_sessions","50.0%","Three of six eligible fixture sessions include a resume view or download."],
  engagement_rate:["Engagement rate","engaged_sessions / eligible_sessions","100.0%","All six fixture sessions meet the engagement rule; this is not a production benchmark."],
  project_depth:["Average project depth","distinct_project_views / project_sessions","1.0","Five project views occur across five project-viewing fixture sessions."],
  contact_rate:["Contact conversion rate","sessions_with_contact_action / eligible_sessions","16.7%","One of six eligible fixture sessions contains a contact action."]
};
function renderLineage(key){const [title,formula,value,note]=lineage[key];document.querySelector("#lineage-detail").innerHTML=`<div class="definition-head"><div><p class="kicker">METRIC CONTRACT</p><h3>${title}</h3></div><span class="certified">✓ Fixture-backed</span></div><p class="formula"><code>${formula}</code></p><div class="contract-grid"><div><span>VALUE</span><b>${value}</b></div><div><span>OWNER</span><b>Analytics Engineering</b></div><div><span>GRAIN</span><b>Session × fixture</b></div><div><span>FRESHNESS</span><b>Commit-bound</b></div></div><div class="lineage-flow" aria-label="Metric lineage"><button type="button"><small>SOURCE</small><b>raw_events seed</b></button><i>→</i><button type="button"><small>STAGING</small><b>stg_events</b></button><i>→</i><button type="button"><small>FACT</small><b>fct_sessions</b></button><i>→</i><button type="button" class="active-node"><small>MART</small><b>mart_conversion</b></button></div><p class="contract-note">${note} The root CI rebuilds and verifies this value.</p>`;}
document.querySelectorAll("[data-lineage]").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll("[data-lineage]").forEach(item=>item.setAttribute("aria-selected","false"));button.setAttribute("aria-selected","true");renderLineage(button.dataset.lineage);}));

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll("nav a").forEach(link=>link.classList.toggle("active",link.getAttribute("href")===`#${entry.target.id}`));}),{rootMargin:"-30% 0px -60%",threshold:0});
document.querySelectorAll("main section[id]").forEach(section=>observer.observe(section));

document.querySelectorAll("[data-consent]").forEach(button=>button.addEventListener("click",()=>{ const choice=button.dataset.consent;localStorage.setItem("analytics_consent",choice);document.querySelector("#consent-status").textContent=choice==="granted"?"Local demo events enabled":"Telemetry remains off";if(choice==="granted"){window.portfolioAnalytics?.track("consent_updated",{consent_source:"dashboard_control"});window.portfolioAnalytics?.track("page_viewed",{page_title:document.title});}}));
if(localStorage.getItem("analytics_consent")==="granted"){document.querySelector("#consent-status").textContent="Local demo events enabled";window.portfolioAnalytics?.track("page_viewed",{page_title:document.title});}

fetch("./data/dashboard.json").then(response=>{if(!response.ok)throw new Error("fixture unavailable");return response.json();}).then(payload=>{metadata=payload.metadata;datasets=payload.datasets;document.querySelector("#fixture-meta").textContent=`${metadata.eventRows} modeled events · ${metadata.eligibleEvents} eligible · through ${metadata.dataThrough}`;setRange("90");}).catch(()=>{document.querySelector("#fixture-meta").textContent="Fixture failed to load; inspect the committed JSON.";});
