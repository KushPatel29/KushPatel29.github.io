# Project status — version 2

Implemented: private live visits/attention/countries, complete-day comparisons, request pacing/retry/cancellation, response validation, labelled stale states, daily table/CSV and provenance-bearing JSON. A separate public evidence workbench has functioning 30/60/90-day controls, chronological acquisition, ordered journeys, session-project engagement, censored cohorts and delivery accounting.

Executed warehouse evidence: 1,460 synthetic delivered events -> 1,441 eligible events -> 568 sessions and 436 session-project pairs. Build: eight models, one seed, 31 data tests (40 nodes). Independent Python checks all session/event assignments, first touches, journeys, project pairs and cohort maturity/counts. Browser checks cover both interfaces at desktop and phone sizes; CI rebuilds the exported JSON.

Not claimed: real visitor identities, observed live retention, causal lift, historical section time, real p75 Core Web Vitals, executed GA4/PostHog/BigQuery integrations, enterprise traffic scale or paid adoption. Experimental observer/reference adapters are not loaded by the dashboards. The live and synthetic paths remain separate. Final release verification is recorded in `docs/validation-report.md`.
