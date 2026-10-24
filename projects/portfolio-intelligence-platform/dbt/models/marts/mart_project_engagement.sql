with project_sessions as (
    select session_id,project_id,min(event_position) as first_position,sum(engagement_seconds) as seconds
    from {{ ref('int_sessions') }} where event_name='project_viewed' group by 1,2
)
select p.session_id,p.project_id,p.seconds,
    max(case when e.event_position > p.first_position and e.event_name in ('resume_viewed','resume_downloaded','linkedin_clicked','contact_clicked') then 1 else 0 end) as downstream_action
from project_sessions p join {{ ref('int_sessions') }} e using(session_id) group by 1,2,3
