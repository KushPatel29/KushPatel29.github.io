# Evidence inventory — Kush Patel

inventory-verified: 2026-10-26
manifest-totals: 21 projects · 14643 tests

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
  3.76, Vancouver, Sep 2022 – Jun 2024. Coursework: machine learning, deep
  learning, NLP/LLMs, time-series forecasting, statistical inference, data
  mining, cloud data platforms. Capstone grew into Ask Your Data.
- Gujarat Technological University — B.Eng. Computer Science, Aug 2017 – Aug 2021.
- Award: first prize, 2024 wildfire-prediction hackathon (team).
- Completed: Google Data Analytics Professional Certificate (Oct 2023); UC
  Davis SQL for Data Science (Jan 2025); IBM Python for Data Science, AI &
  Development (Nov 2023); Databricks Fundamentals (accreditation);
  Northeastern Data Visualization &
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
| Power BI (DAX, Power Query/M, semantic models) | PAID+PROJECT | Two Rivers, Shivam; PBIP/TMDL in Git (control tower, pricing, utility, GrowthOps) | — |
| RLS/RBAC, column masking | PAID | Two Rivers | — |
| Incremental refresh | PAID | Two Rivers | — |
| SSRS paginated reports, SSIS | PAID | Two Rivers legacy estate | maintained + migrated, not greenfield |
| Excel (Power Query, Power Pivot, dynamic arrays, LAMBDA, data tables, LINEST) | PAID (general) + PROJECT (advanced) | Shivam; excel-fpa-model, bc-local-government-finance, GrowthOps OS (window-driven workbook, campaign scorecard) | advanced features are shown in projects |
| Tableau | PROJECT | GL recon generated desktop workbook plus published compact Tableau Public view of the tested control extract; 60 account-periods, 43 outside 0.5% tolerance, monthly filter action | not used in a job; the compact web view is separate from the seven-sheet generated desktop workbook |
| Python (pandas, NumPy, scikit-learn) | PAID+PROJECT | Shivam automation; Two Rivers forecasting web apps; all repos | — |
| PySpark | PAID+PROJECT | Two Rivers Fabric/Synapse; control tower on Databricks | — |
| Microsoft Fabric (Lakehouse, Warehouse, pipelines, notebooks) | PAID | Two Rivers | DP-600 in progress, not held |
| Azure Data Factory, Azure Synapse | PAID | Two Rivers | — |
| SQL Server | PAID | Two Rivers | — |
| Databricks (SQL warehouse, serverless jobs, Unity Catalog, Delta) | PROJECT | control tower notebooks; dbt project built on Databricks; Corridor serverless job (PySpark features match DuckDB to 2.2e-11) | not in a job |
| dbt Core (contracts, unit tests, snapshots, incremental) | PROJECT | Supply Chain Analytics — dbt; BC finance (31 tests) | **not production** (résumé says so) |
| MetricFlow / semantic layer | PAID (Power BI semantic layer) + PROJECT (MetricFlow) | Two Rivers; dbt project | MetricFlow is project-only |
| Apache Airflow | PROJECT | DAG in dbt project | **runs nightly under the Airflow scheduler in CI; not an employer production deployment** |
| Snowflake (dbt Projects on Snowflake, Git repository object, COPY INTO from stage, INFER_SCHEMA) | PROJECT | Supply Chain Analytics — dbt: 180/180 nodes green, 41/41 mart totals equal DuckDB; Retail Analytics Platform: nine sources landed as Parquet and loaded with COPY INTO, 48/48 nodes, 107/107 measures reconciled with an independent pandas build; both on a Snowflake **trial account**, recorded runs with query IDs | not in a job; trial account; Streams/Tasks late-arrival pipeline, Snowpark procedure, 36 access checks with secondary roles disabled, resource monitor; 94,758 lines and 5,979 aggregates reconciled; tasks suspended after the trial run |
| DuckDB, PostgreSQL | PROJECT | several repos | — |
| Dimensional modelling (Kimball, SCD1/2, conformed dims) | PAID+PROJECT | Two Rivers mart; dbt snapshots | — |
| Data quality tests, contracts, quarantine, alerting | PAID+PROJECT | Two Rivers tests/alerts; control tower, BC finance contracts | — |
| Migration with cutover validation | PAID+PROJECT | Two Rivers; Legacy-to-Fabric Migration repo | — |
| REST API integration | PAID | Synerion time-and-attendance API | — |
| Git, GitHub Actions CI, Docker | PROJECT | all 21 public projects run automated validation; Portfolio Intelligence runs in this repo's root workflow | Git use in paid work not stated |
| Stakeholder engagement, requirements, KPI definitions, acceptance criteria | PAID | Two Rivers (Sales, Finance, Supply Chain); Shivam (portfolio/risk) | — |
| Process mapping, UAT plans, traceability, business cases, RACI/RAID | PROJECT | inventory BA case (13 reqs, 12 UAT), clinical UAT plan, migration charter/RACI, supply-chain process case | documents are portfolio artifacts, not employer deliverables |
| Agile user stories, Given/When/Then acceptance criteria, product backlog | PROJECT | Legacy-to-Fabric `docs/business-analysis/BACKLOG_AND_ACCEPTANCE.md`: 5 epics, 16 stories, 30 criteria each executed by a named CI test, the rest labelled manual UAT; loaded into a **Jira Cloud** Scrum project (free site) through the REST API by `jira_rest.py`: ten stories Done because every criterion runs in CI, six in To Do | not in a job; Jira used on a personal free site; no Scrum ceremonies, sprints or team velocity |
| Change and adoption | PAID | widened Power BI self-service with RLS at Two Rivers | — |
| GL/P&L reconciliation, month-end close | PAID+PROJECT | Shivam, Two Rivers; GL recon repo | — |
| AP/AR, DPO/DSO, working capital | PAID+PROJECT | Two Rivers, Shivam; Kestrel Bay model | — |
| Variance, margin, price-volume-mix | PAID+PROJECT | Two Rivers margin KPIs; pricing, utility models | — |
| Budgeting, forecasting, scenario models (FP&A) | PROJECT | utility and BC municipal Excel models; Kestrel Bay FY2027 budget cycle (`excel-fpa-model/budget_cycle`): top-down targets, bottom-up submissions by channel/category/department with hires, monthly phasing, a challenge round, gap-to-target and the price that closes it, a 3+9 reforecast with an EBITDA bridge | FP&A budgeting not a paid responsibility; synthetic company |
| Three-statement model (monthly P&L, balance sheet, cash flow with a revolver) | PROJECT | Kestrel Bay FY2027 budget workbook: balance sheet balances and cash flow ties every month, revolver holds minimum cash, interest on the opening balance (no circularity); 73 tests hold it to a pandas twin | not in a job; a separate lululemon DCF exists on real SEC filings, with explicit WACC, scenarios and terminal-value sensitivity |
| Supply chain: OTIF, FEFO, lot trace, vendor scorecards, WMS accuracy | PAID+PROJECT | Two Rivers; control tower, inventory app | — |
| Demand forecasting | PAID+PROJECT | Two Rivers SKU forecasting; inventory backtests | — |
| Inventory policy / service-level optimisation | PROJECT | inventory app policy lab | — |
| Customer analytics (cohorts, RFM, churn signals) | PAID+PROJECT | Two Rivers; Corridor (RFM segments, calibrated propensity, churn and attrition models) | — |
| KYC / CDD: customer risk rating (onboarding and periodic refresh), EDD triggers, foreign-PEP handling, beneficial ownership (25%, indirect through holdings, loops) | PROJECT | Transaction Monitoring `src/kyc.py` on 1,500 synthetic customers and 450 ownership trees; 131 High at refresh; mapped to PCMLTFA obligations in the regulatory mapping | not in a job; synthetic KYC files; no ID verification, no real PEP or adverse-media lists |
| Streaming (Kafka API / Redpanda), Terraform, Kubernetes | PROJECT | Transaction Monitoring `streaming/`: event-time windows, late and duplicate deliveries, at-least-once with idempotent alerts; Terraform deploys broker, two-replica consumer group and jobs to a kind cluster in GitHub Actions; a pod is killed mid-stream; stream must equal batch (51/51 structuring, 1,270/1,270 LCTR 24-hour rule) | CI cluster only, not production; one broker, no TLS/auth |
| Sanctions name screening (fuzzy matching, Cyrillic transliteration, threshold set on a dev half) | PROJECT | Transaction Monitoring `src/sanctions_screening.py` on the real Consolidated Canadian Autonomous Sanctions List (5,708 entries), list never committed | one list only (not UN or Criminal Code lists); no real PEP screening or ongoing monitoring; synthetic KYC risk rating is implemented separately; customers are synthetic |
| Statistics, hypothesis tests, experiments, causal inference | PROJECT+DEGREE | geo holdout, diff-in-diff, permutation test, survival analysis; Corridor ten-arm randomized offer trial, uplift learners and a randomized test of the targeting policy (+$1.40/customer, 95% CI $0.23 to $2.57); MPS | no production A/B testing platform; Corridor's trials run on simulated customers |
| Mathematical optimization (mixed-integer programming, LP duals, HiGHS, Gurobi) | PROJECT | Corridor: one MIP over 112,563 customer-offer decisions, proven optimal (gap 1.5e-7), residual re-solved in Gurobi; inventory policy lab | synthetic data; Gurobi used under its size-limited licence |
| Pricing, promotions and loyalty (elasticity, offer targeting, next best offer) | PROJECT | Corridor pricing studio and next-best-offer pages; pricing & costing analytics | synthetic toll-road operator; not affiliated with any real one |
| Machine learning (XGBoost, logistic, anomaly, recommender) | PROJECT+DEGREE | wildfire, AML, recommender, HR | production ML only as the forecasting web apps |
| Model monitoring / prospective evaluation of a deployed model | PROJECT | wildfire track record: twice-daily publication; weekly grading of the first published forecast per station day on the current grid against CWFIS satellite detections (leads 2-7, two baselines, day-level bootstrap); first 36 days to 28 Oct 2026: ROC-AUC 0.734 (95% CI 0.696-0.770), ahead of both baselines on ranking, top-10% edge not yet distinguishable from zero | a public project, not an employer's model; MLflow tracks six historical model versions and prospective monitoring, with a local SQLite registry; no SageMaker or employer MLOps ownership |
| LLM / text-to-SQL, governed AI | PROJECT+DEGREE | Ask Your Data | — |
| GIS / geospatial | PROJECT | wildfire, control tower GIS | — |
| Healthcare / FHIR / clinical data | PROJECT | health system, clinical console | **synthetic data**, no healthcare employer |
| AML / financial crime | PROJECT | transaction monitoring | synthetic data |
| Marketing attribution, LookML semantic layer | PROJECT | marketing attribution repo: `looker/` model + 3 views (win rate, ACV, NRR, GRR…), parsed and schema-checked in CI | LookML as code; running it in a Looker instance is not stated |
| Email analytics (deliverability, human vs machine opens, CTR, newsletter → pipeline) | PROJECT | GrowthOps OS `email_analytics.py`, `mart_email_performance` | synthetic sends; no email platform (Klaviyo, HubSpot, Mailchimp) used |
| HubSpot data model (lifecyclestage, dealstage, owners, custom properties, import files, CRM v3 search payloads) | PROJECT | GrowthOps OS `hubspot.py`, `docs/hubspot-mapping.md` | mapping and files |
| HubSpot hands-on (portal build via API: properties, pipelines, Imports API, lists, workflows, dashboard; two-way sync with field-ownership contract, approved change sets, signed webhooks, tasks; products, line items, tickets) | PROJECT | GrowthOps OS `hubspot_portal.py`, `hubspot_sync.py`, `docs/hubspot-production.md`, `docs/hubspot-sync.md` | a HubSpot **developer test account** with synthetic data, built through the APIs and HubSpot's connector; not a company's production portal, no HubSpot admin role, no marketing emails sent |
| HubSpot CRM development (developer projects platform 2026.09: private apps, UI-extension CRM cards in React/TypeScript, app functions, public endpoint functions, custom workflow actions, webhook subscriptions with v3 signature checks) | PROJECT | HubSpot CRM Platform `hubspot/` (apps.mjs + build.mjs generate one project per business; cards tested with HubSpot's createRenderer); all four cards used on real records, a HubSpot workflow ran the custom action, a HubSpot-delivered webhook was verified (`docs/live-evidence.md`) | four **developer test accounts**, synthetic data; private static-auth apps, **not** a marketplace OAuth app; no paid CRM-developer role |
| CRM-as-code: custom objects, pipelines, association labels, idempotent keyed loads | PROJECT | HubSpot CRM Platform `crm_platform/` (schema engine plans, applies and re-plans to zero; never deletes; 2,977 records and 3,393 associations loaded live, rerun planned 0 writes) | developer test accounts, not a company's production portal |
| Salesforce data model (custom objects, fields, picklists, permission sets as SFDX source, custom metadata) | PROJECT | HubSpot CRM Platform `salesforce/` compiled from the same model, CI `--check` gate; deployed to a Developer Edition org (2-3 Oct 2026, 62 of 62 components) | a free **Developer Edition org**, synthetic data; not a company's org, no Salesforce admin or developer role |
| Salesforce code: Apex (service, bulkified trigger handler, Batch Apex, Apex REST API, test classes), Lightning Web Component on a record page, record-triggered Flow, a keyed data loader over REST | PROJECT | HubSpot CRM Platform `salesforce/meridian/code`, `crm_platform/salesforce/load.py`, `docs/live-evidence.md`: 25 of 25 Apex tests passed in the org (coverage 95-100%); 1,379 records loaded by key, rerun 0 writes; all 359 deals scored through the Apex REST API as Python scores them; trigger + batch rescore and the Flow's approval task exercised live | Developer Edition org only; say "deployed and tested in a Developer Edition org", never Salesforce work experience |
| OAuth 2.0 integration (authorization-code install, state check, token refresh, rotated refresh tokens, OS credential store) | PROJECT | HubSpot CRM Platform `crm_platform/hubspot/oauth.py`, connector app deployed to a test account | tested against a stand-in token endpoint; **not yet installed against HubSpot's real one** |
| Verified user identity on CRM card actions (HubSpot-signed `hubspot.fetch` requests) | PROJECT | HubSpot CRM Platform signed endpoints + card runner | built and tested; switched on per portal only once its client secret is set |
| Short-link / UTM governance (Bitly-style) | PROJECT | GrowthOps OS link audit, `mart_link_hygiene`; campaign-link builder | synthetic links; no Bitly account |
| Public-sector finance | PROJECT | BC local-government finance (public data) | — |

| AWS Athena / S3 / Glue Data Catalog | PROJECT | Supply Chain Analytics `cloud/aws/`: actual Athena query on a pinned 20,000-row seed, eight warehouses, 32/32 measures equal an independent Decimal calculation; 1,425,165 bytes scanned, query ID recorded | personal free-plan account; private encrypted S3, seven-day object expiry and 10 MiB query scan cap; no employer AWS, Redshift or Glue ETL ownership |
| BigQuery / GA4 ecommerce analysis | PROJECT | Marketing Attribution `ga4_bigquery/`: 4,295,584 public obfuscated events, 360,129 sessions, six SQL analyses with BigQuery job IDs, independent raw-event/session reconciliation; revenue deduplication, open and ordered funnels, attribution sensitivity and censored cohort retention | historical public sample (2020–2021); no company GA4 instrumentation or GCP platform ownership |
| Confluence delivery documentation | PROJECT | Legacy-to-Fabric delivery pack published in Confluence, with reciprocal links to its 21 Jira issues and executable acceptance criteria | personal free site; no employer Confluence or Scrum experience |
| DCF valuation | PROJECT | Excel FP&A `valuation/`: lululemon FY2025 SEC filings, five-year cash flows, three scenarios, WACC and terminal-growth sensitivities, formula workbook tied to a Python model | educational valuation dated 17 March 2026; not investment advice or paid valuation work |
| Privacy impact assessment | PROJECT | AML `docs/PRIVACY_IMPACT_ASSESSMENT.md` and `governance/privacy_inventory.json`: 105 classified columns across 14 files; coverage and masking tests; 12 risks with remaining organizational controls stated | synthetic customer data; no privacy-officer approval or production compliance certification |

## 5. Not evidenced anywhere

A requirement that names one of these is a **real gap** unless the user supplies
new facts in the conversation (then treat the new fact as user-stated and say
so): AWS in a job, Redshift, Glue ETL jobs, Snowflake
in a job, Looker (the product), Qlik, Alteryx, SAS, R, VBA/macros, SAP as a
user (only SAP-shaped synthetic extracts), Oracle, NetSuite, Dynamics 365,
Salesforce in a company's org (the Developer Edition deploy in §4 is PROJECT), HubSpot in a company's production portal (the developer-test-account builds in §4 are PROJECT), HubSpot marketplace/OAuth app publishing, GA4 instrumentation in a company, Jira or Confluence in a job, Agile/Scrum
ceremonies, production streaming, Terraform or Kubernetes beyond CI, SSAS,
dbt Cloud, Hadoop, data-catalog tools (Purview, Collibra, Alation), Lean / Six
Sigma, formal BRDs or Agile user stories **in a job** (a public backlog exists, §4), HIPAA / PHIPA / PIPEDA compliance
work in a job, budgeting or three-statement models in a job, French or other languages,
Tableau in a job, dbt or Airflow in production, people management,
CPA / CFA / CBAP / PMP / PL-300, industry experience outside food distribution
and investment finance.

## 6. Qualifiers that must survive any rewrite

- ~45%, ~30%, ~40% are **internal estimates** (directional, not audited).
- dbt and Airflow are **project work, not production**; Airflow runs nightly under its scheduler on an ephemeral CI runner.
- Snowflake and Databricks runs were on **free or trial accounts**; Jira and Confluence use a personal free site. BigQuery ran against Google’s public obfuscated GA4 export in a sandbox. None is paid production experience.
- Kafka, Terraform and Kubernetes run in a **CI cluster**, not production.
- KYC files and ownership trees are **synthetic**; the KYC policy weights are the project's own.
- DP-600 is **in progress**.
- Project data is **synthetic** unless the manifest says public-open-data; dollar outcomes in projects are **modelled**.
- Portfolio BA documents are **portfolio artifacts**, not employer deliverables.
- Two Rivers: **sole analyst**. No team leadership is claimed.

## 7. Projects

Mirrors `portfolio-manifest.json` (checked by `tools/check-role-fit-skill.mjs`).
"Data" uses the manifest classification.

| Project | Anchor | Tests | Data | Live | Strongest for |
|---|---|---|---|---|---|
| Portfolio Intelligence Platform | p-portfolio-intelligence | 31 | synthetic-with-private-live-analytics | yes | AE, DA — private live GoatCounter visits, section attention and countries; separate 90-day synthetic workbench, ordered journeys, censored retention and independent Python reconciliation |
| GrowthOps OS | p-growthops | 700 | synthetic | yes | marketing/growth DA, revenue ops, AE, BI — generated 7-page Power BI report (215 DAX measures, SVG KPI tiles, DAX-written summary) and a formula-driven Excel workbook with a campaign scorecard, agreeing to the cent; platform vs CRM vs cash reconciliation, anomaly root cause, paid efficiency to cost per booked call, email analytics and deliverability, UTM/short-link and CRM hygiene, HubSpot in a developer test account (portal build, two-way sync under a field contract, approved change sets, signed webhooks, products/line items/tickets), written daily update, webhook automation with a retry/alert worker, keyless local RAG ask-your-data, tested operational controls (auth, signed webhooks, metrics, backups, containers; no employer production tenure) |
| HubSpot CRM Platform | p-hubspot-crm | 180 | synthetic | no | CRM developer, HubSpot developer, RevOps engineering — CRM-as-code for four businesses (custom objects, pipelines, association labels, keyed loads rerun to zero writes), a private app per business with React CRM cards, app functions, a custom workflow action and signed webhooks, all live in developer test accounts; an idempotency key against duplicate deals (checked live); an OAuth connector; the same model compiled to Salesforce SFDX metadata, with the guardrail in Apex, an LWC and a Flow, deployed to a Developer Edition org with Batch Apex, an Apex REST API, custom metadata and a Lightning record page (25 Apex tests pass there; the same records loaded by key and re-planned to zero; every deal scored through the API as Python scores it) |
| Retail Analytics Platform | p-wholesale | 1499 | synthetic | yes | DA, AE, BI — metric governance, 62 governed metrics, margin root cause |
| Supply Chain Control Tower | p-control-tower | 853 | synthetic | yes | DE, BI, SC — medallion on Databricks, 10M-row benchmark, 8-page Power BI |
| Inventory Analytics · Operations Decision Studio | p-inventory | 349 | synthetic-and-session-upload | yes | SC, BA — forecasting backtests, policy lab, 13 reqs / 12 UAT |
| Ask Your Data | p-ask-your-data | 1238 | synthetic-and-session-upload | yes | DS, AE — governed text-to-SQL, 46/0/12 contract |
| Canada Wildfire Risk | p-wildfire | 155 | public-open-data | yes | DS — XGBoost, ROC-AUC 0.881 out of time, GitHub Actions |
| Corridor Decision Intelligence | p-corridor | 293 | synthetic | yes | DS, pricing/loyalty DA — causal uplift from a ten-arm randomized trial, certified MIP over 112,563 customer-offer decisions (75% of the true-value ceiling vs 7% for propensity targeting), policy A/B test +$1.40/customer, Databricks + PySpark parity, FastAPI, Power BI |
| Health System Decision Support | p-healthcare | 819 | synthetic | no | healthcare DA/BA — SPC, decision packet |
| Pricing & Costing Analytics | p-pricing-analytics | 3205 | synthetic | yes | DA, FA — pocket-price waterfall, approval routing |
| GL / P&L Reconciliation | p-gl-recon | 710 | synthetic | yes | FA — close certification, SoD, Tableau + Power BI |
| Finance Decision Models in Excel and Power BI | p-excel-fpa | 1320 | public-open-data-and-synthetic | no | FA, DA — utility plan-vs-actual, Excel + Power BI tie-out |
| B.C. Local-Government Finance | p-bc-finance | 181 | public-open-data | no | AE, FA, public sector — 90 contracted files, dbt 31 tests |
| Transaction Monitoring | p-aml-monitoring | 281 | synthetic | yes | DS, fincrime — 60/60 planted cases; sanctions name screening on the real Consolidated Canadian Autonomous Sanctions List: threshold set on one half by a fixed rule, 97.2% of standard name variants caught on the held-out half at 10 alerts per 10,000 synthetic customers (Oct 2026) |
| Marketing Attribution & Incrementality | p-marketing | 139 | public-open-data-and-synthetic | yes | DS, marketing DA — geo holdout, budget allocator, real GA4 ecommerce analysis in BigQuery with reconciliation and job IDs |
| Clinical Evidence Console + FHIR Warehouse | p-clinical | 391 | synthetic | yes | healthcare DE/BA — FHIR, UAT plan |
| Customer Recommendation Engine | p-customer-rec | 833 | synthetic | yes | DS — recommender, pre-registered experiment |
| HR Attrition Analytics | p-hr-attrition | 823 | synthetic | yes | DA, people analytics — survival analysis, SQL |
| Supply Chain Analytics — dbt | p-dbt | 157 | synthetic | no | AE — dbt contracts, unit tests, SCD2, MetricFlow, Databricks and Snowflake runs reconciled to DuckDB; nightly Airflow scheduler in CI |
| Legacy-to-Fabric Migration | p-migration | 486 | synthetic | yes | DE, BA — GO/NO-GO cutover gate, charter, RACI, 16-story backlog with CI-executed acceptance criteria |

## 8. Development execution added on 25 October 2026

These add PROJECT evidence, not paid tenure or independent acceptance:

- Control tower: repeated equivalent-result local SQL profiling and a constrained
  S&OP policy challenge. Existing Desktop VertiPaq storage optimization is already
  documented in `docs/MODEL_OPTIMIZATION.md`; DAX query-latency timing remains
  separate. `benchmarks/spark_tuning.json` records an executed Spark 4.0.1
  local[2] CI comparison on 200,000 rows, independent integer totals, actual
  partition skew and repeated join timings; this is not managed-cluster tenure.
- dbt: actual DuckDB subprocess drill for an old correction, explicit bounded
  backfill, idempotence, breaking-schema failure, recovery and full-rebuild parity.
- Migration: current PBIP candidate hash, six still-pending manual UAT criteria,
  stale-review/defect checks and a local manifest-stage/rollback rehearsal.
- FP&A: four synthetic budget-driver sensitivities with cash/debt consequences,
  balanced monthly statements and a generated decision memo. Workbooks preserved.
- Wildfire: actual MLflow alias replay in a disposable registry copy, degradation
  and hash rejection, rollback, and observed prospective lead slices with assumed
  costs and day-clustered uncertainty. No live model change or new training.
- AML: source-referenced synthetic training draft, lawful alternative, unresolved
  evidence and a nondecisional quality gate. Zero independent reviews/filings.
- Portfolio Intelligence: a no-collection experiment planner with power/SRM,
  Wilson/Newcombe intervals and a guardrail, numerically checked against
  SciPy/statsmodels. All experiment examples are synthetic; real A/B remains off.

Licensed Service publication, actual Power Apps/Automate execution, managed
Spark/cloud operating tenure, independent UAT and human interview performance
remain distinct requirements. Do not infer them from these modules.
