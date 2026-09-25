# Event tracking plan

All event names use `snake_case`. Required properties are validated before dispatch. Event payloads must not contain names, email addresses, resume contents, free-form messages, IP addresses, or other direct identifiers.

| Event | Trigger | Required properties |
|---|---|---|
| `page_viewed` | Route becomes visible | `page_path`, `page_title` |
| `project_impression` | Project card is at least 50% visible | `project_id`, `position` |
| `project_viewed` | Project detail is opened | `project_id`, `project_category`, `entry_source` |
| `project_demo_clicked` | Live demo CTA is selected | `project_id` |
| `project_github_clicked` | Repository CTA is selected | `project_id` |
| `case_study_viewed` | Case study opens | `project_id` |
| `case_study_completed` | Reader reaches 90% | `project_id`, `engaged_seconds` |
| `resume_viewed` | Resume preview opens | `source_page` |
| `resume_downloaded` | Resume download starts | `source_page` |
| `linkedin_clicked` | LinkedIn CTA is selected | `source_page` |
| `contact_clicked` | Contact CTA is selected | `source_page`, `contact_method` |
| `navigation_used` | Primary navigation is used | `destination`, `source_page` |
| `scroll_depth_reached` | 25, 50, 75, or 100% threshold is crossed | `depth`, `page_path` |
| `outbound_link_clicked` | External link is selected | `link_domain`, `link_context` |
| `web_vital_recorded` | LCP, CLS, INP, FCP, or TTFB finalizes | `metric_name`, `metric_value`, `rating` |
| `javascript_error_recorded` | Runtime error or unhandled rejection occurs | `error_type` |
| `consent_updated` | Analytics consent changes to granted | `consent_state`, `consent_source` |

## Common context

Every eligible event receives:

- `event_id`: UUID generated once per event
- `event_version`: contract version
- `occurred_at`: UTC ISO-8601 timestamp
- `anonymous_user_id`: first-party pseudonymous identifier
- `session_id`: first-party session identifier
- `page_path`: path only, with sensitive query parameters removed
- `consent_state`: `granted` or `denied`
- `is_internal`, `is_synthetic`: explicit downstream eligibility flags

Error telemetry is deliberately coarse: it records an error category, never exception messages, stack traces, URLs with query strings, or form content. Web-vital values are behavioral performance measurements and contain no user-entered data.

## Quality controls

- Reject unregistered event names at dispatch time.
- Deduplicate on `event_id` before sessionization.
- Quarantine events whose contract version is unsupported.
- Monitor missing IDs, consent state, attribution fields, and timestamps.
- Apply bot, internal, synthetic, and automated-test exclusions only in governed models; preserve raw lineage.
- Reprocess a rolling three-day window to capture late-arriving exports without double counting.

## Ownership and change control

Analytics Engineering owns the contract. Breaking changes require a version bump, updated model tests, and a migration note. New optional properties are backward-compatible.
