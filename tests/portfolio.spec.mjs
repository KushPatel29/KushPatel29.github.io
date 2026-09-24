import { expect, test } from "@playwright/test";

const ROLES = [
  "data-analyst",
  "bi-developer",
  "analytics-engineer",
  "data-engineer",
  "business-analyst",
  "financial-analyst",
  "supply-chain-analyst",
  "data-scientist",
];

test("the first screen routes a hiring manager to their role", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toBeVisible();
  const primary = page.locator(".hero .btn-primary");
  await expect(primary).toHaveAttribute("href", "#fit");

  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(ROLES.length);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".fit-panel:not([hidden])")).toHaveCount(1);
  await expect(page.locator("#fit-data-analyst")).toBeVisible();
});

test("choosing a role shows only that evidence and makes the view shareable", async ({ page }) => {
  await page.goto("/");
  const tab = page.getByRole("tab", { name: /Data Engineer/ });
  await tab.click();

  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/\?role=data-engineer#fit$/);
  await expect(page.locator("#fit-data-engineer")).toBeVisible();
  await expect(page.locator(".fit-panel:not([hidden])")).toHaveCount(1);

  // Arrow keys move between roles, the way a tab list should.
  await tab.focus();
  await page.keyboard.press("ArrowRight");
  const next = page.getByRole("tab", { name: /Business Analyst/ });
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#fit-business-analyst")).toBeVisible();
});

test("an application link opens straight on its role", async ({ page }) => {
  await page.goto("/?utm_source=application&role=financial-analyst#fit");
  await expect(page.getByRole("tab", { name: /Financial Analyst/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#fit-financial-analyst")).toBeVisible();
  await expect(page.locator("#fit-data-analyst")).toBeHidden();

  await page.goto("/#fit-data-scientist");
  await expect(page.locator("#fit-data-scientist")).toBeVisible();
});

test("every role's reading list points at a project on this page", async ({ page }) => {
  await page.goto("/");
  const targets = await page.locator(".fit-start a").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  );
  expect(targets.length).toBe(ROLES.length * 3);
  for (const href of targets) {
    expect(href.startsWith("#")).toBe(true);
    await expect(page.locator(href)).toHaveCount(1);
  }

  // Following one lands on the card with its section open, even from a
  // collapsed "more projects" disclosure.
  await page.getByRole("tab", { name: /Analytics Engineer/ }).click();
  await page.locator("#fit-analytics-engineer .fit-start a").first().click();
  await expect(page.locator("#p-dbt")).toBeVisible();
});

test("without JavaScript every role is still readable", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  for (const role of ROLES) {
    await expect(page.locator(`#fit-${role}`)).toBeVisible();
  }
  await expect(page.locator(".fit-tabs a")).toHaveCount(ROLES.length);
  await context.close();
});

test("project filters remain shareable and only reveal matching work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "AI & ML" }).click();

  await expect(page).toHaveURL(/\?filter=ai#work$/);
  await expect(page.getByRole("button", { name: "AI & ML" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#work-count")).toContainText(/SHOWING [1-9]\d* \/ 17 REPOS/);

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
