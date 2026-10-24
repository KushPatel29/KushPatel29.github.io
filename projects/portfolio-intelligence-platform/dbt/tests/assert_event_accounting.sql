select 1 as failure where
    (select count(*) from {{ ref('raw_events') }}) != (select count(*) from {{ ref('stg_event_audit') }})
    or (select count(*) from {{ ref('int_sessions') }}) != (select count(*) from {{ ref('stg_event_audit') }} where disposition='eligible')
