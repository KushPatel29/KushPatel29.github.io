"""Independent Python oracle: compare all session partitions/first touches and journey stages to SQL."""

import csv
import hashlib
import json
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parents[1]


def check():
    delivered = list(
        csv.DictReader((ROOT / "dbt/seeds/raw_events.csv").open(encoding="utf-8"))
    )
    canonical = {}
    for e in sorted(
        delivered,
        key=lambda x: (
            x["received_at"],
            x["event_timestamp"],
            x["event_name"],
            x["page_path"],
        ),
    ):
        canonical.setdefault(e["event_id"], e)
    users = defaultdict(list)
    for e in canonical.values():
        try:
            e["when"] = (
                datetime.fromisoformat(e["event_timestamp"])
                .astimezone(UTC)
                .replace(tzinfo=None)
            )
        except ValueError:
            continue
        if (
            e["contract_version"] != "2"
            or int(e["engagement_seconds"]) < 0
            or e["consent_state"] != "granted"
            or any(e[k] != "0" for k in ("is_bot", "is_internal", "is_synthetic"))
        ):
            continue
        users[e["anonymous_user_id"]].append(e)
    expected = {}
    journeys = {}
    event_sessions = {}
    for user, events in users.items():
        current = []
        number = 0
        previous = None
        for e in sorted(events, key=lambda x: (x["when"], x["event_id"])):
            if previous is None or e["when"] - previous >= timedelta(minutes=30):
                number += 1
                current = []
            key = hashlib.md5(f"{user}-{number}".encode()).hexdigest()
            current.append(e)
            previous = e["when"]
            event_sessions[e["event_id"]] = key
            first = current[0]
            expected[key] = (user, first["when"], first["page_path"], first["source"])
            names = [
                "page_viewed",
                "project_viewed",
                "case_study_viewed",
                {
                    "resume_viewed",
                    "resume_downloaded",
                    "linkedin_clicked",
                    "contact_clicked",
                },
            ]
            positions = []
            stage = 0
            for pos, event in enumerate(current, 1):
                if stage < 4 and (
                    event["event_name"] in names[stage]
                    if isinstance(names[stage], set)
                    else event["event_name"] == names[stage]
                ):
                    positions.append(pos)
                    stage += 1
            journeys[key] = tuple(positions + [None] * (4 - len(positions)))
    c = duckdb.connect(str(ROOT / "portfolio_intelligence.duckdb"), read_only=True)
    actual = {
        r[0]: tuple(r[1:])
        for r in c.execute(
            "select session_id,anonymous_user_id,session_start_at,landing_page,source from fct_sessions"
        ).fetchall()
    }
    assert actual == expected, "Session partition or chronological first-touch mismatch"
    assert (
        dict(c.execute("select event_id,session_id from int_sessions").fetchall())
        == event_sessions
    ), "Event/session mapping mismatch"
    assert {
        r[0]: tuple(r[1:]) for r in c.execute("select * from fct_journeys").fetchall()
    } == journeys, "Ordered journey mismatch"
    boundary = c.execute(
        "select landing_page,source from fct_sessions where anonymous_user_id='fixture-boundary' order by session_start_at"
    ).fetchall()
    assert boundary == [("/work", "linkedin"), ("/about", "github")], boundary
    assert (
        c.execute(
            "select count(intent_pos) from fct_journeys join fct_sessions using(session_id) where anonymous_user_id='fixture-order'"
        ).fetchone()[0]
        == 0
    )
    firsts = {u: min(e["when"] for e in events).date() for u, events in users.items()}
    cohorts = {u: d - timedelta(days=d.weekday()) for u, d in firsts.items()}
    observed_end = max(e["when"].date() for events in users.values() for e in events)
    for cohort, week, size, mature, retained, rate in c.execute(
        "select cohort,week_number,cohort_users,is_mature,retained_users,retention_rate from mart_retention"
    ).fetchall():
        members = {u for u, d in cohorts.items() if d == cohort}
        is_mature = cohort + timedelta(weeks=week + 1) <= observed_end + timedelta(
            days=1
        )
        active = {
            v[0]
            for v in expected.values()
            if v[0] in members and (v[1].date() - cohort).days // 7 == week
        }
        assert size == len(members) and mature == is_mature
        assert retained == (len(active) if is_mature else None)
        assert rate is None if not is_mature else abs(rate - len(active) / size) < 1e-12
    project_pairs = defaultdict(list)
    sessions = defaultdict(list)
    for events in users.values():
        for e in events:
            sid = event_sessions[e["event_id"]]
            sessions[sid].append(e)
            if e["event_name"] == "project_viewed":
                project_pairs[(sid, e["project_id"])].append(e)
    expected_projects = {}
    for key, events in project_pairs.items():
        first = min((e["when"], e["event_id"]) for e in events)
        action = int(
            any(
                (e["when"], e["event_id"]) > first
                and e["event_name"]
                in {
                    "resume_viewed",
                    "resume_downloaded",
                    "linkedin_clicked",
                    "contact_clicked",
                }
                for e in sessions[key[0]]
            )
        )
        expected_projects[key] = (
            sum(int(e["engagement_seconds"]) for e in events),
            action,
        )
    assert c.execute("select count(*) from mart_project_engagement").fetchone()[
        0
    ] == len(expected_projects)
    assert {
        (sid, p): (seconds, action)
        for sid, p, seconds, action in c.execute(
            "select * from mart_project_engagement"
        ).fetchall()
    } == expected_projects
    print(
        json.dumps(
            {
                "independentOracle": "passed",
                "sessions": len(expected),
                "mappedEvents": len(event_sessions),
                "orderedJourneys": len(journeys),
                "projectPairs": len(expected_projects),
                "cohortObservationChecks": "passed",
                "boundaryAndOutOfOrderProbes": "passed",
            }
        )
    )


if __name__ == "__main__":
    check()
