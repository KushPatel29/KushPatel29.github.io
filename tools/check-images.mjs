/* ============================================================
   check-images.mjs — an <img> that declares the wrong size
   reserves the wrong box, and the page jumps when the file
   lands. Three of them were wrong here: a screenshot swap left
   healthcare-spc declared 17px taller than the file, and
   control-tower and hr-attrition had drifted the same way.

   Also catches the thing that made the healthcare one worth
   finding in the first place: the wrong screenshot had been
   shipped under the right name, so the alt text described a
   Laney control chart and ALC bed equivalents while the file
   showed case mix and cost per weighted case. Nothing on the
   page could tell — but the file's own aspect ratio can be
   checked against what the markup claims, and a missing file
   or an unreadable one can be caught outright.

   A 2x asset declared at half size is correct and expected:
   same aspect ratio, sharper on a retina screen. Only a
   changed ASPECT is a layout shift, so that is what fails.

   No dependencies — PNG and JPEG headers are read directly.
   Node 18+.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

/* PNG: width and height are the two big-endian 32-bit ints in the IHDR
   chunk, which is always the first chunk after the 8-byte signature. */
function pngSize(buf) {
  if (buf.length < 24) return null;
  const signature = "89504e470d0a1a0a";
  if (buf.subarray(0, 8).toString("hex") !== signature) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/* JPEG: walk the segment chain to a start-of-frame marker, which carries
   the dimensions. SOF0/1/2/3, 5-7, 9-11, 13-15 are frames; C4/C8/CC are not. */
function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2; continue;
    }
    const length = buf.readUInt16BE(i + 2);
    const isFrame = (marker >= 0xc0 && marker <= 0xcf)
      && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrame) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  return null;
}

/* Dispatch on the bytes, not the extension. Three screenshots here were
   written as JPEG and saved with a .png name; a parser that trusts the
   extension reports them as unreadable, which is a true statement about the
   wrong thing. The extension is checked separately, because a file served
   under the wrong content type is worth fixing even though browsers sniff. */
function imageSize(file) {
  const buf = fs.readFileSync(file);
  const isPng = buf.length > 8 && buf.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  const size = isPng ? pngSize(buf) : jpegSize(buf);
  return size ? { ...size, kind: isPng ? "png" : "jpeg" } : null;
}

const problems = [];
const rows = [];

for (const m of html.matchAll(
  /<img\s+src="(assets\/[^"]+)"[^>]*?width="(\d+)"[^>]*?height="(\d+)"/gi,
)) {
  const [, src, wAttr, hAttr] = m;
  const file = path.join(ROOT, src);
  if (!fs.existsSync(file)) {
    problems.push(`${src}: referenced by the page but not in the repository`);
    continue;
  }
  const size = imageSize(file);
  if (!size) {
    problems.push(`${src}: could not be read as a PNG or JPEG`);
    continue;
  }
  const declared = Number(wAttr) / Number(hAttr);
  const actual = size.w / size.h;
  const scale = size.w / Number(wAttr);
  const ext = path.extname(src).toLowerCase();
  const extSaysPng = ext === ".png";
  if (extSaysPng !== (size.kind === "png")) {
    problems.push(
      `${src}: the bytes are ${size.kind.toUpperCase()} but the name says ${ext} — `
      + `rename it so the server sends the right content type`,
    );
  }
  const ok = Math.abs(declared - actual) < 0.01;
  rows.push(`${ok ? "✓" : "✗"} ${src.padEnd(34)} file ${size.w}x${size.h}  declared ${wAttr}x${hAttr}${scale > 1.5 ? `  (${scale.toFixed(0)}x asset)` : ""}`);
  if (!ok) {
    const expected = Math.round(size.h * Number(wAttr) / size.w);
    problems.push(
      `${src}: declared ${wAttr}x${hAttr} but the file is ${size.w}x${size.h} — `
      + `height should be ${expected}, or the page will jump when it loads`,
    );
  }
}

if (rows.length === 0) {
  console.error("✗ no sized <img> tags found — has the page changed shape?");
  process.exit(1);
}

for (const row of rows) console.log(row);

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} image problem(s):`);
  for (const p of problems) console.error(`    ${p}`);
  process.exit(1);
}

console.log(`\n✓ all ${rows.length} sized images match the aspect ratio they declare`);
