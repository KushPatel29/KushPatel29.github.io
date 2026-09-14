import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");

const footer = html.match(/footer-updated[\s\S]*?<time datetime="(\d{4}-\d{2}-\d{2})"/i)?.[1];
const structured = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
const sitemapDate = sitemap.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/)?.[1];

console.log(`footer:          ${footer || "missing"}`);
console.log(`structured data: ${structured || "missing"}`);
console.log(`sitemap:         ${sitemapDate || "missing"}`);

if (!footer || !structured || !sitemapDate || new Set([footer, structured, sitemapDate]).size !== 1) {
  console.error("\n✗ footer, ProfilePage dateModified and sitemap lastmod must use the same date");
  process.exit(1);
}

console.log("\n✓ every public freshness signal agrees");
