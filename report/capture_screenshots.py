from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'screenshots'
OUT.mkdir(exist_ok=True)
BASE = 'http://localhost:8765'

def ready(page, path):
    page.goto(BASE + path, wait_until='networkidle')
    page.add_style_tag(content='.slots-toggle, .phone__hint {display:none !important;} html {scroll-behavior:auto !important;} .top {position:absolute !important;}')
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(3000)
    page.evaluate('''async () => {await Promise.all(Array.from(document.images).map(i => i.decode().catch(() => {})))}''')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':1440, 'height':1000}, device_scale_factor=1)
    ready(page, '/letopis/')
    print('LETOPIS', page.evaluate('''() => Array.from(document.querySelectorAll('section')).map(x => ({id:x.id, cls:x.className, y:Math.round(x.getBoundingClientRect().top+scrollY), h:Math.round(x.getBoundingClientRect().height)}))'''))
    page.screenshot(path=str(OUT/'letopis-hero.png'))
    for slug, selector in [('example','#example'),('tree','#tree'),('prices','#prices')]:
        section=page.locator(selector)
        section.scroll_into_view_if_needed()
        page.wait_for_timeout(1500)
        section.screenshot(path=str(OUT/f'letopis-{slug}.png'))
    ready(page, '/povod/')
    print('POVOD', page.evaluate('''() => Array.from(document.querySelectorAll('section')).map(x => ({id:x.id, cls:x.className, y:Math.round(x.getBoundingClientRect().top+scrollY), h:Math.round(x.getBoundingClientRect().height)}))'''))
    page.locator('#occasions').screenshot(path=str(OUT/'povod-occasions.png'))
    ready(page, '/povod/wedding.html')
    print('WEDDING', page.evaluate('''() => Array.from(document.querySelectorAll('section')).map(x => ({id:x.id, cls:x.className, y:Math.round(x.getBoundingClientRect().top+scrollY), h:Math.round(x.getBoundingClientRect().height)}))'''))
    page.locator('#demo').screenshot(path=str(OUT/'povod-wedding.png'))
    mobile=browser.new_page(viewport={'width':375,'height':900},device_scale_factor=2,is_mobile=True,has_touch=True)
    ready(mobile, '/povod/')
    mobile.screenshot(path=str(OUT/'mobile.png'))
    browser.close()

from PIL import Image
for f in OUT.glob('*.png'):
    print(f.name, Image.open(f).size)
