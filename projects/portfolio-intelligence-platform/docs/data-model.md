# Executed data model

DuckDB only. BigQuery syntax, production partitioning and enterprise throughput have not been exercised here.

| Relation | Grain | Responsibility |
|---|---|---|
| `raw_events` | Delivered event, including replay | All generated data, deterministic shuffled delivery order |
| `stg_event_audit` | Delivered row | Safe timestamp/count conversion, v2 contract validation, deterministic earliest-delivery dedup rank, mutually exclusive disposition |
| `stg_events` | Canonical valid event ID | Normalized types; explicit analytics eligibility with consent and bot/internal/test exclusions |
| `int_sessions` | Eligible event in reconstructed session | Exact 30-minute inactivity, stable event positions and session keys |
| `fct_sessions` | Session | First chronological touch, start/end, deduplicated session outcomes, engagement rule |
| `fct_journeys` | Session | Ordered page/project/case/high-intent positions; absent prior stages keep downstream positions NULL |
| `mart_conversion` | Session-start day | Session conversion counts and rates, retained as a daily semantic mart |
| `mart_project_engagement` | Session-project | Repeated-view reduction, summed project seconds, later-action association |
| `mart_retention` | Cohort-week, W0–W4 | Fixed cohort denominator, mature-week censoring, distinct retained users |

The exported JSON contains only synthetic aggregates, schema version 2, fixed observation dates and a normalized seed SHA-256. It contains no API key, visitor-level event export or real telemetry. The exporter requires a successful dbt gate; CI reruns the generator check, full build, independent oracle and output-drift check.

`verify_warehouse.py` constructs sessions independently with Python datetime deltas, not the SQL session model. It compares every event/session assignment and first touch, walks each ordered journey, recomputes session-project actions and weekly cohorts, and asserts the planted exact-boundary and reversed-action probes.
