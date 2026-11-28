import base64
import hashlib
import json
from pathlib import Path
import time

from PIL import Image, ImageDraw, ImageFont, ImageStat

root = Path(__file__).resolve().parent
shots = root / 'screenshots'
metadata = json.loads((shots / 'capture-metadata.json').read_text(encoding='utf-8'))
names = ['Письмо тебе', 'Личный альбом', 'Журнал о тебе', 'Фотобудка',
         'Праздничная афиша', 'Наш маршрут', 'Семейный музей']
slugs = ['letter', 'album', 'magazine', 'photobooth', 'poster', 'route', 'museum']
timestamp = int(time.time() * 1000)
elements = []
files = {}
preview = Image.new('RGB', (1540, 750), '#202020')
draw = ImageDraw.Draw(preview)
font_path = Path('C:/Windows/Fonts/arial.ttf')
font = ImageFont.truetype(str(font_path), 20)


def base(element_id, x, y, width, height):
    return dict(id=element_id, x=x, y=y, width=width, height=height,
                angle=0, strokeColor='#1e1e1e', backgroundColor='transparent',
                fillStyle='solid', strokeWidth=1, strokeStyle='solid',
                roughness=0, opacity=100, groupIds=[], frameId=None,
                roundness=None, seed=1024 + len(elements), version=1,
                versionNonce=2048 + len(elements), index=None, isDeleted=False,
                boundElements=None, updated=timestamp, created=timestamp,
                link=None, locked=False)


def text_element(element_id, text, x, y, width, size):
    item = base(element_id, x, y, width, size * 1.25)
    item.update(type='text', fontSize=size, baseFontSize=None, fontFamily=2,
                text=text, originalText=text, textAlign='left',
                verticalAlign='top', containerId=None, autoResize=False,
                lineHeight=1.25)
    elements.append(item)


text_element('povod-concepts-heading', 'ПОВОД / 7 КОНЦЕПТОВ / 26.11.2026',
             0, -600, 10800, 220)
text_element('povod-concepts-desktop-label', 'ДЕСКТОП', 0, -260, 1500, 100)
text_element('povod-concepts-mobile-label', 'МОБИЛЬНЫЕ ВЕРСИИ', 0, 850, 3000, 100)
for index, name in enumerate(names):
    text_element(f'povod-concept-{index+1}-title', f'{index+1:02d} / {name}',
                 index * 1600, -135, 1480, 100)

checks = []
for entry in metadata:
    source = Path(entry['file'])
    crop = entry['crop']
    with Image.open(source) as full:
        box = tuple(round(v) for v in (crop['x'], crop['y'],
                    crop['x'] + crop['width'], crop['y'] + crop['height']))
        if box[0] < 0 or box[1] < 0 or box[2] > full.width or box[3] > full.height:
            raise ValueError(f'Crop outside screenshot: {source.name} {box} {full.size}')
        image = full.crop(box).convert('RGB')
        variation = max(ImageStat.Stat(image).stddev)
        if variation < 8:
            raise ValueError(f'Screenshot did not render: {source.name}')
        target = shots / source.name.replace('-full.jpg', '.jpg')
        image.save(target, quality=94)
        raw = target.read_bytes()
        file_id = hashlib.sha1(raw).hexdigest()
        data_url = 'data:image/jpeg;base64,' + base64.b64encode(raw).decode('ascii')
        files[file_id] = dict(id=file_id, mimeType='image/jpeg', dataURL=data_url,
                              created=timestamp, lastRetrieved=timestamp)
        index = int(source.name[:2]) - 1
        is_mobile = '-mobile-' in source.name
        x = index * 1600 + ((1408 - image.width) / 2 if is_mobile else 0)
        y = 1050 if is_mobile else 0
        item = base(f'povod-{slugs[index]}-{"mobile" if is_mobile else "desktop"}',
                    x, y, image.width, image.height)
        item.update(type='image', fileId=file_id, status='pending', scale=[1, 1], crop=None)
        elements.append(item)
        thumb = image.copy()
        thumb.thumbnail((204, 310 if is_mobile else 160), Image.Resampling.LANCZOS)
        px = 10 + index * 220 + ((204 - thumb.width) // 2)
        py = 305 if is_mobile else 65
        preview.paste(thumb, (px, py))
        checks.append(dict(file=target.name, size=image.size, variation=round(variation, 1)))

for index, name in enumerate(names):
    draw.text((10 + index * 220, 20), f'{index+1:02d} / {name}', font=font, fill='#ffffff')
draw.text((10, 265), 'Мобильные версии', font=font, fill='#ffffff')
preview.save(root / 'screenshots-overview.jpg', quality=94)
payload = dict(type='excalidraw/clipboard', elements=elements, files=files)
(root / 'povod-concepts-clipboard.json').write_text(
    json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
(root / 'povod-concepts.excalidraw').write_text(
    json.dumps(dict(type='excalidraw', version=2, source='https://excalidraw.com',
                    elements=elements, appState={'viewBackgroundColor': '#121212'},
                    files=files), ensure_ascii=False), encoding='utf-8')
print(json.dumps(dict(images=len(files), labels=len(elements)-len(files),
                      clipboard_bytes=(root / 'povod-concepts-clipboard.json').stat().st_size,
                      checks=checks), ensure_ascii=False, indent=2))
