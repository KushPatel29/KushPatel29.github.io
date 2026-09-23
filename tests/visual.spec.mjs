import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const inCi = Boolean(process.env.CI);

async function captureCiReview(page, testInfo, name, locator) {
  const outputDir = path.join("artifacts", "visual-review", testInfo.project.name);
  await mkdir(outputDir, { recursive: true });
  await locator.screenshot({
    path: path.join(outputDir, `${name}.png`),
    animations: "disabled",
  });
}

async function assertResponsiveShell(page, projectName) {
  const shell = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hero: document.querySelector(".hero")?.getBoundingClientRect(),
    fit: document.querySelector("#fit")?.getBoundingClientRect(),
    tabs: [...document.querySelectorAll("#fit .fit-tab")].map((node) => node.getBoundingClientRect()),
    panels: [...document.querySelectorAll("#fit .fit-panel")]
      .filter((node) => !node.hidden)
      .map((node) => node.getBoundingClientRect()),
  }));

  expect(shell.scrollWidth, "the page must not introduce horizontal overflow").toBeLessThanOrEqual(
    shell.viewport + 1,
  );
  expect(shell.hero?.width, "hero must remain visible").toBeGreaterThan(shell.viewport * 0.8);
  expect(shell.fit?.width, "role fit must remain visible").toBeGreaterThan(shell.viewport * 0.8);
  expect(shell.tabs).toHaveLength(8);
  for (const box of shell.tabs) {
    expect(box.width, "each role tab must remain visible").toBeGreaterThan(0);
    expect(box.height, "each role tab must keep a usable target").toBeGreaterThanOrEqual(44);
  }
  expect(shell.panels, "exactly one role panel shows at a time").toHaveLength(1);
  expect(shell.panels[0].height).toBeGreaterThan(0);

  // Four tabs to a row on a desktop, two on a phone.
  const firstRow = shell.tabs.filter((box) => Math.abs(box.top - shell.tabs[0].top) < 2).length;
  expect(firstRow).toBe(projectName.includes("desktop") ? 4 : 2);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

test("hero visual contract", async ({ page }, testInfo) => {
  if (inCi) {
    await assertResponsiveShell(page, testInfo.project.name);
    await captureCiReview(page, testInfo, "hero-dark", page.locator(".hero"));
    return;
  }

  await expect(page.locator(".hero")).toHaveScreenshot("hero-dark.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});

test("role fit visual contract in both themes", async ({ page }, testInfo) => {
  const section = page.locator("#fit");

  if (inCi) {
    await assertResponsiveShell(page, testInfo.project.name);
    await captureCiReview(page, testInfo, "fit-dark", section);
    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await captureCiReview(page, testInfo, "fit-light", section);
    return;
  }

  await assertResponsiveShell(page, testInfo.project.name);
  await expect(section).toHaveScreenshot("fit-dark.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });

  await page.locator("#theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(section).toHaveScreenshot("fit-light.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});
