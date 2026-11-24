#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the team report from PLAN.md and the supplied prototype files.

Run: python build_report.py
Screenshots are refreshed separately with capture_screenshots.py.
All sources remain read-only. No network calls or paid services are used here.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = HERE / 'Отчёт_для_команды_Летопись_и_Повод.pdf'
SHOTS = HERE / 'screenshots'
QA = HERE / 'qa'
DARK = colors.HexColor('#1D1A16')
BRONZE = colors.HexColor('#9C7644')
MUTED = colors.HexColor('#6F6860')
LINE = colors.HexColor('#D6CEC3')
PW, PH = A4
M = 46
CW = PW - 2 * M


def clean(s):
    return str(s).replace('\u2013', '-').replace('\u2014', '-').replace('\u2011', '-')


def markup(s):
    s = escape(clean(s))
    s = re.sub(r'(?m)^ +', lambda match: '&#160;' * len(match.group()), s)
    s = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'`([^`]+)`', r'\1', s)
    return s.replace('\n', '<br/>')


class Report:
    def __init__(self):
        fonts = Path('C:/Windows/Fonts')
        pdfmetrics.registerFont(TTFont('Segoe', str(fonts / 'segoeui.ttf')))
        pdfmetrics.registerFont(TTFont('Segoe-Bold', str(fonts / 'segoeuib.ttf')))
        pdfmetrics.registerFontFamily('Segoe', normal='Segoe', bold='Segoe-Bold', italic='Segoe', boldItalic='Segoe-Bold')
        self.c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
        self.c.setTitle('Летопись и Повод. План запуска двух сайтов')
        self.c.setAuthor('Виталий')
        self.c.setSubject('Рабочие названия, версия 1. 24.11.2026')
        self.page = 0
        self.y = PH - M
        self.bounds = []

    def para(self, text, size=10.2, leading=None, after=8, bold=False, color=DARK,
             x=None, width=None):
        x = M if x is None else x
        width = CW if width is None else width
        if 9 <= size <= 11:
            size += .5
        style = ParagraphStyle('p', fontName='Segoe-Bold' if bold else 'Segoe',
                               fontSize=size, leading=leading or size * 1.38,
                               textColor=color, alignment=TA_LEFT,
                               splitLongWords=True, spaceBefore=0, spaceAfter=0)
        p = Paragraph(markup(text), style)
        _, h = p.wrap(width, PH)
        self._check(h)
        p.drawOn(self.c, x, self.y - h)
        self.y -= h + after
        return h

    def _check(self, h):
        if self.y - h < 57:
            raise ValueError(f'Page {self.page}: content bottom {self.y-h:.1f}pt is below 57pt')

    def start(self, number=None, title=None, subtitle=None):
        if self.page:
            self.finish()
            self.c.showPage()
        self.page += 1
        self.y = PH - M
        if number:
            self.para(number, size=8.4, bold=True, color=BRONZE, after=8)
        if title:
            self.para(title, size=25, leading=29, after=10, bold=True)
        if subtitle:
            self.para(subtitle, size=9.4, color=MUTED, after=12)

    def finish(self):
        self.bounds.append({'page': self.page, 'content_bottom_pt': round(self.y, 2)})
        self.c.setStrokeColor(LINE)
        self.c.setLineWidth(.45)
        self.c.line(M, 43, PW-M, 43)
        self.c.setFont('Segoe', 8.2)
        self.c.setFillColor(MUTED)
        self.c.drawString(M, 28, f'Летопись и Повод · План запуска · стр {self.page}')

    def sub(self, s, before=7, after=6):
        self.y -= before
        self.para(s, size=12, leading=15.3, bold=True, after=after)

    def note(self, s, size=9.5):
        self.para(s, size=size, color=MUTED, after=9)

    def numbered(self, lines, size=10, gap=7):
        for n, s in enumerate(lines, 1):
            self.para(f'**{n}.** {s}', size=size, after=gap)

    def table(self, rows, widths, size=9.1, leading=None, pad=5, after=10,
              bold_last=False):
        size += .6
        data = []
        for n, row in enumerate(rows):
            data.append([Paragraph(markup(v), ParagraphStyle(
                'cell', fontName='Segoe-Bold' if n == 0 or (bold_last and n == len(rows)-1) else 'Segoe',
                fontSize=size, leading=leading or size*1.31, textColor=DARK,
                splitLongWords=True)) for v in row])
        t = Table(data, colWidths=[CW*w for w in widths], hAlign='LEFT')
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), pad),
            ('RIGHTPADDING', (0,0), (-1,-1), pad),
            ('TOPPADDING', (0,0), (-1,-1), pad),
            ('BOTTOMPADDING', (0,0), (-1,-1), pad+1),
            ('LINEABOVE', (0,0), (-1,0), .65, BRONZE),
            ('LINEBELOW', (0,0), (-1,0), .65, BRONZE),
            ('LINEBELOW', (0,1), (-1,-1), .35, LINE),
            ('LINEAFTER', (0,0), (-2,-1), .3, LINE),
        ]))
        _, h = t.wrap(CW, PH)
        self._check(h)
        t.drawOn(self.c, M, self.y-h)
        self.y -= h + after

    def shot(self, filename, maxheight, caption, width=None):
        path = SHOTS / filename
        iw, ih = Image.open(path).size
        width = CW if width is None else width
        h = min(maxheight, width*ih/iw)
        w = h*iw/ih
        x = M+(CW-w)/2
        self._check(h)
        self.c.drawImage(str(path), x, self.y-h, width=w, height=h, mask='auto')
        self.c.setStrokeColor(LINE)
        self.c.setLineWidth(.35)
        self.c.rect(x, self.y-h, w, h)
        self.y -= h+7
        self.para(caption, size=8.8, leading=11.5, color=MUTED, after=14)

    def save(self):
        self.finish()
        self.c.save()
        (QA / 'layout_bounds.json').write_text(json.dumps(self.bounds, indent=2), encoding='utf-8')


def build():
    QA.mkdir(exist_ok=True)
    # Refresh the automatic source extraction; never edit the prototype files.
    subprocess.run([sys.executable, str(HERE / 'extract_sources.py')], check=True, stdout=subprocess.DEVNULL)
    source = json.loads((HERE / 'source_data.json').read_text(encoding='utf-8'))
    sec = source['sections']
    tables = lambda n: sec[str(n)]['tables']
    slots = json.loads((HERE / 'media_slots.json').read_text(encoding='utf-8'))['slots']
    r = Report()

    # 1. Cover.
    r.start()
    r.para('24.11.2026', size=10, color=BRONZE, bold=True, after=20)
    r.para('Летопись и Повод.\nПлан запуска\nдвух сайтов', size=31, leading=36, bold=True, after=18)
    r.para('Рабочие названия, версия 1', size=12, color=MUTED, after=27)
    r.shot('letopis-hero.png', 360, '«Летопись» · Первый экран макета · Десктоп, ширина 1440 px')
    r.para('Для совместной работы Виталия и друга-программиста', size=10.5, after=9)
    r.note('Суть проекта, продукты, бюджет, передача макетов и план на первые 3 месяца.')

    # 2. The project in one page.
    r.start('02 / ПРОЕКТ', 'Коротко о проекте')
    r.para('Мы делаем красивые личные сайты-истории под ключ. Человек присылает фото, голосовые и пару фактов, а мы собираем страницу уровня хорошего лендинга: восстановленные и раскрашенные фото, текст, голос, видео, QR-код.', size=11, after=16)
    r.sub('Два отдельных бренда, одна общая кухня')
    brand_table = tables(1)[0]
    brand_table[0][0] = 'Параметр'
    r.table(brand_table, [.18,.41,.41], size=10, pad=7, after=18)
    r.sub('Как устроены две витрины')
    r.para('**«Летопись»** - одна длинная страница: пример памяти, сравнение фото до/после, древо, голос и видео, QR на памятник, результат для семьи, цены, шаги, вопросы и заявка.', after=12)
    r.para('**«Повод»** - главная с выбором события. Каждый повод открывает отдельный лендинг: пример подарка внутри телефона, состав, цены, шаги, вопросы и заявка. В плане есть также свой повод.', after=12)
    r.para('**Клиентские страницы:** /p/<адрес> на том же домене, открытые или по паролю.', after=0)

    # 3. Competitors.
    r.start('03 / КОНКУРЕНТЫ', 'Конкуренты и выводы', 'Данные разбора из PLAN.md · Проверено в плане 24.11.2026')
    r.table(tables(2)[0], [.17,.30,.19,.34], size=8.55, pad=5, after=12)
    r.sub('Три вывода для запуска')
    r.numbered([
        'Цена 2-4 тыс. ₽ за страницу на рынке уже есть. За неё продаём ограниченный пакет на готовом шаблоне. Основные деньги - в «Истории», где работаем с материалами.',
        'У MemorialQR нет ежегодной платы. Предложение для «Летописи»: 3 года размещения включены, дальше 390 ₽/год. Семья получает автономную копию: PDF + HTML-архив.',
        'Идею легко повторить. Защищаемся скоростью, качеством подачи и партнёрами: ритуальными агентствами, фотографами, свадебными организаторами.',
    ], size=9.7, gap=8)

    # 4. Letopis products plus all storage numbers from section 3.
    r.start('04 / ПРОДУКТЫ И ЦЕНЫ', '«Летопись»', 'Тестовые цены из PLAN.md. Правила и цены нужно утвердить вдвоём.')
    r.table(tables(3)[0], [.205,.505,.17,.12], size=9.1, pad=5, after=6)
    r.sub('Дополнения и сроки')
    r.para('Видео-воспоминание 60 сек из фото - от 4 900 ₽; металлическая QR-табличка через партнёра - ~1 500 ₽; ещё один человек в древо - 900 ₽; продление после 3 лет - 390 ₽/год.', size=9.8, after=6)
    r.para('«Страница» - 3-5 дней; «История жизни» - 5-7 дней от полного комплекта материалов.', size=9.8, after=8)
    r.sub('Сколько стоит хранение')
    r.table(tables(3)[1], [.76,.24], size=9, pad=4, after=6)
    r.note('390 ₽/год покрывают хранение с запасом даже при 50 клиентах и остаются внизу диапазона 200-1 000 ₽. У главного конкурента продления нет, поэтому первые 3 года включаем в цену.', size=9.2)

    # 5. Povod products and additions, with the unresolved price explicitly retained.
    r.start('04 / ПРОДУКТЫ И ЦЕНЫ · ПРОДОЛЖЕНИЕ', '«Повод»', 'Тестовые цены. Основной пакет в расчётах - 4 490 ₽.')
    r.table(tables(3)[2], [.20,.51,.17,.12], size=9.6, pad=6, after=9)
    r.para('Свадьба считается от «Истории», потому что материалов больше. Размещение 1 год включено, продление - 290 ₽/год. Приём «1 984 ₽ вместо 2 000» оставляем для акций.', size=10, after=10)
    r.sub('Почему «История» стоит 4 490 ₽')
    r.para('Входная цена в рекламе - «Мини» за 1 990 ₽. «История» требует ~3 часов: разбор голосовых, сбор поздравлений от друзей, письмо, правки. При цене 2 990 ₽ после рекламы, налога и эквайринга остаётся ~1 000-1 500 ₽ на двоих за 3 часа. MySurprize берёт от 3 390 ₽ за более простой формат.', size=10, after=10)
    r.note('Окончательный выбор 4 490 ₽ или 2 990 ₽ - вопрос для совместного решения (раздел 12 отчёта).')
    r.sub('Дополнения')
    r.table([
        ['Услуга','Цена'],
        ['Гостевой альбом по QR для свадьбы','+1 990 ₽'],
        ['Срочно за сутки','+1 000 ₽'],
        ['Печатная открытка с QR','от 300 ₽'],
        ['Реставрация старых фото сверх трёх включённых','250 ₽ за снимок'],
        ['Новая глава к следующей годовщине','990 ₽'],
    ], [.76,.24], size=9.4, pad=4, after=10)
    r.sub('Рекомендации и партнёры')
    r.para('Порекомендовал другу: другу скидка 5 %, тебе 300 ₽ на следующий заказ. Партнёру (ритуальное агентство, фотограф) - 1 000 ₽ с оплаченного основного пакета.', size=9.8, after=0)

    # 6. Economics and the exact 50,000 budget.
    r.start('05 / ЭКОНОМИКА И БЮДЖЕТ', 'Экономика запуска')
    r.sub('Один заказ: грубый расчёт', before=0)
    r.table(tables(4)[0], [.48,.26,.26], size=8.9, pad=4, after=5)
    r.note('Главный риск - стоимость привлечения клиента. Пока она не измерена, все расчёты условные. Основной пакет продаём как главный, дешёвый держим как вход.', size=9.1)
    r.sub('Бюджет до 50 000 ₽', before=3)
    r.para('Нейросети уже оплачены работой. Свой труд в бюджет тоже не включён.', size=9.1, after=5)
    r.table(tables(5)[0], [.80,.20], size=8.8, pad=3.5, after=7, bold_last=True)
    r.para('**До первой оплаты:** только обязательное (~22 700 ₽) и одна волна рекламы 6 500 ₽, всего не больше **29 200 ₽**. Вторая и третья волна - после первых оплат.', size=9.3, after=6)
    r.para('**Безубыточность:** 50 000 ₽ / ~5 000 ₽ остатка с «Истории жизни» = около 10 таких заказов или ~15 «Историй» «Повода».', size=9.3, after=0)

    # 7-9. Prototype screenshots: 6 desktop views including the cover + 1 mobile.
    r.start('06 / ЧТО ЕСТЬ В МАКЕТАХ', '«Летопись»: память и древо', 'Первый экран показан на обложке. Ниже - две отдельные секции макета.')
    r.shot('letopis-example.png', 250, 'Пример страницы памяти · /letopis/#example · Портрет, биография и главы истории')
    r.shot('letopis-tree.png', 250, 'Семейное древо · /letopis/#tree · Интерактивные связи родственников')

    r.start('06 / ЧТО ЕСТЬ В МАКЕТАХ · ПРОДОЛЖЕНИЕ', 'Цены и выбор повода')
    r.shot('letopis-prices.png', 258, '«Летопись»: цены · /letopis/#prices · Три пакета и состав предложения')
    r.shot('povod-occasions.png', 258, '«Повод»: главная с выбором события · /povod/#occasions · Переход к отдельному лендингу')

    r.start('06 / ЧТО ЕСТЬ В МАКЕТАХ · ПРОДОЛЖЕНИЕ', 'Свадьба и мобильный экран')
    r.shot('povod-wedding.png', 295, '«Повод»: свадебный лендинг с телефоном-примером · /povod/wedding.html#demo')
    # The mobile capture is shown at a readable scale alongside its explanation.
    iw, ih = Image.open(SHOTS / 'mobile.png').size
    h = 270
    w = h*iw/ih
    r._check(h)
    mobile_top = r.y
    r.c.drawImage(str(SHOTS / 'mobile.png'), M, mobile_top-h, width=w, height=h, mask='auto')
    r.c.setStrokeColor(LINE)
    r.c.setLineWidth(.35)
    r.c.rect(M, mobile_top-h, w, h)
    tx = M+w+22
    r.para('Мобильная версия', size=15, leading=19, bold=True, x=tx, width=CW-w-22, after=10)
    r.para('Ширина браузера - 375 px.\n\nПервый экран «Повода» на телефоне.\n\nСнимок показывает текущую вёрстку макета.', size=10.4, leading=15, x=tx, width=CW-w-22)
    r.y = mobile_top-h-14

    # 10. File structure and every programmer recommendation from PLAN section 6.
    r.start('07 / ФАЙЛЫ МАКЕТА', 'Как устроены файлы')
    tree = (
        'Сайты памяти и поздравлений/\n'
        '  PLAN.md\n'
        '  letopis/\n'
        '    index.html · styles.css · app.js\n'
        '  povod/\n'
        '    index.html\n'
        '    wedding.html · birthday.html\n'
        '    anniversary.html · jubilee.html\n'
        '    data.js · app.js · styles.css'
    )
    r.para(tree, size=9.5, leading=12.3, after=8)
    r.para('**Запуск:** в папке проекта выполнить python -m http.server и открыть http://localhost:8000/letopis/ и http://localhost:8000/povod/.', size=9.4, after=7)
    r.para('**Тексты «Повода»:** povod/data.js. Кнопка «Слоты медиа» справа внизу подсвечивает места под фото и видео, показывает формат, длительность и сюжет. Это список работ Виталия; полная таблица - в приложении.', size=9.4, after=13)
    r.para('08 / РЕКОМЕНДАЦИИ ПРОГРАММИСТУ', size=8.4, bold=True, color=BRONZE, after=7)
    r.para('Перенос в рабочий сайт', size=20, leading=25, bold=True, after=11)
    # Extract only the six bullets under the specified subsection.
    raw_reco = sec['6']['raw'].split('### Рекомендации программисту',1)[1]
    reco = [line[2:].strip() for line in raw_reco.splitlines() if line.startswith('- ')]
    r.numbered(reco, size=9.4, gap=6)

    # 11. Roles and the full three-month plan.
    r.start('09 / РОЛИ И ПЕРЕДАЧА', 'Кто что делает')
    r.table(tables(7)[0], [.27,.73], size=9.5, pad=6, after=8)
    r.para('Виталий меняет медиа и тексты прямо в макете, друг переносит секции в рабочий проект. Один общий чат и одна таблица заказов: ID, повод, пакет, ответственный, дата, оплата, статус.', size=9.6, after=13)
    r.para('10 / ЭТАПЫ НА 3 МЕСЯЦА', size=8.4, bold=True, color=BRONZE, after=7)
    r.para('От макетов к первым заказам', size=20, leading=25, bold=True, after=10)
    r.table(tables(8)[0], [.15,.62,.23], size=9, pad=4.5, after=9)
    r.para('**Критерий остановки:** если после 3 волн рекламы и партнёров меньше 3 оплат по полной цене, меняем предложение, а не докупаем сервисы.', size=10, after=0)

    # 12. All caveats and the five joint decisions from PLAN.
    r.start('11 / ЧТО ВАЖНО НЕ УПУСТИТЬ', 'Правила работы')
    caveats = [line[2:].strip() for line in sec['9']['raw'].splitlines() if line.startswith('- ')]
    for line in caveats:
        r.para(line, size=10.3, after=13)
    r.y -= 12
    r.para('12 / ЧТО РЕШИТЬ ВДВОЁМ', size=8.4, bold=True, color=BRONZE, after=7)
    r.para('Решения на ближайшие дни', size=22, leading=27, bold=True, after=14)
    decisions = [re.sub(r'^\d+\.\s*','',line) for line in sec['10']['raw'].splitlines() if re.match(r'^\d+\.',line)]
    decisions = [s.replace('(раздел 3)', '(раздел 4 отчёта)') for s in decisions]
    r.numbered(decisions, size=10.3, gap=11)

    # 13-14. Automatically generated appendix, without duplicate shared covers.
    assert len(slots) == 20, f'Media slot count changed: {len(slots)}; review pagination.'
    for index, group in enumerate([slots[:10], slots[10:]]):
        r.start('13 / ПРИЛОЖЕНИЕ · СЛОТЫ МЕДИА',
                '«Летопись»' if index == 0 else '«Повод»',
                'Автоматически собрано из data-slot и heroSlot. Повторы объединены; разные поводы сохранены.')
        rows = [['Сайт','Где на странице','Что поставить']]
        for slot in group:
            rows.append([slot['site'], slot['where'], slot['what']])
        r.table(rows, [.12,.27,.61], size=9.1, pad=5.5, after=10)
        r.note('Источник: ' + ('letopis/index.html, атрибуты data-slot.' if index == 0 else 'povod/index.html, povod/app.js (data-slot), povod/data.js (heroSlot). Общая обложка в телефоне и на весь экран указана один раз.'), size=8.7)

    assert r.page == 14
    r.save()
    print(f'Built {r.page} pages: {OUT.name}')


def verify_and_render():
    import fitz
    from pypdf import PdfReader
    doc = fitz.open(OUT)
    assert len(doc) == 14
    texts = [page.extract_text() or '' for page in PdfReader(OUT).pages]
    extracted = '\n\n'.join(texts)
    (QA / 'extracted_text.txt').write_text(extracted, encoding='utf-8')
    assert '\u2013' not in extracted and '\u2014' not in extracted, 'Forbidden dash in extracted PDF text'
    assert all(t.strip() for t in texts), 'Blank page'
    for n, page in enumerate(doc, 1):
        pix = page.get_pixmap(matrix=fitz.Matrix(1.7,1.7), alpha=False)
        pix.save(QA / f'page-{n:02}.png')
    # A compact overview is supplementary; all full page PNGs are also inspected.
    thumbs = []
    for n in range(1,len(doc)+1):
        im = Image.open(QA / f'page-{n:02}.png').convert('RGB')
        im.thumbnail((298,421))
        thumbs.append(im.copy())
    sheet = Image.new('RGB', (4*318, 4*451), '#DDD8D0')
    from PIL import ImageDraw
    draw = ImageDraw.Draw(sheet)
    for idx, im in enumerate(thumbs):
        x,y = (idx%4)*318+10,(idx//4)*451+10
        sheet.paste(im,(x,y))
        draw.text((x,y+423),str(idx+1),fill='#1D1A16')
    sheet.save(QA / 'overview.png')
    numbers = {
        'letopis_packages': ['3 990 ₽', '7 900 ₽', '14 900 ₽'],
        'povod_packages': ['1 990 ₽', '4 490 ₽', '8 900 ₽'],
        'budget': ['1 500 ₽','7 200 ₽','5 000 ₽','1 000 ₽','3 000 ₽','2 000 ₽','20 000 ₽','3 000 ₽','7 300 ₽','50 000 ₽'],
        'stages': ['Неделя 1','Недели 2-3','Неделя 4','Месяц 2','Месяц 3'],
    }
    for group, values in numbers.items():
        for value in values:
            assert value in extracted, f'Missing {group}: {value}'
    assert sum([1500,7200,5000,1000,3000,2000,20000,3000,7300]) == 50000
    summary = {'pages':len(doc), 'forbidden_dashes':0, 'media_slots':20,
               'budget_sum':50000,'screenshots':7,'numeric_presence_checks':'passed',
               'render_scale':1.7,'rendered_pages':len(doc)}
    (QA / 'validation.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2), encoding='utf-8')
    print('Rendered 14 page PNGs; text and numeric checks passed.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--no-render',action='store_true')
    args = parser.parse_args()
    build()
    if not args.no_render:
        verify_and_render()
