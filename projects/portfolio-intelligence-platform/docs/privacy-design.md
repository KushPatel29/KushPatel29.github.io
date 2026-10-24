# Privacy design

## Principles

- No analytics provider activates before consent where consent is legally required.
- No direct identifiers or free-form form contents are sent to analytics.
- Query strings are stripped or allowlisted before page paths are recorded.
- Live statistics stay private in GoatCounter and the authenticated owner's browser. Neither raw events nor real aggregates are published in the repository.
- No session replay is enabled.
- Internal, bot, synthetic, and monitoring traffic remains traceable but ineligible.
- If a provider is activated later, its deletion and retention settings must be configured before collection begins.

## Public and private boundaries

The public dbt case study is synthetic, so its small fictional sample is displayed with that explicit disclosure. The live dashboard requires the owner's read-only key and shows no real values before connection. Geography is never shown below country level. There is no public live-data export. A deliberate owner-initiated summary download stays on the owner's machine.

## Demo boundary

`dist/case-study.html` reads `dist/data/dashboard.json`, generated from the committed 20-event seed after dbt passes. Its consent demo has no configured GA4/PostHog provider, so those demo events do not leave the browser. The default `dist/index.html` instead reads the private GoatCounter API, as documented in [the live measurement contract](live-analytics.md). No fixture values are used as live fallbacks.
