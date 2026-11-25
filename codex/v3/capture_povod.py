"""Capture Povod v3: wedding story every 2%, other pinned scenes every 4%.

Start the Vite preview in v3/povod, then run:
    python capture_povod.py --url http://127.0.0.1:4174/
    python capture_povod.py --url http://127.0.0.1:5174/ --browser msedge
    python capture_povod.py --math-only

Dependencies: pip install playwright pillow fonttools brotli
Browser: python -m playwright install chromium
Screenshots are created only by the browser, never synthesized.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import re
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
if (ROOT / "qa" / "python-deps").exists():
    sys.path.insert(0, str(ROOT / "qa" / "python-deps"))
PROJECT = ROOT.parents[1] / "v3" / "povod"
VIEWPORTS = [(1440, 900), (375, 812)]
PROGRESS = range(0, 101, 4)
EXPECTED_PINS = {"hero": 1.2, "occasions": 1.4, "story": 6, "phone": 2}


def load_data(project: Path) -> dict:
    script = "import {PLANS,OCCASIONS,V2,HUB} from './src/data.js'; import {getStoryScenes,captionLines} from './src/scenes/story-config.js'; const STORIES=Object.fromEntries(Object.keys(OCCASIONS).map(k=>[k,getStoryScenes(k).map(s=>({...s,mobileLines:captionLines(s.text,true),desktopLines:captionLines(s.text,false)}))])); console.log(JSON.stringify({PLANS,OCCASIONS,V2,HUB,STORIES}));"
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=project, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(result.stdout)


def mathematical_audit(project: Path) -> list[dict]:
    """Font advance widths and conservative bounds, separate from browser QA."""
    from fontTools.ttLib import TTFont

    data = load_data(project)
    fonts = {}
    for family, weight in [("onest", 400), ("onest", 500), ("caveat", 400)]:
        languages = ["cyrillic", "latin", "latin-ext", "symbols"] if family == "onest" else ["cyrillic", "latin"]
        fonts[(family, weight)] = [TTFont(project / "node_modules" / "@fontsource" / family / "files" / f"{family}-{language}-{weight}-normal.woff2") for language in languages]

    def advance(text, size, spacing=0, family="onest", weight=400):
        total = 0
        for char in text:
            for font in fonts[(family, weight)]:
                glyph = font.getBestCmap().get(ord(char))
                if glyph:
                    total += font["hmtx"][glyph][0] / font["head"].unitsPerEm * size
                    break
            else:
                raise ValueError(f"Missing font glyph {char!r}")
        # CSS letter spacing is applied to each character; dropping the last
        # negative space makes this estimate slightly more conservative.
        return total + max(0, len(text) - 1) * spacing * size

    def wrap(text, limit):
        result, line = [], ""
        for word in text.split():
            if len(line + " " + word) > limit and line:
                result.append(line)
                line = word
            else:
                line += (" " if line else "") + word
        return result + ([line] if line else [])

    results = []
    for width, height in VIEWPORTS:
        mobile = width < 768
        gutter = 24 if mobile else width * .053
        hero_width = width - 48 if mobile else width * .9
        titles = []
        for key, v in data["V2"].items():
            if mobile:
                size = width * {"wedding": .17, "birthday": .153, "anniversary": .123, "jubilee": .183}[key]
                spacing = -.065 if key == "anniversary" else -.06
            else:
                size = max(66 if key == "anniversary" else 70, min(width * .106, 172)) if key in ["anniversary", "birthday"] else max(78, min(width * .126, 202))
                spacing = -.065
            measured = max(advance(t, size, spacing, weight=500) for t in v["title"])
            titles.append({"occasion": key, "fontPx": round(size, 3), "maxLineAdvancePx": round(measured, 3), "availablePx": hero_width, "fits": measured <= hero_width})
        cw = width * (.64 if mobile else .17)
        ch = cw * 1.4
        bounds = []
        for i in range(5):
            x = width * .18 + i * (cw + 18) if mobile else (i - 2) * (cw + 18) - cw / 2
            left = x if mobile else width / 2 + x
            top = height * .31 + 30 if mobile else height * .58 - ch / 2
            bounds.append({"left": left, "right": left + cw, "top": top, "bottom": top + ch})
        caption_width = width - 48 - 58 if mobile else min(520, width - 96) - 58
        comic_results, letter_results = [], []
        for key, o in data["OCCASIONS"].items():
            scenes = data["STORIES"][key]
            size = 20 if mobile else 26
            longest = max(advance(line, size, -.025) for s in scenes for line in s["mobileLines" if mobile else "desktopLines"])
            max_lines = max(len(s["mobileLines" if mobile else "desktopLines"]) for s in scenes)
            header_width = max(advance(f"{s['year']} · {s['label']}".upper(), 15, .08) for s in scenes)
            header_lines = max(1, math.ceil(header_width / caption_width))
            caption_height = 58 + header_lines * 19.5 + max_lines * size * (1.22 if mobile else 1.25)
            rotated_width = (width - 48) * math.cos(math.radians(1)) + caption_height * math.sin(math.radians(1)) if mobile else None
            comic_results.append({"occasion": key, "sceneCount": len(scenes), "paletteCount": len(set(s["bg"] for s in scenes)), "transitionTypes": [s["transition"] for s in scenes], "fontPx": size, "maxLinePx": round(longest, 3), "availablePx": caption_width, "maxCaptionHeightPx": caption_height, "rotatedMobileCaptionWidthPx": rotated_width, "fits": longest <= caption_width and (not mobile or rotated_width <= width - 32)})
            letter = next(s for s in o["gift"]["sections"] if s["type"] == "letter")
            available = width * (.88 if mobile else .44) - (52 if mobile else 98)
            longest = max(advance(t, 22 if mobile else 30, family="caveat") for t in wrap(letter["text"], 29 if mobile else 43) + [letter["sign"]])
            letter_results.append({"occasion": key, "fontPx": 22 if mobile else 30, "paperWidthPx": width * (.88 if mobile else .44), "giftTransitionFontPx": 40, "maxLinePx": round(longest, 3), "availablePx": available, "fits": longest <= available})
        phone_width, phone_height = (246, 488) if mobile else (310, 624)
        phone_top = height * (.59 if mobile else .51) - phone_height / 2
        annotation_bottom = height * .246 + 16 * 1.15 if mobile else None
        phone_intro_bottom = height * .12 + 9 * 1.6 + 10 + 30 * 2.1 if mobile else None
        plan_width = width - 48 if mobile else (width - 2 * gutter - 44) / 3
        price_available = plan_width - (52 if mobile else 62)
        price_longest = max(advance(p["price"], 43 if mobile else 45, -.06) for p in data["PLANS"].values())
        row = {
            "viewport": [width, height], "heroTitles": titles, "cards": bounds,
            "cardsFitHorizontally": bounds[0]["left"] >= 0 and bounds[0]["right"] <= width if mobile else all(b["left"] >= 0 and b["right"] <= width for b in bounds),
            "cardWidthPx": cw,
            "cardTitleFontPx": 22,
            "cardPriceFontPx": 16,
            "mobileCardTrackWidthPx": 2 * width * .18 + 5 * cw + 4 * 18 if mobile else None,
            "mobileCardsUseNativeHorizontalOverflow": mobile,
            "cardsFitVertically": all(b["top"] >= height * .21 and b["bottom"] <= height * .93 for b in bounds),
            "storyCaptions": comic_results, "storyLetters": letter_results,
            "phone": {"left": (width-phone_width)/2, "right": (width+phone_width)/2, "top": phone_top, "bottom": phone_top+phone_height},
            "mobilePhoneCaptionBottomPx": annotation_bottom,
            "mobilePhoneIntroBottomPx": phone_intro_bottom,
            "mobileCaptionClearancePx": phone_top - annotation_bottom if mobile else None,
            "priceMaxAdvancePx": round(price_longest, 3), "priceAvailablePx": round(price_available, 3),
            "pricesFit": price_longest <= price_available,
            "pinLengthsPx": {name: height * (11 if name == 'story' else ratio) for name, ratio in EXPECTED_PINS.items()},
            "weddingSceneCount": len(data["STORIES"]["wedding"]),
            "weddingTransitionTypesUnique": len(set(s["transition"] for s in data["STORIES"]["wedding"])),
            "containment": "Viewport-sized stages use overflow:clip. Grids use minmax(0,1fr). Images, forms and selects are constrained to their columns. HTML and body use overflow-x:clip.",
            "limitation": "Font advances and CSS geometry verify declared bounds. Real browser layout, overlap and motion require the capture pass.",
        }
        assert all(t["fits"] for t in titles), titles
        assert row["cardsFitHorizontally"] and row["cardsFitVertically"], bounds
        assert all(t["fits"] for t in comic_results), comic_results
        assert row["weddingSceneCount"] == 10 and row["weddingTransitionTypesUnique"] == 10, row
        assert all(t["sceneCount"] >= 5 and t["paletteCount"] >= 5 for t in comic_results), comic_results
        assert all(t["fits"] for t in letter_results), letter_results
        assert row["pricesFit"], row
        if mobile:
            assert phone_top > annotation_bottom + 15, row
            assert phone_top + phone_height < height * .94, row
            assert phone_intro_bottom < height * .246, row
        results.append(row)
    return results


def prepare(page, url, route):
    page.goto(url.split("#")[0] + "#" + route, wait_until="networkidle", timeout=60000)
    page.wait_for_function("window.__povod?.ready === true", timeout=30000)
    page.evaluate("window.__povod.freezeHero()")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(1100)


def seek(page, y):
    page.evaluate("""y => {
      window.scrollTo(0,y);
      window.__lenis?.scrollTo(y,{immediate:true,force:true});
    }""", y)
    page.wait_for_timeout(850)
    page.evaluate("window.__povod.settle()")
    page.wait_for_timeout(200)


def snapshot(page):
    return page.evaluate("""() => {
      const rect = el => {const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      return {
        route:window.__povod.route, scrollY,
        horizontalOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
        documentHeight:document.documentElement.scrollHeight,
        pins:window.__povod.metrics(),
        cards:[...document.querySelectorAll('.occasions .occasion-card')].map(el=>({...rect(el),cssWidth:parseFloat(getComputedStyle(el).width),titleFont:parseFloat(getComputedStyle(el.querySelector('h3')).fontSize),priceFont:el.querySelector('.card-meta>span')?parseFloat(getComputedStyle(el.querySelector('.card-meta>span')).fontSize):null})),
        cardTrack:document.querySelector('.occasions .card-deck')?{width:document.querySelector('.occasions .card-deck').clientWidth,scrollWidth:document.querySelector('.occasions .card-deck').scrollWidth,overflow:getComputedStyle(document.querySelector('.occasions .card-deck')).overflowX}:null,
        brokenImages:[...document.images].filter(i=>!i.complete || i.naturalWidth===0).map(i=>i.src),
        videos:[...document.querySelectorAll('video[src]')].map(v=>({src:v.currentSrc,paused:v.paused,ready:v.readyState,error:v.error?.code??null,blocked:!!v.closest('[data-playing="false"]'),rect:rect(v)})),
        phoneContent:document.querySelector('.gift-content')?.style.transform,
        phoneCaption:document.querySelector('[data-phone-caption]')?.textContent,
        story:document.querySelector('.film-story') ? {
          active:Number(document.querySelector('.film-story').dataset.activeScene),
          count:document.querySelectorAll('.film-scene').length,
          palette:{bg:getComputedStyle(document.body).getPropertyValue('--film-bg').trim(),ink:getComputedStyle(document.body).getPropertyValue('--film-ink').trim(),accent:getComputedStyle(document.body).getPropertyValue('--film-accent').trim()},
          navigationColor:getComputedStyle(document.querySelector('.navigation')).color,
          progressDots:document.querySelectorAll('[data-film-dot]').length,
          currentDots:document.querySelectorAll('[data-film-dot].is-current').length,
          foregroundCutouts:[...document.querySelectorAll('.video-live .person-cutout')].map(el=>getComputedStyle(el).visibility),
          captions:[...document.querySelectorAll('.film-caption')].filter(el=>Number(getComputedStyle(el).opacity)>.5 && getComputedStyle(el).visibility!=='hidden' && getComputedStyle(el.closest('.film-scene')).visibility!=='hidden').map(el=>({...rect(el),fontSize:parseFloat(getComputedStyle(el.querySelector('p')).fontSize),lineFonts:[...el.querySelectorAll('.line-mask>span')].map(s=>parseFloat(getComputedStyle(s).fontSize)),labelFont:parseFloat(getComputedStyle(el.querySelector('small')).fontSize),cssWidth:parseFloat(getComputedStyle(el).width),padding:[getComputedStyle(el).paddingTop,getComputedStyle(el).paddingRight],background:getComputedStyle(el).backgroundColor})),
          letter:{width:parseFloat(getComputedStyle(document.querySelector('.film-letter-stage .story-letter')).width),font:parseFloat(getComputedStyle(document.querySelector('.film-letter-stage .letter-writing')).fontSize),titleFont:parseFloat(getComputedStyle(document.querySelector('.film-letter-stage .gift-transition')).fontSize)},
          firstHalves:[...document.querySelectorAll('.film-before .split-half')].map(rect),
          home:document.querySelector('.film-home')?{clip:getComputedStyle(document.querySelector('.film-home')).clipPath,photoClip:getComputedStyle(document.querySelector('.film-home .film-shot')).clipPath}:null,
          depth:[...document.querySelectorAll('.film-scene')][Number(document.querySelector('.film-story').dataset.activeScene)]?.querySelector('.depth-bg')?.style.transform,
          effect:document.querySelector('.film-effects')?.dataset.effect||'',
          petals:Number(document.querySelector('.film-effects')?.dataset.petals||0),
        } : null,
        letterLines:[...document.querySelectorAll('.letter-writing p>span')].map(rect),
        formNote:document.querySelector('.form-note')?.textContent,
      };
    }""")


def sheet(frames, scene, width, height, output):
    columns, gap, label_h = 4, 8, 28
    tw = 360 if width >= 768 else 188
    th = round(height * tw / width)
    rows = math.ceil(len(frames) / columns)
    canvas = Image.new("RGB", (columns*(tw+gap)+gap, rows*(th+label_h+gap)+gap), "#f7d9c6")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype("arial.ttf", 12) if sys.platform == "win32" else ImageFont.load_default()
    for index, (path, label) in enumerate(frames):
        x, y = gap+(index%columns)*(tw+gap), gap+(index//columns)*(th+label_h+gap)
        with Image.open(path) as source:
            canvas.paste(source.convert("RGB").resize((tw, th), Image.Resampling.LANCZOS), (x, y+label_h))
        draw.text((x+5, y+7), label, font=font, fill="#36251d")
    target = output / f"sheet_povod_{scene}_{width}.jpg"
    canvas.save(target, quality=92, subsampling=0)
    return str(target)


def capture_scene(page, scene, width, height, directory, output):
    metrics = next(t for t in page.evaluate("window.__povod.metrics()") if t["id"] == scene)
    wedding_story = scene == 'story' and page.evaluate("window.__povod.route") == 'wedding'
    expected_ratio = 11 if wedding_story else EXPECTED_PINS[scene]
    assert abs(metrics["length"] - height * expected_ratio) < 2, metrics
    frames, audits = [], []
    progress = range(0, 101, 2) if wedding_story else PROGRESS
    for percent in progress:
        seek(page, metrics["start"] + metrics["length"] * percent / 100)
        audit = snapshot(page)
        assert audit["horizontalOverflow"] <= 1, (scene, percent, audit)
        assert not audit["brokenImages"], audit["brokenImages"]
        assert all(v["error"] is None for v in audit["videos"]), audit["videos"]
        assert all(v["paused"] for v in audit["videos"] if v["blocked"] or v["rect"]["bottom"] <= 0 or v["rect"]["top"] >= height), audit["videos"]
        if scene == "occasions" and percent == 100:
            assert all(abs(r['cssWidth']-width*(.64 if width<768 else .17))<.2 and r['titleFont']==22 and r['priceFont'] in (None,16) for r in audit['cards']), audit['cards']
            if width >= 768:
                assert all(r["left"] >= -1 and r["right"] <= width+1 for r in audit["cards"]), audit["cards"]
            else:
                assert audit['cardTrack']['overflow']=='auto' and audit['cardTrack']['scrollWidth']>audit['cardTrack']['width'], audit['cardTrack']
        if wedding_story:
            assert audit['story']['count'] == 10 and audit['story']['progressDots'] == 10 and audit['story']['currentDots'] == 1, audit['story']
            assert audit['story']['petals'] == 72
            assert all(v == 'hidden' for v in audit['story']['foregroundCutouts']), audit['story']
            target_font=20 if width<768 else 26
            assert all(r['left'] >= -1 and r['right'] <= width+1 and r['top'] >= 100 and r['bottom'] <= height-15 and r['fontSize']==target_font and all(f==target_font for f in r['lineFonts']) and r['labelFont']==15 and r['cssWidth']<=520.1 and r['padding']==['22px','28px'] for r in audit['story']['captions']), audit['story']
            if percent==0:
                assert all(r['left']<width and r['right']>0 for r in audit['story']['firstHalves']), audit['story']
            if 64<=percent<=70:
                assert audit['story']['home']=={'clip':'none','photoClip':'none'}, audit['story']
            if percent==100:
                letter=audit['story']['letter']
                assert abs(letter['width']-width*(.88 if width<768 else .44))<.2 and letter['font']==(22 if width<768 else 30) and letter['titleFont']==40,letter
        file = directory / f"{scene}_{percent:03d}.png"
        page.screenshot(path=str(file), animations="disabled")
        frames.append((file, f"{scene.upper()}  {percent:03d}% | {width}x{height}"))
        audits.append({"scene": scene, "percent": percent, **audit})
    # Reverse scroll must restore the first beat and phone position.
    seek(page, metrics["start"])
    if scene == "phone":
        assert page.locator(".gift-content").evaluate("el=>Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42)<1")
    print(f"Captured {scene}: {len(frames)} frames at {width}x{height}", flush=True)
    return {"scene": scene, "sheet": sheet(frames, scene, width, height, output), "frames": audits}


def capture_viewport(browser, url, width, height, output):
    context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1, reduced_motion="no-preference")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    directory = output / "frames_povod" / str(width)
    directory.mkdir(parents=True, exist_ok=True)
    scenes = []
    prepare(page, url, "home")
    for scene in ["hero", "occasions"]:
        scenes.append(capture_scene(page, scene, width, height, directory, output))
    # Exercise the actual card flight and browser history before the film.
    m = next(t for t in page.evaluate("window.__povod.metrics()") if t["id"] == "occasions")
    seek(page, m["end"])
    page.locator('.occasions [data-route="wedding"]').click()
    page.wait_for_function("window.__povod?.ready && window.__povod.route === 'wedding'")
    page.wait_for_timeout(1200)
    page.go_back(wait_until="networkidle")
    page.wait_for_function("window.__povod?.ready && window.__povod.route === 'home'")
    assert abs(page.evaluate("scrollY") - m["end"]) < 3
    prepare(page, url, "wedding")
    for scene in ["story", "phone"]:
        scenes.append(capture_scene(page, scene, width, height, directory, output))
    lower_frames, lower_audits = [], []
    for name in ["about", "prices", "how", "faq", "request", "other"]:
        y = page.locator(f"#{name}").evaluate("el=>el.getBoundingClientRect().top+scrollY-85")
        seek(page, y)
        if name == "faq":
            page.locator("#faq summary").first.click()
            assert page.locator("#faq details").first.get_attribute("open") is not None
        if name == "request":
            page.locator('[name="name"]').fill("Тест")
            page.locator('[name="contact"]').fill("@demo")
            page.locator('#request-form button[type="submit"]').click()
            assert "Это макет" in page.locator(".form-note").inner_text()
            seek(page, y)
        file = directory / f"lower_{name}.png"
        page.screenshot(path=str(file), animations="disabled")
        lower_frames.append((file, f"{name.upper()} | {width}x{height}"))
        audit = snapshot(page)
        assert audit["horizontalOverflow"] <= 1, audit
        lower_audits.append({"section": name, **audit})
    lower_sheet = sheet(lower_frames, "lower", width, height, output)
    # Other occasions: five distinct scenes, data-driven gift types and controls.
    route_checks = []
    for route in ["birthday", "anniversary", "jubilee"]:
        prepare(page, url, route)
        metrics = {m["id"]: m for m in page.evaluate("window.__povod.metrics()")}
        assert abs(metrics["story"]["length"] - height*6) < 2
        assert page.locator('.film-scene').count() >= 5
        for p in [.24, .43, .62, .81, .97]:
            seek(page, metrics["story"]["start"] + metrics["story"]["length"]*p)
            assert snapshot(page)["horizontalOverflow"] <= 1
        # Scroll the required interactive gift block into the phone screen.
        selector = '[data-block="quiz"]' if route == "birthday" else '[data-block="reasons"]' if route == "anniversary" else '[data-block="recipe"]'
        progress = page.locator(selector).evaluate("el=>Math.min(1,el.offsetTop/(document.querySelector('.gift-content').scrollHeight-document.querySelector('.phone-screen').clientHeight))")
        seek(page, metrics["phone"]["start"] + metrics["phone"]["length"]*progress)
        if route == "birthday":
            page.locator('[data-answer="1"]').click()
            assert "Верно" in page.locator(".quiz-result").inner_text()
        if route == "anniversary":
            page.locator('[data-reason]').click()
            assert page.locator('[data-reason-count]').inner_text() == "2"
        route_checks.append({"route": route, "giftTypes": page.locator('.gift-content [data-block]').evaluate_all("els=>els.map(el=>el.dataset.block)"), "overflow": snapshot(page)["horizontalOverflow"]})
    assert not errors, errors
    context.close()
    reduced = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1, reduced_motion="reduce")
    rp = reduced.new_page()
    prepare(rp, url, "wedding")
    static = rp.evaluate("""() => ({reduced:window.__povod.reducedMotion,pins:document.querySelectorAll('.pin-spacer').length,overflow:document.documentElement.scrollWidth-innerWidth,panels:[...document.querySelectorAll('.story-panel')].map(el=>({top:el.offsetTop,height:el.offsetHeight})),videosPaused:[...document.querySelectorAll('video')].every(v=>v.paused)})""")
    assert static["reduced"] and static["pins"] == 0 and static["overflow"] <= 1 and static["videosPaused"] and len(static["panels"]) == 10, static
    assert all(b["top"] > a["top"] for a, b in zip(static["panels"], static["panels"][1:])), static
    rp.screenshot(path=str(output / f"povod_reduced_{width}.png"), full_page=True, animations="disabled")
    reduced.close()
    return {"viewport": [width, height], "scenes": scenes, "lowerSheet": lower_sheet, "lowerFrames": lower_audits, "otherRoutes": route_checks, "reducedMotion": static, "consoleErrors": errors, "controls": "card flight, back, FAQ, demo form, quiz, reasons, reverse scroll"}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", default="http://127.0.0.1:4174/")
    parser.add_argument("--browser", choices=["chromium", "chrome", "msedge"], default="chromium")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--project", type=Path, default=PROJECT)
    parser.add_argument("--output", type=Path, default=ROOT)
    parser.add_argument("--math-only", action="store_true")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = {"url": args.url, "mathematicalAudit": mathematical_audit(args.project), "browserAudit": [], "browserStatus": "not run"}
    report_path = args.output / "povod_audit.json"
    if args.math_only:
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report["mathematicalAudit"], ensure_ascii=False, indent=2))
        return 0
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            launch = {"headless": not args.headed, "args": ["--autoplay-policy=no-user-gesture-required"]}
            if args.browser != "chromium":
                launch["channel"] = args.browser
            browser = playwright.chromium.launch(**launch)
            for width, height in VIEWPORTS:
                report["browserAudit"].append(capture_viewport(browser, args.url, width, height, args.output))
            browser.close()
        report["browserStatus"] = "passed"
        print("Captured 270 frames, 10 sheets; wedding at 2%, routes, controls and reduced motion checked.")
        return 0
    except Exception as error:
        report["browserStatus"] = "failed"
        report["error"] = str(error)
        print(f"Capture could not finish: {error}\nMath results are retained. No screenshots were fabricated.", file=sys.stderr)
        return 1
    finally:
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
