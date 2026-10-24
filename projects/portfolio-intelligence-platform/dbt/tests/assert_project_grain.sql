select session_id,project_id from {{ ref('mart_project_engagement') }} group by 1,2 having count(*) != 1
