// Render a scene spec to MP4 frame by frame (deterministic, no real-time capture).
//   node render.mjs specs/x.json out/x.mp4            full render
//   node render.mjs specs/x.json out/x --preview 3,10  PNG stills at those seconds
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [specPath, outPath, flag, times] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const FPS = 24;
const root = path.dirname(new URL(import.meta.url).pathname);

const browser = await chromium.launch({ args: ["--allow-file-access-from-files"], ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.goto("file://" + path.join(root, "stage.html"));
const total = await page.evaluate((s) => window.load(s), spec);

if (flag === "--preview") {
  for (const t of times.split(",").map(Number)) {
    await page.evaluate((x) => window.render(x), t);
    await page.screenshot({ path: `${outPath}-${t}.png` });
  }
  console.log("previews written");
} else {
  const frames = Math.round(total * FPS);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-tune", "stillimage", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", outPath], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < frames; i++) {
    await page.evaluate((x) => window.render(x), i / FPS);
    const buf = await page.screenshot({ type: "png" });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  // Poster: a representative frame, and WebVTT captions from the scene timings.
  const posterT = spec.posterAt ?? (spec.scenes[0].dur + spec.scenes[1].dur * 0.6);
  await page.evaluate((x) => window.render(x), posterT);
  await page.screenshot({ path: outPath.replace(/\.mp4$/, "-poster.jpg"), type: "jpeg", quality: 82 });
  const fmt = (s) => new Date(s * 1000).toISOString().slice(11, 23);
  let t = 0, vtt = "WEBVTT\n\n", n = 1;
  for (const sc of spec.scenes) {
    const text = (sc.caption || (sc.type === "title" ? `${sc.title}. ${sc.sub}` : `${sc.cta} ${sc.note}`)).replace(/\*\*/g, "");
    vtt += `${n++}\n${fmt(t + 0.25)} --> ${fmt(t + sc.dur - 0.2)}\n${text}\n\n`;
    t += sc.dur;
  }
  fs.writeFileSync(outPath.replace(/\.mp4$/, ".vtt"), vtt);
  console.log(`${outPath}: ${frames} frames, ${total}s`);
}
await browser.close();
