import { statsClient } from "./api-client.js";
export { SITE } from "./api-client.js";
export const QUANTUM_SECONDS = 15;
export const AREA_LABELS = {
  intro: "Introduction",
  fit: "Role fit",
  work: "Projects overview",
  featured: "Flagship projects",
  experience: "Employment",
  method: "Methods & findings",
  skills: "Skills",
  education: "Education",
  "business-analysis": "Business analysis",
  domains: "Industries",
  faq: "Questions",
  contact: "Contact",
  "p-growthops": "GrowthOps OS",
  "p-control-tower": "Supply Chain Control Tower",
  "p-bc-finance": "B.C. Finance",
  "p-wholesale": "Retail Analytics",
  "p-dbt": "Supply Chain dbt",
  "p-excel-fpa": "Excel FP&A",
  "p-gl-recon": "GL Reconciliation",
  "p-pricing-analytics": "Pricing Analytics",
  "p-inventory": "Inventory Analytics",
  "p-migration": "Fabric Migration",
  "p-ask-your-data": "Ask Your Data",
  "p-wildfire": "Wildfire Forecast",
  "p-aml-monitoring": "AML Monitoring",
  "p-marketing": "Marketing Attribution",
  "p-customer-rec": "Customer Recommendations",
  "p-hr-attrition": "Workforce Analytics",
  "p-corridor": "Corridor Decisions",
  "p-healthcare": "Healthcare Analytics",
  "p-clinical": "Clinical Data",
  "p-hubspot-crm": "HubSpot CRM",
  "p-portfolio-intelligence": "Portfolio Intelligence",
};

export function modelHits(hits) {
  const attention = [],
    projects = [],
    pages = [];
  const actions = { resume: 0, contact: 0 };
  for (const hit of hits) {
    if (!Number.isSafeInteger(hit.count) || hit.count < 0)
      throw new Error("Invalid count received");
    const path = String(hit.path);
    if (path.startsWith("qa:")) continue;
    if (!hit.event && path.startsWith("/"))
      pages.push({ label: hit.title || path, path, count: hit.count });
    if (!hit.event) continue;
    if (path.startsWith("pi-time-15s:")) {
      const id = path.slice("pi-time-15s:".length);
      if (AREA_LABELS[id])
        attention.push({
          id,
          label: AREA_LABELS[id],
          seconds: hit.count * QUANTUM_SECONDS,
        });
    }
    if (path.startsWith("pi-project-click:")) {
      const id = path.slice("pi-project-click:".length);
      if (AREA_LABELS[id])
        projects.push({ id, label: AREA_LABELS[id], count: hit.count });
    }
    if (path === "pi-action:resume") actions.resume += hit.count;
    if (path === "pi-action:contact") actions.contact += hit.count;
  }
  attention.sort((a, b) => b.seconds - a.seconds);
  projects.sort((a, b) => b.count - a.count);
  pages.sort((a, b) => b.count - a.count);
  return {
    attention,
    projects,
    pages,
    actions,
    engagedSeconds: attention.reduce((sum, x) => sum + x.seconds, 0),
  };
}

export async function readAnalytics(
  token,
  days,
  fetcher = fetch,
  now = new Date(),
  options = {},
) {
  if (![1, 7, 30, 90].includes(days) || !Number.isFinite(now.getTime()))
    throw Error("Unsupported analytics date window");
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  // API aggregates inclusive hourly buckets. Last hour of today includes the partial current day
  // without creating a spurious tomorrow bucket when it is 23:xx UTC.
  const end = new Date(now);
  end.setUTCHours(23, 0, 0, 0);
  const common = { start: start.toISOString(), end: end.toISOString() };
  const client = statsClient(token, fetcher, options);
  const get = (route, query = {}) => client.get(route, { ...common, ...query });
  // Serialize requests: GoatCounter permits four API requests per second.
  let hits = [],
    more = true;
  const seen = new Set();
  for (let page = 0; more; page++) {
    if (page >= 20)
      throw new Error(
        "Too many paths to load completely; use the native dashboard.",
      );
    const batch = await get("hits", {
      limit: 100,
      ...(hits.length
        ? { exclude_paths: hits.map((x) => x.path_id).join(",") }
        : {}),
    });
    if (batch.hits === null && batch.more === false) batch.hits = [];
    if (!Array.isArray(batch.hits) || typeof batch.more !== "boolean")
      throw new Error("Unexpected analytics response");
    if (batch.more && !batch.hits.length)
      throw new Error("Incomplete analytics response");
    for (const hit of batch.hits) {
      if (
        !Number.isSafeInteger(hit.path_id) ||
        hit.path_id < 1 ||
        seen.has(hit.path_id)
      )
        throw Error(
          "Repeated or invalid path IDs; incomplete analytics response",
        );
      seen.add(hit.path_id);
    }
    hits.push(...batch.hits);
    more = batch.more;
  }
  // Root visits are kept separate from every event, including heartbeats.
  const root = await get("total", { include_paths: "/", path_by_name: true });
  const locations = await get("locations", {
    limit: 100,
    include_paths: "/",
    path_by_name: true,
  });
  const visits = visitTotal(root);
  const countries =
    locations.stats === null && visits === 0 ? [] : locations.stats;
  if (
    !Array.isArray(countries) ||
    countries.some(
      (c) =>
        !Number.isSafeInteger(c.count) ||
        c.count < 0 ||
        typeof c.name !== "string",
    )
  )
    throw Error("Invalid country counts received");
  const countryTotal = countries.reduce((s, c) => s + c.count, 0);
  const daily = normalizeDaily(root.stats, start, now, visits);
  const modeled = modelHits(hits);
  let comparison = null;
  if (options.compare && days > 1) {
    const boundary = new Date(now);
    boundary.setUTCHours(0, 0, 0, 0);
    const currentStart = new Date(boundary);
    currentStart.setUTCDate(currentStart.getUTCDate() - days);
    const previousStart = new Date(currentStart);
    previousStart.setUTCDate(previousStart.getUTCDate() - days);
    try {
      const current = visitTotal(
        await get("total", {
          start: currentStart.toISOString(),
          end: new Date(boundary - 1).toISOString(),
          include_paths: "/",
          path_by_name: true,
        }),
      );
      const previous = visitTotal(
        await get("total", {
          start: previousStart.toISOString(),
          end: new Date(currentStart - 1).toISOString(),
          include_paths: "/",
          path_by_name: true,
        }),
      );
      comparison = {
        current,
        previous,
        currentStart: currentStart.toISOString(),
        previousStart: previousStart.toISOString(),
        end: new Date(boundary - 1).toISOString(),
        changePercent: previous
          ? (100 * (current - previous)) / previous
          : null,
      };
    } catch (error) {
      if (options.signal?.aborted) throw error;
      comparison = { error: error.message };
    }
  }
  return {
    ...modeled,
    visits,
    countries,
    countriesMore: Boolean(locations.more),
    daily,
    comparison,
    coverage: {
      countryVisits: countryTotal,
      unlocatedVisits: countryTotal <= visits ? visits - countryTotal : null,
      attentionRecorded: modeled.engagedSeconds > 0,
      bucketTimezone: "GoatCounter account setting",
    },
    requests: client.requests,
    updatedAt: now.toISOString(),
    start: start.toISOString(),
    end: now.toISOString(),
  };
}

export function visitTotal(root) {
  const events = root.total_events ?? 0;
  if (
    !Number.isSafeInteger(root.total) ||
    root.total < 0 ||
    !Number.isSafeInteger(events) ||
    events < 0 ||
    events > root.total
  )
    throw Error("Invalid visit/event totals received");
  return root.total - events;
}
export function normalizeDaily(stats, start, end, expected) {
  if (stats === null && expected === 0) stats = [];
  if (!Array.isArray(stats)) throw Error("Missing daily counts received");
  const values = new Map();
  const low = new Date(start);
  low.setUTCDate(low.getUTCDate() - 1);
  const high = new Date(end);
  high.setUTCDate(high.getUTCDate() + 1);
  for (const row of stats) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(row.day) ||
      !Number.isSafeInteger(row.daily) ||
      row.daily < 0 ||
      values.has(row.day) ||
      row.day < low.toISOString().slice(0, 10) ||
      row.day > high.toISOString().slice(0, 10)
    )
      throw Error("Invalid or duplicate daily counts received");
    // Account-timezone padding can include an empty adjacent date. Keep real edge activity,
    // but do not present a provider-padded future zero as an observed day.
    if (
      row.daily === 0 &&
      (row.day < start.toISOString().slice(0, 10) ||
        row.day > end.toISOString().slice(0, 10))
    )
      continue;
    values.set(row.day, row.daily);
  }
  const daily = [];
  const first = [start.toISOString().slice(0, 10), ...values.keys()].sort()[0],
    last = [end.toISOString().slice(0, 10), ...values.keys()].sort().at(-1);
  for (
    let d = new Date(first);
    d.toISOString().slice(0, 10) <= last;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const day = d.toISOString().slice(0, 10);
    daily.push({ day, daily: values.get(day) || 0 });
  }
  if (daily.reduce((s, d) => s + d.daily, 0) !== expected)
    throw Error(
      "Daily counts do not reconcile to homepage visits. No new values were accepted.",
    );
  return daily;
}
