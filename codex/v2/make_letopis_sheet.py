"""Assemble the 24 real Playwright screenshots. Never substitutes missing frames."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
SHOTS = HERE / 'qa_letopis'
STAGES = [
    ('hero', 'Первый экран'),
    ('tree', 'Древо: свободное движение'),
    ('tree_selected', 'Древо: выбран Николай'),
    ('petr_opening', 'Пётр: начало главы'),
    ('petr_panel', 'Пётр: середина панели'),
    ('nikolay_opening', 'Николай: начало главы'),
    ('nikolay_panel', 'Николай: середина панели'),
    ('sergey_opening', 'Сергей: начало главы'),
    ('sergey_panel', 'Сергей: середина панели'),
    ('maria_opening', 'Мария: начало главы'),
    ('maria_panel', 'Мария: середина панели'),
    ('prices', 'Цены'),
]


def build():
    missing = [f'{width}_{stage}.png' for stage, _ in STAGES
               for width in (1440, 375)
               if not (SHOTS / f'{width}_{stage}.png').exists()]
    if missing:
        raise SystemExit('Missing real screenshots: ' + ', '.join(missing))
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
        small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 13)
    except OSError:
        font = ImageFont.load_default(size=18)
        small = ImageFont.load_default(size=13)
    row_height, header = 510, 100
    canvas = Image.new('RGB', (1008, header + len(STAGES) * row_height + 20), '#15130f')
    draw = ImageDraw.Draw(canvas)
    draw.text((28, 22), 'Летопись v2. Проверка страницы', font=font, fill='#f3ece0')
    draw.text((28, 54), '1440 x 900', font=small, fill='#c9894a')
    draw.text((774, 54), '375 x 812', font=small, fill='#c9894a')
    for index, (stage, label) in enumerate(STAGES):
        y = header + index * row_height
        draw.text((28, y), label, font=font, fill='#c9894a')
        desktop = Image.open(SHOTS / f'1440_{stage}.png').convert('RGB')
        mobile = Image.open(SHOTS / f'375_{stage}.png').convert('RGB')
        assert desktop.size == (1440, 900), desktop.size
        assert mobile.size == (375, 812), mobile.size
        canvas.paste(desktop.resize((720, 450), Image.Resampling.LANCZOS), (28, y + 35))
        canvas.paste(mobile.resize((208, 450), Image.Resampling.LANCZOS), (774, y + 35))
    target = HERE / 'sheet_letopis_page.jpg'
    canvas.save(target, quality=91, optimize=True, subsampling=0)
    print(target)


if __name__ == '__main__':
    build()
