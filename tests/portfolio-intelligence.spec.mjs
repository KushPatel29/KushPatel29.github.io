import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Portfolio Intelligence exposes only fixture-backed evidence", async ({ page }) => {
  await page.goto("/projects/portfolio-intelligence-platform/dist/");
  await expect(page.getByText("SYNTHETIC CASE STUDY", { exact: true })).toBeVisible();
  await expect(page.locator("[data-metric='visitors']")).toHaveText("5");
  await expect(page.locator("[data-metric='sessions']")).toHaveText("6");
  await expect(page.locator("#fixture-meta")).toContainText("20 modeled events");
  await expect(page.getByText("REFERENCE ADAPTERS · NOT ACTIVATED", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Retention" }).click();
  await expect(page.locator("#metric-catalog")).toContainText("four-day fixture is insufficient");

  await page.getByRole("button", { name: "Enable local demo events" }).click();
  await expect(page.locator("#consent-status")).toHaveText("Local demo events enabled");

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(item => ["serious", "critical"].includes(item.impact));
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
