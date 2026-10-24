# Architecture and operating decisions

## Two independent paths

Live: homepage -> GoatCounter -> read-only owner browser. Public: generated synthetic CSV -> DuckDB/dbt -> checked aggregate JSON -> static workbench. There is no live-data proxy, public visitor export, shared identity or fixture fallback.

The static owner design avoids storing an API key in a public backend, keeps operating cost at zero for this small use case and reuses the account already collecting visits. Its tradeoff is owner-browser authentication: a remembered key is readable by any script on the portfolio origin. The CSP limits the dashboard's script sources, but does not provide a separate security origin or protection from every browser extension. A dedicated backend with an access-controlled identity boundary would be a different deployment, not a feature silently implied here.

DuckDB makes the analytical pipeline executable by a reviewer. Eight models separate delivery accounting, contract validity, eligible events, sessions and decision-specific marts. Full rebuilds are deliberate for this bounded 1,460-row fixture. Incremental production ingestion, streaming guarantees, cloud deployment and large-scale benchmarks are not claimed.

## Refresh and failure behavior

The owner page refreshes every 60 seconds while visible and avoids overlapping timer reads. Changing a window cancels the old request; generation checks prevent late results overwriting the new selection. Requests have timeouts, pacing, bounded retries on 429/5xx and bounded/progress-checked path pagination. Counts must be non-negative integers and daily totals must reconcile before a new snapshot is accepted. Optional comparison failure is isolated from an otherwise valid live snapshot.

Missing credentials and invalid/incomplete responses show explicit errors. A same-window failed refresh can retain a labelled stale snapshot; a changed window clears old data. JSON export includes retrieval time, source, selected dates and stale/retrieved status. CSV includes daily counts and that same status. Exports are local downloads and contain no key.

## Recovery / release runbook

1. For a collection gap, inspect DNT/GPC, opt-out, active focus, short visits and the native GoatCounter account before concluding the count is zero. Historical attention cannot be reconstructed.
2. For 401/403, verify the account and the existing site's Read statistics permission; reconnect or revoke a compromised key in the native account. Never commit it.
3. For 429/5xx, let bounded retries complete, then retry later or use the native dashboard. Do not increase request frequency to force recovery.
4. For count reconciliation or pagination errors, preserve the last labelled snapshot, inspect the provider's documented API and fix the contract. Never substitute fixture values.
5. For a failed warehouse build, do not export. Reproduce with the pinned runtime, inspect `dbt/target/run_results.json`, fix the model or source and rerun the independent oracle.
6. For a bad deployment, revert the release commit, wait for the Pages workflow, verify deployed bytes and recheck both pages. Stored owner keys are not part of Git or deployment artifacts.

Primary provider references: [API and rate limits](https://www.goatcounter.com/help/api), [OpenAPI contract](https://www.goatcounter.com/api.json), [visit definition](https://www.goatcounter.com/help/sessions). API v0 can change; the adapter validates responses instead of trusting them blindly. There is no claimed service uptime SLO or server-processing freshness guarantee.
