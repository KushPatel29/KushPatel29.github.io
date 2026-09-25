with sessions as (
    select
        session_id,
        anonymous_user_id,
        min(event_timestamp) as session_start_at,
        max(event_timestamp) as session_end_at,
        min(event_date) as session_date,
        min(page_path) as landing_page,
        min(source) as source,
        min(medium) as medium,
        count(*) as event_count,
        sum(case when event_name = 'page_viewed' then 1 else 0 end) as pageviews,
        count(distinct case when event_name = 'project_viewed' then project_id end) as projects_viewed,
        sum(engagement_seconds) as engaged_seconds,
        max(case when event_name in ('resume_viewed', 'resume_downloaded') then 1 else 0 end) as has_resume_action,
        max(case when event_name = 'contact_clicked' then 1 else 0 end) as has_contact_action,
        max(case when event_name in ('resume_viewed', 'resume_downloaded', 'linkedin_clicked', 'contact_clicked') then 1 else 0 end) as has_high_intent_action
    from {{ ref('int_sessions') }}
    group by 1, 2
)

select
    *,
    case when engaged_seconds >= 60 or pageviews >= 2 or has_high_intent_action = 1 then 1 else 0 end as is_engaged
from sessions
