"""Deterministic, entirely synthetic 90-day events. Never reads visitor data."""

import csv
import io
import random
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIELDS = [
    "event_id",
    "anonymous_user_id",
    "event_name",
    "event_timestamp",
    "received_at",
    "page_path",
    "project_id",
    "source",
    "medium",
    "is_bot",
    "is_internal",
    "is_synthetic",
    "engagement_seconds",
    "consent_state",
    "contract_version",
    "data_origin",
]


def generate():
    rng = random.Random(29)
    start = datetime(2026, 7, 26, tzinfo=UTC)
    rows = []

    def add(
        user,
        when,
        name,
        path="/",
        project="",
        source="(direct)",
        seconds=0,
        **overrides,
    ):
        row = {
            "event_id": f"e{len(rows) + 1:06}",
            "anonymous_user_id": user,
            "event_name": name,
            "event_timestamp": str(when),
            "received_at": str(when + timedelta(seconds=5)),
            "page_path": path,
            "project_id": project,
            "source": source,
            "medium": {
                "google": "organic",
                "linkedin": "social",
                "github": "referral",
            }.get(source, "(none)"),
            "is_bot": 0,
            "is_internal": 0,
            "is_synthetic": 0,
            "engagement_seconds": seconds,
            "consent_state": "granted",
            "contract_version": 2,
            "data_origin": "synthetic_fixture",
        }
        row.update(overrides)
        rows.append(row)

    for n in range(180):
        first = rng.randrange(90)
        days = {first}
        for lag in (2, 8, 15, 22, 29, 45):
            if first + lag < 90 and rng.random() < 0.44:
                days.add(first + lag)
        for day in sorted(days):
            when = start + timedelta(days=day, hours=8 + n % 11, minutes=n % 40)
            user = f"fixture-u{n:03}"
            source = rng.choice(["google", "linkedin", "github", "(direct)"])
            add(
                user,
                when,
                "page_viewed",
                path="/work" if n % 3 == 0 else "/",
                source=source,
                seconds=rng.randrange(3, 30),
            )
            if rng.random() < 0.78:
                project = rng.choice(
                    ["growthops", "control-tower", "bc-finance", "wildfire"]
                )
                later = "(direct)" if n % 7 == 0 else source
                add(
                    user,
                    when + timedelta(minutes=2),
                    "project_viewed",
                    f"/projects/{project}",
                    project,
                    later,
                    rng.randrange(5, 95),
                )
                if n % 9 == 0:
                    add(
                        user,
                        when + timedelta(minutes=3),
                        "project_viewed",
                        f"/projects/{project}",
                        project,
                        later,
                        15,
                    )
                if rng.random() < 0.54:
                    add(
                        user,
                        when + timedelta(minutes=5),
                        "case_study_viewed",
                        f"/projects/{project}",
                        project,
                        later,
                        60,
                    )
                if rng.random() < 0.38:
                    add(
                        user,
                        when + timedelta(minutes=8),
                        rng.choice(
                            ["resume_viewed", "resume_downloaded", "contact_clicked"]
                        ),
                        "/contact",
                        source=later,
                    )
    when = start + timedelta(days=2, hours=23, minutes=50, microseconds=500000)
    add("fixture-boundary", when, "page_viewed", "/work", source="linkedin")
    add(
        "fixture-boundary",
        when + timedelta(seconds=1799, microseconds=999000),
        "project_viewed",
        "/projects/growthops",
        "growthops",
        source="(direct)",
        seconds=50,
    )
    add(
        "fixture-boundary",
        when + timedelta(seconds=3599, microseconds=999000),
        "page_viewed",
        "/about",
        source="github",
    )
    add("fixture-order", start + timedelta(days=3), "contact_clicked", "/contact")
    add("fixture-order", start + timedelta(days=3, minutes=1), "page_viewed")
    add(
        "fixture-order",
        start + timedelta(days=3, minutes=2),
        "project_viewed",
        "/projects/growthops",
        "growthops",
    )
    add("fixture-end", start + timedelta(days=89, hours=12), "page_viewed")
    for kwargs in (
        {"is_bot": 1},
        {"is_internal": 1},
        {"is_synthetic": 1},
        {"consent_state": "denied"},
        {"contract_version": 99},
        {"event_timestamp": "invalid"},
        {"engagement_seconds": -1},
    ):
        add("fixture-excluded", start + timedelta(days=10), "page_viewed", **kwargs)
    for row in rows[:12]:
        duplicate = row.copy()
        duplicate["received_at"] = str(
            datetime.fromisoformat(row["event_timestamp"]) + timedelta(days=1)
        )
        rows.append(duplicate)
    rng.shuffle(rows)
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue()


if __name__ == "__main__":
    path = ROOT / "dbt/seeds/raw_events.csv"
    content = generate()
    if "--check" in sys.argv:
        assert path.read_text(encoding="utf-8") == content, (
            "Synthetic fixture drift; regenerate and review."
        )
        print("Synthetic fixture is reproducible (seed 29).")
    else:
        path.write_text(content, encoding="utf-8", newline="\n")
        print("Wrote synthetic fixture:", len(content.splitlines()) - 1, "rows")
