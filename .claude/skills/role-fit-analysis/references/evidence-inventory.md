# Evidence inventory — Kush Patel

inventory-verified: 2026-09-24
manifest-totals: 17 projects · 12754 tests

This ledger is the fallback when `scripts/evidence-snapshot.mjs` cannot run (no
repo checkout). When the snapshot runs, the snapshot wins wherever the two
disagree: it reads the published files, and this ledger is a copy. Everything
here is sourced from `resume/resume.html`, `index.html` (Experience, Role fit,
Education) and `portfolio-manifest.json`. `tools/check-role-fit-skill.mjs`
fails CI when the project table below drifts from the manifest.

Contents: 1 Stated facts and unknowns · 2 Paid experience · 3 Education and
credentials · 4 Capability ledger · 5 Not evidenced anywhere · 6 Qualifiers that
must survive any rewrite · 7 Projects

---

## 1. Stated facts, and what is not stated

| Fact | Status | Source |
|---|---|---|
| Location | Vancouver, BC | résumé header |
| Work authorization | **Canada: legally eligible.** Any other country: **not stated** | résumé header |
| Mobility | Open to remote and relocation **across Canada** | résumé header |
| Availability | Available immediately | résumé header |
| Current employment | No role listed after Jun 2026 | Experience |
| Salary expectation | not stated | — |
| Security clearance | not stated | — |
| Languages other than English | not stated | — |
| Driver's licence, travel %, shift availability | not stated | — |
| People management / direct reports | **none stated** (sole analyst at Two Rivers) | Experience |

"Not stated" means ask, or flag as an unknown in the report. Never fill it in.

## 2. Paid experience (the only source of PAID tier)

| Employer | Title | Dates | Length |
|---|---|---|---|
| Two Rivers Specialty Meats, North Vancouver BC (perishable-goods distributor), permanent full-time, on-site | Data Analyst — Operations, Logistics & Enterprise Reporting | Dec 2023 – Jun 2026 | 2 yrs 7 mos |
| Shivam Investments, India / remote, permanent full-time | Financial Analyst — Data & Reporting | Dec 2020 – Jul 2022 | 1 yr 8 mos |

Total paid analytics experience: **4 yrs 3 mos** (the résumé says "4+ years").
Use this number for any "N+ years of experience" gate, and count years per
skill only from the rows where that skill is PAID below. Example: "3+ years
of dbt" → 0 paid years (dbt is project-only).

Two Rivers scope (Experience section): sole analyst; ERP, Square POS, WMS,
workforce (Synerion API) and REST feeds; Bronze/Silver/Gold in Fabric, ADF,
Synapse with SQL and PySpark; enterprise data mart (star schema, conformed
dims, SCD); Power BI end to end (semantic model, DAX library, RLS/RBAC, column
masking, incremental refresh, drill-through); SSIS/SSRS legacy estate and its
migration to Fabric notebooks with row-count/checksum/control-total cutover;
reconciliation controls (~45% fewer discrepancies, ~30% fewer reporting errors
— internal estimates); sales-ops and rep/territory scorecards; customer
analytics (cohort retention, RFM, churn signals); SKU/assortment analysis;
vendor scorecards and landed cost; WMS accuracy (cycle count, bin use,
pick/pack); FEFO, expiry risk, lot traceability; OTIF by lane/carrier/reason,
freight cost per case; AP/AR aging, DPO/DSO, invoice-match exceptions; labour
cost per case and punch-to-payroll reconciliation; KPI definitions agreed with
Sales, Finance and Supply Chain with acceptance criteria; SKU-level demand
forecasting deployed as Python web apps.

Shivam scope: reporting requirements from portfolio and risk stakeholders;
Power BI dashboards; Python (pandas) + SQL views automation (~40% less effort
— internal estimate); monthly GL/P&L reconciliation; AP/AR aging and
exception reporting; standardised reporting pack; Excel.

## 3. Education and credentials

- Northeastern University — MPS Analytics (Applied Machine Intelligence), GPA
  3.76, Vancouver, Sep 2022 – Mar 2024. Coursework: machine learning, deep
  learning, NLP/LLMs, time-series forecasting, statistical inference, data
  mining, cloud data platforms. Capstone grew into Ask Your Data.
- Gujarat Technological University — B.Eng. Computer Science, Aug 2017 – Aug 2021.
- Award: first prize, 2024 wildfire-prediction hackathon (team).
- Completed: Google Data Analytics Professional Certificate (Oct 2023); UC
  Davis SQL for Data Science (Jan 2025); IBM Python for Data Science, AI &
  Development (Nov 2023); Databricks Lakehouse Fundamentals (accreditation);
  Power BI Data Modelling with DAX; Northeastern Data Visualization &
  Storytelling Basics (Apr 2023).
- **In progress, not held:** Microsoft DP-600 (Fabric Analytics Engineer
  Associate). A posting that *requires* DP-600/PL-300 is unmet today.
- Not held: PL-300, CBAP/CCBA, PMP, CPA, CFA, any cloud-vendor associate cert.

## 4. Capability ledger

Tier = strongest evidence. PAID beats PROJECT beats DEGREE beats CERT. A row
marked PAID+PROJECT has both; cite the paid evidence first.

| Capability | Tier | Evidence | Boundary |
|---|---|---|---|
| SQL (T-SQL, joins, window functions, CTEs) | PAID+PROJECT | Two Rivers daily; HR and GL repos run committed SQL | T-SQL dialect in paid work |
| Power BI (DAX, Power Query/M, semantic models) | PAID+PROJECT | Two Rivers, Shivam; PBIP/TMDL in Git (control tower, pricing, utility) | — |
| RLS/RBAC, column masking | PAID | Two Rivers | — |
| Incremental refresh | PAID | Two Rivers | — |
| SSRS paginated reports, SSIS | PAID | Two Rivers legacy estate | maintained + migrated, not greenfield |
| Excel (Power Query, Power Pivot, dynamic arrays, LAMBDA, data tables, LINEST) | PAID (general) + PROJECT (advanced) | Shivam; excel-fpa-model, bc-local-government-finance | advanced features are shown in projects |
| Tableau | PROJECT | GL recon Tableau close scorecard generated from script | not used in a job |
| Python (pandas, NumPy, scikit-learn) | PAID+PROJECT | Shivam automation; Two Rivers forecasting web apps; all repos | — |
| PySpark | PAID+PROJECT | Two Rivers Fabric/Synapse; control tower on Databricks | — |
| Microsoft Fabric (Lakehouse, Warehouse, pipelines, notebooks) | PAID | Two Rivers | DP-600 in progress, not held |
| Azure Data Factory, Azure Synapse | PAID | Two Rivers | — |
| SQL Server | PAID | Two Rivers | — |
| Databricks (SQL warehouse, serverless jobs, Unity Catalog, Delta) | PROJECT | control tower notebooks; dbt project built on Databricks | not in a job |
| dbt Core (contracts, unit tests, snapshots, incremental) | PROJECT | Supply Chain Analytics — dbt; BC finance (31 tests) | **not production** (résumé says so) |
| MetricFlow / semantic layer | PAID (Power BI semantic layer) + PROJECT (MetricFlow) | Two Rivers; dbt project | MetricFlow is project-only |
| Apache Airflow | PROJECT | DAG in dbt project | **checked, not scheduled; not production** |
| Snowflake | none executed | dbt profile exists | **"never run" — treat as real gap** |
| DuckDB, PostgreSQL | PROJECT | several repos | — |
| Dimensional modelling (Kimball, SCD1/2, conformed dims) | PAID+PROJECT | Two Rivers mart; dbt snapshots | — |
| Data quality tests, contracts, quarantine, alerting | PAID+PROJECT | Two Rivers tests/alerts; control tower, BC finance contracts | — |
| Migration with cutover validation | PAID+PROJECT | Two Rivers; Legacy-to-Fabric Migration repo | — |
| REST API integration | PAID | Synerion time-and-attendance API | — |
| Git, GitHub Actions CI, Docker | PROJECT | all 17 repos run CI | Git use in paid work not stated |
| Stakeholder engagement, requirements, KPI definitions, acceptance criteria | PAID | Two Rivers (Sales, Finance, Supply Chain); Shivam (portfolio/risk) | — |
| Process mapping, UAT plans, traceability, business cases, RACI/RAID | PROJECT | inventory BA case (13 reqs, 12 UAT), clinical UAT plan, migration charter/RACI, supply-chain process case | documents are portfolio artifacts, not employer deliverables |
| Change and adoption | PAID | widened Power BI self-service with RLS at Two Rivers | — |
| GL/P&L reconciliation, month-end close | PAID+PROJECT | Shivam, Two Rivers; GL recon repo | — |
| AP/AR, DPO/DSO, working capital | PAID+PROJECT | Two Rivers, Shivam; Kestrel Bay model | — |
| Variance, margin, price-volume-mix | PAID+PROJECT | Two Rivers margin KPIs; pricing, utility models | — |
| Budgeting, forecasting, scenario models (FP&A) | PROJECT | utility and BC municipal Excel models | FP&A budgeting not a paid responsibility |
| Supply chain: OTIF, FEFO, lot trace, vendor scorecards, WMS accuracy | PAID+PROJECT | Two Rivers; control tower, inventory app | — |
| Demand forecasting | PAID+PROJECT | Two Rivers SKU forecasting; inventory backtests | — |
| Inventory policy / service-level optimisation | PROJECT | inventory app policy lab | — |
| Customer analytics (cohorts, RFM, churn signals) | PAID | Two Rivers | — |
| Statistics, hypothesis tests, experiments, causal inference | PROJECT+DEGREE | geo holdout, diff-in-diff, permutation test, survival analysis; MPS | no production A/B testing platform |
| Machine learning (XGBoost, logistic, anomaly, recommender) | PROJECT+DEGREE | wildfire, AML, recommender, HR | production ML only as the forecasting web apps |
| LLM / text-to-SQL, governed AI | PROJECT+DEGREE | Ask Your Data | — |
| GIS / geospatial | PROJECT | wildfire, control tower GIS | — |
| Healthcare / FHIR / clinical data | PROJECT | health system, clinical console | **synthetic data**, no healthcare employer |
| AML / financial crime | PROJECT | transaction monitoring | synthetic data |
| Marketing attribution, LookML semantic layer | PROJECT | marketing attribution repo: `looker/` model + 3 views (win rate, ACV, NRR, GRR…), parsed and schema-checked in CI | LookML as code; running it in a Looker instance is not stated |
| Public-sector finance | PROJECT | BC local-government finance (public data) | — |

## 5. Not evidenced anywhere

A requirement that names one of these is a **real gap** unless the user supplies
new facts in the conversation (then treat the new fact as user-stated and say
so): AWS (any service, incl. Redshift, S3, Glue), GCP / BigQuery, Snowflake
execution, Looker (the product), Qlik, Alteryx, SAS, R, VBA/macros, SAP as a
user (only SAP-shaped synthetic extracts), Oracle, NetSuite, Dynamics 365,
Salesforce, HubSpot, GA4 / web analytics, Jira, Confluence, Agile/Scrum
ceremonies, Kafka or production streaming, Terraform / IaC, Kubernetes, SSAS,
dbt Cloud, Hadoop, data-catalog tools (Purview, Collibra, Alation), Lean / Six
Sigma, formal BRDs or Agile user stories, HIPAA / PHIPA / PIPEDA compliance
work, three-statement or DCF valuation models, French or other languages,
Tableau in a job, dbt or Airflow in production, people management,
CPA / CFA / CBAP / PMP / PL-300, industry experience outside food distribution
and investment finance.

## 6. Qualifiers that must survive any rewrite

- ~45%, ~30%, ~40% are **internal estimates** (directional, not audited).
- dbt and Airflow are **project work, not production**; Airflow is checked, not scheduled.
- Snowflake is **profile only, never run**.
- DP-600 is **in progress**.
- Project data is **synthetic** unless the manifest says public-open-data; dollar outcomes in projects are **modelled**.
- Portfolio BA documents are **portfolio artifacts**, not employer deliverables.
- Two Rivers: **sole analyst**. No team leadership is claimed.

## 7. Projects

Mirrors `portfolio-manifest.json` (checked by `tools/check-role-fit-skill.mjs`).
"Data" uses the manifest classification.

| Project | Anchor | Tests | Data | Live | Strongest for |
|---|---|---|---|---|---|
| Retail Analytics Platform | p-wholesale | 1423 | synthetic | yes | DA, AE, BI — metric governance, 62 governed metrics, margin root cause |
| Supply Chain Control Tower | p-control-tower | 836 | synthetic | yes | DE, BI, SC — medallion on Databricks, 10M-row benchmark, 8-page Power BI |
| Inventory Analytics · Operations Decision Studio | p-inventory | 349 | synthetic-and-session-upload | yes | SC, BA — forecasting backtests, policy lab, 13 reqs / 12 UAT |
| Ask Your Data | p-ask-your-data | 1128 | synthetic-and-session-upload | yes | DS, AE — governed text-to-SQL, 46/0/12 contract |
| Canada Wildfire Risk | p-wildfire | 111 | public-open-data | yes | DS — XGBoost, ROC-AUC 0.881 out of time, GitHub Actions |
| Health System Decision Support | p-healthcare | 819 | synthetic | no | healthcare DA/BA — SPC, decision packet |
| Pricing & Costing Analytics | p-pricing-analytics | 3182 | synthetic | yes | DA, FA — pocket-price waterfall, approval routing |
| GL / P&L Reconciliation | p-gl-recon | 710 | synthetic | no | FA — close certification, SoD, Tableau + Power BI |
| Finance Decision Models in Excel and Power BI | p-excel-fpa | 1190 | public-open-data-and-synthetic | no | FA, DA — utility plan-vs-actual, Excel + Power BI tie-out |
| B.C. Local-Government Finance | p-bc-finance | 181 | public-open-data | no | AE, FA, public sector — 90 contracted files, dbt 31 tests |
| Transaction Monitoring | p-aml-monitoring | 183 | synthetic | yes | DS, fincrime — 60/60 planted cases |
| Marketing Attribution & Incrementality | p-marketing | 128 | synthetic | yes | DS, marketing DA — geo holdout, budget allocator |
| Clinical Evidence Console + FHIR Warehouse | p-clinical | 281 | synthetic | yes | healthcare DE/BA — FHIR, UAT plan |
| Customer Recommendation Engine | p-customer-rec | 814 | synthetic | yes | DS — recommender, pre-registered experiment |
| HR Attrition Analytics | p-hr-attrition | 822 | synthetic | yes | DA, people analytics — survival analysis, SQL |
| Supply Chain Analytics — dbt | p-dbt | 157 | synthetic | no | AE — dbt contracts, unit tests, SCD2, MetricFlow, Databricks |
| Legacy-to-Fabric Migration | p-migration | 440 | synthetic | yes | DE, BA — GO/NO-GO cutover gate, charter, RACI |
