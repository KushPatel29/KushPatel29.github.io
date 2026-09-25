{% macro datediff_minutes(start_expression, end_expression) -%}
  {%- if target.type == 'bigquery' -%}
    timestamp_diff({{ end_expression }}, {{ start_expression }}, minute)
  {%- else -%}
    date_diff('minute', {{ start_expression }}, {{ end_expression }})
  {%- endif -%}
{%- endmacro %}
