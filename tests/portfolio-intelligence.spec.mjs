import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("synthetic workbench has real filters, ordered journeys and censored cohorts", async ({
  page,
}) => {
  await page.goto(
    "/projects/portfolio-intelligence-platform/dist/case-study.html",
  );
  await expect(
    page.getByText("SYNTHETIC CASE STUDY", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-metric="sessions"]')).toHaveText("568");
  await expect(page.locator("#fixture-meta")).toContainText(
    "1,460 delivered events",
  );
  await expect(page.locator("#fixture-window")).toHaveText(
    "2026-07-26 to 2026-10-23 · UTC · synthetic",
  );
  await expect(page.locator("#fixture-chart .day")).toHaveCount(90);
  await expect(page.locator("#cohort-rows .unavailable").first()).toHaveText(
    "—",
  );
  await expect(page.locator("#quality-summary")).toContainText("31 / 31");
  await page.getByLabel("Analysis window").selectOption("30");
  await expect(page.locator("#fixture-chart .day")).toHaveCount(30);
  await expect(page.locator('[data-metric="sessions"]')).not.toHaveText("568");
  await expect(page.locator("#fixture-window")).toHaveText(
    "2026-09-24 to 2026-10-23 · UTC · synthetic",
  );
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations.filter((x) => ["serious", "critical"].includes(x.impact)),
  ).toEqual([]);
});
test("workbench handles unavailable aggregates without invented values or telemetry", async ({
  page,
}) => {
  let external = 0;
  page.on("request", (r) => {
    if (/goatcounter|google-analytics|posthog/.test(r.url())) external++;
  });
  await page.route("**/dist/data/dashboard.json", (r) =>
    r.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto(
    "/projects/portfolio-intelligence-platform/dist/case-study.html",
  );
  await expect(page.locator("#fixture-meta")).toContainText(
    "Aggregate unavailable",
  );
  await expect(page.locator('[data-metric="sessions"]')).toHaveText("—");
  await expect(
    page.getByRole("button", { name: "Export synthetic aggregates" }),
  ).toBeDisabled();
  expect(external).toBe(0);
});
test("workbench fits narrow phones while its tables remain scrollable", async ({
  page,
}) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(
      "/projects/portfolio-intelligence-platform/dist/case-study.html",
    );
    await expect(page.locator('[data-metric="sessions"]')).toHaveText("568");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
  }
});
