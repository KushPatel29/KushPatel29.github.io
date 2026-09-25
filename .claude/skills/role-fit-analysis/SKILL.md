---
name: role-fit-analysis
description: Evidence-first job-fit analysis for Kush Patel. Compares one job posting's requirements against Kush's actual résumé, paid experience and public portfolio projects. Separates real gaps from wording gaps, decides whether to apply now, and proposes only the few résumé edits that matter. Use this whenever Kush shares a job posting, job description, LinkedIn/Indeed link or pasted JD, or asks "should I apply", "am I a fit", "how do I match this role", "tailor my resume for this job" or "what am I missing for this role". It covers data analyst, BI/Power BI developer, analytics engineer, data engineer, business analyst, financial/FP&A analyst, supply chain/operations analyst, data scientist and adjacent analytics roles, even when the request doesn't say "fit".
---

# Role-fit analysis

Decide, from evidence, whether Kush should apply to one specific posting, and
what (if anything) to change first. The output is a short report that answers
three questions:

1. **Can Kush back up what this posting asks for?** (evidence fit)
2. **Would a screener or ATS see it on the current résumé?** (visible fit)
3. **Apply now, apply after a few edits, stretch, or skip?**

Kush is job hunting and wants to move fast. The two failure modes are:
talking Kush out of roles they can win because the wording differs, and
encouraging claims they cannot defend in an interview. Evidence-first avoids
both. Every "yes" points at something a hiring manager can open, and every "no"
names what is actually missing.

## Ground rules

- **Facts come from two places only.** The evidence snapshot or inventory
  (below), and what Kush states in this conversation. When Kush adds a fact,
  use it and label it *user-stated*. Anything else is **unknown**: ask about
  it, or flag it. Never infer work authorization, salary, seniority, a tool,
  an industry or a metric.
- **The same rule applies to the posting.** Quote its words. If it doesn't
  state location, salary, years, or whether a skill is required, record "not
  stated". Don't fill the gap with what such roles usually want.
- **Evidence tiers are fixed:** PAID (done in a job, in the Experience
  section), PROJECT (public repo), DEGREE (master's coursework), CERT
  (completed only). Never present a PROJECT item as job experience, or an
  in-progress cert as held.
- **Qualifiers travel with the claim.** "internal estimate", "not production",
  "synthetic data", "never run", "in progress" must survive every rewrite
  (inventory §6).
- **Application details are private.** The portfolio repo is public, and
  recruiters open it. Save reports and tailored résumés only under `tmp/`
  (gitignored) or the session scratchpad. Never commit them. Never edit
  `resume/resume.html` or `assets/Kush-Patel-Resume.pdf` for one application.

## Step 0 — Load the evidence

Inside the portfolio repo, run:

```bash
node .claude/skills/role-fit-analysis/scripts/evidence-snapshot.mjs
```

It prints the current résumé, every promoted project, every Role fit row (tagged
PAID / PROJECT / DEGREE) and the per-role evidence scores, all read from the
published files. Then read `references/evidence-inventory.md` for what the
snapshot can't show. That means the capability tier table (§4), the list of
things with **no** evidence (§5), and the qualifiers (§6).

If the script exits 2 (no repo), use the inventory alone. Say "evidence from
inventory snapshot dated <inventory-verified>" in the report header.

## Step 1 — Take in the posting

Work from the posting text. If only a URL is given, fetch it. If fetching
fails or the page is behind a login, ask Kush to paste the text. Don't
analyse a posting from its title alone.

Record: company, title, location and work mode, employment type, salary,
seniority signals and application deadline. Use "not stated" for anything
missing.

## Step 2 — Extract atomic requirements

Split the posting into single, checkable requirements. Split compound lines
("SQL and Python" → two rows, "Git and code review" → two rows), so each row
gets one honest credit instead of an average. Merge duplicates. Drop pure boilerplate
("team player", "fast-paced") unless the posting emphasises it. Keep at most
one row for communication.

Weight each row by where the posting puts it:

| Kind | Signal in the posting | Weight |
|---|---|---|
| **Must** | "required", "must", "minimum", listed under Requirements/Qualifications without a softener | 3 |
| **Core duty** | a tool or skill named in Responsibilities that the job does every week | 2 |
| **Preferred** | "preferred", "nice to have", "asset", "bonus", "plus", "familiarity/exposure" | 1 |

Pull out **hard gates** separately (work authorization, location, minimum
years, required degree/cert/designation, clearance, language, people
management). They are pass/fail, not weighted. See
`references/requirement-mapping.md` §C.

Classify the role family by its duties. Titles are unreliable. Use
`references/requirement-mapping.md` §A to identify which requirements are
**core** for that family. A real gap on a core requirement matters more than
the arithmetic suggests.

## Step 3 — Match each requirement to evidence

For each row, find the strongest evidence and cite where it lives: a résumé
bullet, an Experience entry, a Role fit row, or a project with its anchor
(e.g. `#p-dbt`). Then give it two credits:

**Evidence credit** — can Kush back it up?

| Evidence | Credit |
|---|---|
| PAID | 1.0 |
| PROJECT | 0.7 (1.0 if the posting says only "familiarity/exposure") |
| DEGREE | 0.5 |
| CERT (completed) | 0.4 |
| Adjacent tool (equivalent skill at PAID tier, different product) | 0.5 |
| Depth gap (PROJECT only, but posting demands production / N years) | 0.35 |
| None, or unknown | 0 |

**Visible credit** is the same scale, but judged only on the current
**résumé** text. Would a screener reading the PDF, or an ATS matching
keywords, recognise it? Evidence that sits only on the portfolio site, or is
described in different words, gets lower visible credit. The gap between the
two credits is what tailoring can fix.

Then give each row one **gap class**:

- **Match**: evidence meets the requirement, and the résumé shows it in terms the posting would recognise.
- **Wording gap**: the evidence meets it and it is on the résumé, but under different words (posting: "ETL tools"; résumé: "ELT / Orchestration: Azure Data Factory, SSIS").
- **Surfacing gap**: the evidence meets it but is only on the portfolio, not the résumé (e.g. HR Attrition survival analysis, Legacy-to-Fabric migration charter).
- **Adjacent-tool gap**: the skill transfers but the named product was never used (Looker vs Power BI). Mention it in the cover note or screening answer, never on the résumé.
- **Depth gap**: PROJECT-tier only, where the posting wants production or years (dbt, Airflow, Databricks).
- **Real gap**: no evidence anywhere. Check inventory §5 before deciding. Look again, including synonyms, before calling something a real gap. Then call it plainly.
- **Unknown**: the posting is ambiguous, or it depends on a fact Kush hasn't given.

`references/requirement-mapping.md` §B has the equivalence rules for common
phrasings. Use them rather than improvising. They are what keeps these calls
consistent across postings.

## Step 4 — Score and decide

```
evidence fit  = Σ(weight × evidence credit) / Σ weight
visible fit   = Σ(weight × visible credit)  / Σ weight
must coverage = evidence fit computed over Must rows only
```

Show the arithmetic compactly (the totals, not every multiplication), so the
numbers can be checked.

Decide in this order. The first rule that fires wins, and every posting
lands on exactly one:

1. **Skip**: a hard gate is **unmet**. Examples: a required designation not
   held, people management required, 2+ years short of a stated minimum, or
   work authorization Kush has confirmed not having. Name the gate.
2. **Skip**: must coverage < 45%, or real gaps on two or more core
   requirements. Name the closest role family where Kush is strong instead.
3. **Stretch**: must coverage < 60%, or one real gap on a core requirement.
   Apply only if applying is cheap (easy-apply, referral, or a recruiter
   reached out). Say what would make the application credible.
4. **Apply after tailoring**: Kush can back it up, but the résumé would lose
   the screen. That means visible fit trails evidence fit by 8+ points, or a
   Must row has visible credit ≤ 0.5 while its evidence credit is ≥ 0.7.
   Make the Step 5 edits, then apply the same day.
5. **Apply now**: everything else. Call it **strong** at must coverage ≥ 75%,
   and **competitive** at 60–75%. Step 5 edits are optional quick wins.

A **depth gap on a core requirement** (e.g. "2+ years production dbt"
against project-only dbt) does not change the decision rule. It is the
likeliest screening question, though, so name it as the screen risk and give
the honest answer to prepare.

If a hard gate is **unknown**, still reach a decision, but make it
conditional ("Apply now, once you confirm X") and put the question at the top.
Unknown rows score 0 until Kush answers. Recompute when Kush does.
These thresholds are defaults. If judgment overrides one (e.g. a startup
posting that lists ten "requirements" it plainly treats as preferences), say
so and give the reason.

The per-role scores in `role-readiness.json` describe the portfolio in
general. They are not a fit score for this posting, so don't quote them as one.

## Step 5 — Only the highest-value résumé edits

Rank edits that fix Must or core rows first, since those are what screen
Kush out. Within each group, rank by **weight × (evidence credit − visible
credit)**, summed over the rows the edit fixes. Propose **at most three** (five only if
many Must rows are wording gaps). Stop early when the rest add little. "No
edits needed" is a valid, good answer.

Every edit must:

- close a Must or core-duty row, or, for a Preferred row, cost no more than a few words;
- point at evidence that already exists, citing the source;
- keep its tier and qualifiers (no project → job, no dropped "internal estimate");
- use the posting's exact term only when the evidence supports that term, since ATS matching rewards exact phrases;
- fit the two-page limit. Name what to trim, or swap a project, rather than just adding.

Never add a tool from inventory §5, a metric that isn't published, or a
responsibility Kush didn't state.

Edits come in three shapes, in rough order of value:

1. **Reword**: change an existing bullet or skills line to the posting's term.
2. **Swap a project**: replace one "Selected Projects" entry with a
   portfolio project that fits better (e.g. HR Attrition for a people-analytics
   role, Legacy-to-Fabric Migration for a BA role).
3. **Reorder**: move the most relevant skills line or bullet up.

Mark each edit **this application** (a tailored copy) or **promote to master
résumé**. Promote only when it is true, helps two or more role families, and
the two-page limit still holds. A master-résumé change must also keep
`tools/check-resume.mjs` passing, and then needs `bash resume/build.sh`.

When Kush asks for the tailored résumé itself:

```bash
mkdir -p tmp/role-fit/<company-slug>
cp resume/resume.html tmp/role-fit/<company-slug>/resume.html
# apply the edits to the copy, then:
RESUME_SRC=tmp/role-fit/<company-slug>/resume.html \
RESUME_OUT=tmp/role-fit/<company-slug>/Kush-Patel-Resume.pdf bash resume/build.sh
```

`build.sh` fails unless the result is exactly two pages with extractable text.
Treat a failure as a sign the edit added too much.

## Step 6 — Report

Use this structure. Keep it tight, because Kush reads it before deciding.

```markdown
# Role fit: <Title> — <Company>
Evidence: live snapshot <manifest date> | inventory <date> · Posting: <source>

## Decision: <Apply now | Apply after tailoring | Stretch | Skip> — <one-line reason>
<Conditional? "Confirm first: …" line with any unknown hard gates.>

| Evidence fit | Visible fit (résumé today) | Must coverage | Family |
|---|---|---|---|
| NN% | NN% | NN% | <family> (<seniority read>) |

## Hard gates
| Gate | Posting says | Kush | Status (met / unmet / unknown) |

## Requirements vs evidence
| # | Requirement (posting's words) | Wt | Best evidence (source) | Tier | E / V | Gap class |
<every row; the evidence cell cites a bullet, Experience entry or project anchor>

## Real gaps (what's actually missing)
<Each real, depth or adjacent-tool gap on a Must/core row. Include an honest
one-line interview answer, and the fastest credible way to close it, if one
exists and is cheap. Omit the section if there are none.>

## Résumé edits (highest value first)
1. **<what>**. Fixes rows #… · <this application | promote to master>
   - Where: <section / bullet>
   - Now: "<current text>"
   - Change to: "<proposed text>"
   - Evidence: <source> · Trim: <what makes room>

## Send with the application
- Portfolio link: `node tools/make-link.mjs <company> "<title>"` (add `--as <view>` if the title misleads)
- Lead projects: <2–3, with anchors, chosen for this posting>
- Cover-note line for adjacent-tool gaps, if any.

## Unknowns to resolve
<questions for Kush, or for the recruiter; omit if none>
```

When a hard gate decides **Skip**, stop after the Hard gates table. Add two
lines: which gate(s) decided it, and where to aim instead (the closest family
and seniority where Kush is strong). Skip the requirement table and the
résumé edits, since they would not change the outcome.

`references/example-report.md` is a worked example on a fictional posting.
Match its level of detail and its honesty about gaps.

Afterwards, if Kush wants the report kept, save it to
`tmp/role-fit/<company-slug>/report.md`. Mention that `make-link.mjs` logs
to `tools/links.tsv`, which is gitignored for the same privacy reason.

## Batch triage

Given several postings at once, run Steps 1–4 for each. Then return one table
(company, title, family, evidence fit, visible fit, decision, top blocker),
sorted by decision and then evidence fit. Run Steps 5–6 in full only for the
postings marked Apply now or Apply after tailoring, unless asked otherwise.
