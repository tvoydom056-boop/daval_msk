"""Validate both real collections and regression cases without changing masters."""

from collections import Counter
import copy
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


root = Path(__file__).resolve().parents[1]
script = root / "codex/prepare_people_events_pack.py"
old = root / "assets/collections/people-events-50"
new = root / "assets/collections/photo-concepts-20"


def snapshot(folder):
    return {p.relative_to(folder).as_posix(): (hashlib.sha256(p.read_bytes()).hexdigest(), p.stat().st_mtime_ns) for p in folder.rglob("*") if p.is_file()}


def run(folder, profile, flag="--check"):
    result = subprocess.run([sys.executable, str(script), "--profile", profile, "--root", str(folder), flag], capture_output=True, encoding="utf-8")
    return result.returncode, (result.stdout + result.stderr).strip()


def expected_failure(folder, profile, expected):
    before = snapshot(folder)
    code, message = run(folder, profile)
    assert code != 0 and expected.lower() in message.lower(), message
    assert before == snapshot(folder), "Failed validation wrote files"
    return message


results = {}
old_before = snapshot(old)
code, message = run(old, "people-events-50")
assert code == 0, message
assert snapshot(old) == old_before, "Old collection changed"
results["old_50_readonly"] = message
masters = snapshot(new / "originals")
code, message = run(new, "photo-concepts-20", "--prepare")
assert code == 0, message
assert masters == snapshot(new / "originals"), "Preparation changed new masters"
results["new_prepare_preserves_masters"] = message
before = snapshot(new)
code, message = run(new, "photo-concepts-20")
assert code == 0, message
assert before == snapshot(new), "New check wrote files"
results["new_20_readonly"] = message
catalog_old = json.loads((old / "catalog.json").read_text(encoding="utf-8"))
catalog_new = json.loads((new / "catalog.json").read_text(encoding="utf-8"))
all_items = catalog_old["items"] + catalog_new["items"]
assert len(all_items) == len({i["sha256"] for i in all_items}) == 70
assert len({i["theme"] for i in catalog_new["items"]}) == 20
assert all(i["status"] == "accepted" and i.get("visual_review") for i in catalog_new["items"])
assert Counter(i["style"] for i in catalog_new["items"]) == {"documentary": 14, "editorial": 6}
results["cross_collection_original_hashes"] = "70 unique originals; 20 new themes"
with tempfile.TemporaryDirectory(prefix="povod-pc20-check-") as directory:
    temporary = Path(directory).resolve()
    assert temporary.is_relative_to(Path(tempfile.gettempdir()).resolve())
    assert temporary.name.startswith("povod-pc20-check-")
    fixture = temporary / "catalog-only"
    fixture.mkdir()
    def save(catalog):
        (fixture / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False), encoding="utf-8")
    modified = copy.deepcopy(catalog_old)
    modified["items"][0]["style"], modified["items"][3]["style"] = modified["items"][3]["style"], modified["items"][0]["style"]
    save(modified)
    results["old_swapped_styles"] = expected_failure(fixture, "people-events-50", "style")
    modified = copy.deepcopy(catalog_old)
    modified["items"][0]["theme"], modified["items"][5]["theme"] = modified["items"][5]["theme"], modified["items"][0]["theme"]
    save(modified)
    results["old_swapped_themes"] = expected_failure(fixture, "people-events-50", "theme")
    modified = copy.deepcopy(catalog_new)
    modified["items"][1]["theme"] = modified["items"][0]["theme"]
    save(modified)
    results["new_repeated_theme"] = expected_failure(fixture, "photo-concepts-20", "theme")
    save(catalog_new)
    results["wrong_profile"] = expected_failure(fixture, "people-events-50", "50 item")
    media_copy = temporary / "media"
    shutil.copytree(new, media_copy)
    missing = media_copy / "originals/pc001.png"
    removed = temporary / "removed.png"
    missing.replace(removed)
    results["missing_original"] = expected_failure(media_copy, "photo-concepts-20", "missing original")
    removed.replace(missing)
    (media_copy / "originals/pc002.png").write_bytes(missing.read_bytes())
    results["duplicate_original"] = expected_failure(media_copy, "photo-concepts-20", "duplicate original sha-256")
assert snapshot(old) == old_before, "Tests changed prior collection"
assert masters == snapshot(new / "originals"), "Tests changed new originals"
results["script_sha256"] = hashlib.sha256(script.read_bytes()).hexdigest()
results["result"] = "PASS"
(root / ".codex/pc20-validation.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(results, ensure_ascii=True, indent=2))
