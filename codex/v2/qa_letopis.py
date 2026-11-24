import sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766'
OUT = Path(__file__).parent / 'qa'
OUT.mkdir(exist_ok=True)
shots = []
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    for w, h, tag in [(1440, 900, 'd'), (375, 812, 'm')]:
        pg = b.new_page(viewport={'width': w, 'height': h})
        errs = []
        pg.on('console', lambda m, errs=errs: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e, errs=errs: errs.append(str(e)))
        pg.goto(BASE + '/letopis/', wait_until='networkidle')
        pg.wait_for_timeout(2500)
        ids = pg.evaluate("() => [...document.querySelectorAll('section[id]')].map(s => [s.id, Math.round(s.getBoundingClientRect().top + scrollY), Math.round(s.offsetHeight)])")
        print(tag, 'sections', ids)
        print(tag, 'overflow', pg.evaluate('() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]'))
        total = pg.evaluate('() => document.documentElement.scrollHeight')
        n = 14 if tag == 'd' else 10
        for i in range(n):
            y = int(total * i / n)
            pg.evaluate(f'window.scrollTo(0,{y})')
            pg.wait_for_timeout(1300)
            f = OUT / f'{tag}{i:02d}.png'
            pg.screenshot(path=str(f))
            shots.append((tag, f))
        print(tag, 'errors', errs[:8])
        pg.close()
    b.close()

def sheet(tag, cols):
    fs = [f for t, f in shots if t == tag]
    ims = [Image.open(f) for f in fs]
    tw = 480 if tag == 'd' else 220
    th = int(ims[0].height * tw / ims[0].width)
    rows = (len(ims) + cols - 1) // cols
    s = Image.new('RGB', (tw * cols, th * rows), 'white')
    for i, im in enumerate(ims):
        s.paste(im.resize((tw, th)), ((i % cols) * tw, (i // cols) * th))
    s.save(OUT / f'sheet_{tag}.jpg', quality=80)
sheet('d', 4); sheet('m', 5)
