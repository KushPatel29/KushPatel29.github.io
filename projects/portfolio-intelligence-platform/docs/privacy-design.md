# Privacy design and threat model

The public evidence workbench fetches only committed synthetic aggregates. It sends no analytics events, requests no identity consent and stores no visitor identifier. The homepage's live collector is separate: cookie-free GoatCounter page/event counts, static area IDs, sampled attention and coarse countries. DNT/GPC, internal automation and owner opt-outs suppress it. No form content, keystrokes, raw query strings, raw referrer paths or precise location are collected by that code.

| Threat | Implemented control | Residual boundary |
|---|---|---|
| API key exposed in source or URLs | Owner enters an existing read-only site-scoped key; Authorization header directly to HTTPS provider | Key is readable in the running owner browser; no claim of secret isolation from browser extensions |
| Persisted credential stolen by same-origin script | Memory-only default, explicit Remember choice, disclosure, Disconnect clearing, self-only dashboard scripts and restricted CSP connections | localStorage is not encrypted secret storage; use a trusted device and revoke compromised keys |
| Real traffic disclosed publicly | No provider credentials/data committed; separate source paths; synthetic JSON labelled and checked | Owner exports are private local files that the owner must handle appropriately |
| Synthetic values shown as live | Owner view never fetches fixture JSON; failures stay errors/stale states | Tests validate this boundary, not all possible browser compromises |
| Misleading inferred identity or behavior | Visits are approximate; countries coarse; no person-level joining, causal conversion claims or historic dwell reconstruction | VPNs, blocking, deduplication and inactivity sampling affect coverage |
| Unsafe returned labels | Browser rendering uses textContent rather than interpolated provider HTML | CSP and response checks complement, rather than replace, safe rendering |
| Overcollection via optional reference adapter | Not loaded by either dashboard; consent and property allowlist guard the reference dispatcher | Activating a future provider requires its own privacy and measurement review |

No jurisdictional compliance certification, legal determination or anonymization guarantee is asserted. Retention is controlled by the native provider/account; this static project cannot enforce provider deletion or retention. Owner-browser storage and a separate production identity boundary remain explicit architectural tradeoffs.
