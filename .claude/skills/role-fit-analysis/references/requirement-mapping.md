# Requirement mapping — role families and wording vs real gaps

Read this during steps 2–4 of the method. Section A tells you what actually
decides fit for each role family; section B tells you whether a posting's
phrase is met by existing evidence under different words (a wording gap) or
not met at all (a real gap).

Contents: A. Role families · B. Wording vs real: equivalence rules ·
C. Hard gates

---

## A. Role families

For each family: the requirements that decide fit (weight these as core), the
Role fit view to link, the projects to lead with, and the gaps that usually
matter. Titles vary; classify by the duties, not the title. A "Data Analyst"
whose duties are pipelines is a data engineering role.

| Family (common titles) | Core requirements that decide fit | Role fit view | Lead with | Usual real-gap risks |
|---|---|---|---|---|
| **Data Analyst** (insights, reporting, operations, product, marketing analyst) | SQL; a BI tool; stakeholder questions → findings; data quality | `data-analyst` | Retail Analytics Platform, Pricing & Costing, Finance models | product/web analytics (GA4, event data, A/B platforms); a named BI tool other than Power BI |
| **BI / Reporting Analyst, BI Developer** | Power BI or named BI tool; data modelling; DAX; RLS; report delivery | `bi-developer` | Supply Chain Control Tower, GL Recon, Health System | Tableau/Looker/Qlik as *primary* tool in a job; SSAS; PL-300 required |
| **Analytics Engineer** | dbt; dimensional modelling; tests/CI; cloud warehouse; metric definitions | `analytics-engineer` | Supply Chain Analytics — dbt, Retail Analytics Platform, BC finance | dbt **in production**; Snowflake/BigQuery named as required; Looker/LookML in production |
| **Data Engineer** | pipelines/ELT; orchestration; cloud platform; data quality; scale | `data-engineer` | Control Tower, Legacy-to-Fabric Migration, BC finance | AWS/GCP; Kafka/streaming; Terraform; Airflow in production; years of pure DE |
| **Business Analyst / Business Systems Analyst** | elicitation; process mapping; UAT; documentation; stakeholder management | `business-analyst` | Legacy-to-Fabric Migration, Inventory Analytics, delivery documents | Agile/Jira/user stories; named ERP/CRM configuration; CBAP; BRDs in a job |
| **Financial / FP&A Analyst** | Excel modelling; variance; close/reconciliation; budgeting and forecasting | `financial-analyst` | Finance models (Excel + Power BI), GL Recon, Pricing | CPA/CFA; paid budgeting/FP&A cycle; three-statement/DCF; named ERP (SAP, Oracle, NetSuite) |
| **Supply Chain / Operations Analyst** | inventory; OTIF/service; demand forecasting; ERP/WMS data | `supply-chain-analyst` | Inventory Analytics, Control Tower, dbt | named planning systems (SAP APO/IBP, Kinaxis, Blue Yonder); manufacturing/MRP |
| **Data Scientist / ML** | modelling; evaluation; statistics; experimentation; production ML | `data-scientist` | Wildfire, Transaction Monitoring, Ask Your Data | production ML ownership; deep learning in a job; PhD; MLOps platforms |

**Adjacent roles** (data governance / data quality analyst, analytics consultant,
revenue or sales-ops analyst, people analytics, healthcare data analyst,
fincrime analyst): pick the closest family above for the view and lead
projects, then treat the domain requirement separately. Domain evidence that
exists only in synthetic-data projects (healthcare, AML, marketing, HR) is
PROJECT tier. It is never industry experience.

**Seniority.** Kush has ~4 years of paid work and no people management. Read
the title and years together: "Senior" plus 5+ years is a stretch; "Lead" or
"Manager" with reports is a hard gate miss unless the duties show it is an
individual-contributor role.

## B. Wording vs real: equivalence rules

The question for every requirement: **would a truthful edit to the résumé
make a screener or ATS see the match?** If yes, it is a wording or surfacing
gap. If the only way to show it would be to claim something not in the
evidence, it is a real gap.

### Categories that existing evidence satisfies (wording gaps if the résumé uses other words)

| Posting says | Honest mapping | Tier |
|---|---|---|
| "cloud data warehouse" (unspecified) | Microsoft Fabric Warehouse, Azure Synapse (paid); Databricks SQL (project) | PAID |
| "ETL/ELT tools", "data pipelines" | Azure Data Factory, Fabric pipelines, SSIS (paid) | PAID |
| "BI tools", "data visualization tools" (any-of list including Power BI) | Power BI | PAID |
| "ERP data", "operational systems" | ERP, POS, WMS, workforce, REST feeds at Two Rivers | PAID |
| "KPI development", "metrics definitions", "single source of truth" | governed KPIs agreed with Sales/Finance/Supply Chain | PAID |
| "requirements gathering", "elicitation", "translate business needs" | Two Rivers KPI definitions with acceptance criteria; Shivam reporting requirements | PAID |
| "stakeholder management", "cross-functional" | Sales, Finance, Supply Chain; portfolio and risk stakeholders | PAID |
| "data governance", "data security", "access controls" | RLS/RBAC, column masking, documented definitions | PAID |
| "data quality", "validation", "reconciliation", "controls" | reconciliation controls, automated tests, alerting | PAID |
| "root cause analysis" | discrepancies traced to feed level | PAID |
| "automation", "streamline reporting" | Python/SQL automation (~40%, internal estimate) | PAID |
| "big data", "Spark" | PySpark in Fabric/Synapse | PAID |
| "semantic layer", "metrics layer" | Power BI semantic model (paid); MetricFlow (project) | PAID |
| "version control", "CI/CD", "software engineering practices" | Git + GitHub Actions on 17 repos | PROJECT |
| "statistics", "regression", "hypothesis testing" | geo holdout, diff-in-diff, permutation test, survival, LINEST; MPS | PROJECT+DEGREE |
| "experimentation", "A/B testing" | pre-registered experiment design, geo holdout | PROJECT |
| "R or Python", "Python or similar" | Python | PAID |
| "degree in a quantitative field" | B.Eng. Computer Science; MPS Analytics | DEGREE |

### Named tools: match, adjacent, or real

- **Named tool with a PAID or PROJECT row in the inventory** → match at that tier.
  Example: "Tableau" → PROJECT (GL recon). Cite the project. Do not say it was used in a job.
- **Named tool that is only an alternative inside an any-of list** ("Snowflake,
  BigQuery or Synapse") → match on the alternative that has evidence.
- **Named tool required on its own, no evidence, but a close equivalent at PAID
  tier** (Looker required, Power BI paid; BigQuery required, Synapse paid) →
  **adjacent-tool gap**. The skill transfers but the keyword does not. Credit
  0.5 in the score. The fix is to mention the transfer in the cover note or
  screen answer. Never add the tool to the résumé.
- **Named tool with no evidence and no close equivalent** (SAS, Salesforce admin,
  Terraform, Kafka) → real gap.
- **"Production", "professional", "N years of X"** attached to a skill that is
  PROJECT-only → **depth gap**, credit 0.5 of the project credit. dbt and
  Airflow are the common cases.
- **"N years of <tool>"** is a weighted Must row, not a hard gate: tools
  transfer, and postings over-ask. Count only PAID years for that tool
  (inventory §4). If PAID years ≥ N, it is a match. If the tool is PROJECT-only,
  it is a depth gap. If it has no evidence, it is a real gap.
- **"Experience with" vs "exposure to" / "familiarity with"**: "exposure" or
  "familiarity" is satisfied by PROJECT or DEGREE tier at full credit.

### Domain requirements

- "Experience in [industry]" → PAID only if food/perishable distribution,
  wholesale, logistics or investment-firm finance. A synthetic-data project in
  that domain is a PROJECT-tier partial (credit 0.5): it shows domain
  vocabulary, not industry experience. Say which.
- "Public-sector", "municipal", "government finance" → PROJECT on public data
  (BC local-government finance). This is stronger than synthetic data. It is still not employment.

## C. Hard gates

A hard gate is a condition the posting states as mandatory and that no skill
can substitute for. Total years count, but years with a particular tool do not
(see §B). Check each one explicitly, and mark it met, unmet, or unknown:

| Gate | How to evaluate |
|---|---|
| Work authorization / sponsorship | Canada: met. Anything else: **unknown**. Ask; never assume. |
| Location / on-site / relocation | Vancouver; open to remote and relocation across Canada. Outside Canada: unknown. Hybrid in another Canadian city: met (relocation stated). |
| Minimum total years | compare against 4 yrs 3 mos paid. If 1 year short with strong core coverage: flag as soft. If 2+ years short: unmet. **"N years or an equivalent combination of education and experience"** is soft, not a gate: count the MPS and B.Eng. as the posting invites, and say so. |
| Required degree | B.Eng. CS, MPS Analytics. |
| Required certification or designation | only completed certs count. DP-600 in progress = unmet, but say "in progress". |
| Clearance, licence, language, travel, shifts | not stated → unknown; ask. |
| People management | none stated → unmet if required. |

An **unknown** hard gate never blocks the analysis. It goes to the top of the
report as a question to answer before applying.
