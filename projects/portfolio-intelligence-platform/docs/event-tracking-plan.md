# Event contracts and activation boundaries

## Executed live collector

`analytics/live-tracking.js` is loaded by the homepage. It uses cookie-free GoatCounter aggregate events:

| Path | Meaning | Guardrail |
|---|---|---|
| `/` page hit | Estimated homepage visit | Native visit deduplication; not an identified person |
| `pi-time-15s:<registered-area>` | One complete 15-second active-attention block | One foreground area only; focused/visible, recent activity or playing video; static area IDs |
| `pi-project-click:<registered-project>` | Project-card link interaction | Deduplicated native event; not a read or conversion |
| `pi-action:resume` / `pi-action:contact` | Résumé/email-link interest | Does not establish completed download, message or application |
| `qa:*` | Explicit integration test namespace | Excluded from live metrics; QA mode suppresses automatic real page hit |

DNT/GPC, automation, owner opt-out and `?analytics=off` suppress collection. Referrers are reduced to origin; no visitor ID, free text, input content, precise location or raw query string is added.

## Synthetic warehouse contract v2

The deterministic CSV contains event ID, simulated user, event name, event/receipt timestamp, page/project, source/medium, bot/internal/test flags, event seconds, consent state, version and `data_origin=synthetic_fixture`.

Seven analytical event names are accepted: page/project/case-study viewed, résumé viewed/downloaded, LinkedIn clicked and contact clicked. An ID and simulated user must exist; event time must parse; seconds must be non-negative; page paths start with `/` and contain no query or fragment; project events require a project ID. Contract version is exactly 2. Duplicates are ranked by earliest receipt timestamp with deterministic tie-breakers. Invalid contracts are retained in the audit, not session facts.

## Unactivated reference code

`analytics/tracking.js` and `analytics/web-vitals.js` are reference experiments; neither dashboard loads them. The dispatcher requires locally granted consent, respects DNT/GPC, and refuses unregistered properties or attempts to override its base context. It is not an executed GA4/PostHog integration. Its observer emits experimental raw observations and does not implement complete official CLS/INP algorithms. It cannot support real-user p75 claims. A future activation requires a separate event/schema, privacy, provider and measurement validation pass.
