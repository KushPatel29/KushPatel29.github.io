with source as (
    select * from {{ ref('stg_event_audit') }} where duplicate_rank=1 and coalesce(is_contract_valid,false)
),

typed as (
    select
        cast(event_id as varchar) as event_id,
        cast(anonymous_user_id as varchar) as anonymous_user_id,
        lower(trim(event_name)) as event_name,
        occurred_at as event_timestamp,
        cast(occurred_at as date) as event_date,
        coalesce(nullif(page_path, ''), '/') as page_path,
        nullif(project_id, '') as project_id,
        coalesce(nullif(source, ''), '(direct)') as source,
        coalesce(nullif(medium, ''), '(none)') as medium,
        cast(is_bot as boolean) as is_bot,
        cast(is_internal as boolean) as is_internal,
        cast(is_synthetic as boolean) as is_synthetic,
        greatest(cast(engagement_seconds as integer), 0) as engagement_seconds,
        consent_state,contract_version,data_origin
    from source
)

select
    *,
    consent_state='granted' and not (is_bot or is_internal or is_synthetic) as is_analytics_eligible
from typed
