import { test, expect } from "@playwright/test";
import { MAIN_CONTENT_SELECTOR } from "../tools/wake-streamlit-demos.mjs";

test("demo health accepts rendered main content in both Streamlit layouts", async ({ page }) => {
  for (const main of ["stMainBlockContainer", "stMain"]) {
    await page.setContent(`<section data-testid="${main}"><div data-testid="stElementContainer"><h1>Decision room</h1></div></section>`);
    await expect(page.locator(MAIN_CONTENT_SELECTOR).first()).toBeVisible();
  }
});

test("demo health rejects a shell or sidebar without a rendered main page", async ({ page }) => {
  await page.setContent('<div data-testid="stApp"><aside data-testid="stSidebar"><div data-testid="stElementContainer">Navigation</div></aside><section data-testid="stMain"></section></div>');
  await expect(page.locator(MAIN_CONTENT_SELECTOR)).toHaveCount(0);
});

test("demo health skips invisible style containers before visible main content", async ({ page }) => {
  await page.setContent(`<section data-testid="stMain">
    <div data-testid="stElementContainer" style="display:none"><style>.app { color: navy; }</style></div>
    <div data-testid="stElementContainer"><style>.app { background: white; }</style></div>
    <div data-testid="stElementContainer"><h1>Decision room</h1><p>Verified operating evidence</p></div>
  </section>`);
  await expect(page.locator(MAIN_CONTENT_SELECTOR).first()).toBeVisible();
  await expect(page.locator(MAIN_CONTENT_SELECTOR).first()).toContainText("Decision room");
  await page.setContent('<section data-testid="stMain"><div data-testid="stElementContainer"><style>.app { color: navy; }</style></div></section>');
  await expect(page.locator(MAIN_CONTENT_SELECTOR)).toHaveCount(0);
});
