select * from {{ ref('int_sessions') }} where not is_analytics_eligible
   or consent_state != 'granted' or is_bot or is_internal or is_synthetic
