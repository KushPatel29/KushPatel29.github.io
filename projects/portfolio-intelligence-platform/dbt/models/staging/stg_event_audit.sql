with typed as (
    select *, try_cast(event_timestamp as timestamptz) at time zone 'UTC' as occurred_at,
        try_cast(engagement_seconds as integer) as seconds,
        row_number() over (partition by event_id order by received_at, event_timestamp, event_name, page_path) as duplicate_rank
    from {{ ref('raw_events') }}
), classified as (
    select *, occurred_at is not null and seconds >= 0 and contract_version = 2
        and is_bot in (0,1) and is_internal in (0,1) and is_synthetic in (0,1)
        and nullif(event_id,'') is not null and nullif(anonymous_user_id,'') is not null
        and page_path like '/%' and page_path not like '%?%' and page_path not like '%#%'
        and event_name in ('page_viewed','project_viewed','case_study_viewed','resume_viewed','resume_downloaded','linkedin_clicked','contact_clicked')
        and (event_name not in ('project_viewed','case_study_viewed') or nullif(project_id,'') is not null) as is_contract_valid
    from typed
)
select *, case when duplicate_rank > 1 then 'duplicate'
    when not coalesce(is_contract_valid,false) then 'invalid_contract'
    when consent_state != 'granted' or consent_state is null then 'consent_denied'
    when is_bot then 'bot' when is_internal then 'internal' when is_synthetic then 'test_marker'
    else 'eligible' end as disposition from classified
