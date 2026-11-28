"""Проверки Повода v2. Запускать из любого каталога при сервере на 8770."""
import asyncio
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'codex/v2/povod_qa'
SHEET = ROOT / 'codex/v2/sheet_povod_page.jpg'
OUT.mkdir(exist_ok=True)
BASE = 'http://127.0.0.1:8770/povod/'
SHOTS = []
RESULT = {'viewports': {}, 'errors': [], 'checks': {}}

async def capture(page, label, prefix):
    path = OUT / (prefix + '_' + label + '.jpg')
    await page.screenshot(path=str(path), quality=86)
    SHOTS.append((prefix + ' / ' + label, path))

async def scroll_to(page, selector, center=False):
    await page.locator(selector).first.evaluate(
        '(el,center)=>{const r=el.getBoundingClientRect();scrollTo({top:scrollY+r.top-(center?(innerHeight-r.height)/2:90),behavior:"instant"})}', center)
    await page.wait_for_timeout(1900 if 'scene-' in selector else 1000)

async def overflow(page):
    return await page.evaluate('document.documentElement.scrollWidth-innerWidth')

def sheet():
    cols, tile_w, tile_h = 4, 360, 430
    rows = (len(SHOTS) + cols - 1) // cols
    im = Image.new('RGB', (cols*tile_w, rows*tile_h+70), '#f7d9c6')
    draw = ImageDraw.Draw(im)
    draw.text((20, 20), 'POVOD V2 / CHROMIUM / 1440x900 + 375x812', fill='#1d1a1c')
    for i, (name, path) in enumerate(SHOTS):
        x, y = (i%cols)*tile_w, (i//cols)*tile_h+70
        shot = Image.open(path)
        shot.thumbnail((tile_w-20, tile_h-45))
        im.paste(shot, (x+(tile_w-shot.width)//2, y))
        draw.text((x+10, y+tile_h-30), name, fill='#1d1a1c')
    im.save(SHEET, quality=90)

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for width, height, prefix in [(1440,900,'desktop'), (375,812,'mobile')]:
            context = await browser.new_context(viewport={'width':width,'height':height})
            page = await context.new_page()
            page.on('pageerror', lambda e: RESULT['errors'].append(str(e)))
            page.on('console', lambda m: RESULT['errors'].append(m.text) if m.type == 'error' else None)
            await page.goto(BASE, wait_until='networkidle')
            await page.evaluate('document.fonts.ready')
            await capture(page, 'hero_initial', prefix)
            initial = await page.locator('.thumb.is-active').get_attribute('data-slide-button')
            await page.wait_for_selector('.hero-slide.is-incoming', timeout=9000)
            await page.wait_for_timeout(550)
            await capture(page, 'hero_curtain_middle', prefix)
            await page.wait_for_timeout(900)
            await capture(page, 'hero_after', prefix)
            assert initial != await page.locator('.thumb.is-active').get_attribute('data-slide-button')
            RESULT['checks'][prefix+'_auto'] = True
            widths = [await overflow(page)]
            await page.locator('[data-slide-button="3"]').click()
            await page.wait_for_timeout(1400)
            assert await page.locator('.thumb.is-active').get_attribute('data-slide-button') == '3'
            await scroll_to(page, '#occasions')
            widths.append(await overflow(page))
            await capture(page, 'occasion_cards', prefix)
            origin_y = await page.evaluate('scrollY')
            await page.locator('[data-occasion="wedding"]').first.click()
            await page.wait_for_timeout(450)
            await capture(page, 'card_flight', prefix)
            await page.wait_for_timeout(900)
            assert page.url.endswith('#wedding')
            await capture(page, 'wedding_cover', prefix)
            for i in range(1,5):
                await scroll_to(page, '#scene-'+str(i), True)
                widths.append(await overflow(page))
                await capture(page, 'wedding_scene_'+str(i), prefix)
            await scroll_to(page, '.phone', True)
            await capture(page, 'phone', prefix)
            await page.locator('#giftPhone .g-letter').evaluate('(el)=>el.scrollIntoView({block:"center",behavior:"instant"})')
            await page.wait_for_timeout(300)
            await capture(page, 'phone_letter', prefix)
            await scroll_to(page, '#prices')
            await capture(page, 'prices', prefix)
            widths.append(await overflow(page))
            await page.locator('#form input[name="name"]').fill('Проверка')
            await page.locator('#form input[name="contact"]').fill('@demo')
            await page.locator('#form button[type="submit"]').click()
            assert 'не отправляется' in await page.locator('#formNote').inner_text()
            await page.go_back()
            await page.wait_for_timeout(1100)
            assert not page.url.endswith('#wedding')
            assert abs(await page.evaluate('scrollY') - origin_y) < 10
            RESULT['checks'][prefix+'_back'] = True
            for key in ['birthday','anniversary','jubilee']:
                await page.goto(BASE+'#'+key, wait_until='networkidle')
                assert await page.locator('.story-scene').count() == 4
                widths.append(await overflow(page))
                if key == 'birthday':
                    await page.locator('#giftPhone [data-answer="1"]').evaluate('(el)=>el.click()')
                    assert 'Верно' in await page.locator('#giftPhone .quiz-result').inner_text()
                if key == 'anniversary':
                    await page.locator('#giftPhone .g-reason').first.evaluate('(el)=>el.click()')
                    assert await page.locator('#giftPhone .g-reason.is-out').count() == 1
                if key == 'jubilee':
                    assert await page.locator('#giftPhone [data-block="recipe"]').count() == 1
            await page.goto(BASE+'artifact.html#wedding', wait_until='networkidle')
            assert await page.locator('.story-scene').count() == 4
            await page.locator('.occasion-hero a[href="#home"]').click()
            assert await page.locator('.hero').count() == 1
            RESULT['checks'][prefix+'_artifact'] = True
            RESULT['viewports'][prefix] = {'width':width,'height':height,'overflow':max(widths)}
            assert max(widths) == 0
            await context.close()
        context = await browser.new_context(viewport={'width':375,'height':812}, reduced_motion='reduce')
        page = await context.new_page()
        await page.goto(BASE, wait_until='networkidle')
        await page.wait_for_timeout(5600)
        assert await page.locator('.thumb.is-active').get_attribute('data-slide-button') == '0'
        assert await page.evaluate('Array.from(document.querySelectorAll("video")).every(v=>v.paused)')
        RESULT['checks']['reduced_motion'] = True
        await page.goto((ROOT/'povod/artifact.html').as_uri()+'#birthday', wait_until='load')
        assert await page.locator('.story-scene').count() == 4
        await page.locator('a[href="#anniversary"][data-occasion]').click()
        assert page.url.endswith('#anniversary')
        RESULT['checks']['artifact_file_routes'] = True
        await browser.close()
    sheet()
    (OUT/'browser_results.json').write_text(json.dumps(RESULT, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(RESULT, ensure_ascii=False))
    assert not RESULT['errors'], RESULT['errors']

if __name__ == '__main__':
    try:
        asyncio.run(run())
    except Exception as e:
        RESULT['blocked'] = type(e).__name__ + ': ' + str(e)
        (OUT/'browser_results.json').write_text(json.dumps(RESULT, ensure_ascii=False, indent=2), encoding='utf-8')
        raise
