import html
import json
import re
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parent


def text(value):
    if isinstance(value, (dict, list)):
        value = json.dumps(value, ensure_ascii=False)
    return html.escape(str(value), quote=True)


def render_card(asset):
    relative = Path(asset["file"])
    target = (ROOT / relative).resolve()
    if relative.is_absolute() or not target.is_relative_to(ROOT):
        raise ValueError("Image paths must stay inside the collection folder")
    exists = target.is_file()
    url = quote(relative.as_posix(), safe="/")
    status = "Сгенерировано" if exists else "Запланировано"
    if not exists and asset.get("status") in {"failed", "error", "blocked"}:
        status = "Ошибка генерации"
    title = text(asset["title"])
    transparent = bool(asset.get("transparent_background"))
    visual_class = "visual cutout" if transparent else "visual"
    aspect = asset.get("aspect_ratio", "3:2")
    ratio = aspect.replace(":", " / ") if re.fullmatch(r"\d+:\d+", aspect) else "3 / 2"
    visual = (
        f'<a class="{visual_class}" href="{url}" target="_blank" rel="noopener" '
        f'aria-label="Открыть оригинал: {title}" style="--ratio:{ratio}">'
        f'<img src="{url}" alt="{title}. Демонстрационный материал, созданный ИИ." loading="lazy"></a>'
        if exists
        else f'<div class="visual pending" style="--ratio:{ratio}"><span>{status}</span></div>'
    )
    return f'''<article class="card" data-category="{text(asset['category'])}">
  <div class="card-heading"><span class="number">{int(asset['id']):02d}</span><span>{text(asset['category'])}</span></div>
  <h2>{title}</h2>
  {visual}
  <p class="concept">{text(asset.get('concept', ''))}</p>
  <details>
    <summary>Промпт и параметры</summary>
    <dl><dt>Состояние</dt><dd>{status}</dd><dt>Тема</dt><dd>{text(asset.get('theme', ''))}</dd>
    <dt>Период</dt><dd>{text(asset.get('period', ''))}</dd><dt>Кадр</dt><dd>{text(aspect)}</dd>
    <dt>Предлагаемый слот</dt><dd>{text(asset.get('suggested_slot', ''))}</dd>
    <dt>Применение</dt><dd>{text(asset.get('application', ''))}</dd>
    <dt>Фон</dt><dd>{'Прозрачный PNG' if transparent else 'Фотографическая сцена'}</dd>
    <dt>Файл</dt><dd><code>{text(relative.as_posix())}</code></dd></dl>
    <pre>{text(asset['generation_prompt'])}</pre>
  </details>
</article>''', exists


def write_catalog(new_assets):
    old_folder = "letopis-visuals-2026-11-28"
    old_manifest = json.loads((ROOT.parent / old_folder / "manifest.json").read_text(encoding="utf-8-sig"))
    collections = [
        (old_folder, old_manifest["assets"], "Серия 1 / Кадры 1-50", "Семья и воспоминания", "Архив, портреты, близкие, места и семейные события.", {11, 41}),
        (ROOT.name, new_assets, "Серия 2 / Кадры 51-100", "Предметы и путешествия", "Конструкции альбомов, прозрачные закладки, реликвии, люди в пути и атмосфера мест.", {61, 81}),
    ]
    sections = []
    saved_total = 0
    for folder, assets, label, title, description, preview_ids in collections:
        saved = sum((ROOT.parent / folder / asset["file"]).is_file() for asset in assets)
        saved_total += saved
        previews = []
        for asset in assets:
            if asset["id"] in preview_ids and (ROOT.parent / folder / asset["file"]).is_file():
                url = quote(f"{folder}/{Path(asset['file']).as_posix()}", safe="/")
                cutout = " cutout" if asset.get("transparent_background") else ""
                previews.append(f'<a class="thumbnail{cutout}" href="{url}"><img src="{url}" alt="{text(asset["title"])}. Создано ИИ."></a>')
        sections.append(f'''<article><p class="label">{text(label)}</p><h2>{text(title)}</h2>
<p>{text(description)}</p><p class="count">Сохранено {saved} из {len(assets)} изображений</p>
<div class="previews">{''.join(previews)}</div>
<a class="gallery-link" href="{quote(folder, safe='')}/gallery.html">Открыть 50 заготовок</a></article>''')
    catalog = '''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>Летопись - каталог 100 заготовок</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3ece0;color:#1d1a16;font:17px/1.55 Georgia,serif}.wrap{max-width:1320px;width:calc(100% - 64px);margin:auto}header{padding:52px 0 28px;border-bottom:1px solid #cabeac}
h1{font-size:clamp(34px,5vw,64px);font-weight:400;line-height:1.15;max-width:850px;margin:14px 0 24px}header p{max-width:820px}.label,.count,.gallery-link{font:14px/1.5 system-ui,sans-serif}.label{color:#675b4a}.count{margin:18px 0}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px;padding:36px 0 56px}article{min-width:0}h2{font-size:30px;font-weight:400;margin:12px 0}
.previews{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.thumbnail{display:block;aspect-ratio:4/5;background:#e4d9c7;overflow:hidden}.thumbnail img{display:block;width:100%;height:100%;object-fit:contain}.cutout{background-color:#eee8de;background-image:conic-gradient(#d9d2c6 25%,transparent 0 50%,#d9d2c6 0 75%,transparent 0);background-size:24px 24px}
a{color:inherit;text-underline-offset:4px}.gallery-link{display:inline-block;padding:14px 0;min-height:44px}a:hover{color:#80542e}:focus-visible{outline:3px solid #956036;outline-offset:4px}
@media(max-width:650px){.wrap{width:calc(100% - 32px)}header{padding-top:30px}main{grid-template-columns:1fr;gap:36px}.previews{gap:8px}}
</style></head><body><header><div class="wrap"><p class="label">Летопись / Библиотека концепций</p><h1>100 заготовок для семейной истории</h1>
<p>Две самостоятельные серии по 50 концепций. Все изображения созданы ИИ; люди и истории вымышлены. Прозрачные PNG показаны на шахматной подложке страницы, исходные файлы её не содержат.</p>
<p class="count">Всего сохранено __SAVED__ из 100 отдельных изображений.</p></div></header>
<main class="wrap">__SECTIONS__</main></body></html>'''
    catalog = catalog.replace("__SAVED__", str(saved_total)).replace("__SECTIONS__", "\n".join(sections))
    (ROOT.parent / "letopis-catalog.html").write_text(catalog, encoding="utf-8")


def write_concepts(assets):
    proposals = {
        "Альбомы и конструкции": "При отдельной реализации интерфейса можно предусмотреть смену разворота по нажатию. Для этого потребуется согласовать устройство страниц и подготовить отдельные слои или изображения разворотов.",
        "Закладки и детали": "Прозрачная закладка может стать оформлением выбранной главы. Подпись и состояние выбора следует задавать средствами интерфейса; растровый объект остаётся декоративным элементом.",
        "Дорожные реликвии": "К предмету можно добавить короткое воспоминание, раскрывающееся по нажатию. Семейные сведения и текст добавляются отдельно после согласования содержания.",
        "Люди в пути": "Один дорожный кадр может открывать главу с личной историей поездки и обычной галереей. Связи между героями и хронология задаются данными семьи.",
        "Места и атмосфера": "Широкий кадр можно использовать в начале главы с заголовком в свободной области. Спокойного статичного показа достаточно для первичного макета.",
    }
    lines = [
        "# Летопись: 50 новых концепций, 51-100", "",
        "Перечень собран из текущего `manifest.json`. Названия, применение, предлагаемые слоты и прозрачность соответствуют заданиям генерации. Все изображения являются синтетическими демонстрациями.", "",
        "## Отличие от первой серии", "",
        "Первая серия 1-50 охватывает семейный архив, характеры, близких, привычные места и события. Вторая серия переносит внимание на устройство альбомов и отдельных элементов вёрстки, дорожные вещи, новые действия путешественников и атмосферу мест. Новые заготовки сохраняют общий спокойный визуальный язык Летописи.", "",
        "| Первая серия | Вторая серия |", "|---|---|",
        "| Архивные сцены и семейные вещи | Конструкции альбомов, страницы, крепления и слои |",
        "| Портреты и отношения | Отдельные прозрачные закладки и детали для композиции |",
        "| Семейные события | Дорожные реликвии и следы конкретных путешествий |",
        "| Привычные места и общие поездки | Новые действия людей в пути и самостоятельные атмосферные кадры |", "",
        "Ниже идеи применения описывают возможное оформление. Они не являются согласованным контрактом поведения сайта. Перелистывание, навигация по закладкам и раскрытие историй требуют отдельной задачи и проверки после выбора концепций.", "",
    ]
    for category in dict.fromkeys(asset["category"] for asset in assets):
        lines.extend([f"## {category}", "", proposals[category], "", "| ID | Заготовка | Применение | Предлагаемый слот | Фон |", "|---|---|---|---|---|"])
        for asset in assets:
            if asset["category"] != category:
                continue
            values = [asset["id"], asset["title"], asset["application"], asset.get("suggested_slot", ""), "Прозрачный PNG" if asset.get("transparent_background") else "Фотографическая сцена"]
            cells = [str(value).replace("|", "\\|").replace("\n", " ") for value in values]
            lines.append("| " + " | ".join(cells) + " |")
        lines.append("")
    lines.extend(["## Просмотр", "", "[Галерея серии 51-100](gallery.html), [общий каталог 100 заготовок](../letopis-catalog.html), [полные промпты и параметры](manifest.json).", "", "Шахматная подложка прозрачных деталей задаётся CSS галереи. Для оценки краёв исходные PNG дополнительно просматриваются на светлом и тёмном фоне; фон не записывается в сами изображения.", ""])
    (ROOT / "CONCEPTS.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8-sig"))
    assets = manifest["assets"]
    if len(assets) != 50 or {item["id"] for item in assets} != set(range(51, 101)):
        raise ValueError("The collection must contain exactly ids 51 through 100")
    if len({item["file"] for item in assets}) != 50:
        raise ValueError("Each asset must have its own output path")
    cards = [render_card(asset) for asset in assets]
    generated = sum(exists for _, exists in cards)
    categories = list(dict.fromkeys(asset["category"] for asset in assets))
    filters = '<button type="button" data-filter="" aria-pressed="true">Все 50</button>'
    filters += "".join(
        f'<button type="button" data-filter="{text(category)}" aria-pressed="false">{text(category)}</button>'
        for category in categories
    )
    document = '''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Летопись - предметы и путешествия, 51-100</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f3ece0;color:#1d1a16;font:16px/1.55 Georgia,serif}
.wrap{width:min(1320px,calc(100% - 64px));margin:auto}header{padding:56px 0 30px;border-bottom:1px solid #cabeac}
.eyebrow,.number,.filters,nav,.status,summary,dl{font-family:system-ui,sans-serif}.eyebrow{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#675b4a}
h1{font-size:clamp(34px,4.5vw,62px);line-height:1.1;font-weight:400;max-width:850px;margin:18px 0 24px}
header p{max-width:780px}a{color:inherit;text-underline-offset:4px}a:hover{color:#80542e}
nav{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:14px;margin-top:26px}nav a{padding:10px 0}
.status{color:#5d5141;font-size:14px}.filters{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 12px}
button{border:1px solid #ad9c85;background:transparent;color:inherit;font:14px system-ui,sans-serif;padding:11px 16px;min-height:44px;cursor:pointer;border-radius:3px}
button:hover{background:#e7dccb}button[aria-pressed=true]{background:#1d1a16;color:#f3ece0;border-color:#1d1a16}
:focus-visible{outline:3px solid #956036;outline-offset:4px}.shown{font:14px system-ui,sans-serif;color:#675b4a;margin-bottom:26px}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:48px 26px;padding-bottom:64px}.card{min-width:0}
.card[hidden]{display:none}.card-heading{display:flex;gap:12px;align-items:center;font:12px system-ui,sans-serif;color:#675b4a}
.number{font-variant-numeric:tabular-nums;color:#80542e}h2{font-size:24px;font-weight:400;line-height:1.25;margin:10px 0 18px;min-height:60px}
.visual{display:block;width:100%;aspect-ratio:var(--ratio);background:#e4d9c7;overflow:hidden}.visual img{display:block;width:100%;height:100%;object-fit:contain;transition:transform .2s}
.visual.cutout{background-color:#eee8de;background-image:conic-gradient(#d9d2c6 25%,transparent 0 50%,#d9d2c6 0 75%,transparent 0);background-size:24px 24px}
a.visual:hover img{transform:scale(1.015)}.pending{display:grid;place-items:center;border:1px solid #cabeac;color:#675b4a;font:14px system-ui,sans-serif}
.concept{font-size:16px;margin:16px 0}.card details{border-top:1px solid #cabeac;padding-top:12px}summary{cursor:pointer;min-height:44px;padding:10px 0;font-size:14px}
dl{font-size:13px;margin:12px 0}dt{color:#675b4a;margin-top:8px}dd{margin:0;overflow-wrap:anywhere}pre{font:12px/1.6 ui-monospace,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#e8dece;padding:16px}
footer{border-top:1px solid #cabeac;padding:26px 0 40px;font:14px system-ui,sans-serif;color:#675b4a}
@media(max-width:1050px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wrap{width:calc(100% - 40px)}}
@media(max-width:580px){.wrap{width:calc(100% - 32px)}header{padding-top:32px}.grid{grid-template-columns:1fr;gap:34px}h2{min-height:0}.filters button{flex-grow:1}nav{gap:0 18px}}
@media(prefers-reduced-motion:reduce){.visual img{transition:none}}
</style>
</head>
<body>
<header><div class="wrap"><div class="eyebrow">Летопись / Визуальная библиотека</div>
<h1>Предметы и путешествия: 51-100</h1>
<p>Альбомы, закладки, дорожные реликвии, люди в пути и места воспоминаний. Все изображения созданы ИИ для демонстрации. Люди и семейные истории вымышлены. Шахматная подложка прозрачных PNG показана только средствами страницы.</p>
<p class="status">Изображений сохранено: <strong>__GENERATED__ из 50</strong>. Состояние учитывает наличие отдельных файлов на момент сборки галереи.</p>
<nav aria-label="Материалы исследования"><a href="../letopis-catalog.html">Каталог 100 заготовок</a><a href="../letopis-visuals-2026-11-28/gallery.html">Первая серия 1-50</a><a href="CONCEPTS.md">Концепции и применение</a><a href="manifest.json">Манифест 51-100</a><a href="README.md">Проверки серии</a></nav>
</div></header>
<main class="wrap"><div class="filters" role="group" aria-label="Фильтр по категории">__FILTERS__</div>
<p class="shown" aria-live="polite">Показано: <span id="visible-count">50</span> из 50</p>
<div class="grid">__CARDS__</div></main>
<footer><div class="wrap">Локальная подборка для выбора концепций. Нажмите на готовое изображение, чтобы открыть оригинал. Параметры и полный промпт находятся в каждой карточке.</div></footer>
<script>
const buttons = document.querySelectorAll('[data-filter]');
const cards = document.querySelectorAll('[data-category]');
buttons.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  cards.forEach(card => {
    card.hidden = Boolean(category && card.dataset.category !== category);
    if (!card.hidden) count += 1;
  });
  document.getElementById('visible-count').textContent = count;
}));
</script>
</body>
</html>
'''
    document = document.replace("__GENERATED__", str(generated)).replace("__FILTERS__", filters)
    document = document.replace("__CARDS__", "\n".join(card for card, _ in cards))
    (ROOT / "gallery.html").write_text(document, encoding="utf-8")
    write_concepts(assets)
    write_catalog(assets)
    print(f"gallery.html: {len(assets)} cards, {len(categories)} categories, {generated} images saved")


if __name__ == "__main__":
    main()
