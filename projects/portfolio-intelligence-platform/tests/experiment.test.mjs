import assert from "node:assert/strict";
import { test } from "node:test";
import { plan, analyze, examples, normalQuantile, wilson, difference } from "../dist/experiment-model.js";

test("normal quantiles and sample planning reproduce external reference values", () => {
  assert.ok(Math.abs(normalQuantile(.975) - 1.959963984540054) < 1e-8);
  const p = plan({ baseline: .05, effect: .01 });
  assert.equal(p.perArm, 8158);
  assert.equal(p.total, 16316);
  assert.equal(p.enrollmentDays, 816);
  assert.ok(plan({ baseline: .05, effect: .005 }).perArm > p.perArm);
});
test("synthetic decisions distinguish sample, allocation and harm", () => {
  const design = { ...plan({ baseline: .05, effect: .01 }), guardrailMargin: .005 };
  assert.match(analyze(examples.incomplete, design).decision, /sample is incomplete/);
  assert.match(analyze(examples.allocation, design).decision, /assignment quality/);
  assert.match(analyze(examples.guardrail, design).decision, /guardrail/);
  assert.match(analyze(examples.review, design).decision, /Eligible for decision review/);
});
test("invalid inputs never produce a favorable decision", () => {
  for (const args of [{ baseline: 0, effect: .01 }, { baseline: .99, effect: .1 },
    { baseline: .05, effect: 0 }, { baseline: .05, effect: .01, participantsPerDay: 0 }])
    assert.throws(() => plan(args));
  assert.throws(() => difference(11, 10, 3, 10));
  assert.throws(() => wilson(0, 0));
});
test("all-zero outcomes retain uncertainty", () => {
  const estimate = difference(0, 100, 0, 100);
  assert.equal(estimate.delta, 0);
  assert.ok(estimate.lower < 0 && estimate.upper > 0);
});
