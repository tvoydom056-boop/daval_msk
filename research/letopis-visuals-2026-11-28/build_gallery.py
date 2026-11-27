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
    aspect = asset.get("aspect_ratio", "3:2")
    ratio = aspect.replace(":", " / ") if re.fullmatch(r"\d+:\d+", aspect) else "3 / 2"
    visual = (
        f'<a class="visual" href="{url}" target="_blank" rel="noopener" '
        f'aria-label="Открыть оригинал: {title}" style="--ratio:{ratio}">'
        f'<img src="{url}" alt="{title}. Вымышленная сцена, созданная ИИ." loading="lazy"></a>'
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
    <dt>Файл</dt><dd><code>{text(relative.as_posix())}</code></dd></dl>
    <pre>{text(asset['generation_prompt'])}</pre>
  </details>
</article>''', exists


def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8-sig"))
    assets = manifest["assets"]
    if len(assets) != 50 or len({item["id"] for item in assets}) != 50:
        raise ValueError("The collection must contain exactly 50 unique asset ids")
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
<title>Летопись - 50 визуальных заготовок</title>
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
<h1>Семейные истории в 50 кадрах</h1>
<p>Архив, характеры, близкие, места и события. Все люди и сцены вымышлены; изображения создаются ИИ для демонстрации. Кадры не являются подлинными семейными документами.</p>
<p class="status">Изображений сохранено: <strong>__GENERATED__ из 50</strong>. Состояние учитывает наличие отдельных файлов на момент сборки галереи.</p>
<nav aria-label="Материалы исследования"><a href="REFERENCES.md">Референсы и источники</a><a href="PROMPT.md">Основной промпт</a><a href="manifest.json">Манифест 50 кадров</a><a href="README.md">Аудит и проверки</a></nav>
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
    print(f"gallery.html: {len(assets)} cards, {len(categories)} categories, {generated} images saved")


if __name__ == "__main__":
    main()
