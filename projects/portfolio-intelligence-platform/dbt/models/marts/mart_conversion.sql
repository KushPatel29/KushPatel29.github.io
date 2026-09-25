select
    session_date,
    count(*) as sessions,
    count(distinct anonymous_user_id) as unique_visitors,
    sum(is_engaged) as engaged_sessions,
    sum(has_resume_action) as resume_conversions,
    sum(has_contact_action) as contact_conversions,
    sum(has_high_intent_action) as high_intent_sessions,
    1.0 * sum(is_engaged) / nullif(count(*), 0) as engagement_rate,
    1.0 * sum(has_resume_action) / nullif(count(*), 0) as resume_conversion_rate,
    1.0 * sum(has_contact_action) / nullif(count(*), 0) as contact_conversion_rate
from {{ ref('fct_sessions') }}
group by 1
