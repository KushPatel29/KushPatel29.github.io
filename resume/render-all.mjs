// Portable renderer for the editable resume sources. Use the pinned Playwright
// from the site's development dependencies; no UI session or account required.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const css = await fs.readFile(path.join(here, "resume.css"), "utf8");
const files = ["resume.html", ...(await fs.readdir(path.join(here, "roles"))).filter(f => f.endsWith(".html")).sort().map(f => `roles/${f}`)];
const browser = await chromium.launch({ headless: true });
try {
  for (const file of files) {
    const source = await fs.readFile(path.join(here, file), "utf8");
    const html = source.replace(/<link rel="stylesheet" href="[^"]*resume\.css">/, `<style>${css}</style>`);
    const output = source.match(/<meta name="resume-pdf" content="([^"]+)">/)?.[1] ?? "Kush-Patel-Resume.pdf";
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(root, "assets", output), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
    await page.close();
    console.log(output);
  }
} finally {
  await browser.close();
}
