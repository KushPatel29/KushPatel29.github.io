# Metric contracts

## Public workbench: entirely synthetic

Owner: portfolio analytics. Freshness: fixed, commit-bound fixture, 26 July–23 October 2026. This is not a live feed. `data_origin=synthetic_fixture` applies to every delivery. Row flags model hypothetical exclusion rules and do not make unflagged rows real traffic.

| Measure | Grain and denominator | Important boundary |
|---|---|---|
| Eligible event | Canonical event ID, valid v2 contract, granted consent, no bot/internal/test marker | Duplicate deliveries and invalid contracts have explicit audit dispositions |
| Session | User and sequential inactivity partition | Exact elapsed seconds >=1,800 start a new session; timestamps tie-break on event ID |
| Window | Session-start date in the selected 30/60/90 days, UTC | All child events use the selected session population, including a session crossing midnight |
| Eligible users | Distinct simulated users across selected sessions | Never sum daily distinct users into a period user count |
| Acquisition / landing | First event's source, medium and page | First event in time, not lexicographic minimum or last direct touch |
| Engagement rate | Sessions with >=60 event seconds, >=2 page views or a high-intent action / eligible sessions | A method demonstration, not an attention measurement of real visitors |
| High intent | Résumé view/download, LinkedIn or contact action, once per session | An action is not a completed download, application, message or hire |
| Ordered journey | Page -> project -> case study -> high intent, strictly increasing event positions, same session | Stage counts / all eligible sessions. Independent action totals are not substituted |
| Project sessions | Distinct session-project pairs | Repeated views do not add denominator rows |
| Deep session-project | Sum of project's view-event seconds >=45 / project sessions | Hypothetical event duration in synthetic data |
| Later-action rate | Session-project pairs with a high-intent event after the first project view / project sessions | Association, not causal attribution or lift; one session may evaluate several projects |
| Weekly retention | Active users in week N / fixed first-observed Monday cohort | Complete calendar weeks only; incomplete cells are NULL, not zero. W0 may start before the fixture boundary; these are first-observed cohorts, not known lifetime acquisition |
| Event accounting | One mutually exclusive disposition per delivery | Raw = eligible + duplicate + invalid + consent denied + bot + internal + test marker |

Retention always uses the full 90-day fixture history, independently labelled beneath the window selector. Ratios are calculated from counts, never averaged from displayed percentages. A zero requires a complete observation interval; unavailable cells stay unavailable.

## Live owner dashboard

The independent [live measurement contract](live-analytics.md) defines approximate visits, 15-second attention samples, link interactions, country estimates, retrieval freshness and complete-day comparisons. Synthetic warehouse sessions and real GoatCounter visit deduplication are different definitions. They must not be joined or compared as if they shared identity.
