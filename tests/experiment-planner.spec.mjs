import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("experiment planner distinguishes sample size, allocation and harm without telemetry", async ({ page }) => {
  const external = [];
  page.on("request", request => { if (!request.url().startsWith("http://127.0.0.1:4173")) external.push(request.url()); });
  await page.goto("/projects/portfolio-intelligence-platform/dist/experiment.html");
  await expect(page.locator("#plan-result")).toContainText("8,158");
  expect(await page.locator("#experiment-plan").evaluate(form => form.checkValidity())).toBe(true);
  await page.getByRole("button", { name: "Recalculate" }).click();
  await expect(page.locator("#experiment-decision")).toContainText("sample is incomplete");
  await page.getByLabel("Challenge a synthetic result").selectOption("allocation");
  await expect(page.locator("#experiment-decision")).toContainText("assignment quality");
  await page.getByLabel("Challenge a synthetic result").selectOption("guardrail");
  await expect(page.locator("#experiment-decision")).toContainText("guardrail");
  await page.getByLabel("Challenge a synthetic result").selectOption("review");
  await expect(page.locator("#experiment-decision")).toContainText("Eligible for decision review");
  await page.getByLabel("Minimum effect (percentage points)").fill("0");
  await expect(page.locator("#experiment-error")).not.toBeEmpty();
  await expect(page.locator("#plan-result")).toContainText("Unavailable");
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(external).toEqual([]);
  const audit = await new AxeBuilder({ page }).analyze();
  expect(audit.violations.filter(x => ["critical", "serious"].includes(x.impact))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
