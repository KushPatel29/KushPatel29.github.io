import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function assertTableauContent(page, timeout = 90000) {
  await page.getByRole("heading", {name:/GL close.*Reconcile before signing/i}).waitFor({state:"visible",timeout});
  // Tableau's accessible name can prefix a chart title with "Title:".
  for (const name of [/Net variance by account/i, /Accounts outside 0\.5% tolerance/i]) {
    await page.getByRole("heading", {name}).waitFor({state:"visible",timeout});
  }
  // A workbook title/metadata page is insufficient: a drawn chart must exist.
  await page.locator("canvas").first().waitFor({state:"visible",timeout});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT,"portfolio-manifest.json"),"utf8"));
  const url = manifest.projects.find(p=>p.id==="gl-reconciliation").liveApp;
  if (!url.startsWith("https://public.tableau.com/views/")) throw new Error("Use the direct public visualization, not its metadata page");
  const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
  const directory = path.join(ROOT,"artifacts/live-demos");
  fs.mkdirSync(directory,{recursive:true});
  try {
    for (const [name,viewport] of [["desktop",{width:1440,height:1000}],["narrow",{width:390,height:844}]]) {
      const context = await browser.newContext({viewport});
      const page = await context.newPage();
      try {
        await page.goto(url,{waitUntil:"domcontentloaded",timeout:90000});
        await assertTableauContent(page);
        console.log(`✓ Tableau ${name}: workbook heading, both chart headings and visible rendered chart`);
      } finally {
        await page.screenshot({path:path.join(directory,`tableau-${name}.png`)}).catch(()=>{});
        await context.close();
      }
    }
  } finally {await browser.close();}
}
