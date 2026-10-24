# Version 2 validation record

Assessment: **share with the stated measurement and scope limits**. This is a reproducible personal analytics product, not a claim of enterprise operation or independently observed business impact.

## Correctness evidence

- Entirely synthetic 90-day source: deterministic generator seed 29, 1,460 deliveries. Twelve duplicates, three invalid contracts and one each bot/internal/test-marker/consent-denied row leave 1,441 eligible events.
- All 31 dbt tests pass across 40 build nodes. Explicit checks cover event accounting, excluded-event leakage, journey order, project grain, conversion bounds and cohort observation maturity, alongside unique/not-null/value contracts.
- Independent Python recomputation matches all 568 session partitions, event mappings, chronological first touches, ordered journeys, 436 session-project pairs and weekly cohort counts/maturity. Planted 29m59.999s/exact-30m and reversed-action examples are asserted directly, including a sub-second boundary spanning midnight.
- Four additional negative controls deliberately corrupt first-touch attribution, journey order, immature cohorts and project grain in disposable database copies. All four are rejected by the independent checker; the committed database/source is not modified.
- Selected-window facts, sources, daily rows and ordered funnel use the same session-start population. Period distinct users are recomputed, not summed. Public contract checks reconcile each window, bound project rates and reject observed values in censored cells.
- Live adapter tests cover malformed counts, pagination, bounded 429/5xx retries, authentication, cancellation, dense daily reconciliation and complete-day/zero-baseline comparisons. Browser checks cover private binding, opt-in saved access, disconnect, stale/error states, exports, public filters, unavailable aggregate states, phone overflow and serious/critical accessibility findings.

## Presentation and privacy checks

Public results are labelled synthetic beside the controls and every data export includes classification/provenance. Real analytics stays behind the existing owner's read-only connection. Daily bars start at zero; detailed data tables accompany charts. Incomplete retention weeks are em dashes, not zeros. Live country counts are not converted into rates against potentially different hourly/day boundaries.

The owner API timestamp is a retrieval timestamp, not evidence of provider processing completeness. Real traffic/attention may be empty, delayed, blocked or approximate. The public fixture models methods; it cannot establish real retention, hiring conversion or causal commercial lift. No paid experience, stakeholder sign-off or independent endorsement was added.

Live Chrome verification also exposed stale cached module dependencies after deployment. HTML, CSS and the full owner-module chain now carry content fingerprints checked in CI; public aggregate requests revalidate their data. The read-only owner connection was reused without creating or broadening credentials.
