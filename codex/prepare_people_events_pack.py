"""Prepare or check the separate 50-photo Povod collection without changing masters."""

import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import sys
from urllib.parse import urlparse

from PIL import Image, ImageDraw, ImageFont


IDS = [f"pe{number:03d}" for number in range(1, 51)]
RATIOS = {"portrait": "4:5", "landscape": "16:9", "square": "1:1"}
EDITORIAL_IDS = {f"pe{number:03d}" for number in (4, 5, 10, 15, 19, 20, 24, 25, 30, 35, 39, 40, 44, 45, 50)}
THEMES = ("portraits", "relatives", "friends", "birthday", "wedding", "anniversary", "travel", "new-year", "womens-day", "valentines")
ORIENTATIONS = ("portrait", "portrait", "landscape", "landscape", "square")
ROLES = ("cover", "cover", "section", "section", "gallery")
PREVIEW_EDGE = 960


def contained(root, relative):
    relative = PurePosixPath(relative)
    if relative.is_absolute() or ".." in relative.parts or "\\" in str(relative) or ":" in str(relative):
        raise ValueError(f"Unsafe relative path: {relative}")
    path = (root / str(relative)).resolve()
    if not path.is_relative_to(root):
        raise ValueError(f"Path leaves collection: {relative}")
    if path != root.joinpath(*relative.parts):
        raise ValueError(f"Symlink paths are not supported: {relative}")
    return path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_image(path):
    try:
        with Image.open(path) as original:
            original.load()
            if original.getexif().get(274, 1) != 1:
                raise ValueError(f"Unexpected EXIF rotation: {path.name}")
            return original.convert("RGB")
    except (OSError, SyntaxError) as error:
        raise ValueError(f"Cannot read image {path.name}: {error}") from error


def preview_size(size):
    scale = min(1, PREVIEW_EDGE / max(size))
    return tuple(max(1, round(edge * scale)) for edge in size)


def preview_paths(identifier):
    return {
        "jpeg": f"previews/jpeg/{identifier}.jpg",
        "webp": f"previews/webp/{identifier}.webp",
    }


def sheet_path(number):
    first, last = (number - 1) * 10 + 1, number * 10
    return f"contact-sheets/{number:02d}-pe{first:03d}-pe{last:03d}.jpg"


def load_catalog(root):
    try:
        catalog = json.loads(contained(root, "catalog.json").read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ValueError(f"Cannot read catalog.json: {error}") from error
    if not isinstance(catalog, dict) or catalog.get("version") != 1 or not isinstance(catalog.get("title"), str) or not catalog["title"].strip():
        raise ValueError("Catalog needs version=1 and a nonempty title")
    items = catalog.get("items")
    if not isinstance(items, list) or len(items) != 50 or any(not isinstance(item, dict) for item in items):
        raise ValueError("Catalog must contain exactly 50 item objects")
    if Counter(item.get("id") for item in items) != Counter(IDS):
        raise ValueError("Catalog IDs must be exactly pe001-pe050, each once")
    items.sort(key=lambda item: item["id"])
    if Counter(item.get("style") for item in items) != {"documentary": 35, "editorial": 15}:
        raise ValueError("Expected 35 documentary and 15 editorial items")
    if Counter(item.get("orientation") for item in items) != {"portrait": 20, "landscape": 20, "square": 10}:
        raise ValueError("Expected 20 portrait, 20 landscape and 10 square items")
    themes = [item.get("theme") for item in items]
    if any(not isinstance(theme, str) or not theme.strip() for theme in themes):
        raise ValueError("Every item needs a theme")
    counts = Counter(themes)
    if len(counts) != 10 or set(counts.values()) != {5}:
        raise ValueError("Expected 10 themes, 5 items each")
    prompts = set()
    for index, item in enumerate(items):
        identifier = item["id"]
        for field in ("title_ru", "prompt"):
            if not isinstance(item.get(field), str) or not item[field].strip():
                raise ValueError(f"{identifier}: {field} must be nonempty")
        prompt = " ".join(item["prompt"].split())
        if prompt in prompts:
            raise ValueError(f"{identifier}: duplicate full prompt")
        prompts.add(prompt)
        expected_style = "editorial" if identifier in EDITORIAL_IDS else "documentary"
        if item["style"] != expected_style:
            raise ValueError(f"{identifier}: expected {expected_style} style")
        if item["theme"] != THEMES[index // 5]:
            raise ValueError(f"{identifier}: expected {THEMES[index // 5]} theme")
        if item["orientation"] != ORIENTATIONS[index % 5] or item.get("role") != ROLES[index % 5]:
            raise ValueError(f"{identifier}: orientation or role differs from the approved matrix")
        if item.get("aspect_ratio") != RATIOS[item["orientation"]]:
            raise ValueError(f"{identifier}: orientation and aspect_ratio disagree")
        if item.get("role") not in ("cover", "section", "gallery") or item.get("status") not in ("planned", "accepted"):
            raise ValueError(f"{identifier}: invalid role or status")
        references = item.get("references")
        if not isinstance(references, list) or len(references) < 2:
            raise ValueError(f"{identifier}: at least two reference URLs are required")
        for reference in references:
            if not isinstance(reference, dict) or any(not isinstance(reference.get(key), str) or not reference[key].strip() for key in ("url", "technique", "verification")):
                raise ValueError(f"{identifier}: each reference needs url, technique and verification")
            url = urlparse(reference["url"])
            if url.scheme not in ("http", "https") or not url.netloc:
                raise ValueError(f"{identifier}: reference URL must be HTTP(S)")
        if len({reference["url"] for reference in references}) < 2:
            raise ValueError(f"{identifier}: at least two distinct reference URLs are required")
        if "file" not in item or (item["file"] is not None and item["file"] != f"originals/{identifier}.png"):
            raise ValueError(f"{identifier}: file must be null or originals/{identifier}.png")
    return catalog


def inspect_originals(root, items, check):
    files, hashes, available = set(), set(), {}
    for item in items:
        identifier = item["id"]
        if check and (item["status"] != "accepted" or item["file"] is None):
            raise ValueError(f"{identifier}: final check requires an accepted original")
        if item["file"] is None:
            if item["status"] == "accepted":
                raise ValueError(f"{identifier}: accepted item has no file")
            continue
        path = contained(root, item["file"])
        if not path.is_file():
            raise ValueError(f"{identifier}: missing original {item['file']}")
        if path in files:
            raise ValueError(f"{identifier}: duplicate original path")
        files.add(path)
        photo = read_image(path)
        with Image.open(path) as original:
            if original.format != "PNG":
                raise ValueError(f"{identifier}: original must be a PNG file")
        width, height = photo.size
        numerator, denominator = map(int, item["aspect_ratio"].split(":"))
        if abs(width - height * numerator / denominator) > 1:
            raise ValueError(f"{identifier}: {width}x{height} does not match {item['aspect_ratio']}; regenerate or review cropping manually")
        sha256 = digest(path)
        if sha256 in hashes:
            raise ValueError(f"{identifier}: duplicate original SHA-256")
        hashes.add(sha256)
        metadata = {"width": width, "height": height, "sha256": sha256}
        if check and any(item.get(key) != value for key, value in metadata.items()):
            raise ValueError(f"{identifier}: original metadata does not match file")
        available[identifier] = {**metadata, "preview_size": preview_size(photo.size)}
    return available


def check_outputs(root, items, available):
    originals = contained(root, "originals")
    expected = {item["file"] for item in items}
    actual = {path.relative_to(root).as_posix() for path in originals.rglob("*") if path.is_file()}
    if actual != expected:
        raise ValueError("Originals directory must contain exactly the 50 catalog originals")
    for kind, extension, format_name in (("jpeg", "jpg", "JPEG"), ("webp", "webp", "WEBP")):
        directory = contained(root, f"previews/{kind}")
        actual = {path.name for path in directory.iterdir() if path.is_file()} if directory.is_dir() else set()
        if actual != {f"{identifier}.{extension}" for identifier in IDS}:
            raise ValueError(f"Expected exactly 50 {kind} previews")
        for item in items:
            relative = preview_paths(item["id"])[kind]
            if item.get("previews") != preview_paths(item["id"]):
                raise ValueError(f"{item['id']}: preview metadata does not match expected paths")
            path = contained(root, relative)
            photo = read_image(path)
            with Image.open(path) as encoded:
                if encoded.format != format_name or photo.size != available[item["id"]]["preview_size"]:
                    raise ValueError(f"{item['id']}: invalid {kind} preview format or dimensions")
    directory = contained(root, "contact-sheets")
    expected = {Path(sheet_path(number)).name for number in range(1, 6)}
    actual = {path.name for path in directory.iterdir() if path.is_file()} if directory.is_dir() else set()
    if actual != expected:
        raise ValueError("Expected exactly 5 contact sheets")
    for number in range(1, 6):
        path = contained(root, sheet_path(number))
        photo = read_image(path)
        with Image.open(path) as encoded:
            valid = encoded.format == "JPEG" and photo.size == (1500, 970)
        if not valid:
            raise ValueError(f"Invalid contact sheet dimensions: {path.name}")


def font(size):
    candidates = (Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts/arial.ttf", "DejaVuSans.ttf")
    for candidate in candidates:
        try:
            return ImageFont.truetype(str(candidate), size)
        except OSError:
            pass
    raise ValueError("A Cyrillic TrueType font is required (Arial or DejaVu Sans)")


def wrapped(draw, text, face, width):
    lines, line = [], ""
    for word in text.split():
        candidate = f"{line} {word}".strip()
        if line and draw.textlength(candidate, font=face) > width:
            lines.append(line)
            line = word
        else:
            line = candidate
    lines.append(line)
    return lines


def write_sheets(root, items, available):
    heading, label, small = font(27), font(20), font(16)
    for number in range(1, 6):
        sheet = Image.new("RGB", (1500, 970), "#fffaf6")
        draw = ImageDraw.Draw(sheet)
        draw.text((20, 18), f"Повод - фотографии {number}/5", fill="#29211e", font=heading)
        for index, item in enumerate(items[(number - 1) * 10:number * 10]):
            left, top = (index % 5) * 300 + 10, (index // 5) * 450 + 65
            draw.rectangle((left, top, left + 280, top + 340), fill="#f0e5dd")
            if item["id"] in available:
                photo = read_image(contained(root, preview_paths(item["id"])["jpeg"]))
                photo.thumbnail((280, 340), Image.Resampling.LANCZOS)
                sheet.paste(photo, (left + (280 - photo.width) // 2, top + (340 - photo.height) // 2))
            else:
                draw.text((left + 45, top + 155), "Ещё не создано", fill="#51463e", font=label)
            draw.text((left, top + 350), f"{item['id']} - {item['aspect_ratio']} - {item['style']}", fill="#ad452e", font=small)
            lines = wrapped(draw, item["title_ru"], label, 280)
            for offset, line in enumerate(lines[:3]):
                draw.text((left, top + 375 + offset * 23), line, fill="#29211e", font=label)
        output = contained(root, sheet_path(number))
        output.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(output, "JPEG", quality=85, optimize=True)


def prepare(root, catalog, available):
    font(20)
    for item in catalog["items"]:
        identifier = item["id"]
        if identifier not in available:
            continue
        photo = read_image(contained(root, item["file"]))
        size = available[identifier]["preview_size"]
        if photo.size != size:
            photo = photo.resize(size, Image.Resampling.LANCZOS)
        paths = preview_paths(identifier)
        for kind, format_name, quality in (("jpeg", "JPEG", 85), ("webp", "WEBP", 82)):
            output = contained(root, paths[kind])
            output.parent.mkdir(parents=True, exist_ok=True)
            photo.save(output, format_name, quality=quality)
        item.update({key: value for key, value in available[identifier].items() if key != "preview_size"})
        item["previews"] = paths
    write_sheets(root, catalog["items"], available)
    contained(root, "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(available)}/50 originals, {len(available) * 2} previews and 5 contact sheets; acceptance statuses unchanged")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1] / "assets/collections/people-events-50", help="Collection directory containing catalog.json")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="Read-only final validation; require all 50 accepted originals and derivatives")
    mode.add_argument("--prepare", action="store_true", help="Prepare available images and update metadata (default)")
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        catalog = load_catalog(root)
        available = inspect_originals(root, catalog["items"], args.check)
        if args.check:
            check_outputs(root, catalog["items"], available)
            print("PASS: 50 accepted originals, 100 previews, 5 contact sheets; quotas, paths, hashes, metadata and dimensions checked")
        else:
            prepare(root, catalog, available)
    except (ValueError, OSError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
