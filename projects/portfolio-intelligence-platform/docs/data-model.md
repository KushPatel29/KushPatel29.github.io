# Data model

## Raw and staging

- `raw_events`: append-only event source used by the demo target
- `stg_events`: typed, deduplicated, normalized event records

## Intermediate

- `int_sessions`: 30-minute inactivity sessionization
- `int_attribution`: first-touch, session, and last non-direct source logic
- `int_project_engagement`: deduplicated project interactions
- `int_journeys`: ordered session steps and time to action

## Marts

- `fct_events`: eligible event fact
- `fct_sessions`: one row per reconstructed session
- `fct_project_engagement`: session-project behavioral fact
- `fct_web_vitals`: performance observation fact
- `mart_conversion`: governed daily conversion metrics
- `mart_acquisition`: source/medium performance
- `mart_content`: project reach, depth, and downstream action

## Stable keys

`event_id` is generated client-side. `session_id` is derived from anonymous user ID and the cumulative session-break number. Project and page dimensions use stable, human-readable business keys.
