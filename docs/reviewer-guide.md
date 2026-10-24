# A short guide to checking the portfolio

[Portfolio and role views](https://kushpatel29.github.io/#fit) · [Three captioned tours](https://kushpatel29.github.io/#featured)

Start with the question and result, then follow one calculation to its source and independent check. These are public portfolio artifacts built with AI coding assistance. Paid work is described separately in the résumé. GrowthOps and the control tower use synthetic businesses; the B.C. case uses official public files. Reproducing a calculation does not establish adoption or client impact.

For performance, recovery, experiment and decision controls, use the
[development evidence map](development-proof.md). It links runnable additions
to the existing projects and names the human or platform evidence still pending.

## GrowthOps: which revenue number is right?

Ad platforms claim $3.72M while the synthetic business collects $3.06M. The useful result is the explanation of that difference, not a claim that a dashboard created revenue.

1. Read the [case study](https://github.com/KushPatel29/GrowthOps-OS/blob/main/docs/case-study.md) and inspect the [metric catalog](https://github.com/KushPatel29/GrowthOps-OS/blob/main/docs/metric-catalog.md). Distinguish platform claims, CRM bookings and collected cash.
2. Follow the [reconciliation implementation](https://github.com/KushPatel29/GrowthOps-OS/blob/main/growthops/reconciliation.py) and [tests](https://github.com/KushPatel29/GrowthOps-OS/blob/main/tests/test_reconciliation.py). Check how the bridge treats differences and what must sum to zero.
3. Compare the [Power BI handoff](https://github.com/KushPatel29/GrowthOps-OS/blob/main/docs/power-bi-handoff.md) with the downloadable Excel workbook linked there. The consumers independently agree to the cent.

**Challenge to discuss:** Would the answer change if a refund landed after the reporting window? Establish date basis, grain and gross/net treatment before comparing totals. Attribution does not establish incremental revenue.

In a disposable checkout, after installing the dependencies documented in that repository:

```bash
python -m pytest tests/test_reconciliation.py
```

## Control tower: what should change to improve service?

The synthetic network misses its OTIF target. The analysis separates short-shipping from lateness and checks stock location before recommending a purchase.

1. Read the [operating process case](https://github.com/KushPatel29/supply-chain-control-tower/blob/master/docs/business_process_improvement_case.md). Inspect the [DAX definitions](https://github.com/KushPatel29/supply-chain-control-tower/blob/master/powerbi/dax_measures.dax) and the [Gold transformation](https://github.com/KushPatel29/supply-chain-control-tower/blob/master/notebooks/03_gold_curate.py).
2. Inspect [contract tests](https://github.com/KushPatel29/supply-chain-control-tower/blob/master/tests/test_data_contract.py), [quarantine tests](https://github.com/KushPatel29/supply-chain-control-tower/blob/master/tests/test_quarantine.py) and [publish-gate tests](https://github.com/KushPatel29/supply-chain-control-tower/blob/master/tests/test_pipeline_gate.py). A bad source should not quietly become a trusted report.
3. Inspect the dated [Databricks reconciliation](https://github.com/KushPatel29/supply-chain-control-tower/blob/master/docs/databricks/reconciliation.csv). All 36 recorded Gold comparisons match; this receipt is a project run, not continuous enterprise operation.

**Challenge to discuss:** When should a malformed delivery stop the pipeline, and when should one row be quarantined? Explain replay, duplicate handling and how the publish gate prevents partial or misleading outputs.

In a disposable local checkout after the repository's data-generation setup:

```bash
python pipeline/run_pipeline.py
python pipeline/run_pipeline.py --inject-dq-failure
```

The second command is deliberately expected to fail with exit code 2 and refuse publication. It is a local failure demonstration, not a command to run against a live account.

## B.C. finance: what would closing the renewal gap cost?

The analysis estimates a combined $570M annual shortfall across 68 municipalities investing below modelled renewal need. Its usefulness depends on the assumptions and source quality, not just the headline.

1. Read the [method and findings](https://github.com/KushPatel29/bc-local-government-finance#what-it-found), then inspect the downloadable workbook and board pack. Renewal need is re-derived with an explicit plausibility screen; it is not treated as an unquestionable published value.
2. Inspect the [source manifest](https://github.com/KushPatel29/bc-local-government-finance/blob/main/data/sources.json), [independent Gold checks](https://github.com/KushPatel29/bc-local-government-finance/blob/main/tests/test_gold.py) and [reproducibility check](https://github.com/KushPatel29/bc-local-government-finance/blob/main/tests/test_gold_reproducible.py).
3. Change a planning input in a copy of the Excel workbook. Check the tax/borrowing consequence and the control sheet before accepting a recommendation.

**Challenge to discuss:** Why can provincial averages hide individual shortfalls? Which municipalities are excluded from an indicator, why, and how would a different replacement-value screen affect the conclusion?

## Give useful feedback

An independent review is welcome; no external endorsement or adoption is implied by this guide. Identify the question, artifact/version and check you performed, then describe one issue or decision the evidence changed. State whether feedback may be quoted publicly. An unresolved review or approval remains unresolved.

For web analytics, the [public case study](https://kushpatel29.github.io/projects/portfolio-intelligence-platform/dist/case-study.html) is available without authentication. The separately labelled owner dashboard contains private real traffic and requires the owner's key.
