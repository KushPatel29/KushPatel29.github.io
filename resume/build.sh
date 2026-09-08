#!/usr/bin/env bash
# Render resume/resume.html to assets/Kush-Patel-Resume.pdf.
#
# The page count is asserted rather than assumed. The previous résumé grew to
# three pages without anyone noticing, and the third held four lines.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(dirname "$here")"
src="$here/resume.html"
out="$root/assets/Kush-Patel-Resume.pdf"

chrome=""
for candidate in \
  "/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "$(command -v google-chrome || true)" \
  "$(command -v chromium || true)"; do
  [ -n "$candidate" ] && [ -x "$candidate" ] && { chrome="$candidate"; break; }
done
[ -n "$chrome" ] || { echo "error: no Chrome or Chromium found" >&2; exit 1; }

# Windows Chrome needs a file:// URL with a drive letter, not an MSYS path.
url="file:///$(cd "$here" && pwd -W 2>/dev/null || echo "$here")/resume.html"

"$chrome" --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=8000 --print-to-pdf="$out" "$url" >/dev/null 2>&1

[ -s "$out" ] || { echo "error: no PDF was written" >&2; exit 1; }

pages="$(python -c "import pypdf,sys; print(len(pypdf.PdfReader(sys.argv[1]).pages))" "$out")"
echo "rendered $(basename "$out") — ${pages} page(s)"
if [ "$pages" -ne 2 ]; then
  echo "error: expected 2 pages, got ${pages}. Tighten the source before shipping." >&2
  exit 1
fi

# A résumé whose text cannot be selected cannot be parsed by an ATS either.
chars="$(python -c "import pypdf,sys; r=pypdf.PdfReader(sys.argv[1]); print(sum(len(p.extract_text() or '') for p in r.pages))" "$out")"
echo "extractable text: ${chars} characters"
[ "$chars" -gt 4000 ] || { echo "error: too little extractable text — is it rendering as images?" >&2; exit 1; }
