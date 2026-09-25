select *
from {{ ref('fct_sessions') }}
where session_end_at < session_start_at
   or engaged_seconds < 0
   or pageviews < 0
   or projects_viewed < 0
