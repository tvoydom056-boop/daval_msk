import json
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

TASK = Path(__file__).resolve().parent
BASE = TASK.parent
manifest = json.loads((TASK / 'image_manifest.json').read_text(encoding='utf-8'))
ready = []
quality_probe = BytesIO()
Image.new('RGB', (8, 8)).save(quality_probe, format='JPEG', quality=85)
quality_probe.seek(0)
quality_tables = Image.open(quality_probe).quantization
for item in manifest['images']:
    if not item['source']:
        continue
    target = BASE / item['folder'] / 'assets' / 'img' / (item['name'] + '.jpg')
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(item['source']) as source:
        result = ImageOps.fit(source.convert('RGB'), (item['width'], item['height']), method=Image.Resampling.LANCZOS)
        result.save(target, format='JPEG', quality=85, optimize=True)
    with Image.open(target) as check:
        assert check.format == 'JPEG'
        assert check.mode == 'RGB'
        assert check.size == (item['width'], item['height'])
        assert check.quantization == quality_tables
    ready.append((item, target))
    print(f"OK {item['folder']}/{target.name}: {item['width']}x{item['height']}")

# Proof is a diagnostic image only; final photos are not blended or retouched.
bw_path = BASE / 'letopis/assets/img/nikolay-bw.jpg'
color_path = BASE / 'letopis/assets/img/nikolay-color.jpg'
if bw_path.exists() and color_path.exists():
    with Image.open(bw_path) as bw, Image.open(color_path) as color:
        Image.blend(bw.convert('RGB'), color.convert('RGB'), 0.5).save(TASK / 'nikolay_overlay_50.jpg', quality=95)

font_path = Path('C:/Windows/Fonts/arial.ttf')
font = ImageFont.truetype(str(font_path), 24) if font_path.exists() else ImageFont.load_default()
cols, cell_w, cell_h = 5, 480, 530
sheet = Image.new('RGB', (cols * cell_w, 3 * cell_h), '#efede8')
draw = ImageDraw.Draw(sheet)
for index, item in enumerate(manifest['images']):
    x, y = (index % cols) * cell_w, (index // cols) * cell_h
    target = BASE / item['folder'] / 'assets/img' / (item['name'] + '.jpg')
    if not target.exists():
        continue
    with Image.open(target) as photo:
        thumb = ImageOps.contain(photo, (cell_w - 24, cell_h - 64), method=Image.Resampling.LANCZOS)
        sheet.paste(thumb, (x + (cell_w - thumb.width) // 2, y + 10 + (cell_h - 64 - thumb.height) // 2))
    draw.text((x + 12, y + cell_h - 43), item['name'] + '.jpg', fill='#292722', font=font)
sheet.save(TASK / 'contact_sheet.jpg', format='JPEG', quality=92, optimize=True)
print(f'Prepared {len(ready)}/15 images; contact sheet updated.')
