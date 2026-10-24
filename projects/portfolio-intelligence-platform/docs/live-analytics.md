# Live portfolio analytics

The default dashboard is now a private owner view. `dist/case-study.html` retains
the deterministic synthetic dbt demonstration. Neither can silently load the other's data.

## Implemented path

Homepage → GoatCounter page/event collection → authenticated statistics API →
owner browser. No proxy, additional hosting account, or paid backend is required.
The browser refreshes every 60 seconds while visible; collection/aggregation and
network delays mean this is near real time, not an instantaneous census.

The API key has **Read statistics only**, restricted to `kushpatel.goatcounter.com`.
It is sent in an HTTPS Authorization header, never a URL, source file or public
JSON. The default connection stays in memory until reload. Remember is an
explicit opt-in to localStorage on the portfolio origin; any script on that origin
can read it. Use only a trusted personal browser. Disconnect removes that key.
A restrictive dashboard CSP permits scripts only from this site and API reads only
from GoatCounter. The owner page does not load third-party collection scripts.

## Metrics

| Metric | Calculation and boundary |
|---|---|
| Homepage visits | `/stats/total` filtered to path `/`, excluding events. GoatCounter's approximate eight-hour visit deduplication; not identified people or lifetime uniques. |
| Section attention | Sum of event counts × 15 seconds for registered `pi-time-15s:<area>` paths. One area receives each foreground interval. |
| Most measured area | Registered area with most measured attention in the selected period. No ranking before events exist; no proof of reading. |
| Résumé interest | Deduplicated `pi-action:resume` link interactions, not download completion. |
| Countries | `/stats/locations` filtered to homepage `/`; coarse network-derived estimates, affected by proxies/VPNs. No GPS or exact addresses. |
| Project interest | Deduplicated `pi-project-click:<project>` events, not proof of deep reading. |
| Page visits | Recorded non-event paths. Uninstrumented project demos on other domains are outside coverage. |

Attention requires a visible tab, focused document and activity within 60 seconds,
or a playing video. A project card takes precedence over its parent section.
Ticks use monotonic time, cap long timer stalls and retain fractional time locally.
Only complete 15-second blocks are dispatched; up to 14 seconds per area per page
load are unreported. Background/idle time is never backfilled. Browser blocking,
page exits, DNT and network failures cause undercounting. Old visits cannot have
section-time history reconstructed. The live interface states these limitations.

## Privacy and quality

- Existing GoatCounter country collection remains coarse; no precise location is requested.
- No visitor ID, form content, key value, full query string or raw referrer path is sent by the live collector.
- Referrers are reduced to origins. Event names use registered static area IDs.
- No new cookie or persistent visitor identifier. Remember stores an owner key only after explicit choice.
- Do Not Track, Global Privacy Control, `navigator.webdriver`, homepage `?analytics=off`, and
  `localStorage.portfolio_tracking_disabled = '1'` suppress collection.
- `?analytics_test=1` sends only `qa:` events and suppresses the automatic real page hit.
  QA events are excluded from attention and all root-filtered metrics.
- API pagination is followed; incomplete or failed reads never appear as successful totals.
- API failures label retained values with the last successful update time. A changed
  period clears the previous period before fetching. The fixture is never a fallback.
- Unit tests cover foreground/idle/privacy semantics, double counting, QA separation,
  pagination, authentication and count conversion. Browser tests cover API binding,
  key storage opt-in/removal, error states, accessibility and mobile layout.

## Account setup / recovery

Verify the GoatCounter account email. In the account's API settings, create a key
with only **Read statistics**, turn off all-sites access, and select only
`kushpatel.goatcounter.com`. Connect at the live dashboard. Use Remember only on a
trusted browser. If it is cleared, reconnect with the key visible in your private
GoatCounter account; do not paste it into a chat or commit it. Revoke it there if
the device becomes untrusted. The native private dashboard remains available at
https://kushpatel.goatcounter.com/ without this custom connection.

Sources: [API](https://www.goatcounter.com/help/api),
[JavaScript API](https://www.goatcounter.com/help/js),
[visit/session semantics](https://www.goatcounter.com/help/sessions).

## Version 2 reliability and comparison contract

Optional comparisons use equal complete UTC-day windows, excluding today. Live headline windows still include a partial today, so comparison totals are shown separately, with their own dates and denominator. A zero baseline makes percentage change unavailable; a volume change does not establish significance or causation.

The API uses inclusive hourly buckets. Live windows include today's hours; complete-day comparison ends before the next midnight. Daily display buckets follow the native account timezone and may include an adjacent calendar edge date; the request boundaries remain UTC. Country statistics use provider day buckets, so country percentages or conversion rates against hourly totals are not inferred.

Reads are serialized with at least 300 ms between requests, at most two retries on 429/5xx and a 20-second per-request timeout. Path pagination stops at 20 pages and rejects repeated/invalid IDs. Negative, fractional and unsafe counts are refused; daily counts must reconcile to the homepage total. Window changes abort old reads and generation checks block stale overwrites. Comparison failure does not hide an otherwise valid live snapshot.

The interface distinguishes retrieved, stale, disconnected, incomplete and empty states. JSON/CSV downloads include retrieval/selection and stale-state context, never the API key. Daily tables remain available alongside charts. Browser storage is still opt-in and same-origin readable; no new authentication or wider permission is introduced by this upgrade.
