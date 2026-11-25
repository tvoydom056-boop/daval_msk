"""Автопроверка страниц сайта: кадры по прокрутке, цвет текста, пустые тёмные экраны, переполнение, консоль.

Запуск напрямую:  python codex/v4/qa.py <url> [--name letopis] [--points 16] [--widths 1440,375] [--sel "#tree,.book-page"]
Через сервис:     curl "http://127.0.0.1:8790/qa?url=<url>&name=letopis&points=16"
Результат: codex/v4/qa_out/<name>/report.json, sheet_<w>.jpg (лист кадров), кадры f_<w>_<NN>.jpg.
"""
import argparse, json, os, sys, pathlib, asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageStat

ROOT = pathlib.Path(__file__).resolve().parent
HOST_CSS = "html,body{color:#000 !important;font-family:Arial,sans-serif !important;background:#fff !important}"
AUDIT_JS = r"""() => {
  const bad=[]; const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const seen=new Set();
  while(walker.nextNode()){
    const t=walker.currentNode; if(!t.textContent.trim())continue;
    const el=t.parentElement; if(!el||seen.has(el))continue; seen.add(el);
    const cs=getComputedStyle(el); const r=el.getBoundingClientRect();
    if(cs.visibility==='hidden'||cs.display==='none'||r.width===0)continue;
    if(el.closest('[aria-hidden="true"],.sr-only,noscript,script,style'))continue;
    const black=cs.color==='rgb(0, 0, 0)'; const arial=/^\s*"?arial/i.test(cs.fontFamily);
    if(black||arial)bad.push({tag:el.tagName.toLowerCase(),cls:(el.className&&el.className.baseVal===undefined?el.className:'').toString().slice(0,60),text:t.textContent.trim().slice(0,50),color:cs.color,font:cs.fontFamily.slice(0,40)});
  }
  return bad;
}"""

def dark_empty(path):
    """Кадр почти целиком тёмный и однородный - пустой чёрный экран."""
    im = Image.open(path).convert('L').resize((160, 100))
    st = ImageStat.Stat(im)
    dark = sum(im.histogram()[:22]) / (160 * 100)
    return dark > 0.93 and st.stddev[0] < 10, round(dark, 3), round(st.stddev[0], 1)

def flat_empty(path):
    """Кадр почти без деталей (одна заливка любого цвета) - пустой экран."""
    im = Image.open(path).convert('L').resize((160, 100))
    return ImageStat.Stat(im).stddev[0] < 4

def dark_band(path, lum=28, share_min=.95, min_cols=0.10, min_rows=0.14, edge_jump=30, band_sd=6):
    """Сплошная чёрная полоса или прямоугольник внутри кадра (шторка не дошла, шов между секциями).
    Мягкая виньетка не считается: у настоящей полосы резкая граница (скачок яркости на краю)."""
    im = Image.open(path).convert('L').resize((160, 100))
    px = im.load(); W, H = im.size
    def scan(lines):
        means = [sum(v) / len(v) for v in lines]
        ok = [sum(1 for x in v if x < lum) / len(v) >= share_min for v in lines]
        best = None; i = 0; n = len(lines)
        while i < n:
            if not ok[i]: i += 1; continue
            j = i
            while j < n and ok[j]: j += 1
            jumps = []
            if i >= 3: jumps.append(means[i - 3] - means[i])
            if j <= n - 3: jumps.append(means[j + 2] - means[j - 1])
            sharp = bool(jumps) and max(jumps) >= edge_jump
            if sharp:
                vals = [x for v in lines[i:j] for x in v]; m = sum(vals) / len(vals)
                sharp = (sum((x - m) ** 2 for x in vals) / len(vals)) ** .5 < band_sd
            if sharp and (best is None or j - i > best[1] - best[0]): best = (i, j)
            i = j
        return best
    c = scan([[px[x, y] for y in range(12, H)] for x in range(W)])  # верх с меню не считаем
    r = scan([[px[x, y] for x in range(W)] for y in range(H)])
    if c and W * min_cols <= c[1] - c[0] < W * .93:
        return f'чёрная вертикальная полоса {round((c[1]-c[0]) / W * 100)}% ширины с {round(c[0] / W * 100)}%'
    if r and H * min_rows <= r[1] - r[0] < H * .93:
        return f'чёрная горизонтальная полоса {round((r[1]-r[0]) / H * 100)}% высоты с {round(r[0] / H * 100)}%'
    return None

def sheet(frames, out, w):
    ims = [Image.open(f) for f in frames]
    sc = 0.32 if w > 800 else 0.5
    ims = [i.resize((int(i.width * sc), int(i.height * sc))) for i in ims]
    cols = 4 if w > 800 else 8
    W, H = ims[0].size
    rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (W * cols, H * rows), (255, 255, 255))
    for k, i in enumerate(ims):
        S.paste(i, ((k % cols) * W, (k // cols) * H))
    S.save(out, quality=72)

async def run(url, name, points, widths, sels, host=True, span=None):
    out = ROOT / 'qa_out' / name
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob('f_*.jpg'):
        f.unlink()
    report = {'url': url, 'host_emulation': host, 'widths': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w in widths:
            h = 900 if w > 800 else 812
            pg = await b.new_page(viewport={'width': w, 'height': h})
            errors = []
            pg.on('pageerror', lambda e: errors.append(str(e)[:200]))
            pg.on('console', lambda m: m.type == 'error' and errors.append(m.text[:200]))
            await pg.goto(url, wait_until='networkidle')
            if host:
                await pg.add_style_tag(content=HOST_CSS)
            await pg.wait_for_timeout(3000)
            total = await pg.evaluate('document.documentElement.scrollHeight')
            if span:
                a, z, st = span
                ys = list(range(a, min(z, total - h) + 1, st))
            else:
                ys = [round((total - h) * i / max(1, points - 1)) for i in range(points)]
            for s in sels:
                y = await pg.evaluate("s=>{const e=document.querySelector(s);return e?e.getBoundingClientRect().top+scrollY:null}", s)
                if y is not None:
                    ys.append(round(y))
            ys = sorted(set(ys))
            frames, flags, warns, bad_all = [], [], [], {}
            for k, y in enumerate(ys):
                await pg.evaluate("y=>{window.__lenis?window.__lenis.scrollTo(y,{immediate:true,force:true}):scrollTo(0,y)}", y)
                await pg.wait_for_timeout(1100)
                f = out / f'f_{w}_{k:02d}.jpg'
                await pg.screenshot(path=str(f), type='jpeg', quality=70)
                frames.append(f)
                de, dark, sd = dark_empty(f)
                if de or flat_empty(f):
                    flags.append({'frame': f.name, 'y': y, 'issue': 'пустой экран', 'dark_share': dark, 'stddev': sd})
                else:
                    band = dark_band(f)
                    if band:
                        warns.append({'frame': f.name, 'y': y, 'issue': band})
                for item in await pg.evaluate(AUDIT_JS):
                    bad_all[item['tag'] + '|' + item['text']] = item
            overflow = await pg.evaluate('document.documentElement.scrollWidth-innerWidth')
            sheet(frames, out / f'sheet_{w}.jpg', w)
            report['widths'][w] = {
                'page_height': total, 'frames': len(frames), 'overflow_px': overflow,
                'empty_screens': flags, 'dark_band_warnings': warns, 'body_inherited_text': list(bad_all.values())[:30],
                'body_inherited_count': len(bad_all), 'console_errors': errors[:10],
                'sheet': str((out / f'sheet_{w}.jpg').relative_to(ROOT.parent.parent)).replace('\\', '/'),
            }
            await pg.close()
        await b.close()
    ok = all(v['overflow_px'] <= 0 and not v['empty_screens'] and v['body_inherited_count'] == 0 and not v['console_errors'] for v in report['widths'].values())
    report['ok'] = ok
    (out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')
    return report

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('url'); ap.add_argument('--name', default='page'); ap.add_argument('--points', type=int, default=16)
    ap.add_argument('--widths', default='1440,375'); ap.add_argument('--sel', default=''); ap.add_argument('--nohost', action='store_true'); ap.add_argument('--span', default='')
    a = ap.parse_args()
    r = asyncio.run(run(a.url, a.name, a.points, [int(x) for x in a.widths.split(',')], [s for s in a.sel.split(',') if s], not a.nohost, tuple(int(x) for x in a.span.split(',')) if a.span else None))
    print(json.dumps(r, ensure_ascii=False, indent=1))

if __name__ == '__main__':
    main()
