// Fixed-horizon, two-arm planning and synthetic aggregate interpretation.
// No collection, storage, random assignment or network access occurs here.
function probability(value, name, open = false) {
  if (!Number.isFinite(value) || value < 0 || value > 1 || (open && (value === 0 || value === 1)))
    throw new Error(`${name} must be ${open ? "between 0 and 1, exclusive" : "between 0 and 1"}.`);
}
function count(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${name} must be a nonnegative integer.`);
}
// Acklam's inverse standard normal approximation.
export function normalQuantile(p) {
  probability(p, "Quantile", true);
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-.00778489400243029, -.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [.00778469570904146, .32246712907004, 2.445134137143, 3.75440866190742];
  const poly = (v, q) => v.reduce((s, x) => s * q + x, 0);
  if (p < .02425) { const q = Math.sqrt(-2 * Math.log(p)); return poly(c, q) / (poly(d, q) * q + 1); }
  if (p > .97575) return -normalQuantile(1 - p);
  const q = p - .5, r = q * q;
  return poly(a, r) * q / (poly(b, r) * r + 1);
}
function normalCdf(z) {
  const x = Math.abs(z), t = 1 / (1 + .2316419 * x);
  const tail = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) * t *
    (.319381530 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - tail : tail;
}
export function plan({ baseline, effect, alpha = .05, power = .8, participantsPerDay = 20 }) {
  probability(baseline, "Baseline", true); probability(alpha, "Alpha", true); probability(power, "Power", true);
  probability(baseline + effect, "Treatment rate", true);
  if (!Number.isFinite(effect) || effect <= 0 || power <= .5 || alpha >= .5)
    throw new Error("Use a positive absolute effect, power above 50% and alpha below 50%.");
  if (!Number.isFinite(participantsPerDay) || participantsPerDay <= 0)
    throw new Error("Daily independent participants must be positive.");
  const treatment = baseline + effect, pooled = (baseline + treatment) / 2;
  const a = normalQuantile(1 - alpha / 2) * Math.sqrt(2 * pooled * (1 - pooled));
  const b = normalQuantile(power) * Math.sqrt(baseline * (1 - baseline) + treatment * (1 - treatment));
  const perArm = Math.ceil((a + b) ** 2 / effect ** 2);
  if (!Number.isSafeInteger(perArm)) throw new Error("Effect is too small for a bounded sample-size calculation.");
  return { perArm, total: 2 * perArm, enrollmentDays: Math.ceil(2 * perArm / participantsPerDay),
    baseline, effect, alpha, power, method: "Normal approximation; equal allocation; two-sided fixed-horizon test" };
}
export function wilson(successes, n, alpha = .05) {
  count(successes, "Successes"); count(n, "Participants"); probability(alpha, "Alpha", true);
  if (n === 0 || successes > n) throw new Error("Successes must not exceed a positive participant count.");
  const p = successes / n, z = normalQuantile(1 - alpha / 2), d = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / d;
  const radius = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [Math.max(0, center - radius), Math.min(1, center + radius)];
}
export function difference(controlSuccesses, controlN, testSuccesses, testN, alpha = .05) {
  const [lc, uc] = wilson(controlSuccesses, controlN, alpha), [lt, ut] = wilson(testSuccesses, testN, alpha);
  const pc = controlSuccesses / controlN, pt = testSuccesses / testN, delta = pt - pc;
  return { delta, lower: Math.max(-1, delta - Math.hypot(pt - lt, uc - pc)),
    upper: Math.min(1, delta + Math.hypot(ut - pt, pc - lc)) };
}
export function allocationCheck(controlN, testN) {
  count(controlN, "Control participants"); count(testN, "Treatment participants");
  const expected = (controlN + testN) / 2;
  if (expected < 5) return { valid: false, p: null, reason: "Too few assignments for the chi-square approximation" };
  const chiSquare = (controlN - expected) ** 2 / expected + (testN - expected) ** 2 / expected;
  return { valid: true, chiSquare, p: Math.max(0, Math.min(1, 2 * (1 - normalCdf(Math.sqrt(chiSquare))))) };
}
export function analyze(data, design) {
  probability(design.guardrailMargin, "Guardrail margin");
  probability(design.effect, "Planned effect", true);
  probability(design.alpha, "Alpha", true);
  count(design.perArm, "Planned participants per arm");
  if (design.perArm < 1) throw new Error("A positive planned sample is required.");
  const allocation = allocationCheck(data.controlN, data.testN);
  const primary = difference(data.controlConversions, data.controlN, data.testConversions, data.testN, design.alpha);
  const guardrail = difference(data.controlErrors, data.controlN, data.testErrors, data.testN, design.alpha);
  const sampleComplete = data.controlN >= design.perArm && data.testN >= design.perArm;
  let decision;
  if (!allocation.valid || allocation.p < .001) decision = "Stop: assignment quality requires investigation";
  else if (!sampleComplete) decision = "Hold: planned sample is incomplete";
  else if (guardrail.upper >= design.guardrailMargin) decision = "Hold: guardrail safety is not established";
  else if (primary.lower <= 0 || primary.delta < design.effect) decision = "Hold: practical improvement is not established";
  else decision = "Eligible for decision review in this synthetic example";
  return { allocation, primary, guardrail, sampleComplete, decision };
}
export const examples = {
  incomplete: { controlN: 200, testN: 200, controlConversions: 10, testConversions: 14, controlErrors: 0, testErrors: 0 },
  allocation: { controlN: 8000, testN: 12000, controlConversions: 400, testConversions: 780, controlErrors: 8, testErrors: 12 },
  guardrail: { controlN: 10000, testN: 10000, controlConversions: 500, testConversions: 650, controlErrors: 100, testErrors: 300 },
  review: { controlN: 10000, testN: 10000, controlConversions: 500, testConversions: 650, controlErrors: 10, testErrors: 12 },
};
