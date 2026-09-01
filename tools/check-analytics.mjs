/* ============================================================
   check-analytics.mjs — the footer makes a privacy claim. This makes
   the page keep it.

   The footer has always said "NO TRACKER", and the fonts are served
   from this repo rather than fonts.gstatic.com specifically so that
   claim stays true before first paint. Adding visit counting makes
   the old wording false, and the wording is in a different part of
   the file from the script that falsified it — which is precisely
   how a claim and its reality drift apart without anyone lying.

   So the two are tied together here. There are exactly two states
   this page is allowed to be in:

     no analytics configured -> the footer may say "NO TRACKER"
     analytics configured    -> the footer must say "NO COOKIES"
                                and must not say "NO TRACKER"

   Anything else is the page claiming one thing and doing another,
   which is the failure this whole site argues against.

   It also refuses a cookie-setting or identity-resolving script
   outright. Not because one would be illegal, but because the
   footer's promise is the product here: a portfolio that says it
   measures nothing and then measures everything has made its own
   central claim unfalsifiable, and every other number on it reads
   differently after that.

   No dependencies. Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const PLACEHOLDER = "REPLACE-WITH-GOATCOUNTER-CODE";

/* Analytics vendors that set a cookie, fingerprint, or resolve identity
   across sites. The footer's claim cannot survive any of them. */
const DISALLOWED = [
  ["googletagmanager.com", "Google Tag Manager"],
  ["google-analytics.com", "Google Analytics"],
  ["gtag(", "gtag / GA4"],
  ["connect.facebook.net", "Meta Pixel"],
  ["snap.licdn.com", "LinkedIn Insight Tag"],
  ["hotjar.com", "Hotjar (session recording)"],
  ["clarity.ms", "Microsoft Clarity (session recording)"],
  ["fullstory.com", "FullStory (session recording)"],
];

const found = DISALLOWED.filter(([needle]) => html.includes(needle));
if (found.length) {
  console.error(
    "✗ this page loads something the footer's privacy claim cannot survive:\n" +
      found.map(([, name]) => `  - ${name}`).join("\n") +
      "\n\n  Session recording and cross-site identity are a different thing from\n" +
      "  counting visits. If you want one of these, the footer needs rewriting\n" +
      "  and this check needs deleting on purpose, not quietly.\n"
  );
  process.exit(1);
}

const codeMatch = html.match(/var SITE_CODE = "([^"]*)"/);
if (!codeMatch) {
  console.log("• no analytics block found — nothing to reconcile.");
  process.exit(0);
}

const code = codeMatch[1];
const configured = code !== PLACEHOLDER && /^[a-z0-9][a-z0-9-]{1,48}$/.test(code);

/* The whole .footer-meta block, not the first <span> inside it. The
   copyright line nests <span id="year">, so a non-greedy match on
   <span>...</span> stops after the year and never sees the claim -
   it read "© 2026" and passed a state it should have failed. A check
   that cannot see the thing it checks is worse than no check, so the
   extracted text is asserted to contain the phrase the claim hangs off. */
const footer = html.match(/<div class="footer-meta">([\s\S]*?)<\/div>/);
if (!footer) {
  console.error("✗ could not find the .footer-meta block in index.html");
  process.exit(1);
}
const footerText = footer[1];
if (!/HAND-BUILT/i.test(footerText)) {
  console.error(
    '✗ the footer no longer carries the "HAND-BUILT" line this check reads.\n' +
      "  It cannot tell whether the privacy claim is true, so it is failing rather\n" +
      "  than reporting a pass it did not earn.\n"
  );
  process.exit(1);
}
const saysNoTracker = /NO TRACKER/i.test(footerText);
const saysNoCookies = /NO COOKIES/i.test(footerText);

console.log(`analytics: ${configured ? `configured (${code})` : "not configured"}`);
console.log(`footer:    ${footerText.replace(/<[^>]+>/g, "").trim()}`);

if (!configured) {
  /* Inert is a legitimate state — the loader returns before making a
     request — so the old claim is still true and nothing is wrong. */
  if (saysNoCookies && !saysNoTracker) {
    console.log(
      '\n• note: the footer says "NO COOKIES" but analytics is not configured yet.' +
        "\n  Accurate, if understated. Set SITE_CODE in index.html to start counting."
    );
  }
  console.log("\n✓ nothing is being counted, and the footer does not claim otherwise.");
  process.exit(0);
}

if (saysNoTracker) {
  console.error(
    `\n✗ the footer still says "NO TRACKER" while GoatCounter is live on ${code}.\n` +
      "  It counts page views. That is a tracker by any reading a visitor would use.\n" +
      '  Change the footer to "HAND-BUILT — NO FRAMEWORK, NO COOKIES." in index.html.\n'
  );
  process.exit(1);
}

if (!saysNoCookies) {
  console.error(
    "\n✗ analytics is live but the footer makes no privacy claim at all.\n" +
      '  Say what is true: "HAND-BUILT — NO FRAMEWORK, NO COOKIES."\n' +
      "  A page that measures its readers and says nothing about it is worse\n" +
      "  than one that never claimed anything.\n"
  );
  process.exit(1);
}

console.log("\n✓ visits are counted without cookies, and the footer says exactly that.");
