export const SITE = 'https://kushpatel.goatcounter.com';
export const QUANTUM_SECONDS = 15;
export const AREA_LABELS = {
  intro: 'Introduction', fit: 'Role fit', work: 'Projects overview', featured: 'Flagship projects',
  experience: 'Employment', method: 'Methods & findings', skills: 'Skills', education: 'Education',
  'business-analysis': 'Business analysis', domains: 'Industries', faq: 'Questions', contact: 'Contact',
  'p-growthops': 'GrowthOps OS', 'p-control-tower': 'Supply Chain Control Tower', 'p-bc-finance': 'B.C. Finance',
  'p-wholesale': 'Retail Analytics', 'p-dbt': 'Supply Chain dbt', 'p-excel-fpa': 'Excel FP&A',
  'p-gl-recon': 'GL Reconciliation', 'p-pricing-analytics': 'Pricing Analytics', 'p-inventory': 'Inventory Analytics',
  'p-migration': 'Fabric Migration', 'p-ask-your-data': 'Ask Your Data', 'p-wildfire': 'Wildfire Forecast',
  'p-aml-monitoring': 'AML Monitoring', 'p-marketing': 'Marketing Attribution', 'p-customer-rec': 'Customer Recommendations',
  'p-hr-attrition': 'Workforce Analytics', 'p-corridor': 'Corridor Decisions', 'p-healthcare': 'Healthcare Analytics',
  'p-clinical': 'Clinical Data', 'p-hubspot-crm': 'HubSpot CRM', 'p-portfolio-intelligence': 'Portfolio Intelligence'
};

export function modelHits(hits) {
  const attention = [], projects = [], pages = [];
  const actions = { resume: 0, contact: 0 };
  for (const hit of hits) {
    if (!Number.isInteger(hit.count) || hit.count < 0) throw new Error('Invalid count received');
    const path = String(hit.path);
    if (path.startsWith('qa:')) continue;
    if (!hit.event && path.startsWith('/')) pages.push({ label: hit.title || path, path, count: hit.count });
    if (!hit.event) continue;
    if (path.startsWith('pi-time-15s:')) {
      const id = path.slice('pi-time-15s:'.length);
      if (AREA_LABELS[id]) attention.push({ id, label: AREA_LABELS[id], seconds: hit.count * QUANTUM_SECONDS });
    }
    if (path.startsWith('pi-project-click:')) {
      const id = path.slice('pi-project-click:'.length);
      if (AREA_LABELS[id]) projects.push({ id, label: AREA_LABELS[id], count: hit.count });
    }
    if (path === 'pi-action:resume') actions.resume += hit.count;
    if (path === 'pi-action:contact') actions.contact += hit.count;
  }
  attention.sort((a,b) => b.seconds-a.seconds);
  projects.sort((a,b) => b.count-a.count);
  pages.sort((a,b) => b.count-a.count);
  return { attention, projects, pages, actions, engagedSeconds: attention.reduce((sum,x) => sum+x.seconds,0) };
}

export async function readAnalytics(token, days, fetcher = fetch, now = new Date()) {
  const start = new Date(now); start.setUTCHours(0,0,0,0); start.setUTCDate(start.getUTCDate()-days+1);
  const end = new Date(now); end.setUTCHours(end.getUTCHours()+1,0,0,0);
  const common = new URLSearchParams({ start: start.toISOString(), end: end.toISOString() });
  async function get(route, query = {}) {
    const qs = new URLSearchParams(common);
    Object.entries(query).forEach(([k,v]) => qs.set(k,String(v)));
    const response = await fetcher(`${SITE}/api/v0/stats/${route}?${qs}`, {
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(20000)
    });
    if (response.status === 401 || response.status === 403) throw new Error('Access denied. Use a verified-account key with Read statistics permission for kushpatel only.');
    if (!response.ok) {
      const detail=await response.json().catch(()=>({}));
      const reason=detail.error || (detail.errors ? JSON.stringify(detail.errors) : 'Try again shortly.');
      throw new Error(`GoatCounter ${response.status}: ${String(reason).slice(0,250)}`);
    }
    return response.json();
  }
  // Serialize requests: GoatCounter permits four API requests per second.
  let hits = [], more = true;
  for (let page = 0; more; page++) {
    if (page >= 20) throw new Error('Too many paths to load completely; use the native dashboard.');
    const batch = await get('hits', {limit:100, ...(hits.length ? {exclude_paths:hits.map(x=>x.path_id).join(',')} : {})});
    if (!Array.isArray(batch.hits)) throw new Error('Unexpected analytics response');
    if (batch.more && !batch.hits.length) throw new Error('Incomplete analytics response');
    hits.push(...batch.hits); more = batch.more;
    await new Promise(resolve => setTimeout(resolve,300));
  }
  // Root visits are kept separate from every event, including heartbeats.
  const root = await get('total', {include_paths:'/',path_by_name:true});
  await new Promise(resolve => setTimeout(resolve,300));
  const locations = await get('locations', {limit:100,include_paths:'/',path_by_name:true});
  const countries = locations.stats;
  if (!Number.isInteger(root.total) || !Array.isArray(countries)) throw new Error('Incomplete analytics response');
  const modeled = modelHits(hits);
  return { ...modeled, visits: root.total-(root.total_events || 0), countries, countriesMore: Boolean(locations.more),
    daily: root.stats || [], updatedAt: now.toISOString(), start: start.toISOString(), end: now.toISOString() };
}
