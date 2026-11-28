"""Verify the pushed commit and every published original against its manifest."""

import hashlib
import json
from pathlib import Path
import subprocess


root = Path(__file__).resolve().parents[1]


def git(*arguments):
    return subprocess.check_output(["git", *arguments], cwd=root)


head = git("rev-parse", "HEAD").decode().strip()
branch = "content/povod-people-events-50"
remote = git("ls-remote", "--heads", "origin", branch).decode().split()[0]
assert head == remote, (head, remote)
names = set(git("ls-tree", "-r", "--name-only", head).decode("utf-8").splitlines())
collections = (("people-events-50", 50), ("photo-concepts-20", 20))
originals = []
for name, count in collections:
    prefix = f"assets/collections/{name}"
    catalog = json.loads(git("show", f"{head}:{prefix}/catalog.json").decode("utf-8"))
    assert len(catalog["items"]) == count
    for item in catalog["items"]:
        path = f"{prefix}/{item['file']}"
        assert path in names and item["status"] == "accepted" and item.get("visual_review")
        originals.append((path, item["sha256"]))
    for path in (root / prefix).rglob("*"):
        if path.is_file():
            assert path.relative_to(root).as_posix() in names
assert len(originals) == len({sha for _, sha in originals}) == 70
assert not any(path.startswith("output/") or "-rejected/" in path or "-runs/" in path or "-qa/" in path for path in names)
assert not git("diff", "--name-only", "f7e35b2", head, "--", "assets/collections/people-events-50").strip()
process = subprocess.Popen(["git", "cat-file", "--batch"], cwd=root, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
try:
    for path, expected in originals:
        process.stdin.write(f"{head}:{path}\n".encode("utf-8"))
        process.stdin.flush()
        header = process.stdout.readline().split()
        assert len(header) == 3 and header[1] == b"blob", header
        content = process.stdout.read(int(header[2]))
        assert process.stdout.read(1) == b"\n"
        assert hashlib.sha256(content).hexdigest() == expected, path
    process.stdin.close()
    assert process.wait(timeout=10) == 0
finally:
    if process.poll() is None:
        process.terminate()
changed = git("diff", "--name-only", "9f50552", head).decode("utf-8").splitlines()
fixed = {"HANDOFF.md", "codex/prepare_people_events_pack.py", ".codex/jev/povod-people-events-50-20261128.md", ".codex/jev/povod-new-concepts-20-push-20261128.md"}
assert all(path in fixed or any(path.startswith(f"assets/collections/{name}/") for name, _ in collections) for path in changed), changed
assert not git("diff", "--name-only", "HEAD").strip(), "Tracked worktree changes remain"
assert not git("diff", "--cached", "--name-only").strip(), "Staged changes remain"
receipt = {"branch": branch, "head": head, "remote_head": remote, "originals_verified_from_commit": 70, "prior_50_unchanged": True, "changed_paths": len(changed), "local_archives_excluded": True, "result": "PASS"}
(root / ".codex/pc20-remote.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
print(json.dumps(receipt, indent=2))
