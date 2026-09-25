# Privacy design

## Principles

- No analytics provider activates before consent where consent is legally required.
- No direct identifiers or free-form form contents are sent to analytics.
- Query strings are stripped or allowlisted before page paths are recorded.
- Raw events are retained privately; only aggregates are public.
- Session replay masks text and inputs by default and is disabled on sensitive routes.
- Internal, bot, synthetic, and monitoring traffic remains traceable but ineligible.
- Deletion and retention settings are configured in each provider.

## Public dashboard threshold

Segments with fewer than 10 eligible sessions are suppressed or combined into “Other.” Geography is never shown below country level. The public export contains no user IDs, session IDs, timestamps finer than a day, or raw referrers.

## Demo boundary

The deployed dashboard uses deterministic synthetic aggregates and says so visibly. Synthetic generation is used to validate models and presentation, never to inflate production claims.
