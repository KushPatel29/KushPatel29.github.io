import { plan, analyze, examples } from "./experiment-model.js?v=a15bf4af73ad";
const form = document.querySelector("#experiment-plan");
function update() {
  try {
    const design = plan({ baseline: Number(form.elements.baseline.value) / 100,
      effect: Number(form.elements.effect.value) / 100,
      participantsPerDay: Number(form.elements.daily.value) });
    design.guardrailMargin = .005;
    document.querySelector("#plan-result").textContent =
      `${design.perArm.toLocaleString()} independent participants per arm; ${design.total.toLocaleString()} total. About ${design.enrollmentDays.toLocaleString()} enrollment days at this traffic assumption, plus outcome maturation.`;
    const result = analyze(examples[form.elements.scenario.value], design);
    document.querySelector("#experiment-decision").textContent = result.decision;
    document.querySelector("#experiment-primary").textContent =
      `Primary change: ${(result.primary.delta * 100).toFixed(2)} percentage points; 95% interval ${(result.primary.lower * 100).toFixed(2)} to ${(result.primary.upper * 100).toFixed(2)}.`;
    document.querySelector("#experiment-quality").textContent =
      `Allocation p-value: ${result.allocation.p.toPrecision(3)}. Error-rate change upper 95% bound: ${(result.guardrail.upper * 100).toFixed(2)} percentage points; allowed margin: 0.50.`;
    document.querySelector("#experiment-error").textContent = "";
  } catch (error) {
    document.querySelector("#experiment-error").textContent = error.message;
    for (const selector of ["#plan-result", "#experiment-decision", "#experiment-primary", "#experiment-quality"])
      document.querySelector(selector).textContent = "Unavailable until inputs are valid.";
  }
}
form.addEventListener("input", update);
form.addEventListener("change", update);
form.addEventListener("submit", (event) => { event.preventDefault(); update(); });
update();
