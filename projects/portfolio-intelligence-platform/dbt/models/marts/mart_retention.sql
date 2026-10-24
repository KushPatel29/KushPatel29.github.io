-- First observed cohorts. Immature calendar weeks stay NULL.
with first_seen as (
    select anonymous_user_id,cast(date_trunc('week',min(session_start_at)) as date) as cohort
    from {{ ref('fct_sessions') }} group by 1
), cohorts as (select cohort,count(*) as cohort_users from first_seen group by 1), activity as (
    select f.cohort,date_diff('week',f.cohort,cast(date_trunc('week',s.session_date) as date)) as week_number,
        count(distinct s.anonymous_user_id) as retained_users
    from first_seen f join {{ ref('fct_sessions') }} s using(anonymous_user_id) group by 1,2
), grid as (
    select c.*,w.week_number,
        c.cohort + (w.week_number+1)*interval 7 day <= (select max(event_date)+interval 1 day from {{ ref('stg_events') }}) as is_mature
    from cohorts c cross join range(0,5) w(week_number)
)
select g.*,case when is_mature then coalesce(a.retained_users,0) end as retained_users,
    case when is_mature then 1.0*coalesce(a.retained_users,0)/cohort_users end as retention_rate
from grid g left join activity a using(cohort,week_number)
