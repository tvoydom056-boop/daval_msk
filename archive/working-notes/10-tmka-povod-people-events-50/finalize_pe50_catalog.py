"""Merge actual per-image generation records into the delivery catalog and prompts."""

import json
from pathlib import Path


root = Path(__file__).resolve().parents[1]
pack = root / "assets/collections/people-events-50"
catalog = json.loads((pack / "catalog.json").read_text(encoding="utf-8"))
records = {}
for path in (root / ".codex/pe50-runs").glob("*.json"):
    record = json.loads(path.read_text(encoding="utf-8"))
    if record["id"] in records:
        raise ValueError("Duplicate generation record")
    records[record["id"]] = record
expected = {f"pe{number:03d}" for number in range(1, 51)}
if set(records) != expected or any(r.get("status") != "accepted" for r in records.values()):
    raise ValueError("All 50 actual accepted generation records are required")
verified = {
    "https://www.retrospectphotography.com/journal/2019/2/20/the-honest-portrait-project-30",
    "https://www.danwoottonphotography.co.uk/blog/lancashire-family-shoot-manson",
    "https://unsplash.com/photos/a-happy-couple-walking-hand-in-hand-after-their-wedding-Bd7wdtN_NKU",
    "https://www.zofiamayphotography.co.uk/blog/how-to-prepare-for-a-christmas-photoshoot-at-home-london-family-photographer",
    "https://kseniaremizova.ru/",
}
craig = {
    "url": "https://craigfrankphotography.wordpress.com/2019/04/02/jesabelles-birthday-party/",
    "technique": "Soft side window light, natural expressions and everyday birthday interaction.",
    "verification": "pixel-viewed by GPT worker using view_image after ordinary HTTP 200; two photographs inspected",
}
for item in catalog["items"]:
    record = records[item["id"]]
    if not record.get("review") or "pending" in record["review"].lower():
        raise ValueError(f"Missing actual visual review: {item['id']}")
    if record["file"] != f"originals/{item['id']}.png" or not (pack / record["file"]).is_file():
        raise ValueError(f"Missing actual original: {item['id']}")
    for key in ("file", "prompt", "status"):
        item[key] = record[key]
    item["visual_review"] = record["review"]
    if item["id"] in ("pe001", "pe017"):
        target = 0 if item["id"] == "pe001" else 1
        item["references"][target] = dict(craig)
    for reference in item["references"]:
        if reference["url"] in verified:
            reference["verification"] = "pixel-viewed by GPT worker using view_image after ordinary HTTP 200"
catalog["generation_tool"] = "built-in image_gen"
catalog["people"] = "fictional demonstration subjects"
(pack / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
lines = ["# Фактические промпты 50 фотографий «Повода»", "", "Все кадры созданы встроенным image_gen. Ниже сохранены полные фактически использованные промпты принятых изображений, включая уточнения внешности и исправления композиции.", ""]
for item in catalog["items"]:
    lines.extend([f"## {item['id']} - {item['title_ru']}", "", f"Тема: {item['theme']}. Стиль: {item['style']}. Формат: {item['aspect_ratio']}. Файл: `{item['file']}`.", "", item["prompt"], "", "Референсы:", ""])
    lines.extend(f"- [Источник]({ref['url']}) - {ref['technique']} Проверка: {ref['verification']}." for ref in item["references"])
    lines.extend(["", f"Визуальная проверка: {item['visual_review']}", ""])
(pack / "prompts.md").write_text("\n".join(lines), encoding="utf-8")
print("Merged 50 actual accepted originals, prompts and visual reviews")
