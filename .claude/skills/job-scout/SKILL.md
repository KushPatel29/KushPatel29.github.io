---
name: job-scout
description: One unattended job-scouting run for Kush Patel. Finds Canadian data, BI, analytics-engineering, business-analyst, finance and supply-chain postings from the last day on Indeed and ZipRecruiter, and screens each with the role-fit-analysis skill. For the best matches it prepares an application pack (tailored ATS-checked résumé PDF, fit report, cover note, hiring-manager outreach draft) in Kush's private Job Scout Queue page on claude.ai, and ends with a digest. Use it when a scheduled Routine fires, or when Kush says "run the job scout", "find me new jobs", "check for new postings" or "prepare applications". It never submits applications and never sends emails or messages: Kush applies and sends.
---

# Job scout

Each run turns the last day's postings into a short list of ready-to-send
applications. Kush does the submitting. This skill does the finding,
screening and preparation, so each application takes Kush about five
minutes and goes out within hours of the posting.

## What this skill never does, and why

- **Submit an application or answer a screening question.** The boards'
  terms forbid automated applications and ban accounts that do it. Screening
  answers (work authorization, salary, years with a tool) are statements Kush
  makes, and a wrong one can void an offer later.
- **Send an email, LinkedIn message or connection request, or look up
  personal email addresses.** Outreach is drafted for Kush to send.
  Automated cold email from a personal account gets flagged as spam, and a
  templated note reads as one.
- **Write anything into the git repository or commit it.** The repo is public,
  and an application list is private. Working files live under the gitignored
  `tmp/`. Everything Kush sees goes to the private Job Scout Queue page.
- **Claim what the evidence doesn't show.** Every résumé edit follows
  role-fit-analysis Step 5 (existing evidence only, qualifiers kept, nothing
  from inventory §5).

If a run can't do something (a connector is missing, the build fails), say so
in the digest. Don't work around it.

## Step 0 — Set up

From the repo root:

```bash
bash .claude/skills/job-scout/scripts/setup.sh   # prints: export PYTHON=…
node .claude/skills/role-fit-analysis/scripts/evidence-snapshot.mjs > tmp/role-fit/evidence.txt
```

Export the `PYTHON` line it prints. Read `tmp/role-fit/evidence.txt` once, and
read `.claude/skills/role-fit-analysis/SKILL.md` with its references. Every
screen in this run follows that method.

## Step 1 — Open the queue

The queue is a private claude.ai page (an Artifact) with a small database
and file storage. Its URL comes with the Routine prompt. If it's missing,
ask Kush for it. It's deliberately not written in this public repo. First,
`Artifact` `action: "read"` on that URL, since uploads are refused for an
artifact this session hasn't read. Then read its database with
`ArtifactData` (load it with ToolSearch if needed):

| Collection | Document id | Holds |
|---|---|---|
| `postings` | the job key (`JK-…`) | one posting worth acting on: fields below, and `status` which **Kush** sets (`new` / `applied` / `passed`) |
| `seen` | ISO week, e.g. `2026-W39` | `week: "2026-W39"` plus one top-level field per screened job key: `{company, title, decision, mustCoverage, reason, applyUrl, screenedAt}` |
| `runs` | ISO timestamp of the run | `{at, screened, unscreened, packs, skipped, note}` |

`list` the `seen` collection and build the set of keys screened in the last
six weeks. That set is the run-to-run memory. Never overwrite a `postings`
document that already exists: `status` belongs to Kush.

## Step 2 — Search

Target: all of Canada, remote/on-site/hybrid, these families: data / BI
analyst, analytics / data engineer, business analyst, finance / FP&A, supply
chain / operations.

**Indeed** (`country_code: CA`). Search each of these terms with `location:
"Canada"`: data analyst · business intelligence analyst · power bi
developer · reporting analyst · analytics engineer · data engineer ·
business analyst · business systems analyst · financial analyst · FP&A
analyst · supply chain analyst · operations analyst. Then search these four
with `location: "remote"`: data analyst · business intelligence analyst ·
analytics engineer · business analyst. Indeed has no date filter and sorts
by relevance, so keep only postings dated today or yesterday.

**ZipRecruiter** (`country_admin_code: CA`, `max_posted_minutes_ago: 1440`).
Search each role with `location` "Vancouver, BC", "Toronto, ON" and "Calgary,
AB", and once more with `location: "Canada"` plus `location_types:
["REMOTE"]`. The roles are: data analyst · business intelligence · analytics
engineer · data engineer · business analyst · financial analyst · supply
chain analyst. Keep `days_ago` ≤ 1.

Drop straight away, without screening:
- the location is outside Canada and the posting isn't remote-in-Canada
  (remote with no stated country stays, with work authorization **unknown**);
- the title is outside the families (software developer, nurse, sales rep…);
- the title is Director, Head, VP, Principal, Staff, Lead, or Manager with reports;
- the same job appears twice in this run's results.

## Step 3 — Skip what earlier runs already screened

For each remaining posting:

```bash
node .claude/skills/job-scout/scripts/job-key.mjs "<company>" "<title>" "<location>"
```

If the key is in the Step 1 set, skip it. It was screened before, whether
reposted or cross-posted.

## Step 4 — Get the full posting

- Indeed: `get_job_details` with the job id from this run's search. The ids
  only live for the session.
- ZipRecruiter gives no description, and its pages may be blocked by the
  session's network policy. Try fetching the `job_redirect_url`; if that
  fails, search Indeed for the same company and title (a matching result
  gives you the full text through `get_job_details`). If neither works, the
  posting is **unscreened**: don't guess at its requirements. Give it a
  `postings/<key>` document with `decision: "unscreened"`, `pack: null`, the
  `job_redirect_url` as `applyUrl` (it opens fine in Kush's browser), and a
  one-line reason, so Kush sees it under "Worth a look".

## Step 5 — Screen

Run role-fit-analysis Steps 1–4 on each posting: requirements, evidence,
evidence fit / visible fit / must coverage, decision. Keep the table
compact, since it goes into the queue, not into chat.

A qualification written as "N years **or an equivalent combination of
education and experience**" is soft, not a hard gate. Count the MPS and
B.Eng. as the posting invites, and say so.

## Step 6 — Prepare packs for the best matches

Take the postings decided **Apply now** or **Apply after tailoring**. Order
them by posting age (newest first), then evidence fit. Prepare packs for at
most **5** per run. List any others in the digest as "ready to prepare, ask
me".

For each posting, with `<slug>` from `job-key.mjs`:

1. **Tailored résumé.** Copy `resume/resume.html` to
   `tmp/role-fit/<slug>/resume.html`. Apply the role-fit Step 5 edits there,
   at most three, and only when they close a real visible-fit gap. Then
   build:
   ```bash
   RESUME_SRC=tmp/role-fit/<slug>/resume.html \
   RESUME_OUT=tmp/role-fit/<slug>/Kush_Patel_Resume.pdf bash resume/build.sh
   "$PYTHON" .claude/skills/job-scout/scripts/ats_check.py tmp/role-fit/<slug>/Kush_Patel_Resume.pdf \
     --keywords "<the posting's exact terms for Must rows that the evidence supports>"
   ```
   Both must pass. If the build fails on page count, the edits added too
   much, so trim. If a keyword is missing, the tailoring didn't land, so fix
   the wording. Never force in a term the evidence doesn't support; drop it
   from `--keywords` and note it as a gap instead. If no edits are needed,
   build from the unchanged copy anyway. The published résumé also passes
   `ats_check.py`.
2. **Upload the PDF** to the queue's file storage: `Artifact` publish with
   `url: <queue>`, `file_path: tmp/role-fit/<slug>/Kush_Patel_Resume.pdf`,
   `asset: true`. Keep the returned `id` and `url` exactly as given.
3. **Write the pack** as the `postings/<key>` document (`set`, since it's new).
   Fields:
   - `company`, `title`, `location`, `workMode`, `salary` (as stated, else
     omit), `postedDate` (YYYY-MM-DD), `source`, `applyUrl`, `family`
   - `decision`: `apply-now-strong` | `apply-now-competitive` |
     `apply-after-tailoring` | `stretch`
   - `evidenceFit`, `visibleFit`, `mustCoverage` (numbers, 0–100),
     `reason` (one line), `screenRisk` (one line, or omit)
   - `report`: the role-fit report in Markdown (fits, hard gates,
     requirement table, real gaps with honest interview answers)
   - `screenedAt` (ISO), `status: "new"`
   - `pack`:
     - `resumeUrl`, `resumeAssetId`: from the upload.
     - `atsCheck`: the `ats_check.py` output, one line per check.
     - `edits`: the résumé edits made, in Markdown, or "No edits: the
       résumé already shows the matches".
     - `screeningAnswers` (Markdown): only facts from the evidence
       ("Legally eligible to work in Canada", total paid experience 4 yrs
       3 mos, tool years as PAID years only). For anything not in the
       evidence (salary expectation, start date, relocation timing, other
       countries' work authorization), write "Kush to answer". Never supply
       a number or a yes.
     - `coverNote` (≤ 180 words, plain text): three specific matches to the
       posting's Must rows, each with one piece of evidence. Add an
       adjacent-tool line if one is needed. Nothing that isn't in the
       evidence.
     - `outreach`: `{to, linkedinSearch, message}`.
       - `to`: a person only if the posting names one (recruiter or hiring
         manager, as written). Otherwise, "the hiring manager".
       - `linkedinSearch`: `https://www.linkedin.com/search/results/people/?keywords=<Company>%20<team or function>%20manager`
         (URL-encoded).
       - `message` (≤ 90 words, to send *after* applying): the role, one
         concrete result from the evidence that maps to their top
         requirement, the portfolio link, and a one-line ask.
       - Never guess an email address. Never look anyone up beyond the
         posting and that search link.
     - `portfolioLink`: from `node tools/make-link.mjs <company> "<title>"`
       (it logs to the gitignored `tools/links.tsv`).

Stretch postings and good matches beyond the 5-pack limit also get a
`postings/<key>` document, with `pack: null`. They appear under "Worth a
look".

## Step 7 — Record what was screened

Add **every** posting screened this run (packs, stretches, skips and
unscreened) to this week's `seen/<ISO week>` document, which has `week` plus
one top-level field per job key:
`{company, title, decision, mustCoverage, reason, applyUrl, screenedAt}`.
`get` the document first. If it doesn't exist, write it with `set`, because
`update` on a missing document fails and takes the whole batch with it. If
it exists, `update` it with `if_version` from the `get`.
This is what stops the next run from re-screening the same job, so don't
skip it. Then `set` `runs/<run timestamp>` with the counts. Use one
`ArtifactData` `batch` for the run's writes where you can.

## Step 8 — Digest (your final message)

Your final message becomes the phone push and email. Keep it scannable:

```
Job scout — <date, time> · screened N new postings (M unscreened)

READY TO APPLY (open the Job Scout Queue: <queue URL>)
1. <Company> — <Title> · <city / remote> · posted <age> · <decision> · fit NN% / must NN%
   Apply: <link> · Screen risk: <one line or "none">
…
ALSO WORTH A LOOK (stretch, or no pack yet)
- <Company> — <Title> · <why> · <link>
UNSCREENED (couldn't read the posting)
- <Company> — <Title> · <link>
Skipped: N (top reasons: …)
```

If nothing new passed screening, say exactly that in one line, e.g. "Job
scout — no new matches in the last day (screened N)". Don't pad it.

## When Kush runs it by hand

Same steps. Afterwards, offer to prepare packs for the "ready to prepare"
overflow, or to run role-fit-analysis in full on any posting in the digest.
