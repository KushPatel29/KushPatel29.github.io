-- Strict same-session sequence; independent actions are not funnel stages.
with landing as (
    select session_id,min(event_position) filter(where event_name='page_viewed') as landing_pos
    from {{ ref('int_sessions') }} group by 1
), project as (
    select l.*,min(e.event_position) filter(where e.event_name='project_viewed' and e.event_position > l.landing_pos) as project_pos
    from landing l left join {{ ref('int_sessions') }} e using(session_id) group by 1,2
), case_study as (
    select p.*,min(e.event_position) filter(where e.event_name='case_study_viewed' and e.event_position > p.project_pos) as case_pos
    from project p left join {{ ref('int_sessions') }} e using(session_id) group by 1,2,3
)
select c.*,min(e.event_position) filter(where e.event_name in ('resume_viewed','resume_downloaded','linkedin_clicked','contact_clicked') and e.event_position > c.case_pos) as intent_pos
from case_study c left join {{ ref('int_sessions') }} e using(session_id) group by 1,2,3,4
