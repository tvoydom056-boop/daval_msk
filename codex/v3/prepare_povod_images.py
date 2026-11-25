"""Prepare responsive Povod images without changing source JPEG files."""

import argparse
from io import BytesIO
import json
from pathlib import Path

from PIL import Image, ImageOps


WIDTHS = (480, 960, 1440)
SCENES = ("wedding", "birthday", "anniversary", "jubilee")


def within_root(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root):
        raise ValueError(f"Path leaves workspace: {relative}")
    return path


def write_if_changed(path, content):
    if not path.exists() or path.read_bytes() != content:
        path.write_bytes(content)


def prepare(root):
    root = root.resolve()
    if not (root / "AGENTS.md").is_file() or not (root / "v3/povod/package.json").is_file():
        raise ValueError("--root must point to the project workspace")
    media_root = within_root(root, "v3/povod/public/media")
    image_root = within_root(root, "v3/povod/public/media/img")
    sources = sorted(image_root.glob("*.jpg"))
    if len(sources) != 12:
        raise ValueError(f"Expected 12 JPEG images, found {len(sources)}")
    sources.extend(media_root / "v2/scenes" / f"slide-{key}.jpg" for key in SCENES)
    output = within_root(root, "v3/povod/public/media/responsive")
    metadata_path = within_root(root, "v3/povod/src/image-sizes.json")
    for source in sources:
        within_root(root, source.relative_to(root))
        if not source.is_file():
            raise ValueError(f"Missing source image: {source.relative_to(root)}")
    output.mkdir(parents=True, exist_ok=True)
    metadata = {}
    for source in sources:
        key = source.relative_to(media_root).as_posix()
        prefix = "img" if source.parent == image_root else "scene"
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            width, height = image.size
            variants = []
            for target_width in dict.fromkeys(min(size, width) for size in WIDTHS):
                target_height = round(height * target_width / width)
                resized = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
                buffer = BytesIO()
                resized.save(buffer, format="WEBP", quality=82, method=6)
                content = buffer.getvalue()
                with Image.open(BytesIO(content)) as encoded:
                    encoded.load()
                    if encoded.format != "WEBP" or encoded.size != (target_width, target_height):
                        raise ValueError(f"Invalid WebP output for {key}")
                name = f"{prefix}-{source.stem}-{target_width}.webp"
                path = within_root(root, output.relative_to(root) / name)
                write_if_changed(path, content)
                variants.append({
                    "path": path.relative_to(media_root).as_posix(),
                    "width": target_width,
                    "height": target_height,
                    "size": len(content),
                })
            metadata[key] = {"width": width, "height": height, "size": source.stat().st_size, "variants": variants}
    if len(metadata) != 16 or sum(len(item["variants"]) for item in metadata.values()) != 48:
        raise ValueError("Expected 16 source images and 48 responsive variants")
    content = (json.dumps(metadata, indent=2, ensure_ascii=False, sort_keys=True) + "\n").encode("utf-8")
    write_if_changed(metadata_path, content)
    size = sum(variant["size"] for item in metadata.values() for variant in item["variants"])
    print(f"Prepared {len(metadata)} images, 48 WebP variants, {size:,} bytes")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2], help="Project workspace root")
    args = parser.parse_args()
    prepare(args.root)


if __name__ == "__main__":
    main()
