select * from {{ ref('fct_journeys') }}
where (project_pos is not null and (landing_pos is null or project_pos <= landing_pos))
   or (case_pos is not null and (project_pos is null or case_pos <= project_pos))
   or (intent_pos is not null and (case_pos is null or intent_pos <= case_pos))
