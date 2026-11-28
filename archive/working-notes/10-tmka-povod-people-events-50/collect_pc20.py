"""Collect actual generated photo records; keep original files untouched."""

import argparse
import json
from pathlib import Path


parser = argparse.ArgumentParser()
parser.add_argument("--partial", action="store_true")
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
pack = root / "assets/collections/photo-concepts-20"
catalog = json.loads((pack / "catalog.json").read_text(encoding="utf-8"))
records = {record["id"]: record for path in (root / ".codex/pc20-runs").glob("*.json") for record in [json.loads(path.read_text(encoding="utf-8"))]}
expected = {f"pc{number:03d}" for number in range(1, 21)}
if not args.partial and (set(records) != expected or any(r.get("status") != "accepted" for r in records.values())):
    raise ValueError("All 20 actual accepted generation records are required")
accepted = 0
for item in catalog["items"]:
    record = records.get(item["id"])
    if not record or record.get("status") != "accepted":
        continue
    if not record.get("review") or "pending" in record["review"].lower():
        raise ValueError(f"Missing concrete visual review: {item['id']}")
    if record["file"] != f"originals/{item['id']}.png" or not (pack / record["file"]).is_file():
        raise ValueError(f"Missing actual original: {item['id']}")
    for key in ("file", "prompt", "status"):
        item[key] = record[key]
    item["visual_review"] = record["review"]
    accepted += 1
catalog["generation_tool"] = "built-in image_gen"
catalog["people"] = "fictional demonstration subjects"
(pack / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
lines = ["# Фактические промпты 20 новых концепций «Повода»", "", "Каждое принятое изображение создано встроенным image_gen по приведённому полному промпту. Общие референсы задают фотографические приёмы; сюжеты новых событий придуманы отдельно.", ""]
for item in catalog["items"]:
    lines.extend([f"## {item['id']} - {item['title_ru']}", "", f"Тема: {item['theme']}. Стиль: {item['style']}. Формат: {item['aspect_ratio']}. Статус: {item['status']}.", "", item["prompt"], "", "Стилистические источники:", ""])
    lines.extend(f"- [Источник]({reference['url']}) - {reference['technique']} Проверка: {reference['verification']}." for reference in item["references"])
    lines.extend(["", f"Визуальная проверка: {item.get('visual_review', 'Ещё не выполнена.')}", ""])
(pack / "prompts.md").write_text("\n".join(lines), encoding="utf-8")
print(f"Collected {accepted}/20 accepted originals and actual prompts")
