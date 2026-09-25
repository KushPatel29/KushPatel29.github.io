import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Portfolio Intelligence exposes only fixture-backed evidence", async ({ page }) => {
  await page.goto("/projects/portfolio-intelligence-platform/dist/");
  await expect(page.getByText("SYNTHETIC CASE STUDY", { exact: true })).toBeVisible();
  await expect(page.locator("[data-metric='visitors']")).toHaveText("5");
  await expect(page.locator("[data-metric='sessions']")).toHaveText("6");
  await expect(page.locator("#fixture-meta")).toContainText("20 modeled events");
  await expect(page.getByText("REFERENCE ADAPTERS · NOT ACTIVATED", { exact: true })).toBeVisible();

  // One fixture window, stated plainly, and trends drawn from its daily rows.
  await expect(page.locator("#fixture-window")).toHaveText("Fixture window · 4 days · 2026-09-20 to 2026-09-23");
  await expect(page.locator("[data-range]")).toHaveCount(0);
  await expect(page.locator("[data-spark='visitors'] circle")).toHaveCount(4);
  await expect(page.locator("[data-spark='visitors']")).toHaveAttribute("aria-label", /09-22: 0, 09-23: 1$/);
  await expect(page.locator("[data-spark='conversion']")).toHaveAttribute("aria-label", /09-22: no sessions/);

  await page.getByRole("tab", { name: "Retention" }).click();
  await expect(page.locator("#metric-catalog")).toContainText("four-day fixture is insufficient");

  await page.getByRole("button", { name: "Enable local demo events" }).click();
  await expect(page.locator("#consent-status")).toHaveText("Local demo events enabled");

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(item => ["serious", "critical"].includes(item.impact));
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("Portfolio Intelligence fits a phone screen without sideways scrolling", async ({ page }) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/projects/portfolio-intelligence-platform/dist/");
    await expect(page.locator("[data-metric='visitors']")).toHaveText("5");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `page is ${overflow}px wider than a ${width}px screen`).toBeLessThanOrEqual(0);
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  }
});
