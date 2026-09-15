/*
  The portfolio manifest is the control plane for public project claims.
  This check keeps it reconciled with the actual static HTML so a title,
  repository, live-app status, test count, or total cannot drift quietly.
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const manifestPath = path.join(ROOT, "portfolio-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const errors = [];

function fail(message) {
  errors.push(message);
}

function textOnly(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&mdash;", "—")
    .replaceAll("&#183;", "·")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedUrl(value) {
  if (value === null) return null;
  const parsed = new URL(value);
  parsed.hash = "";
  if (parsed.pathname !== "/") parsed.pathname = parsed.pathname.replace(/\/$/, "");
  return parsed.toString().replace(/\/$/, "");
}

if (manifest.schemaVersion !== 1) fail("schemaVersion must be 1");
if (!Array.isArray(manifest.projects)) fail("projects must be an array");

const verified = new Date(`${manifest.lastVerified}T00:00:00Z`);
if (Number.isNaN(verified.valueOf())) {
  fail("lastVerified must be an ISO date");
} else {
  const ageDays = Math.floor((Date.now() - verified.valueOf()) / 86_400_000);
  if (ageDays < 0) fail("lastVerified cannot be in the future");
  if (ageDays > 45) fail(`manifest evidence is stale (${ageDays} days; maximum 45)`);
}

const articles = new Map();
for (const match of html.matchAll(
  /<article\b[^>]*\bid="(p-[a-z-]+)"[\s\S]*?<\/article>/gi,
)) {
  articles.set(match[1], match[0]);
}

const seenIds = new Set();
const seenCards = new Set();
const seenRepos = new Set();
const allowedStatus = new Set(["live-demo", "repository-only"]);
const allowedPriority = new Set(["flagship", "specialist"]);
const allowedClassification = new Set([
  "synthetic",
  "synthetic-and-session-upload",
]);

for (const project of manifest.projects ?? []) {
  const label = project.id || "<missing id>";
  for (const field of [
    "id", "cardId", "title", "repository", "liveStatus", "testCount",
    "testCommand", "dataClassification", "priority", "productShape",
    "primaryDecision", "capabilities", "evidence",
  ]) {
    if (project[field] === undefined || project[field] === "") {
      fail(`${label}: missing ${field}`);
    }
  }

  if (seenIds.has(project.id)) fail(`${label}: duplicate id`);
  if (seenCards.has(project.cardId)) fail(`${label}: duplicate cardId`);
  if (seenRepos.has(project.repository?.toLowerCase())) fail(`${label}: duplicate repository`);
  seenIds.add(project.id);
  seenCards.add(project.cardId);
  seenRepos.add(project.repository?.toLowerCase());

  if (!allowedStatus.has(project.liveStatus)) fail(`${label}: unsupported liveStatus`);
  if (!allowedPriority.has(project.priority)) fail(`${label}: unsupported priority`);
  if (!allowedClassification.has(project.dataClassification)) {
    fail(`${label}: unsupported dataClassification`);
  }
  if (!Number.isInteger(project.testCount) || project.testCount < 1) {
    fail(`${label}: testCount must be a positive integer`);
  }
  if (!Array.isArray(project.capabilities) || project.capabilities.length < 2) {
    fail(`${label}: provide at least two capabilities`);
  }
  if (!Array.isArray(project.evidence)) fail(`${label}: evidence must be an array`);

  try {
    const repo = new URL(project.repository);
    if (repo.protocol !== "https:" || repo.hostname !== "github.com") {
      fail(`${label}: repository must be a GitHub HTTPS URL`);
    }
  } catch {
    fail(`${label}: repository is not a valid URL`);
  }

  if (project.liveStatus === "live-demo" && !project.liveApp) {
    fail(`${label}: live-demo requires liveApp`);
  }
  if (project.liveStatus === "repository-only" && project.liveApp !== null) {
    fail(`${label}: repository-only projects must use liveApp: null`);
  }

  const card = articles.get(project.cardId);
  if (!card) {
    fail(`${label}: ${project.cardId} is not present in index.html`);
    continue;
  }

  const title = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
  const count = card.match(
    /<(?:p|li)\s+class="(?:card-tests|tag-tests)">\s*(\d+)(?:\s+dbt)?\s+tests\b/i,
  );
  const repo = card.match(/https:\/\/github\.com\/KushPatel29\/[A-Za-z0-9_.-]+/i);

  if (!title || textOnly(title[1]) !== project.title) {
    fail(`${label}: manifest title does not match ${project.cardId}`);
  }
  if (!count || Number(count[1]) !== project.testCount) {
    fail(`${label}: manifest testCount does not match ${project.cardId}`);
  }
  if (!repo || normalizedUrl(repo[0]) !== normalizedUrl(project.repository)) {
    fail(`${label}: manifest repository does not match ${project.cardId}`);
  }
  if (project.liveApp) {
    const cardUrls = [...card.matchAll(/href="(https:\/\/[^\"]+)"/gi)]
      .map((item) => normalizedUrl(item[1]));
    if (!cardUrls.includes(normalizedUrl(project.liveApp))) {
      fail(`${label}: manifest liveApp is not linked from ${project.cardId}`);
    }
  }
}

const manifestCount = manifest.projects?.length ?? 0;
const manifestTests = (manifest.projects ?? [])
  .reduce((sum, project) => sum + (project.testCount || 0), 0);
const hero = html.match(
  /<div class="metric-value" data-count="(\d+)">([\d,]+)<\/div>\s*<div class="metric-label">Automated tests/i,
);

if (manifest.totals?.promotedProjects !== manifestCount) {
  fail("totals.promotedProjects does not equal projects.length");
}
if (manifest.totals?.automatedTests !== manifestTests) {
  fail("totals.automatedTests does not equal the project test-count sum");
}
if (articles.size !== manifestCount) {
  fail(`index.html has ${articles.size} project cards; manifest has ${manifestCount}`);
}
if (!hero || Number(hero[1]) !== manifestTests || Number(hero[2].replaceAll(",", "")) !== manifestTests) {
  fail("the hero test total does not reconcile to the manifest");
}

for (const cardId of articles.keys()) {
  if (!seenCards.has(cardId)) fail(`${cardId}: card is missing from the manifest`);
}

if (errors.length > 0) {
  console.error(`✗ portfolio manifest has ${errors.length} error(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `✓ portfolio manifest: ${manifestCount} projects, ${manifestTests.toLocaleString("en-CA")} tests, ` +
  `${manifest.projects.filter((item) => item.liveStatus === "live-demo").length} live demos`,
);
console.log(`✓ verified ${manifest.lastVerified}; every card title, repository, live link and count reconciles`);
