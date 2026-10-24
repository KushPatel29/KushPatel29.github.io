"""Export deterministic aggregates only after the complete dbt gate passes."""

import hashlib
import json
from datetime import timedelta
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parents[1]


def rows(c, sql, args=()):
    cursor = c.execute(sql, args)
    keys = [x[0] for x in cursor.description]
    return [dict(zip(keys, row)) for row in cursor.fetchall()]


def dataset(c, start, end):
    args = [start, end]
    facts = rows(
        c,
        """select count(*) as sessions,count(distinct anonymous_user_id) as users,
        coalesce(sum(is_engaged),0) as engagedSessions,coalesce(sum(projects_viewed>0),0) as projectSessions,
        coalesce(sum(has_high_intent_action),0) as intentSessions,coalesce(sum(has_resume_action),0) as resumeSessions,
        coalesce(sum(has_contact_action),0) as contactSessions,coalesce(sum(engaged_seconds),0) as engagedSeconds
        from fct_sessions where session_date between ? and ?""",
        args,
    )[0]
    funnel = rows(
        c,
        """select count(*) as sessions,count(landing_pos) as landing,count(project_pos) as project,
        count(case_pos) as caseStudy,count(intent_pos) as intent from fct_journeys join fct_sessions using(session_id)
        where session_date between ? and ?""",
        args,
    )[0]
    projects = rows(
        c,
        """select project_id,count(*) as sessions,sum(seconds>=45) as deepSessions,
        sum(downstream_action) as actionSessions,sum(seconds) as seconds
        from mart_project_engagement join fct_sessions using(session_id)
        where session_date between ? and ? group by 1 order by sessions desc,project_id""",
        args,
    )
    sources = rows(
        c,
        """select source,count(*) as sessions,sum(has_high_intent_action) as intentSessions
        from fct_sessions where session_date between ? and ? group by 1 order by sessions desc,source""",
        args,
    )
    daily = rows(
        c,
        """select cast(d.day as date) as day,count(s.session_id) as sessions,
        count(distinct s.anonymous_user_id) as users,coalesce(sum(s.has_high_intent_action),0) as intentSessions
        from generate_series(cast(? as date),cast(? as date),interval 1 day) d(day)
        left join fct_sessions s on s.session_date=d.day group by 1 order by 1""",
        args,
    )
    return {
        "start": str(start),
        "end": str(end),
        "facts": facts,
        "funnel": funnel,
        "projects": projects,
        "sources": sources,
        "daily": daily,
    }


def main():
    results = json.loads((ROOT / "dbt/target/run_results.json").read_text())["results"]
    assert results and all(r["status"] in ("pass", "success") for r in results), (
        "Full dbt build must pass before export"
    )
    tests = [r for r in results if r["unique_id"].startswith("test.")]
    assert len(tests) == 31 and len(results) == 40, "Incomplete or unreviewed dbt gate"
    manifest = json.loads((ROOT / "dbt/target/manifest.json").read_text())
    source_hashes = {}
    for node in manifest["nodes"].values():
        if node["resource_type"] not in ("seed", "model"):
            continue
        path = ROOT / "dbt" / node["original_file_path"]
        native_digest = hashlib.sha256(path.read_bytes().strip()).hexdigest()
        assert native_digest == node["checksum"]["checksum"], (
            f"Rebuild changed source before exporting: {path.name}"
        )
        source_hashes[path.relative_to(ROOT / "dbt").as_posix()] = hashlib.sha256(
            path.read_text().strip().encode()
        ).hexdigest()
    c = duckdb.connect(str(ROOT / "portfolio_intelligence.duckdb"), read_only=True)
    start, end = c.execute(
        "select min(session_date),max(session_date) from fct_sessions"
    ).fetchone()
    quality = rows(
        c,
        "select disposition,count(*) as rows from stg_event_audit group by 1 order by 1",
    )
    cohorts = rows(c, "select * from mart_retention order by cohort,week_number")
    payload = {
        "metadata": {
            "schemaVersion": 2,
            "classification": "synthetic_fixture",
            "label": "Synthetic case study — not real portfolio visitors",
            "windowStart": str(start),
            "windowEnd": str(end),
            "windowDays": (end - start).days + 1,
            "rawEvents": sum(q["rows"] for q in quality),
            "dataTests": len(tests),
            "seedSha256": hashlib.sha256(
                (ROOT / "dbt/seeds/raw_events.csv").read_text().encode()
            ).hexdigest(),
            "dbtNodes": len(results),
            "generatorSeed": 29,
            "sourceSha256": dict(sorted(source_hashes.items())),
            "sourceHashConvention": "UTF-8, LF normalized, surrounding whitespace stripped (dbt)",
        },
        "windows": {
            str(days): dataset(c, end - timedelta(days=days - 1), end)
            for days in (30, 60, 90)
        },
        "cohorts": cohorts,
        "quality": quality,
    }
    target = ROOT / "dist/data/dashboard.json"
    target.write_text(
        json.dumps(payload, indent=2, default=str) + "\n", encoding="utf-8"
    )
    print("Exported verified synthetic aggregates:", payload["metadata"])


if __name__ == "__main__":
    main()
