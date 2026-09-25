# Governed metric catalog

Every published value has a definition, grain, owner, exclusion policy, and freshness expectation. The public dashboard uses a clearly labeled synthetic dataset; these same contracts are designed for production events.

## Eligibility and identity

An eligible event has analytics consent granted and is not bot, internal, synthetic, or an automated test. An eligible session contains at least one eligible event. Anonymous visitors use a first-party pseudonymous identifier; sessions expire after 30 minutes of inactivity. Session conversions are deduplicated and rates are recomputed from base counts, never summed from daily percentages.

## Acquisition

| Metric | Definition | Grain / owner |
|---|---|---|
| Users | Distinct eligible anonymous users | period / Analytics Engineering |
| New users | Users whose first eligible event falls in the period | period / Growth Analytics |
| Sessions | Distinct reconstructed eligible sessions | day / Analytics Engineering |
| Sessions per user | Eligible sessions divided by users | period / Growth Analytics |
| Channel share | Sessions attributed to a channel divided by sessions | channel-day / Growth Analytics |
| Campaign conversion | Campaign sessions with a high-intent action divided by campaign sessions | campaign-day / Growth Analytics |

Attribution uses first touch for acquisition, session source for visit reporting, and last non-direct for conversion reporting. Direct traffic never overwrites a known campaign within the lookback window.

## Engagement and content

| Metric | Definition | Grain / owner |
|---|---|---|
| Engaged sessions | Sessions with 60+ foreground seconds, 2+ content views, or a high-intent action | day / Product Analytics |
| Engagement rate | Engaged sessions divided by eligible sessions | day / Product Analytics |
| Average engaged time | Foreground engaged milliseconds divided by eligible sessions | day / Product Analytics |
| Views per session | Governed page and project views divided by sessions | day / Content Analytics |
| Scroll completion | Eligible page views reaching 90% depth divided by page views | page-day / Content Analytics |
| Project view rate | Sessions with `project_viewed` divided by eligible sessions | day / Portfolio Analytics |
| Average project depth | Distinct projects viewed divided by project sessions | day / Content Analytics |
| Case-study completion | Completed case studies divided by opened case studies | project-day / Content Analytics |

## Conversion and journey

| Metric | Definition | Grain / owner |
|---|---|---|
| High-intent rate | Sessions with resume, GitHub, LinkedIn, or contact action divided by sessions | day / Portfolio Analytics |
| Resume view rate | Sessions with a resume view divided by sessions | day / Portfolio Analytics |
| Resume download rate | Sessions with a resume download divided by sessions | day / Portfolio Analytics |
| GitHub click-through rate | Sessions with a project repository click divided by project sessions | project-day / Portfolio Analytics |
| Contact conversion | Sessions with a contact action divided by sessions | day / Portfolio Analytics |
| Funnel completion | Sessions reaching the selected terminal step divided by sessions entering step one | journey-day / Product Analytics |

## Retention

| Metric | Definition | Grain / owner |
|---|---|---|
| Returning-user rate | Users observed before the period divided by users in the period | period / Product Analytics |
| Week-N retention | Acquisition-cohort users active in week N divided by week-zero cohort users | cohort-week / Product Analytics |
| Return frequency | Sessions from returning users divided by returning users | period / Product Analytics |
| Evaluator return rate | Technical-evaluator users returning within 28 days divided by evaluator users | cohort / Portfolio Analytics |
| Median days to return | Median elapsed whole days between consecutive eligible sessions | period / Product Analytics |

## Experience and reliability

Core Web Vitals are reported at the 75th percentile, segmented by device class. “Good” thresholds follow the public Web Vitals guidance: LCP ≤ 2.5 s, INP ≤ 200 ms, and CLS ≤ 0.10.

| Metric | Definition | Grain / owner |
|---|---|---|
| LCP p75 | 75th percentile Largest Contentful Paint | device-period / Web Performance |
| INP p75 | 75th percentile Interaction to Next Paint | device-period / Web Performance |
| CLS p75 | 75th percentile Cumulative Layout Shift | device-period / Web Performance |
| FCP p75 | 75th percentile First Contentful Paint | device-period / Web Performance |
| TTFB p75 | 75th percentile time to first response byte | device-period / Web Performance |
| Good-CWV visit share | Assessed visits passing all available Core Web Vitals divided by assessed visits | period / Web Performance |
| Error-free sessions | Sessions without a captured JavaScript error divided by sessions | day / Web Performance |

## Data health guardrails

| Metric | Service level |
|---|---|
| Event-contract coverage | 100% of accepted events match a versioned contract |
| Consent-state coverage | 100% of accepted events include consent state |
| Known attribution | ≥ 95% of eligible sessions resolve source and medium |
| Duplicate-event rate | < 1% by `event_id` |
| Late-arrival rate | < 2% after the daily processing cutoff |
| Freshness | production marts updated within 24 hours |
| Direct PII | zero names, emails, messages, IP addresses, or resume contents |

## Change control

Analytics Engineering owns the semantic contract. A breaking definition or property change requires an event-version increment, migration note, updated dbt tests, and approval from the metric owner. Dashboard labels must point to the same versioned definition used by downstream models.
