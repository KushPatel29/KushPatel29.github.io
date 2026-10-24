"""Prove meaningful analytical failures are rejected, using disposable synthetic database copies."""

import gc
import json
import shutil
import tempfile
from pathlib import Path

import duckdb
import verify_warehouse

root = Path(__file__).resolve().parents[1]
mutations = {
    "wrong first-touch source": "update fct_sessions set source='wrong-source' where session_id=(select min(session_id) from fct_sessions)",
    "out-of-order journey": "update fct_journeys set intent_pos=0 where intent_pos is not null",
    "immature cohort shown as zero": "update mart_retention set retained_users=0,retention_rate=0 where not is_mature",
    "duplicate session-project row": "insert into mart_project_engagement select * from mart_project_engagement limit 1",
}
results = []
for name, sql in mutations.items():
    with tempfile.TemporaryDirectory(prefix="pi-quality-") as directory:
        trial = Path(directory)
        (trial / "dbt/seeds").mkdir(parents=True)
        shutil.copyfile(
            root / "dbt/seeds/raw_events.csv", trial / "dbt/seeds/raw_events.csv"
        )
        shutil.copyfile(
            root / "portfolio_intelligence.duckdb",
            trial / "portfolio_intelligence.duckdb",
        )
        with duckdb.connect(str(trial / "portfolio_intelligence.duckdb")) as connection:
            connection.execute(sql)
        verify_warehouse.ROOT = trial
        rejected = False
        try:
            verify_warehouse.check()
        except AssertionError:
            rejected = True
        gc.collect()
        assert rejected, f"Quality gate accepted: {name}"
        results.append({"mutation": name, "rejected": True})
print(json.dumps(results))
