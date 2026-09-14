import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflowDir = path.join(ROOT, ".github", "workflows");
const files = fs.readdirSync(workflowDir).filter((name) => /\.ya?ml$/i.test(name));
const unpinned = [];

for (const name of files) {
  const body = fs.readFileSync(path.join(workflowDir, name), "utf8");
  for (const match of body.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)(?:\s*#.*)?$/gm)) {
    const reference = match[1];
    if (/^\.\//.test(reference) || /^docker:\/\//.test(reference)) continue;
    const version = reference.split("@").at(-1) || "";
    if (!/^[a-f0-9]{40}$/i.test(version)) unpinned.push(`${name}: ${reference}`);
  }
}

if (unpinned.length) {
  console.error("✗ GitHub Actions must be pinned to full commit SHAs:");
  for (const item of unpinned) console.error(`  ${item}`);
  process.exit(1);
}

console.log(`✓ ${files.length} workflow(s) use immutable action references`);
