"""Create the requested reviewable photo delivery as a portable archive."""

import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED


root = Path(__file__).resolve().parents[1]
pack = root / "assets/collections/people-events-50"
files = sorted(p for p in pack.rglob("*") if p.is_file())
assert len(files) == 159, len(files)
files += [root / "codex/prepare_people_events_pack.py", root / ".codex/jev/povod-people-events-50-20261128.md", root / ".codex/pe50-jevreview.json", root / ".codex/pe50-validation.json"]
output = root / "output/povod-people-events-50.zip"
output.parent.mkdir(exist_ok=True)
prefix = "povod-people-events-50/"
with ZipFile(output, "x", compression=ZIP_DEFLATED, compresslevel=1) as archive:
    for path in files:
        archive.write(path, prefix + path.relative_to(root).as_posix())
    archive.writestr(prefix + "README.txt", "Povod: 50 generated photographs\n\nOpen assets/collections/people-events-50/README.md for the collection, prompts, references and five contact sheets. All people are fictional. Generation used built-in image_gen.\n\nFrom this extracted folder, with Python 3.9+ and Pillow installed:\npython codex/prepare_people_events_pack.py --check\npython codex/prepare_people_events_pack.py --prepare\n\nThe website integration is a separate task.\n")
with ZipFile(output) as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    assert len(names) == len(set(names)) == 164
    assert sum("/originals/pe" in n and n.endswith(".png") for n in names) == 50
receipt = {"archive": output.relative_to(root).as_posix(), "entries": len(names), "originals": 50, "bytes": output.stat().st_size, "sha256": hashlib.sha256(output.read_bytes()).hexdigest(), "crc_check": "PASS"}
(root / ".codex/pe50-archive.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
print(json.dumps(receipt, indent=2))
