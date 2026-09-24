#!/usr/bin/env python3
"""ats_check.py — check a résumé PDF for the things that make ATS parsing fail.

No checker can promise "100% ATS-friendly": every ATS parses differently.
What reliably breaks parsing is knowable, so this checks exactly that:

  - the text is real, selectable text (not an image of text)
  - there are no embedded images standing in for content
  - no word is split by letter-spacing ("E XPERIENCE" hides a heading)
  - the standard section headings are present, as plain text
  - email and phone are in the text layer (not in a header graphic)
  - it is exactly two pages
  - every keyword passed with --keywords appears in the text

Keywords should be the posting's exact terms for requirements the evidence
actually supports; a miss means the tailoring did not land, not that the
term should be forced in.

Usage:
  python ats_check.py <resume.pdf> [--keywords "Power BI,SQL,ETL"] [--json]
Exit 0 when every check passes, 1 otherwise.
"""

import argparse
import json
import re
import sys

try:
    from pypdf import PdfReader
except ImportError:
    sys.exit("error: pypdf is missing; run .claude/skills/job-scout/scripts/setup.sh and use its PYTHON")

HEADINGS = ["summary", "technical skills", "professional experience", "education"]
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
SPLIT = re.compile(r"\b(?![AI]\b)[A-Z] [A-Z]{3,}\b")
PHONE = re.compile(r"\+?1?[\s(.-]*\d{3}[\s).-]*\d{3}[\s.-]*\d{4}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--keywords", default="")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    reader = PdfReader(args.pdf)
    pages = len(reader.pages)
    text = "\n".join((p.extract_text() or "") for p in reader.pages)
    flat = re.sub(r"\s+", " ", text).lower()

    images = 0
    for page in reader.pages:
        try:
            images += len(page.images)
        except Exception:  # an unreadable image stream still counts as an image
            images += 1

    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]
    kw_hits = {k: re.sub(r"\s+", " ", k.lower()) in flat for k in keywords}

    checks = {
        "two pages": pages == 2,
        "selectable text (>4000 chars)": len(text) > 4000,
        "no embedded images": images == 0,
        "no split words": not SPLIT.search(text),
        "standard headings": all(h in flat for h in HEADINGS),
        "email in text": bool(EMAIL.search(text)),
        "phone in text": bool(PHONE.search(text)),
        "all keywords present": all(kw_hits.values()) if keywords else True,
    }

    result = {
        "file": args.pdf,
        "pages": pages,
        "characters": len(text),
        "images": images,
        "split_words": SPLIT.findall(text),
        "missing_headings": [h for h in HEADINGS if h not in flat],
        "keywords_missing": [k for k, hit in kw_hits.items() if not hit],
        "checks": checks,
        "passed": all(checks.values()),
    }

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        for name, ok in checks.items():
            print(f"{'✓' if ok else '✗'} {name}")
        if result["split_words"]:
            print("  split words:", ", ".join(result["split_words"]))
        if result["missing_headings"]:
            print("  missing headings:", ", ".join(result["missing_headings"]))
        if result["keywords_missing"]:
            print("  keywords not found:", ", ".join(result["keywords_missing"]))
        print("PASS" if result["passed"] else "FAIL")
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
