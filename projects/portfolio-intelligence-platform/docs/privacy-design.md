# Privacy design

## Principles

- No analytics provider activates before consent where consent is legally required.
- No direct identifiers or free-form form contents are sent to analytics.
- Query strings are stripped or allowlisted before page paths are recorded.
- Raw events are retained privately; only aggregates are public.
- Session replay masks text and inputs by default and is disabled on sensitive routes.
- Internal, bot, synthetic, and monitoring traffic remains traceable but ineligible.
- If a provider is activated later, its deletion and retention settings must be configured before collection begins.

## Public dashboard threshold

Segments with fewer than 10 eligible sessions are suppressed or combined into “Other.” Geography is never shown below country level. The public export contains no user IDs, session IDs, timestamps finer than a day, or raw referrers.

## Demo boundary

The deployed dashboard reads `dist/data/dashboard.json`, generated from the committed 20-event seed after dbt passes. It says so visibly. The local consent demo has no configured provider, so its events do not leave the browser.
