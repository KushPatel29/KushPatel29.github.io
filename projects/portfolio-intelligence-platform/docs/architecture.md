# Architecture

## Design goals

- Keep collection lightweight and consent-aware.
- Preserve immutable raw events and apply exclusions downstream.
- Make transformations reproducible locally without a paid cloud account.
- Define each public KPI once and publish only aggregated data.
- Treat quality, freshness, cost, and privacy as product requirements.

## Data flow

1. A browser event contract validates names and required properties.
2. The implemented browser dispatcher emits local custom events after consent; optional GA4 and PostHog hooks are present but not configured.
3. A committed 20-event CSV is the only executed source. BigQuery is an untested reference target.
4. dbt on DuckDB types, deduplicates, excludes ineligible events, and normalizes sources.
5. Intermediate models reconstruct sessions, journeys, and attribution.
6. Facts and marts aggregate engagement and conversion behavior.
7. Tests gate the export consumed by the public dashboard.

## Environments

| Environment | Purpose | Warehouse | Data |
|---|---|---|---|
| CI | Pull-request validation | DuckDB | deterministic seed |
| Demo | Public portfolio showcase | static aggregate | synthetic and labeled |
| Reference target | Future genuine analytics | BigQuery profile (not run) | none |

## Incremental strategy

The rolling three-day merge is a proposed production pattern, not an implemented model in this fixture. The executed DuckDB models rebuild the small deterministic seed in full.

## Cost controls

- Partition facts by event or session date.
- Cluster frequent filters such as event name, project ID, and source.
- Require partition filters on production marts.
- Export only aggregated dashboard payloads.
- Keep CI on local DuckDB.
