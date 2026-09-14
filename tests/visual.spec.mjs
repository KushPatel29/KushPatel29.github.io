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
    featured: document.querySelector("#featured")?.getBoundingClientRect(),
    cases: [...document.querySelectorAll("#featured .decision-case")].map((node) =>
      node.getBoundingClientRect(),
    ),
  }));

  expect(shell.scrollWidth, "the page must not introduce horizontal overflow").toBeLessThanOrEqual(
    shell.viewport + 1,
  );
  expect(shell.hero?.width, "hero must remain visible").toBeGreaterThan(shell.viewport * 0.8);
  expect(shell.featured?.width, "featured section must remain visible").toBeGreaterThan(
    shell.viewport * 0.8,
  );
  expect(shell.cases).toHaveLength(3);
  for (const box of shell.cases) {
    expect(box.width, "each decision case must remain visible").toBeGreaterThan(0);
    expect(box.height, "each decision case must retain a usable height").toBeGreaterThan(0);
  }

  if (projectName.includes("desktop")) {
    expect(shell.cases[0].width).toBeGreaterThan(shell.cases[1].width * 1.15);
  } else {
    expect(shell.cases[0].width).toBeGreaterThan(shell.viewport * 0.8);
  }
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

test("flagship decision index visual contract in both themes", async ({ page }, testInfo) => {
  const section = page.locator("#featured");

  if (inCi) {
    await assertResponsiveShell(page, testInfo.project.name);
    await captureCiReview(page, testInfo, "featured-dark", section);
    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await captureCiReview(page, testInfo, "featured-light", section);
    return;
  }

  await expect(section).toHaveScreenshot("featured-dark.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });

  await page.locator("#theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(section).toHaveScreenshot("featured-light.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});
