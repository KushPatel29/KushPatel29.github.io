select *
from {{ ref('mart_conversion') }}
where resume_conversions > sessions
   or contact_conversions > sessions
   or high_intent_sessions > sessions
   or engagement_rate < 0 or engagement_rate > 1
