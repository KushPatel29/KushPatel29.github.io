/* ============================================================
   wake-streamlit-demos.mjs — keep every Streamlit demo this
   portfolio links to awake, and fail when one will not come up.

   Streamlit Community Cloud puts an app to sleep after twelve
   hours without a visitor. The next person to follow the link
   gets a "this app has gone to sleep" screen, which is the one
   thing a demo link on a CV must not show.

   Each app repository used to carry its own keep-warm job. All
   six were green on 2026-09-17 while four of the demos slept:
   they ran every other day against a twelve-hour clock, and they
   fetched the page with curl. A sleeping app still answers 200,
   its sleep screen is drawn by JavaScript so the HTML never says
   so, and a fetch that never opens a session is not a visitor.

   So this does what a visitor does, from one place:
     1. open the app in a real browser;
     2. ask the platform whether it is running
        (/api/v2/app/status: 5 running, 12 asleep, else starting);
     3. if not, press "Yes, get this app back up!" and wait;
     4. load the app's own frame and wait for its first page to
        render, which is also the session that resets the clock;
     5. fail if that page shows a Python exception.

   The list is read from the pages and the manifest, so a demo
   added to the site is kept awake without editing this file.
   Pass URLs as arguments to visit only those.

   Needs Playwright (the repository's @playwright/test).
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = ["index.html", "404.html"];
const STREAMLIT = /^https:\/\/[a-z0-9-]+\.streamlit\.app\/?$/i;
const WAKE = /get this app back up/i;
const RUNNING = 5;
const ASLEEP = 12;
const MISSING = "no such app";
const WAKE_BUDGET_MS = 10 * 60_000;
const RENDER_BUDGET_MS = 3 * 60_000;
const RENDER_ATTEMPTS = 2;
const SETTLE_MS = 15_000;

function origin(url) {
  return url.replace(/\/+$/, "");
}

export function demosOnTheSite() {
  const found = new Set();
  for (const page of PAGES) {
    const file = path.join(ROOT, page);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/href="(https:\/\/[^"#?]+)/gi)) {
      if (STREAMLIT.test(m[1])) found.add(origin(m[1]));
    }
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "portfolio-manifest.json"), "utf8"));
  for (const project of manifest.projects) {
    if (project.liveApp && STREAMLIT.test(project.liveApp)) found.add(origin(project.liveApp));
  }
  return [...found].sort();
}

async function loadChromium() {
  for (const name of ["@playwright/test", "playwright"]) {
    try {
      return (await import(name)).chromium;
    } catch {
      /* try the next one */
    }
  }
  throw new Error("Playwright is not installed: run `pnpm install` first");
}

async function visit(browser, url) {
  const log = [];
  const say = (line) => log.push(line);
  const context = await browser.newContext();
  const page = await context.newPage();

  const status = async () => {
    try {
      const response = await context.request.get(`${url}/api/v2/app/status`, { timeout: 30_000 });
      if (response.status() === 404) return MISSING;
      return response.ok() ? (await response.json()).status : null;
    } catch {
      return null;
    }
  };

  /* The button has always been on the top-level page; every frame is searched
     so that a layout change on Streamlit's side fails loudly below rather than
     turning this into a job that never presses anything. */
  const pressWake = async (timeout) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      for (const frame of page.frames()) {
        const button = frame.getByRole("button", { name: WAKE });
        if (await button.count()) {
          await button.first().click();
          return true;
        }
      }
      await page.waitForTimeout(1_000);
    }
    return false;
  };

  const started = Date.now();
  let ok = false;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
    let current = await status();
    const arrived = current;
    /* A renamed or deleted app is a dead link, not a slow start: say so now
       rather than after the whole wake budget. */
    if (current === MISSING) throw new Error("Streamlit has no app at this address (404)");

    if (current !== RUNNING) {
      say(`status ${current} on arrival`);
      say((await pressWake(30_000)) ? "pressed the wake button" : "no wake button; waiting for it to start");
      let lastPress = Date.now();
      while (current !== RUNNING && Date.now() - started < WAKE_BUDGET_MS) {
        await page.waitForTimeout(10_000);
        current = await status();
        if (current === ASLEEP && Date.now() - lastPress > 60_000) {
          await page.reload({ waitUntil: "domcontentloaded" });
          if (await pressWake(15_000)) say("still asleep after a minute; pressed again");
          lastPress = Date.now();
        }
      }
      if (current !== RUNNING) {
        throw new Error(`not running after ${WAKE_BUDGET_MS / 60_000} minutes (status ${current})`);
      }
      say(`running after ${Math.round((Date.now() - started) / 1000)}s`);
    }

    /* "Running" is the platform's word for the container, not for the app's
       first script run: a demo that has just woken can take minutes to draw,
       and the workforce room missed a three-minute wait once and rendered
       fine on the next run. A reload and a second wait cost less than a false
       alarm that teaches everyone to ignore this job. */
    const app = page.frameLocator("iframe[title='streamlitApp']");
    const drawn = async () => {
      await app.locator("[data-testid='stApp']").waitFor({ timeout: RENDER_BUDGET_MS });
      await app
        .locator("[data-testid='stMainBlockContainer'] [data-testid='stElementContainer']")
        .first()
        .waitFor({ timeout: RENDER_BUDGET_MS });
    };
    for (let attempt = 1; ; attempt += 1) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
      try {
        await drawn();
        break;
      } catch (error) {
        if (attempt === RENDER_ATTEMPTS) throw error;
        say(`nothing drawn in ${RENDER_BUDGET_MS / 60_000} minutes; reloading`);
      }
    }
    await page.waitForTimeout(SETTLE_MS);

    const errors = app.locator("[data-testid='stException']");
    if (await errors.count()) {
      const text = (await errors.first().innerText()).split("\n").slice(0, 2).join(" | ");
      throw new Error(`first page renders a Python exception: ${text}`);
    }
    say(arrived === RUNNING ? "was awake; first page renders" : "first page renders");
    ok = true;
  } catch (error) {
    say(error.message.split("\n")[0]);
  } finally {
    await context.close();
  }
  return { url, ok, seconds: Math.round((Date.now() - started) / 1000), log };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const requested = process.argv.slice(2).filter((a) => !a.startsWith("-")).map(origin);
  const demos = requested.length ? requested : demosOnTheSite();
  if (!demos.length) {
    console.error("✗ no Streamlit demos found on the site — has the page changed shape?");
    process.exit(1);
  }

  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });
  /* In parallel: a cold start is minutes of waiting on someone else's
     server, and nine of those in a row would outlast the job. */
  const results = await Promise.all(demos.map((url) => visit(browser, url)));
  await browser.close();

  for (const r of results) {
    const mark = r.ok ? "✓" : "✗";
    console.log(`${mark} ${r.url}  (${r.seconds}s)  ${r.log.join("; ")}`);
    if (!r.ok && process.env.GITHUB_ACTIONS) {
      console.log(`::error title=Demo down::${r.url}: ${r.log.at(-1)}`);
    }
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${demos.length} Streamlit demos visited, ${failed} not serving`);
  process.exit(failed ? 1 : 0);
}
