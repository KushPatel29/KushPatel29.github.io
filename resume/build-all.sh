#!/usr/bin/env bash
# Render the main résumé and every role variant.
#
#   resume/resume.html            -> assets/Kush-Patel-Resume.pdf  (data analyst, BI, supply chain)
#   resume/roles/<slug>.html      -> assets/Kush-Patel-Resume-<Name>.pdf
#
# Each variant is the same person, the same dates and the same projects, ordered
# and worded for one role family. tools/check-resume.mjs holds every source to
# the facts the page states, so a variant cannot quietly become a different CV.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(dirname "$here")"

bash "$here/build.sh"
for src in "$here"/roles/*.html; do
  name="$(sed -n 's/.*<meta name="resume-pdf" content="\([^"]*\)".*/\1/p' "$src")"
  [ -n "$name" ] || { echo "error: $src has no <meta name=\"resume-pdf\">" >&2; exit 1; }
  RESUME_SRC="$src" RESUME_OUT="$root/assets/$name" bash "$here/build.sh"
done
