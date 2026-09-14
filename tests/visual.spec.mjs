import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

test("hero visual contract", async ({ page }) => {
  await expect(page.locator(".hero")).toHaveScreenshot("hero-dark.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});

test("flagship decision index visual contract in both themes", async ({ page }) => {
  const section = page.locator("#featured");
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
