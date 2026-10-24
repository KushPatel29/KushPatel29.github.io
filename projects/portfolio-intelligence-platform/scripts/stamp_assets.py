"""Fingerprint the complete static module chain; --check never changes files."""

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "dist"
write = "--write" in sys.argv
changed = []


def digest(content):
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:12]


def update(name, replacements):
    path = ROOT / name
    old = path.read_text(encoding="utf-8")
    content = old
    for target, version in replacements.items():
        pattern = r"\./" + re.escape(target) + r"(?:\?v=[a-zA-Z0-9.-]+)?(?=[\x22\x27])"
        content, count = re.subn(pattern, f"./{target}?v={version}", content)
        assert count > 0, f"Missing dependency {target} in {name}"
    if content != old:
        changed.append(name)
        if write:
            path.write_text(content, encoding="utf-8", newline="\n")
    return digest(content)


api = digest((ROOT / "api-client.js").read_text(encoding="utf-8"))
model = update("live-model.js", {"api-client.js": api})
live = update("live.js", {"live-model.js": model})
css = digest((ROOT / "live.css").read_text(encoding="utf-8"))
app = digest((ROOT / "app.js").read_text(encoding="utf-8"))
update("index.html", {"live.js": live, "live.css": css})
update("case-study.html", {"app.js": app, "live.css": css})
if changed and not write:
    raise SystemExit(
        "Stale asset fingerprints: "
        + ", ".join(changed)
        + ". Run python scripts/stamp_assets.py --write and review."
    )
print("Static asset chain fingerprints " + ("updated." if changed else "verified."))
