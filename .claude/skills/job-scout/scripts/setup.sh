#!/usr/bin/env bash
# Prepare a fresh session to build tailored résumés: a private venv with pypdf
# under tmp/ (gitignored), and a check that Chrome/Chromium and Node exist.
# Prints the PYTHON line to export before calling resume/build.sh.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
[ -f "$root/portfolio-manifest.json" ] || { echo "error: not inside the portfolio repo ($root)" >&2; exit 1; }

venv="$root/tmp/.venv"
if [ ! -x "$venv/bin/python" ]; then
  python3 -m venv "$venv" >/dev/null
fi
"$venv/bin/python" -c "import pypdf" 2>/dev/null || "$venv/bin/pip" install -q pypdf >/dev/null 2>&1
"$venv/bin/python" -c "import pypdf" || { echo "error: pypdf would not install into $venv" >&2; exit 1; }

command -v node >/dev/null || { echo "error: node is missing" >&2; exit 1; }

found=""
for c in "$(command -v google-chrome || true)" "$(command -v chromium || true)" /opt/pw-browsers/chromium; do
  [ -n "$c" ] && [ -x "$c" ] && { found="$c"; break; }
done
[ -n "$found" ] || { echo "error: no Chrome or Chromium; tailored PDFs cannot be built" >&2; exit 1; }

mkdir -p "$root/tmp/role-fit"
echo "ready: chrome=$found"
echo "export PYTHON=$venv/bin/python"
