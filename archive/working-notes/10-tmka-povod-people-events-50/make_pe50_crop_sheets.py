"""Build private visual QA sheets; never change collection originals."""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


root = Path(__file__).resolve().parents[1]
pack = root / "assets/collections/people-events-50"
out = root / ".codex/pe50-qa"
out.mkdir(exist_ok=True)
catalog = json.loads((pack / "catalog.json").read_text(encoding="utf-8"))
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 23)
wide = [item for item in catalog["items"] if item["orientation"] == "landscape" and item["file"]]
for group in range((len(wide) + 4) // 5):
    sheet = Image.new("RGB", (1400, 1470), "#fffaf6")
    draw = ImageDraw.Draw(sheet)
    draw.text((20, 12), "Landscape QA: central 4:3 and 1.65:1 crops", font=font, fill="#29211e")
    for row, item in enumerate(wide[group * 5:group * 5 + 5]):
        with Image.open(pack / item["file"]) as native:
            photo = native.convert("RGB")
        for col, ratio in enumerate((4 / 3, 1.65)):
            width = min(photo.width, round(photo.height * ratio))
            height = min(photo.height, round(photo.width / ratio))
            left, top = (photo.width - width) // 2, (photo.height - height) // 2
            crop = photo.crop((left, top, left + width, top + height))
            crop.thumbnail((650, 230), Image.Resampling.LANCZOS)
            x, y = 20 + col * 700, 70 + row * 280
            sheet.paste(crop, (x, y))
            draw.text((x, y + 235), f"{item['id']} - {ratio:.2f}:1", font=font, fill="#29211e")
    sheet.save(out / f"landscape-crops-{group + 1:02d}.jpg", quality=88)

portrait = [item for item in catalog["items"] if item["orientation"] == "portrait" and item["file"]]
for group in range((len(portrait) + 9) // 10):
    sheet = Image.new("RGB", (1500, 940), "#fffaf6")
    draw = ImageDraw.Draw(sheet)
    draw.text((20, 12), "Portrait QA: lower 20 percent caption zone", font=font, fill="#29211e")
    for index, item in enumerate(portrait[group * 10:group * 10 + 10]):
        with Image.open(pack / item["file"]) as native:
            photo = native.convert("RGB")
        photo.thumbnail((280, 350), Image.Resampling.LANCZOS)
        mark = ImageDraw.Draw(photo)
        boundary = round(photo.height * 0.8)
        mark.line((0, boundary, photo.width, boundary), fill="#ad452e", width=3)
        x, y = 10 + (index % 5) * 300, 65 + (index // 5) * 430
        sheet.paste(photo, (x, y))
        draw.text((x, y + 360), item["id"], font=font, fill="#29211e")
    sheet.save(out / f"portrait-captions-{group + 1:02d}.jpg", quality=88)
print(f"Prepared crop QA for {len(wide)} landscape and {len(portrait)} portrait photos")
