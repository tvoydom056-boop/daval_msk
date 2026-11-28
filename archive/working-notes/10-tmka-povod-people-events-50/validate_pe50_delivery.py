"""Verify the real pack and required negative cases on a private temporary copy."""

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


root = Path(__file__).resolve().parents[1]
pack = root / "assets/collections/people-events-50"
script = root / "codex/prepare_people_events_pack.py"


def snapshot(folder):
    return {p.relative_to(folder).as_posix(): (hashlib.sha256(p.read_bytes()).hexdigest(), p.stat().st_mtime_ns, p.stat().st_size) for p in folder.rglob("*") if p.is_file()}


def run(folder, flag):
    result = subprocess.run([sys.executable, str(script), "--root", str(folder), flag], capture_output=True, text=True, encoding="utf-8")
    return result.returncode, (result.stdout + result.stderr).strip()


results = {}
masters_before = snapshot(pack / "originals")
code, message = run(pack, "--prepare")
assert code == 0, message
assert masters_before == snapshot(pack / "originals"), "Preparation changed a master"
results["prepare_preserves_originals"] = message
before = snapshot(pack)
code, message = run(pack, "--check")
assert code == 0, message
assert before == snapshot(pack), "Check changed the real pack"
results["actual_50_readonly_check"] = message
with tempfile.TemporaryDirectory(prefix="povod-pe50-check-") as directory:
    temporary = Path(directory).resolve()
    assert temporary.is_relative_to(Path(tempfile.gettempdir()).resolve())
    assert temporary.name.startswith("povod-pe50-check-")
    copy = temporary / "pack"
    shutil.copytree(pack, copy)
    missing = copy / "originals/pe001.png"
    removed = temporary / "removed.png"
    missing.replace(removed)
    before = snapshot(copy)
    code, message = run(copy, "--check")
    assert code != 0 and "missing original" in message.lower(), message
    assert before == snapshot(copy), "Failed check wrote files"
    results["missing_original_rejected"] = message
    removed.replace(missing)
    second = copy / "originals/pe002.png"
    second.write_bytes(missing.read_bytes())
    before = snapshot(copy)
    code, message = run(copy, "--check")
    assert code != 0 and "duplicate original sha-256" in message.lower(), message
    assert before == snapshot(copy), "Duplicate check wrote files"
    results["duplicate_original_rejected"] = message
assert masters_before == snapshot(pack / "originals"), "Negative tests changed the real originals"
results["script_sha256"] = hashlib.sha256(script.read_bytes()).hexdigest()
results["result"] = "PASS"
(root / ".codex/pe50-validation.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(results, ensure_ascii=False, indent=2))
