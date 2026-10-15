/* ============================================================
   render-og-banner.mjs — renders tools/og-banner.html to
   assets/og-banner.png (1200x630), the image link previews show.
   The counts in the source are held to the manifest by
   check-headline-counts.mjs, so re-run this whenever they change.

   Uses the Playwright already installed for the browser tests.
   PLAYWRIGHT_EXECUTABLE_PATH picks a local Chromium if needed.
   ============================================================ */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined;

const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(ROOT, "tools", "og-banner.html")).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(ROOT, "assets", "og-banner.png") });
await browser.close();
console.log("✓ assets/og-banner.png rendered from tools/og-banner.html");
