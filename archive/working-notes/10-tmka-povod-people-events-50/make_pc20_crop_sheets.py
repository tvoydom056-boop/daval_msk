"""Create private crop QA sheets without changing originals."""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


root = Path(__file__).resolve().parents[1]
pack = root / "assets/collections/photo-concepts-20"
out = root / ".codex/pc20-qa"
out.mkdir(exist_ok=True)
catalog = json.loads((pack / "catalog.json").read_text(encoding="utf-8"))
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
wide = [i for i in catalog["items"] if i["orientation"] == "landscape" and i["file"]]
for group in range((len(wide) + 3) // 4):
    sheet = Image.new("RGB", (1400, 1190), "#fffaf6")
    draw = ImageDraw.Draw(sheet)
    draw.text((20, 12), "New concepts: central 4:3 and 1.65:1 crops", font=font, fill="#29211e")
    for row, item in enumerate(wide[group * 4:group * 4 + 4]):
        with Image.open(pack / item["file"]) as original:
            photo = original.convert("RGB")
        for col, ratio in enumerate((4 / 3, 1.65)):
            width, height = min(photo.width, round(photo.height * ratio)), min(photo.height, round(photo.width / ratio))
            left, top = (photo.width - width) // 2, (photo.height - height) // 2
            crop = photo.crop((left, top, left + width, top + height))
            crop.thumbnail((650, 230), Image.Resampling.LANCZOS)
            x, y = 20 + col * 700, 70 + row * 280
            sheet.paste(crop, (x, y))
            draw.text((x, y + 235), f"{item['id']} - {ratio:.2f}:1", font=font, fill="#29211e")
    sheet.save(out / f"landscape-crops-{group + 1:02d}.jpg", quality=88)
portrait = [i for i in catalog["items"] if i["orientation"] == "portrait" and i["file"]]
sheet = Image.new("RGB", (1500, 940), "#fffaf6")
draw = ImageDraw.Draw(sheet)
draw.text((20, 12), "New concepts: lower 20 percent portrait caption zone", font=font, fill="#29211e")
for index, item in enumerate(portrait):
    with Image.open(pack / item["file"]) as original:
        photo = original.convert("RGB")
    photo.thumbnail((280, 350), Image.Resampling.LANCZOS)
    boundary = round(photo.height * 0.8)
    ImageDraw.Draw(photo).line((0, boundary, photo.width, boundary), fill="#ad452e", width=3)
    x, y = 10 + (index % 5) * 300, 65 + (index // 5) * 430
    sheet.paste(photo, (x, y))
    draw.text((x, y + 360), item["id"], font=font, fill="#29211e")
sheet.save(out / "portrait-captions.jpg", quality=88)
print(f"Crop QA prepared for {len(wide)} landscapes and {len(portrait)} portraits")
