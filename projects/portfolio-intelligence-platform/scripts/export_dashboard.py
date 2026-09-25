"""Export the public synthetic dashboard fixture from tested dbt relations."""

import json
from pathlib import Path

import duckdb


ROOT = Path(__file__).resolve().parents[1]
DATABASE = ROOT / "portfolio_intelligence.duckdb"
OUTPUT = ROOT / "dist" / "data" / "dashboard.json"


def percent(numerator, denominator):
    return f"{(100 * numerator / denominator if denominator else 0):.1f}%"


def dataset(connection, days):
    maximum = connection.execute("select max(session_date) from fct_sessions").fetchone()[0]
    cutoff = connection.execute(f"select ?::date - interval {days - 1} day", [maximum]).fetchone()[0]
    row = connection.execute(
        """select count(*), count(distinct anonymous_user_id), sum(is_engaged),
                  sum(case when projects_viewed > 0 then 1 else 0 end),
                  sum(has_high_intent_action), sum(pageviews), sum(engaged_seconds),
                  sum(has_resume_action), sum(has_contact_action)
           from fct_sessions where session_date >= ?""",
        [cutoff],
    ).fetchone()
    sessions, visitors, engaged, project_sessions, intent, pageviews, seconds, resume, contact = row

    funnel_row = connection.execute(
        """select count(distinct session_id),
                  count(distinct case when event_name='project_viewed' then session_id end),
                  count(distinct case when event_name='case_study_viewed' then session_id end),
                  count(distinct case when event_name in ('resume_viewed','resume_downloaded') then session_id end),
                  count(distinct case when event_name='contact_clicked' then session_id end)
           from int_sessions where event_date >= ?""",
        [cutoff],
    ).fetchone()
    labels = ("landing", "project", "caseStudy", "resume", "contact")
    funnel = {label: [value, percent(value, funnel_row[0])] for label, value in zip(labels, funnel_row)}

    projects = connection.execute(
        """select coalesce(project_id, 'unknown') as project_id,
                  count(*) as views,
                  avg(case when engagement_seconds >= 45 then 1.0 else 0.0 end) as deep_read,
                  avg(has_high_intent_action) as action_rate
           from int_sessions join fct_sessions using (session_id)
           where event_name='project_viewed' and event_date >= ?
           group by 1 order by views desc, project_id""",
        [cutoff],
    ).fetchall()
    names = {
        "wholesale-analytics": ["Retail Analytics Platform", "BI & metric governance"],
        "customer-intelligence": ["Customer Intelligence", "Product analytics"],
        "wildfire-risk": ["Canada Wildfire Risk", "ML & geospatial"],
        "mobility-operations": ["Mobility Operations", "Operations analytics"],
    }
    project_rows = [
        [*names.get(project_id, [project_id, "Portfolio project"]), views, percent(deep_read, 1), percent(action_rate, 1)]
        for project_id, views, deep_read, action_rate in projects
    ]

    sources = connection.execute(
        """select source, count(*) from fct_sessions where session_date >= ?
           group by 1 order by count(*) desc, source""",
        [cutoff],
    ).fetchall()

    return {
        "visitors": str(visitors), "sessions": str(sessions),
        "engagement": percent(engaged, sessions), "projectRate": percent(project_sessions, sessions),
        "conversion": percent(intent, sessions),
        "changes": {key: "fixture" for key in ("visitors", "engagement", "projectRate", "conversion")},
        "funnel": funnel, "projects": project_rows,
        "sources": [[source, count, percent(count, sessions)] for source, count in sources],
        "facts": {"pageviews": pageviews, "engagedSeconds": seconds, "resumeSessions": resume, "contactSessions": contact},
    }


def main():
    connection = duckdb.connect(str(DATABASE), read_only=True)
    datasets = {str(days): dataset(connection, days) for days in (30, 90, 365)}
    raw, eligible, users = connection.execute(
        """select count(*), sum(case when is_analytics_eligible then 1 else 0 end),
                  count(distinct case when is_analytics_eligible then anonymous_user_id end)
           from stg_events"""
    ).fetchone()
    duplicates = connection.execute(
        "select count(*) - count(distinct event_id) from raw_events"
    ).fetchone()[0]
    payload = {
        "metadata": {
            "label": "Synthetic dbt fixture — not real visitor traffic",
            "eventRows": raw, "eligibleEvents": eligible, "excludedEvents": raw - eligible,
            "eligibleUsers": users, "duplicateEventIds": duplicates,
            "dataThrough": str(connection.execute("select max(event_date) from stg_events").fetchone()[0]),
        },
        "datasets": datasets,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)} from {raw} modeled events")


if __name__ == "__main__":
    main()
