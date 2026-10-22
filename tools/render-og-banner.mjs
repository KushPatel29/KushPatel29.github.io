/* ============================================================
   render-og-banner.mjs — renders tools/og-banner.html to
   assets/og-share.png (1200x630), the image link previews show.
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
// --linkedin renders the LinkedIn profile background from the same palette instead.
const linkedin = process.argv.includes("--linkedin");
const [src, out, width, height] = linkedin
  ? ["linkedin-banner.html", "linkedin-banner.png", 1584, 396]
  : ["og-banner.html", "og-share.png", 1200, 630];
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(ROOT, "tools", src)).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(ROOT, "assets", out) });
await browser.close();
console.log(`✓ assets/${out} rendered from tools/${src}`);
