with ordered as (
    select
        *,
        lag(event_timestamp) over (
            partition by anonymous_user_id
            order by event_timestamp, event_id
        ) as previous_event_timestamp
    from {{ ref('stg_events') }}
    where is_analytics_eligible
),

breaks as (
    select
        *,
        case
            when previous_event_timestamp is null then 1
            when {{ datediff_minutes('previous_event_timestamp', 'event_timestamp') }} >= 30 then 1
            else 0
        end as is_new_session
    from ordered
),

numbered as (
    select
        *,
        sum(is_new_session) over (
            partition by anonymous_user_id
            order by event_timestamp, event_id
            rows between unbounded preceding and current row
        ) as session_number
    from breaks
)

select
    md5(concat(anonymous_user_id, '-', cast(session_number as varchar))) as session_id,
    *
from numbered
