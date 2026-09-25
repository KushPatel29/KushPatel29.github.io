with source as (
    select * from {{ ref('raw_events') }}
),

typed as (
    select
        cast(event_id as varchar) as event_id,
        cast(anonymous_user_id as varchar) as anonymous_user_id,
        lower(trim(event_name)) as event_name,
        cast(event_timestamp as timestamp) as event_timestamp,
        cast(event_timestamp as date) as event_date,
        coalesce(nullif(page_path, ''), '/') as page_path,
        nullif(project_id, '') as project_id,
        coalesce(nullif(source, ''), '(direct)') as source,
        coalesce(nullif(medium, ''), '(none)') as medium,
        cast(is_bot as boolean) as is_bot,
        cast(is_internal as boolean) as is_internal,
        cast(is_synthetic as boolean) as is_synthetic,
        greatest(cast(engagement_seconds as integer), 0) as engagement_seconds,
        row_number() over (partition by event_id order by event_timestamp) as duplicate_rank
    from source
)

select
    *,
    not (is_bot or is_internal or is_synthetic) as is_analytics_eligible
from typed
where duplicate_rank = 1
