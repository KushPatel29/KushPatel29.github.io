"""Cross-check the browser statistics against SciPy and statsmodels."""

import json
import math
import subprocess
from pathlib import Path

from scipy.stats import chi2, norm
from statsmodels.stats.proportion import confint_proportions_2indep

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = """
import {plan,analyze,examples,normalQuantile} from './dist/experiment-model.js';
const plans=[{baseline:.05,effect:.01},{baseline:.2,effect:.02},{baseline:.05,effect:.005}];
const design={...plan(plans[0]),guardrailMargin:.005};
console.log(JSON.stringify({plans:plans.map(x=>({...x,...plan(x)})),
 quantiles:[.001,.025,.5,.975,.999].map(p=>[p,normalQuantile(p)]),
 examples:Object.fromEntries(Object.entries(examples).map(([k,v])=>[k,{input:v,result:analyze(v,design)}]))}));
"""


def verify():
    output = subprocess.run(["node", "--input-type=module", "-e", PROGRAM], cwd=ROOT,
                            text=True, capture_output=True, check=True, timeout=30)
    actual = json.loads(output.stdout)
    for p, value in actual["quantiles"]:
        assert abs(value - norm.ppf(p)) < 1e-7
    for result in actual["plans"]:
        p0, p1 = result["baseline"], result["baseline"] + result["effect"]
        pooled = (p0 + p1) / 2
        a = norm.ppf(.975) * math.sqrt(2 * pooled * (1 - pooled))
        b = norm.ppf(.8) * math.sqrt(p0 * (1 - p0) + p1 * (1 - p1))
        assert result["perArm"] == math.ceil((a + b) ** 2 / result["effect"] ** 2)
    for example in actual["examples"].values():
        values, result = example["input"], example["result"]
        expected = (values["controlN"] + values["testN"]) / 2
        statistic = sum((values[key] - expected) ** 2 / expected for key in ("controlN", "testN"))
        assert abs(result["allocation"]["p"] - chi2.sf(statistic, 1)) < 1e-6
        for metric, c, t in (("primary", "controlConversions", "testConversions"),
                             ("guardrail", "controlErrors", "testErrors")):
            lower, upper = confint_proportions_2indep(
                values[t], values["testN"], values[c], values["controlN"],
                method="newcomb", alpha=.05,
            )
            assert abs(result[metric]["lower"] - lower) < 1e-8
            assert abs(result[metric]["upper"] - upper) < 1e-8
    return {"schema_version": 1, "classification": "synthetic_statistical_verification",
            "references": "SciPy normal quantiles/chi-square survival and statsmodels Newcombe intervals",
            "planning_cases_verified": 3, "quantiles_verified": 5, "synthetic_decision_cases_verified": 4,
            "intervals_verified": 8, "all_checks_passed": True,
            "boundary": "Numerical verification is not evidence that a real randomized experiment occurred."}


if __name__ == "__main__":
    result = verify()
    (ROOT / "docs/experiment-verification.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
