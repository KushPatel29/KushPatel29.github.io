# Architecture

## Design goals

- Keep collection lightweight and consent-aware.
- Preserve immutable raw events and apply exclusions downstream.
- Make transformations reproducible locally without a paid cloud account.
- Define each public KPI once and publish only aggregated data.
- Treat quality, freshness, cost, and privacy as product requirements.

## Data flow

1. A browser event contract validates names and required properties.
2. Consented events are routed to GA4 and PostHog.
3. GA4 exports nested daily event tables to BigQuery.
4. dbt flattens parameters, deduplicates events, and normalizes sources.
5. Intermediate models reconstruct sessions, journeys, and attribution.
6. Facts and marts aggregate engagement and conversion behavior.
7. Tests gate the export consumed by the public dashboard.

## Environments

| Environment | Purpose | Warehouse | Data |
|---|---|---|---|
| CI | Pull-request validation | DuckDB | deterministic seed |
| Demo | Public portfolio showcase | static aggregate | synthetic and labeled |
| Production | Genuine portfolio analytics | BigQuery | consented production events |

## Incremental strategy

Production event and session models reprocess a rolling three-day window and merge by stable keys. This handles delayed GA4 exports and corrects sessions affected by late events while limiting scan volume. Backfills use explicit date bounds.

## Cost controls

- Partition facts by event or session date.
- Cluster frequent filters such as event name, project ID, and source.
- Require partition filters on production marts.
- Export only aggregated dashboard payloads.
- Keep CI on local DuckDB.
