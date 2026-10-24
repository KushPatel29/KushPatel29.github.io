# Experiment design, quality and interpretation

[Open the interactive planner](../dist/experiment.html).

The hypothesis is that a clearer project-evidence route increases a predeclared
binary intent outcome without unacceptable navigation errors. This is a planning
example only. No real visitor is assigned, no experiment event is emitted and no
identifier is stored. The public synthetic warehouse and private GoatCounter
aggregates remain separate and unchanged.

## A protocol before a result

- Define an independent user as the randomization/analysis unit, one eligible
  exposure and one binary outcome per user. Repeated sessions must not inflate n.
- Predeclare eligibility, the exposure/event schema, bot/internal/consent rules,
  primary outcome, outcome maturation window and one fixed analysis horizon.
- Use 50/50 allocation, two-sided alpha .05, power .80 and an absolute minimum
  effect. The planner uses the normal approximation for two independent rates.
- Freeze the horizon and exclusions. Peeking, adaptive stopping, multiple primary
  outcomes, clustering or unequal allocation require a different analysis plan.
- Monitor assignment quality before interpreting outcomes. The example uses a
  chi-square sample-ratio check at .001; adequate expected counts are required.
- The example error-rate guardrail has a predeclared .005 absolute harm margin.
  Its upper two-sided 95% Newcombe interval must stay below that margin. A primary
  signal alone does not establish an acceptable release.

The browser shows four wholly synthetic cases: insufficient sample, allocation
mismatch, primary improvement with guardrail harm, and eligibility for decision
review after the stated checks. The last is not an automatic shipping approval.
Wilson/Newcombe difference intervals retain uncertainty even when both groups
have zero observed outcomes. Lower/upper bounds are in absolute rate units.

The existing event contract/deduplication gates continue to check instrumentation
shape and eligibility. They do not prove that real randomization, complete
exposure capture, user independence or outcome maturation occurred. GoatCounter
visits cannot establish those properties or be substituted for unique randomized
users. Real A/B instrumentation is therefore unactivated; no causal live lift is
claimed. For limited traffic, a consented usability study may be more useful.

## Reproduce the numerical checks

```bash
node --test tests/experiment.test.mjs
python scripts/verify_experiments.py
```

The [verification receipt](experiment-verification.json) records comparisons
against independent SciPy and statsmodels implementations for quantiles, sample
sizes, allocation checks and eight confidence intervals.

Method references: [statsmodels Newcombe comparison](https://www.statsmodels.org/stable/generated/statsmodels.stats.proportion.confint_proportions_2indep.html),
[SciPy chi-square distribution](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.chi2.html).

## UI integration

The planner preserves the existing Space typeface, left-aligned reading order,
ink `#0b1c2c`, muted `#526475`, teal `#08695e`, paper `#f3f6f5` and line `#d3dfdf`.
The sequence is question → assumptions → required sample → challenged decision.
Native labelled controls, visible errors and status outputs remain usable by
keyboard and on narrow screens. No live-dashboard control or default changes.
