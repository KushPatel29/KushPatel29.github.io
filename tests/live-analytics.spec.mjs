import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
const route = "/projects/portfolio-intelligence-platform/dist/";
const fakeKey = "test-only-read-key";
async function mockAnalytics(page) {
  await page.route(
    "https://kushpatel.goatcounter.com/api/v0/stats/**",
    async (request) => {
      const req = request.request();
      if (req.method() === "OPTIONS")
        return request.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "authorization,content-type",
          },
        });
      expect(req.headers().authorization).toBe("Bearer " + fakeKey);
      expect(req.url()).not.toContain(fakeKey);
      const path = new URL(req.url()).pathname;
      let data;
      if (path.endsWith("/hits"))
        data = {
          hits: [
            { path: "/", path_id: 1, title: "Portfolio", count: 8 },
            {
              path: "pi-time-15s:p-growthops",
              path_id: 2,
              event: true,
              count: 4,
            },
            {
              path: "pi-project-click:p-growthops",
              path_id: 3,
              event: true,
              count: 2,
            },
            { path: "pi-action:resume", path_id: 4, event: true, count: 1 },
            {
              path: "qa:pi-time-15s:intro",
              path_id: 5,
              event: true,
              count: 900,
            },
          ],
          more: false,
        };
      else if (path.endsWith("/total")) {
        expect(new URL(req.url()).searchParams.get("include_paths")).toBe("/");
        data = {
          total: 8,
          total_events: 0,
          stats: [{ day: "2026-10-24", daily: 8 }],
        };
      } else
        data = {
          stats: [
            { name: "Canada", count: 5 },
            { name: "India", count: 3 },
          ],
          more: false,
        };
      await request.fulfill({
        json: data,
        headers: { "access-control-allow-origin": "*" },
      });
    },
  );
}
async function connect(page, remember = false) {
  await page.getByLabel("Read-only API key", { exact: true }).fill(fakeKey);
  if (remember)
    await page.getByLabel("Remember this connection on this browser").check();
  await page
    .getByRole("button", { name: "Connect live analytics", exact: true })
    .click();
  await expect(page.locator("#live-status")).toContainText(
    "Connected · real traffic",
  );
}
test("owner view has no fake live data and publishes no analytics request before connection", async ({
  page,
}) => {
  let reads = 0;
  page.on("request", (req) => {
    if (req.url().includes("/api/v0/")) reads++;
  });
  await page.goto(route);
  await expect(page.locator("#visits")).toHaveText("—");
  await expect(
    page.getByText("PRIVATE OWNER VIEW · REAL TRAFFIC", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "dbt case study ↗", exact: true }),
  ).toBeVisible();
  expect(reads).toBe(0);
});
test("real API binding separates visits, attention, QA events and private locations", async ({
  page,
}) => {
  await mockAnalytics(page);
  await page.goto(route);
  await connect(page);
  await expect(page.locator("#visits")).toHaveText("8");
  await expect(page.locator("#attention-total")).toHaveText("1m 0s");
  await expect(page.locator("#most-read")).toHaveText("GrowthOps OS");
  await expect(page.locator("#country-rows")).toContainText("Canada5");
  await expect(page.locator("#resume-actions")).toHaveText("1");
  expect(
    await page.evaluate(() => localStorage.getItem("portfolio_owner_read_key")),
  ).toBeNull();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter((x) => ["serious", "critical"].includes(x.impact)),
  ).toEqual([]);
});
test("remember is opt-in and Disconnect removes the saved connection", async ({
  page,
}) => {
  await mockAnalytics(page);
  await page.goto(route);
  await connect(page, true);
  await page.reload();
  await expect(page.locator("#visits")).toHaveText("8");
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(page.locator("#connection-form")).toBeVisible();
  await expect(page.locator("#visits")).toHaveText("—");
  expect(
    await page.evaluate(() => localStorage.getItem("portfolio_owner_read_key")),
  ).toBeNull();
});
test("failed refresh labels old values and invalid access never loads a fixture", async ({
  page,
}) => {
  await mockAnalytics(page);
  await page.goto(route);
  await connect(page);
  await page.unrouteAll();
  await page.route("https://kushpatel.goatcounter.com/api/v0/stats/**", (r) =>
    r.fulfill({ status: 401, headers: { "access-control-allow-origin": "*" } }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator("#live-status")).toContainText(
    "Last successful values remain visible",
  );
  await expect(page.locator("#visits")).toHaveText("8");
  await page.getByLabel("Period", { exact: true }).selectOption("7");
  await expect(page.locator("#live-status")).toContainText(
    "No live values are being shown",
  );
  await expect(page.locator("#visits")).toHaveText("—");
});
test("private analytics fits narrow phones", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(route);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

test("comparisons are explicit and exports contain aggregates rather than credentials", async ({
  page,
}) => {
  await mockAnalytics(page);
  await page.goto(route);
  await connect(page);
  await page.getByLabel("Compare complete UTC days").check();
  await expect(page.locator("#comparison-result")).toContainText(
    "8 visits versus 8",
  );
  await expect(page.locator("#comparison-window")).toContainText(
    "exclude today",
  );
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export daily CSV", exact: true })
    .click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("portfolio-daily-visits.csv");
  const csv = fs.readFileSync(await download.path(), "utf8");
  expect(csv).toContain("day_account_timezone");
  expect(csv).toContain("retrieved");
  expect(csv).not.toContain(fakeKey);
  const jsonPending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export summary", exact: true })
    .click();
  const summary = fs.readFileSync(await (await jsonPending).path(), "utf8");
  expect(JSON.parse(summary).visits).toBe(8);
  expect(JSON.parse(summary).state).toBe("retrieved");
  expect(summary).not.toContain(fakeKey);
});
