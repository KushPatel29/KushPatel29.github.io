import { expect, test } from "@playwright/test";

test("the first screen leads to three inspectable flagship decisions", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toContainText("governed decision systems");
  await expect(page.locator("#featured .decision-case")).toHaveCount(3);
  await expect(page.getByRole("link", { name: /open live board/i })).toHaveAttribute(
    "href",
    "https://kush-asset-management-decision-board.streamlit.app/",
  );
  await expect(page.getByRole("link", { name: /try inventory analytics/i })).toHaveAttribute(
    "href",
    "https://inventory-analytics-app.onrender.com/",
  );
  await expect(page.getByRole("link", { name: /try decision assurance/i })).toHaveAttribute(
    "href",
    "https://kush-network-risk-decision-room.streamlit.app/",
  );
});

test("project filters remain shareable and only reveal matching work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "AI & ML" }).click();

  await expect(page).toHaveURL(/\?filter=ai#work$/);
  await expect(page.getByRole("button", { name: "AI & ML" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#work-count")).toContainText(/SHOWING [1-9]\d* \/ 15 REPOS/);

  const tags = await page.locator(".project:not(.is-filtered-out)").evaluateAll((cards) =>
    cards.map((card) => card.getAttribute("data-tags") || ""),
  );
  expect(tags.length).toBeGreaterThan(0);
  expect(tags.every((value) => value.split(/\s+/).includes("ai"))).toBe(true);
});

test("theme choice persists across a reload", async ({ page }) => {
  await page.goto("/");
  const before = await page.locator("html").getAttribute("data-theme");
  await page.locator("#theme-toggle").click();
  const after = before === "light" ? "dark" : "light";
  await expect(page.locator("html")).toHaveAttribute("data-theme", after);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", after);
});

test("the dashboard lightbox closes and returns keyboard focus", async ({ page }) => {
  await page.goto("/");
  const trigger = page.locator(".card-zoom").first();
  await trigger.click();
  await expect(page.locator("#lightbox")).toHaveAttribute("open", "");
  await page.locator("#lightbox-close").click();
  await expect(page.locator("#lightbox")).not.toHaveAttribute("open", "");
  await expect(trigger).toBeFocused();
});

test("the compact menu is a keyboard-operable disclosure", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile navigation contract");
  await page.goto("/");
  const menu = page.locator("#nav-menu");
  await menu.locator("summary").click();
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(menu.locator("summary")).toBeFocused();
});

test("every resume action points at the downloadable PDF", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('a[href="assets/Kush-Patel-Resume.pdf"]');
  await expect(links).toHaveCount(5);
  for (let index = 0; index < await links.count(); index += 1) {
    await expect(links.nth(index)).toHaveAttribute("download", "");
  }
});
