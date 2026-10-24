select * from {{ ref('mart_retention') }}
where cohort_users <= 0 or retained_users > cohort_users or retained_users < 0
   or retention_rate < 0 or retention_rate > 1
   or (not is_mature and (retention_rate is not null or retained_users is not null))
   or (is_mature and (retention_rate is null or retained_users is null))
