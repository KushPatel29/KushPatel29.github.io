# Worked example — Analytics Engineer, Northwind Grocers (fictional)

This shows the method end to end on `evals/files/analytics-engineer-northwind.txt`,
a **fictional** posting. Use it to calibrate the level of detail and the
credits. Don't reuse its numbers: every posting gets its own rows.

---

# Role fit: Analytics Engineer — Northwind Grocers
Evidence: live snapshot, manifest 2026-09-24 · Posting: pasted text (fictional test posting)

## Decision: Apply now (competitive). Paid modelling and metric work cover the core; production dbt is the screen risk
No hard gate is unknown. One requirement is unknown ("code review workflows"), and your answer to it moves the score.

| Evidence fit | Visible fit (résumé today) | Must coverage | Family |
|---|---|---|---|
| 70% (24.55 / 35) | 67% (23.45 / 35) | 68% (12.15 / 18) | Analytics Engineer (mid-level; 3+ yrs asked) |

Rule path: no gate unmet → must ≥ 60% and no real gap on a core row → visible trails evidence by 3 points and no Must row is hidden → **Apply now**, competitive (60–75%).

## Hard gates
| Gate | Posting says | Kush | Status |
|---|---|---|---|
| Location | Toronto, hybrid 3 days in office | Vancouver; open to relocation across Canada | met |
| Work authorization | not stated | legally eligible in Canada | met |
| Minimum total years | 3+ years in AE, BI or data analysis | 4 yrs 3 mos paid | met |
| Degree / certification | not stated | — | n/a |

## Requirements vs evidence
| # | Requirement (posting's words) | Wt | Best evidence (source) | Tier | E / V | Gap class |
|---|---|---|---|---|---|---|
| 1 | "Build and maintain dbt models … from staging through marts" | 2 | Supply Chain Analytics — dbt `#p-dbt`: staging→marts, enforced contract, unit tests, SCD2, incremental; BC finance dbt (31 tests) | PROJECT | 0.7 / 0.5 | Surfacing: the main dbt project isn't on the résumé |
| 2 | "in Snowflake" / "Snowflake preferred" | 2 | Fabric Warehouse, Synapse (paid); dbt profile for Snowflake exists but has **never run** | adjacent | 0.5 / 0.5 | Adjacent tool |
| 3 | "Define and document core business metrics with finance and merchandising" | 2 | Two Rivers: governed KPIs agreed with Sales, Finance, Supply Chain, with documented definitions; 62 governed metrics `#p-wholesale` | PAID | 1.0 / 1.0 | Match |
| 4 | "Write data tests" | 2 | Two Rivers: automated schema, completeness, uniqueness, RI tests | PAID | 1.0 / 1.0 | Match |
| 5 | "maintain CI for our analytics codebase" | 2 | GitHub Actions on all 17 repos | PROJECT | 0.7 / 0.7 | Match (project tier) |
| 6 | "Partner with data engineering on Airflow-orchestrated pipelines" | 2 | Airflow DAG in `#p-dbt` (checked, not scheduled); ADF/Fabric orchestration at Two Rivers | PROJECT | 0.7 / 0.7 | Match (project tier) |
| 7 | "Support self-serve analytics in Looker" | 2 | Power BI self-serve rollout with RLS at Two Rivers | adjacent | 0.5 / 0.5 | Adjacent tool |
| 8 | "2+ years of production dbt experience" | 3 | dbt is project-only (résumé says "not production") | PROJECT | 0.35 / 0.35 | **Depth gap (core)** |
| 9 | "Strong SQL" | 3 | T-SQL daily at Two Rivers | PAID | 1.0 / 1.0 | Match |
| 10 | "dimensional modelling (Kimball)" | 3 | Two Rivers enterprise mart: star schemas, conformed dims, SCD | PAID | 1.0 / 1.0 | Match |
| 11 | "Experience with a cloud data warehouse" | 3 | Microsoft Fabric, Azure Synapse | PAID | 1.0 / 1.0 | Match |
| 12 | "Git" | 3 | all 17 public repos | PROJECT | 0.7 / 0.7 | Match (project tier) |
| 13 | "code review workflows" | 3 | not evidenced; sole analyst, and review practice in the repos isn't stated | — | 0 / 0 | **Unknown** |
| 14 | "LookML" (nice to have) | 1 | LookML model + 3 views in Marketing Attribution `#p-marketing`, schema-checked in CI | PROJECT | 0.7 / 0 | Surfacing |
| 15 | "Python" (nice to have) | 1 | Shivam automation; Two Rivers forecasting apps | PAID | 1.0 / 1.0 | Match |
| 16 | "Retail or grocery industry experience" (nice to have) | 1 | perishable-goods distributor (upstream of grocery), not retail | PAID (adjacent domain) | 0.5 / 0.5 | Adjacent domain |

## Real gaps (what's actually missing)
- **Production dbt (#8), the screen risk.** Honest answer: "I haven't run dbt in a job. At Two Rivers the transformation layer was Fabric and Synapse SQL/PySpark. I've built two dbt projects to production patterns: contracts, unit tests, SCD2, CI, and one built on both DuckDB and Databricks with every mart total reconciled." Don't stretch it into production years.
- **Snowflake (#2).** Fastest credible close: run the existing dbt project on a Snowflake trial account and publish the reconciliation, as was done for Databricks. That turns "never run" into project evidence for every AE posting that names Snowflake. Until then, say "profile only".
- **Looker (#7).** Transfer, not experience: Power BI self-serve in production, plus a LookML model in a project. Say it in the cover note, not the résumé.
- **Code review (#13), unknown.** Kush: did you review, or get reviewed on, SQL/DAX/pipeline changes at Two Rivers or Shivam? If yes, that becomes PAID (Must coverage → ~84%). If no, it's a real gap on a non-core row.

## Résumé edits (highest value first)
1. **Swap a project: Supply Chain Analytics — dbt in, Canada Wildfire Risk out.** Fixes #1 (and shows #5, #6 in context) · this application
   - Where: Selected Projects, the Canada Wildfire Risk entry
   - Now: "Canada Wildfire Risk — Python, XGBoost, GIS, Power BI, GitHub Actions · 111 tests …"
   - Change to: "Supply Chain Analytics — dbt — dbt Core, DuckDB, Databricks, MetricFlow, Airflow · 157 tests. Staging-to-marts dbt with an enforced contract on the executive mart, unit tests, incremental facts and SCD2 snapshots; MetricFlow metrics reconcile to the marts they summarise. Built on DuckDB in CI and on Databricks (180 of 180 nodes green, all 41 mart totals equal the DuckDB build). Airflow DAG checked, not scheduled."
   - Evidence: Role fit, analytics-engineer view; manifest `p-dbt` · Trim: nothing; the award line still names the wildfire project
2. **Add LookML to the skills line.** Fixes #14 · this application
   - Where: Technical Skills → BI & Visualization
   - Now: "… Tableau, Excel (…), Streamlit, Plotly"
   - Change to: "… Tableau, LookML (project), Excel (…), Streamlit, Plotly"
   - Evidence: Marketing Attribution `#p-marketing` · Trim: none needed

No third edit: every other gap is either already visible or not fixable by wording.

## Send with the application
- Portfolio link: `node tools/make-link.mjs northwind "Analytics Engineer"` (opens the analytics-engineer view)
- Lead projects: Supply Chain Analytics — dbt `#p-dbt`, Retail Analytics Platform `#p-wholesale` (62 governed metrics), B.C. Local-Government Finance `#p-bc-finance` (dbt on messy real filings)
- Cover-note line: "My BI work was in Power BI, and I've modelled in LookML in a project; the semantic-layer discipline transfers directly to Looker."

## Unknowns to resolve
- Code review practice in paid roles (row #13).
- Toronto hybrid needs relocation: relocation across Canada is stated, but confirm the timing works.
