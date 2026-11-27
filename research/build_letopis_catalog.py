import html
import json
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parent


def text(value):
    return html.escape(str(value), quote=True)


def image_path(folder, asset):
    relative = Path(asset["file"])
    target = (folder / relative).resolve()
    if relative.is_absolute() or not target.is_relative_to(folder.resolve()):
        raise ValueError("Image paths must stay inside their collection folder")
    return target


def main():
    collections = []
    for manifest_path in ROOT.glob("*/manifest.json"):
        manifest = json.loads(manifest_path.read_text(encoding="utf-8-sig"))
        if manifest.get("site") == "letopis" and manifest.get("assets"):
            collections.append((manifest_path.parent, manifest))
    collections.sort(key=lambda item: min(asset["id"] for asset in item[1]["assets"]))
    total = sum(len(manifest["assets"]) for _, manifest in collections)
    titles = {
        "Архивы и вещи": "Семья и воспоминания",
        "Альбомы и конструкции": "Предметы и путешествия",
        "Звук и музыка": "Звуки, занятия и домашние традиции",
    }
    sections = []
    saved_total = 0
    for index, (folder, manifest) in enumerate(collections, start=1):
        assets = sorted(manifest["assets"], key=lambda asset: asset["id"])
        available = [asset for asset in assets if image_path(folder, asset).is_file()]
        saved_total += len(available)
        categories = list(dict.fromkeys(asset["category"] for asset in assets))
        title = manifest.get("collection_title", titles.get(categories[0], categories[0]))
        description = manifest.get("collection_description", manifest.get("description", ", ".join(categories) + "."))
        candidates = [asset for asset in available if asset.get("transparent_background")]
        candidates += [asset for asset in available if not asset.get("transparent_background")]
        preview_assets = candidates[:1]
        if preview_assets:
            second = next((asset for asset in candidates[1:] if asset["category"] != preview_assets[0]["category"]), None)
            second = second or next(iter(candidates[1:]), None)
            if second:
                preview_assets.append(second)
        previews = []
        for asset in preview_assets:
            url = quote(f"{folder.name}/{Path(asset['file']).as_posix()}", safe="/")
            cutout = " cutout" if asset.get("transparent_background") else ""
            previews.append(f'<a class="thumbnail{cutout}" href="{url}"><img src="{url}" alt="{text(asset["title"])}. Создано ИИ."></a>')
        label = f"Серия {index} / Кадры {assets[0]['id']}-{assets[-1]['id']}"
        sections.append(f'''<article><p class="label">{text(label)}</p><h2>{text(title)}</h2>
<p class="description">{text(description)}</p><p class="count">Сохранено {len(available)} из {len(assets)} изображений</p>
<div class="previews">{''.join(previews)}</div>
<a class="gallery-link" href="{quote(folder.name, safe='')}/gallery.html">Открыть {len(assets)} заготовок</a></article>''')
    catalog = '''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>Летопись - каталог __TOTAL__ заготовок</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3ece0;color:#1d1a16;font:17px/1.55 Georgia,serif}.wrap{max-width:1320px;width:calc(100% - 64px);margin:auto}header{padding:52px 0 28px;border-bottom:1px solid #cabeac}
h1{font-size:clamp(34px,5vw,64px);font-weight:400;line-height:1.15;max-width:850px;margin:14px 0 24px}header p{max-width:820px}.label,.count,.gallery-link{font:14px/1.5 system-ui,sans-serif}.label{color:#675b4a}.count{margin:18px 0}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,350px),1fr));gap:32px;padding:36px 0 56px}article{min-width:0}h2{font-size:30px;font-weight:400;margin:12px 0}
.previews{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.thumbnail{display:block;aspect-ratio:4/5;background:#e4d9c7;overflow:hidden}.thumbnail img{display:block;width:100%;height:100%;object-fit:contain}.cutout{background-color:#eee8de;background-image:conic-gradient(#d9d2c6 25%,transparent 0 50%,#d9d2c6 0 75%,transparent 0);background-size:24px 24px}
a{color:inherit;text-underline-offset:4px}.gallery-link{display:inline-block;padding:14px 0;min-height:44px}a:hover{color:#80542e}:focus-visible{outline:3px solid #956036;outline-offset:4px}
@media(max-width:650px){.wrap{width:calc(100% - 32px)}header{padding-top:30px}main{grid-template-columns:1fr;gap:36px}.previews{gap:8px}}
</style></head><body><header><div class="wrap"><p class="label">Летопись / Библиотека концепций</p><h1>__TOTAL__ заготовок для семейной истории</h1>
<p>Самостоятельных серий: __SERIES__. Все изображения созданы ИИ; люди и истории вымышлены. Прозрачные PNG показаны на шахматной подложке страницы, исходные файлы её не содержат.</p>
<p class="count">Всего сохранено __SAVED__ из __TOTAL__ отдельных изображений.</p></div></header>
<main class="wrap">__SECTIONS__</main></body></html>'''
    catalog = catalog.replace("__TOTAL__", str(total)).replace("__SERIES__", str(len(collections)))
    catalog = catalog.replace("__SAVED__", str(saved_total)).replace("__SECTIONS__", "\n".join(sections))
    (ROOT / "letopis-catalog.html").write_text(catalog, encoding="utf-8")
    print(f"letopis-catalog.html: {len(collections)} collections, {saved_total}/{total} images saved")


if __name__ == "__main__":
    main()
