import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function seriousViolations(page) {
  const result = await new AxeBuilder({ page }).analyze();
  return result.violations
    .filter((violation) => ["critical", "serious"].includes(violation.impact))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.flatMap((node) => node.target),
    }));
}

test("the complete portfolio has no serious accessibility violations in either theme", async ({ page }) => {
  await page.goto("/");
  await expect(seriousViolations(page), "dark theme accessibility violations").resolves.toEqual([]);

  if (await page.locator("html").getAttribute("data-theme") !== "light") {
    await page.locator("#theme-toggle").click();
  }
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(seriousViolations(page), "light theme accessibility violations").resolves.toEqual([]);
});
