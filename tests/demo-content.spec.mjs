import { test, expect } from "@playwright/test";
import { MAIN_CONTENT_SELECTOR } from "../tools/wake-streamlit-demos.mjs";
import { assertTableauContent } from "../tools/check-tableau-demo.mjs";

test("Tableau health rejects a successful metadata page without the charts", async ({ page }) => {
  await page.setContent('<h1>GL Close Controls - Synthetic Data</h1><p>Published by Kush Patel</p>');
  await expect(assertTableauContent(page, 100)).rejects.toThrow();
});

test("Tableau health requires the workbook and drawn charts", async ({ page }) => {
  await page.setContent('<h1>GL close | Reconcile before signing</h1><h2 aria-label="Title: Net variance by account.">Net variance by account</h2><h2 aria-label="Title: Accounts outside 0.5% tolerance.">Accounts outside 0.5% tolerance</h2><canvas width="400" height="200"></canvas>');
  await assertTableauContent(page, 1000);
  await page.locator('canvas').evaluate(el => el.remove());
  await expect(assertTableauContent(page, 100)).rejects.toThrow();
});

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
