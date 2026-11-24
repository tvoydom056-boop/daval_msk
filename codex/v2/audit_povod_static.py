"""Статические проверки и честный расчётный лист, когда Chromium недоступен."""
import json, re, subprocess, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'codex/v2/povod_qa'
files = [ROOT/'build_artifacts.py'] + [ROOT/'povod'/n for n in
         ['index.html','styles.css','app.js','data.js','wedding.html','birthday.html','anniversary.html','jubilee.html','artifact.html']]
source = {p.name:p.read_text(encoding='utf-8-sig') for p in files}
old = subprocess.check_output(['git','show','HEAD:povod/data.js'],cwd=ROOT).decode('utf-8')
assert source['data.js'].startswith(old.rstrip()), 'Original data was changed'
dashes = {p.name:sum(source[p.name].count(chr(c)) for c in (0x2013,0x2014)) for p in files}
assert not any(dashes.values()), dashes
colors = re.findall(r'#[0-9a-fA-F]+\b',source['styles.css'])
assert not [c for c in colors if len(c)-1 not in (3,4,6,8)], 'Invalid CSS color'
assert source['app.js'].count('requestAnimationFrame(tick)') == 2
for k in ['wedding','birthday','anniversary','jubilee']:
    assert 'index.html#'+k in source[k+'.html']
assert '<script src="app.js">' not in source['artifact.html']
assert '<link rel="stylesheet" href="styles.css">' not in source['artifact.html']
statuses={}
for page in ['','wedding.html','birthday.html','anniversary.html','jubilee.html','artifact.html','assets/v2/video/']:
    with urllib.request.urlopen('http://127.0.0.1:8770/povod/'+page) as r:
        statuses[page or 'index']=r.status
videos = sorted(p.stem for p in (ROOT/'povod/assets/v2/video').glob('*.mp4'))
expected=['slide-wedding','slide-birthday','slide-anniversary','slide-jubilee','story-meet','story-trip','story-proposal','story-today','clouds']
result = {
    'sourceDataPreserved':True,'unicodeDashes':dashes,'singleRafLoop':True,
    'http':statuses,'artifactBytes':(ROOT/'povod/artifact.html').stat().st_size,
    'videosAvailable':videos,'posterFallback':[k for k in expected if k not in videos],
    'titleWidthsAt375':{'available':335,'birthday':329.3,'anniversary':323.0,'fontPx':64,
                       'method':'Onest 800 TTF metrics, letter spacing and horizontal scale'},
    'calculatedWidths':{
        '1440x900':{'container':1280,'card':(1280-4*18)/5,'phone':318,'phoneColumn':(1280-100)/2},
        '375x812':{'container':335,'card':(335-13)/2,'phone':292,'phoneColumn':335}
    },
    'browser':{'started':False,'reason':'Chromium spawn EPERM; Python WinError 5; CUA browser host unavailable',
               'overflow':None,'consoleErrors':None,'screenshots':False}
}
OUT.mkdir(exist_ok=True)
(OUT/'static_results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')

W,H=1600,2210
canvas=Image.new('RGB',(W,H),'#fbe7da')
draw=ImageDraw.Draw(canvas)
font_path='C:/Windows/Fonts/arial.ttf'
font_bold='C:/Windows/Fonts/arialbd.ttf'
def font(size,bold=False): return ImageFont.truetype(font_bold if bold else font_path,size)
def text(x,y,s,size=24,bold=False,fill='#1d1a1c'): draw.text((x,y),s,font=font(size,bold),fill=fill)
def wrap(s,maxw,size):
    lines=[];line=''
    for word in s.split():
        nxt=(line+' '+word).strip()
        if draw.textlength(nxt,font=font(size))>maxw and line: lines.append(line);line=word
        else: line=nxt
    if line: lines.append(line)
    return lines
def paragraph(x,y,s,maxw,size=24,fill='#5c5156'):
    for line in wrap(s,maxw,size):
        text(x,y,line,size,fill=fill);y+=int(size*1.4)
    return y
def photo(path,box):
    x,y,w,h=box
    im=ImageOps.fit(Image.open(path).convert('RGB'),(w,h))
    canvas.paste(im,(x,y))

text(54,45,'ПОВОД V2',58,True)
text(55,123,'РАСЧЁТНЫЙ ЛИСТ / 1440x900 И 375x812',25)
draw.rounded_rectangle((54,180,1546,335),8,fill='#1d1a1c')
text(80,204,'Браузерный рендер недоступен: Chromium spawn EPERM',29,True,'#f7d9c6')
paragraph(80,253,'Скриншоты не получены. Ниже - исходные постеры, расчёты ширины и результаты проверки логики. Это не изображение готового интерфейса.',1420,23,'#fdf0e7')
text(54,375,'Витрина / исходные постеры четырёх поводов',31,True)
for i,(key,title) in enumerate([('wedding','Свадьба'),('birthday','День рождения'),('anniversary','Годовщина'),('jubilee','Юбилей')]):
    x=54+(i%2)*760;y=432+(i//2)*273
    photo(ROOT/f'povod/assets/v2/scenes/slide-{key}.jpg',(x,y,732,220))
    text(x,y+230,title,22)
text(54,1002,'Свадьба / четыре сцены с точными подписями задания',31,True)
scene_labels=[
    ('story-meet','2019. Кофейня на Покровке, он опоздал на 20 минут'),
    ('story-trip','Первое море вдвоём. Она боялась высоты, он держал за руку'),
    ('story-proposal','Крыша, ноябрь, плюс два. Она сказала «да» раньше, чем он договорил'),
    ('story-today','Сегодня у них есть собака Булка и сайт, который откроют на свадьбе')
]
for i,(key,label) in enumerate(scene_labels):
    x=54+i*380
    photo(ROOT/f'povod/assets/v2/scenes/{key}.jpg',(x,1068,352,198))
    paragraph(x,1284,label,352,21)
text(54,1436,'Расчёт адаптивной сетки по CSS',31,True)
rows=[
    ('Параметр','1440x900','375x812'),
    ('Ширина контента','1280 px','335 px'),
    ('Карточки поводов','5 колонок, 241,6 x 322,1 px','2 колонки, 161 x 214,7 px'),
    ('Телефон / доступная колонка','318 / 590 px','292 / 335 px'),
    ('Длинные заголовки','Размер clamp, 129,6 px','329,3 и 323 px при 64 px'),
    ('Фактический overflow / консоль','Не измерены в браузере','Не измерены в браузере')
]
y=1490
for i,row in enumerate(rows):
    if i==0: draw.rectangle((54,y,1546,y+54),fill='#e9b89c')
    draw.line((54,y+54,1546,y+54),fill='#c9a58e',width=1)
    for x,s in zip([68,560,1080],row): text(x,y+14,s,20,i==0)
    y+=54
text(54,1860,'Автопроверки логики и сборки',31,True)
paragraph(54,1910,'Пройдены: синтаксис JS, DOM исходной страницы и встроенного artifact, автосмена, миниатюры, маршруты и назад, четыре сцены каждого повода, все 9 типов блоков, квиз, причины, демо-форма, reduced motion, слоты и наличие фото.',1490,24)
paragraph(54,2035,'Исходные данные сохранены. Длинных и средних тире нет. HTTP 200. Видео, которых ещё нет, остаются на постерах. Лист не подтверждает визуальную приёмку; повторяемый браузерный прогон: python codex/v2/check_povod.py.',1490,23)
canvas.save(ROOT/'codex/v2/sheet_povod_page.jpg',quality=93)
print(json.dumps(result,ensure_ascii=False,indent=2))

