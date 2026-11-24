"""Capture the two pinned scenes every 4%, audit layout, and assemble proof sheets.

Run the project with `npm run preview`, then:
    python capture_film.py
    python capture_film.py --browser msedge
    python capture_film.py --math-only

Requirements: pip install playwright pillow fonttools brotli
Browser: python -m playwright install chromium
All output stays beside this script unless --output is supplied.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
if (ROOT / 'qa' / 'python-deps').exists():
    sys.path.insert(0, str(ROOT / 'qa' / 'python-deps'))
PROJECT = Path(__file__).resolve().parents[2] / "v3" / "letopis"
VIEWPORTS = [(1440, 900), (375, 812)]
PROGRESS = range(0, 101, 4)


def mathematical_audit(project: Path) -> list[dict]:
    """Conservative advance-width calculations using the actual local Literata.

    This is geometry verification, not a replacement for browser visual QA.
    No screenshot is fabricated if the browser cannot start.
    """
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont

    files = project / "node_modules" / "@fontsource-variable" / "literata" / "files"
    fonts = []
    for language in ["cyrillic", "latin"]:
        font = TTFont(files / f"literata-{language}-wght-normal.woff2")
        font = instantiateVariableFont(font, {"wght": 300}, inplace=False)
        fonts.append(font)

    def advance(text: str, size: float, spacing: float = 0, tabular: bool = False) -> float:
        total = 0.0
        for letter in text:
            for font in fonts:
                glyph = font.getBestCmap().get(ord(letter))
                if glyph:
                    if tabular and 'GSUB' in font:
                        gsub = font['GSUB'].table
                        for feature in gsub.FeatureList.FeatureRecord:
                            if feature.FeatureTag == 'tnum':
                                for index in feature.Feature.LookupListIndex:
                                    for subtable in gsub.LookupList.Lookup[index].SubTable:
                                        glyph = getattr(subtable, 'mapping', {}).get(glyph, glyph)
                    total += font["hmtx"][glyph][0] / font["head"].unitsPerEm * size
                    break
            else:
                raise ValueError(f"No font metrics for {letter!r}")
        return total + max(0, len(text) - 1) * spacing * size

    results = []
    for width, height in VIEWPORTS:
        mobile = width < 768
        title_size = max(56, min(width * .181, 136)) if mobile else max(96, min(width * .15, 260))
        title_width = advance("Летопись", title_size, -.035 if mobile else -.03)
        year_size = width * .353 if mobile else min(height * .42, width * .27)
        widest_year = max(advance(str(year), year_size, -.045 if mobile else -.035, tabular=True) for year in range(1909, 1942)) + 3
        hero_pin = height * 1.15
        chapter_pin = height * 6.2
        natural = height * 2  # The next-chapter teaser is inside the final pinned frame.
        expected_page_height = hero_pin + chapter_pin + natural
        teaser_size = max(64, min(width * .09, 140))
        teaser_word_width = max(advance(word, teaser_size, -.04) for word in ['Николай', 'Петрович'])
        row = {
            "viewport": [width, height],
            "titleFontPx": round(title_size, 3),
            "titleAdvancePx": round(title_width, 3),
            "titleClearanceEachSidePx": round((width - title_width) / 2, 3),
            "yearFontPx": round(year_size, 3),
            "maximumYearWidthIncludingStrokePx": round(widest_year, 3),
            "yearClearanceEachSidePx": round((width - widest_year) / 2, 3),
            "heroPinPx": hero_pin,
            "chapterPinPx": chapter_pin,
            "sumOfPinsVh": 735,
            "naturalHeightVh": 200,
            "expectedPageHeightPx": expected_page_height,
            "expectedMaximumScrollPx": expected_page_height - height,
            "titleFits": title_width < width,
            "yearFits": widest_year < width,
            "teaserFontPx": round(teaser_size, 3),
            "teaserLongestWordWidthPx": round(teaser_word_width, 3),
            "teaserWordFits": teaser_word_width < width * (.872 if mobile else .9),
            "sceneClipping": "hero and chapter-stage use overflow:clip; html and body use overflow-x:clip",
            "mobilePaperHorizontalBoundsPx": [round(width * .07 - width * .82 * 1.25 * math.sin(math.radians(1)) / 2, 3), round(width * .89 + width * .82 * 1.25 * math.sin(math.radians(1)) / 2, 3)] if mobile else None,
            "note": "Advance metrics before optional font kerning. Browser overflow is audited separately.",
        }
        assert row["titleFits"] and row["yearFits"] and row["teaserWordFits"], row
        results.append(row)
    return results


def prepare(page, url: str) -> None:
    page.goto(url, wait_until="networkidle", timeout=45000)
    page.wait_for_function("window.__film?.ready === true", timeout=30000)
    page.evaluate("""async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
      await Promise.all([...document.querySelectorAll('video')].map(video => {
        if (video.readyState >= 2 || video.error) return;
        return new Promise(resolve => {
          video.addEventListener('loadeddata', resolve, {once:true});
          video.addEventListener('error', resolve, {once:true});
          setTimeout(resolve, 12000);
        });
      }));
    }""")


def seek(page, y: float) -> None:
    page.evaluate("""y => {
      window.scrollTo(0, y);
      window.__lenis?.scrollTo(y, { immediate: true, force: true });
    }""", y)
    page.wait_for_timeout(700)
    # 700ms is shorter than scrub 1.2. Snap the remaining interpolation for an
    # exact percentage frame, without changing the film's runtime settings.
    page.evaluate("window.__film.settle()")
    page.wait_for_timeout(130)  # Finish the 110ms digit drum.


def layout_snapshot(page) -> dict:
    return page.evaluate("""() => {
      const rect = el => {
        const r = el.getBoundingClientRect();
        return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height};
      };
      const glyphs = [...document.querySelectorAll('.letter-mask > span')].map(rect);
      const title = {left: Math.min(...glyphs.map(r=>r.left)), right: Math.max(...glyphs.map(r=>r.right))};
      return {
        viewport: {width:innerWidth,height:innerHeight},
        scrollY, documentWidth:document.documentElement.scrollWidth,
        documentHeight:document.documentElement.scrollHeight,
        bodyWidth:document.body.scrollWidth,
        horizontalOverflow: Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
        title, year:rect(document.querySelector('.year')),
        yearValue:document.querySelector('.year').dataset.year,
        letterCount:document.querySelector('.count-number').textContent,
        medalImage:{...rect(document.querySelector('.medal img')),heightRatio:document.querySelector('.medal img').getBoundingClientRect().height/innerHeight},
        quoteFontSize:getComputedStyle(document.querySelector('.last-quote')).fontSize,
        quoteWordFontSizes:[...document.querySelectorAll('.quote-word')].map(word=>getComputedStyle(word).fontSize),
        heroFogMasks:[...document.querySelectorAll('.hero-fog')].map(layer=>getComputedStyle(layer).maskImage),
        heroCopyOpacity:[...document.querySelectorAll('.hero-description,.scroll-invitation')].map(el=>Number(getComputedStyle(el).opacity)),
        teaser:{...rect(document.querySelector('.next-chapter-title')),opacity:Number(getComputedStyle(document.querySelector('.epilogue')).opacity),visibility:getComputedStyle(document.querySelector('.epilogue')).visibility},
        pins:window.__film.metrics(),
        videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc,ready:v.readyState,error:v.error?.code??null})),
        letterText:rect(document.querySelector('.letter-writing')),
        letterPaper:rect(document.querySelector('.letter-paper')),
      };
    }""")


def sheet(frames: list[tuple[Path, str]], width: int, height: int, output: Path) -> Path:
    columns = 4
    thumb_w = 360 if width > 767 else 188
    thumb_h = round(height * thumb_w / width)
    label_h, gap = 30, 8
    rows = math.ceil(len(frames) / columns)
    canvas = Image.new("RGB", (columns * (thumb_w + gap) + gap, rows * (thumb_h + label_h + gap) + gap), "#171917")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype("arial.ttf", 12) if sys.platform == "win32" else ImageFont.load_default()
    for index, (path, label) in enumerate(frames):
        x = gap + (index % columns) * (thumb_w + gap)
        y = gap + (index // columns) * (thumb_h + label_h + gap)
        with Image.open(path) as image:
            canvas.paste(image.convert("RGB").resize((thumb_w, thumb_h), Image.Resampling.LANCZOS), (x, y + label_h))
        draw.text((x + 5, y + 7), label, font=font, fill="#f3ece0")
    target = output / f"sheet_film_{width}.jpg"
    canvas.save(target, quality=92, subsampling=0)
    return target


def capture_viewport(browser, url: str, width: int, height: int, output: Path) -> dict:
    context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1, reduced_motion="no-preference")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    prepare(page, url)
    seek(page, 0)
    initial = layout_snapshot(page)
    assert initial["title"]["left"] >= -1 and initial["title"]["right"] <= width + 1, initial["title"]
    pin_metrics = initial["pins"]
    assert len(pin_metrics) == 2, pin_metrics
    assert abs(pin_metrics[0]["length"] - height * 1.15) < 2, pin_metrics
    assert abs(pin_metrics[1]["length"] - height * 6.2) < 2, pin_metrics
    expected_height = height * 9.35
    assert abs(initial["documentHeight"] - expected_height) <= 4, (initial["documentHeight"], expected_height)
    assert all(v["ready"] >= 2 and v["error"] is None for v in initial["videos"]), initial["videos"]

    directory = output / "frames_film" / str(width)
    directory.mkdir(parents=True, exist_ok=True)
    frames, audits = [], []
    for scene in pin_metrics:
        for percent in PROGRESS:
            y = scene["start"] + scene["length"] * percent / 100
            seek(page, y)
            audit = layout_snapshot(page)
            assert audit["horizontalOverflow"] <= 1, (scene["id"], percent, audit)
            if scene["id"] == "hero" and percent <= 8:
                assert all(opacity >= .99 for opacity in audit["heroCopyOpacity"]), audit["heroCopyOpacity"]
            if scene["id"] == "petr" and percent == 0:
                assert audit["year"]["left"] >= -1 and audit["year"]["right"] <= width + 1, audit["year"]
                assert audit["yearValue"] == "1909", audit["yearValue"]
            if scene["id"] == "petr" and percent == 68:
                assert audit["letterCount"] == "37", audit["letterCount"]
            if scene["id"] == "petr" and percent == 80:
                low, high = (.28, .32) if width == 1440 else (.22, .26)
                assert low <= audit["medalImage"]["heightRatio"] <= high, audit["medalImage"]
            if scene["id"] == "petr" and percent in (92, 96):
                expected_font = max(30, min(width * .036, 60))
                assert abs(float(audit["quoteFontSize"].removesuffix('px')) - expected_font) < .05, audit["quoteFontSize"]
                assert all(abs(float(size.removesuffix('px')) - expected_font) < .05 for size in audit["quoteWordFontSizes"]), audit["quoteWordFontSizes"]
            if scene["id"] == "hero" and percent in (64, 68, 72, 76, 80, 84):
                assert len(audit["heroFogMasks"]) == 2 and all(mask != 'none' for mask in audit["heroFogMasks"]), audit["heroFogMasks"]
            if scene["id"] == "petr" and percent == 100:
                teaser = audit["teaser"]
                assert teaser["opacity"] >= .99 and teaser["visibility"] == "visible", teaser
                assert teaser["left"] >= -1 and teaser["right"] <= width + 1 and teaser["top"] >= 0 and teaser["bottom"] <= height, teaser
            file = directory / f"{scene['id']}_{percent:03d}.png"
            page.screenshot(path=str(file), animations="disabled")
            frames.append((file, f"{scene['id'].upper()}  {percent:03d}%  |  {width}x{height}"))
            audits.append({"scene": scene["id"], "percent": percent, **audit})
        print(f"Captured {scene['id']}: 26 frames at {width}x{height}", flush=True)

    # The chapter must rewind as well as advance.
    seek(page, pin_metrics[1]["start"])
    assert page.locator(".year").get_attribute("data-year") == "1909"
    seek(page, initial["documentHeight"] - height)
    page.locator("[data-open-tree]").click()
    assert page.locator("#tree").is_visible()
    page.keyboard.press("Escape")
    assert not page.locator("#tree").is_visible()
    page.locator("[data-open-prices]").click()
    assert page.locator(".prices-dialog").is_visible()
    page.keyboard.press("Escape")
    page.get_by_role("link", name="Истории", exact=True).click()
    page.wait_for_timeout(1800)
    assert abs(page.evaluate("scrollY") - pin_metrics[1]["start"]) < 3
    assert not errors, errors
    target = sheet(frames, width, height, output)
    context.close()

    # A separate context tests the operating-system reduced-motion preference.
    reduced_context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1, reduced_motion="reduce")
    reduced_page = reduced_context.new_page()
    prepare(reduced_page, url)
    static_audit = reduced_page.evaluate("""() => ({
      reduced:window.__film.reducedMotion,
      pins:document.querySelectorAll('.pin-spacer').length,
      overflow:document.documentElement.scrollWidth-innerWidth,
      beats:[...document.querySelectorAll('.beat')].map(el=>({top:el.offsetTop,height:el.offsetHeight})),
      videosPaused:[...document.querySelectorAll('video')].every(v=>v.paused),
    })""")
    assert static_audit["reduced"] and static_audit["pins"] == 0 and static_audit["overflow"] <= 1, static_audit
    assert static_audit["videosPaused"], static_audit
    assert all(b["top"] > a["top"] for a, b in zip(static_audit["beats"], static_audit["beats"][1:])), static_audit
    reduced_page.screenshot(path=str(output / f"film_reduced_{width}.png"), full_page=True, animations="disabled")
    reduced_context.close()
    return {"viewport": [width, height], "sheet": str(target), "frames": audits, "consoleErrors": errors, "reducedMotion": static_audit, "controls": "tree, Escape, prices, chapter navigation, reverse scroll passed"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", default="http://127.0.0.1:4173/")
    parser.add_argument("--browser", choices=["chromium", "chrome", "msedge"], default="chromium")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--output", type=Path, default=ROOT)
    parser.add_argument("--project", type=Path, default=PROJECT)
    parser.add_argument("--math-only", action="store_true")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = {"url": args.url, "mathematicalAudit": mathematical_audit(args.project), "browserAudit": [], "browserStatus": "not run"}
    report_path = args.output / "film_audit.json"
    if args.math_only:
        print(json.dumps(report["mathematicalAudit"], ensure_ascii=False, indent=2))
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
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
        print("All 104 frames, both sheets, layout, controls and reduced motion verified.")
        return 0
    except Exception as error:
        report["browserStatus"] = "failed"
        report["error"] = str(error)
        print(f"Capture could not finish: {error}\nMath results are saved. No screenshots were fabricated.\nIf the browser is missing: python -m playwright install chromium\nIf sandbox launch is blocked, run this script outside that sandbox or use --browser msedge.", file=sys.stderr)
        return 1
    finally:
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
