"""WebP-подготовка трёх изображений из уже созданного визуального банка."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('bank', type=Path, help='Корень checkout с визуальным банком Летописи')
args = parser.parse_args()
assets = Path(__file__).resolve().parents[1] / 'assets'
assets.mkdir(parents=True, exist_ok=True)
sources = [
    (12, 'letopis-visuals-2026-11-28/generated/letopis-12-elder-warm-smile.png', 'anna.webp', 480),
    (31, 'letopis-visuals-2026-11-28/generated/letopis-31-birch-home-morning.png', 'house.webp', 1672),
    (117, 'letopis-life-details-2026-11-28/generated/letopis-117-old-house-key.png', 'key.webp', 600),
]
manifest = []
for image_id, relative, name, width in sources:
    path = args.bank / 'research' / relative
    with Image.open(path) as image:
        original = image.size
        if image.width > width:
            image = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
        target = assets / name
        image.save(target, 'WEBP', quality=86, method=6)
        manifest.append({
            'id': image_id, 'source': 'research/' + relative,
            'source_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'source_size': original, 'file': name, 'size': image.size,
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
            'bytes': target.stat().st_size,
            'status': 'AI-generated fictional illustration, not a family archive',
        })
(assets / 'images.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=False))
