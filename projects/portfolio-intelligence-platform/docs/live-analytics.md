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
| Most-read area | Registered area with most measured attention in the selected UTC period. No ranking before events exist. |
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
