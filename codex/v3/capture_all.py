"""Capture six film scenes and the horizontal gallery every 4%, plus six lower views.

Run npm run build and npm run preview in v3/letopis, then:
  python capture_all.py --url http://127.0.0.1:4173/
  python capture_all.py --browser msedge
  python capture_all.py --math-only --output qa/all-checks

Requirements: playwright pillow fonttools brotli; playwright install chromium.
The old capture_film.py, sheets and frames are retained.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFont
from capture_film import mathematical_audit, seek

ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parents[1]/'v3'/'letopis'
SCENES={'hero':115,'tree':200,'petr':620,'nikolay':600,'sergey':560,'maria':560}
PINS={**SCENES,'restoration':120,'benefits':360}
CAPTURE_SCENES=[*SCENES,'benefits']
VIEWPORTS=[(1440,900),(375,812)]
LOWER=['restoration','qr','benefits','prices','faq','request']


def geometry(project):
    records=mathematical_audit(project)
    for record in records:
        width,height=record['viewport']
        record.pop('expectedPageHeightPx',None)
        record.pop('expectedMaximumScrollPx',None)
        record['pinLengthsPx']={name:height*distance/100 for name,distance in PINS.items()}
        record['sumOfPinsVh']=sum(PINS.values())
        record['naturalHeightVh']=800
        record['pinnedPlusNaturalPx']=height*39.35
        record['pageFormula']='3135vh of pins + 800vh of natural pinned stages + restoration notes + other paper sections + footer'
        record['lowerSectionsHeight']='Measured by window.__film.layout() in the actual browser, not guessed.'
        if width==375:
            envelope_w=width*.27
            envelope_h=envelope_w*2/3
            rotated_envelope=envelope_w*math.cos(math.radians(6))+envelope_h*math.sin(math.radians(6))
            record['mobileRestingBoundsPx']={
                'brigadePhoto':[.14*width,.86*width],
                'teamPhoto':[.09*width,.91*width],
                'notebook':[.04*width,.96*width],
                'caliper':[.07*width,.93*width],
                'globe':[.09*width,.09*width+.34*height*506/900],
                'envelopeRing':[.015*width,.985*width],
                'scoreboard':[.064*width,.936*width],
                'rotatedEnvelopeRing':[.15*width-rotated_envelope/2,.85*width+rotated_envelope/2],
            }
            assert all(0<=bounds[0]<bounds[1]<=width for bounds in record['mobileRestingBoundsPx'].values())
        record['documentOverflowControl']='html/body overflow-x:clip; pinned stages overflow:clip; captions and paper grids have responsive widths'
    return records


def prepare(page,url):
    page.goto(url,wait_until='networkidle',timeout=45000)
    page.wait_for_function('window.__film?.ready === true',timeout=30000)
    page.evaluate('document.fonts.ready')


def snapshot(page):
    return page.evaluate('''() => {
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
      return {
        scrollY,overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
        layout:window.__film.layout(),
        counters:{objects:document.querySelector('[data-object-count]').textContent,years:document.querySelector('[data-years-count]').textContent,letters:document.querySelector('.count-number').textContent},
        clock:document.querySelector('.match-clock').getAttribute('aria-label'),
        medal:{...rect(document.querySelector('.medal img')),ratio:document.querySelector('.medal img').getBoundingClientRect().height/innerHeight},
        quoteFont:getComputedStyle(document.querySelector('#petr .last-quote')).fontSize,
        videoStates:[...document.querySelectorAll('video')].map(v=>({source:v.currentSrc,paused:v.paused,ready:v.readyState})),
        activeFogCanvasCount:[...document.querySelectorAll('.procedural-fog')].length,
      };
    }''')


def make_sheet(frames,scene,width,height,output):
    columns=4
    tw=360 if width==1440 else 188
    th=round(height*tw/width)
    gap,label=8,28
    image=Image.new('RGB',(columns*(tw+gap)+gap,math.ceil(len(frames)/columns)*(th+label+gap)+gap),'#171917')
    draw=ImageDraw.Draw(image)
    try:font=ImageFont.truetype('arial.ttf',12)
    except OSError:font=ImageFont.load_default()
    for index,(file,title) in enumerate(frames):
        x=gap+(index%columns)*(tw+gap);y=gap+(index//columns)*(th+label+gap)
        draw.text((x+5,y+7),title,font=font,fill='#f3ece0')
        with Image.open(file) as frame:image.paste(frame.convert('RGB').resize((tw,th),Image.Resampling.LANCZOS),(x,y+label))
    target=output/f'sheet_{scene}_{width}.jpg'
    image.save(target,quality=92,subsampling=0)
    return str(target)


def capture(browser,url,width,height,output):
    context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='no-preference')
    page=context.new_page();errors=[];posts=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('console',lambda message:errors.append(message.text) if message.type=='error' else None)
    page.on('request',lambda request:posts.append(request.url) if request.method=='POST' else None)
    prepare(page,url)
    initial=page.evaluate('window.__film.layout()')
    assert len(initial['pins'])==8,initial
    for pin in initial['pins']:
        assert abs(pin['length']-height*PINS[pin['id']]/100)<3,pin
    assert abs(initial['expected']-initial['actual'])<9,initial
    assert initial['overflow']<=1,initial
    frames_root=output/'frames_all'/str(width);frames_root.mkdir(parents=True,exist_ok=True)
    result={'viewport':[width,height],'initialLayout':initial,'scenes':{},'sheets':[]}
    for scene in CAPTURE_SCENES:
        page.evaluate('id=>window.__film.prepare(id)',scene)
        metric=next(pin for pin in page.evaluate('window.__film.metrics()') if pin['id']==scene)
        frames=[];records=[]
        for percent in range(0,101,4):
            seek(page,metric['start']+metric['length']*percent/100)
            record=snapshot(page)
            assert record['overflow']<=1,(scene,percent,record['overflow'])
            if scene=='petr' and percent==80:
                low,high=(.28,.32) if width==1440 else (.22,.26)
                assert low<=record['medal']['ratio']<=high,record['medal']
            if scene=='petr' and percent in (92,96):
                assert abs(float(record['quoteFont'].removesuffix('px'))-max(30,min(width*.036,60)))<.05,record['quoteFont']
            if scene=='nikolay' and percent==72:assert record['counters']['objects']=='14',record
            if scene=='maria' and percent==72:assert record['counters']['years']=='41',record
            if scene=='sergey' and 20<=percent<=28:assert record['clock']=='88:00',record
            file=frames_root/f'{scene}_{percent:03d}.png';page.screenshot(path=str(file),animations='disabled')
            frames.append((file,f'{scene.upper()} {percent:03d}% | {width}x{height}'))
            records.append({'percent':percent,**record})
        result['scenes'][scene]=records
        result['sheets'].append(make_sheet(frames,scene,width,height,output))
        print(f'{scene} {width}: 26 frames saved',flush=True)
    lower_frames=[]
    for index,section in enumerate(LOWER):
        page.evaluate('id=>window.__film.prepare(id)',section)
        position=page.evaluate('''id=>{
          const pin=window.__film.metrics().find(p=>p.id===id);
          return pin?pin.start+pin.length*.5:document.getElementById(id).getBoundingClientRect().top+scrollY;
        }''',section)
        seek(page,position)
        page.wait_for_timeout(1500)  # Finish headings and the staggered price-card entrances.
        assert snapshot(page)['overflow']<=1,section
        file=frames_root/f'lower_{index+1}_{section}.png';page.screenshot(path=str(file),animations='disabled')
        lower_frames.append((file,f'LOWER {index+1}: {section.upper()} | {width}'))
    result['sheets'].append(make_sheet(lower_frames,'sections',width,height,output))
    # Verify real user interactions after the storyboard capture.
    tree=next(pin for pin in page.evaluate('window.__film.metrics()') if pin['id']=='tree')
    seek(page,tree['start']+tree['length']*.7)
    page.locator('[data-person="anna"]').click()
    assert page.locator('.selection').is_visible()
    page.locator('.selection__close').click()
    assert not page.locator('.selection').is_visible()
    page.locator('[data-person="nikolay"]').click()
    page.locator('.tree-selection .glass-btn').click();page.wait_for_timeout(1800)
    chapter=next(pin for pin in page.evaluate('window.__film.metrics()') if pin['id']=='nikolay')
    assert abs(page.evaluate('scrollY')-chapter['start'])<5
    price_y=page.evaluate('document.getElementById("prices").getBoundingClientRect().top+scrollY');seek(page,price_y)
    page.locator('[data-plan="История жизни"]').click();page.wait_for_timeout(1800)
    assert page.locator('[name=plan]').input_value()=='История жизни'
    page.locator('[name=name]').fill('Проверка макета');page.locator('[name=contact]').fill('@demo')
    page.locator('#request-form [type=submit]').click()
    assert 'не отправляется' in page.locator('.form-note').inner_text()
    assert not posts,posts
    assert not errors,errors
    result['interactionChecks']='tree selection/release, chapter navigation, plan selection, demo form and no POST passed'
    result['errors']=errors
    context.close()
    reduced_context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
    reduced_page=reduced_context.new_page();prepare(reduced_page,url)
    static=reduced_page.evaluate('''()=>({reduced:window.__film.reducedMotion,pins:document.querySelectorAll('.pin-spacer').length,overflow:document.documentElement.scrollWidth-innerWidth,order:[...document.querySelectorAll('[data-scene]')].map(el=>el.id),videosPaused:[...document.querySelectorAll('video')].every(v=>v.paused)})''')
    assert static['reduced'] and static['pins']==0 and static['overflow']<=1 and static['videosPaused'],static
    assert static['order']==list(SCENES),static
    result['reducedMotion']=static;reduced_context.close()
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--url',default='http://127.0.0.1:4173/')
    parser.add_argument('--browser',choices=['chromium','chrome','msedge'],default='chromium')
    parser.add_argument('--output',type=Path,default=ROOT)
    parser.add_argument('--project',type=Path,default=PROJECT)
    parser.add_argument('--headed',action='store_true');parser.add_argument('--math-only',action='store_true')
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    report={'url':args.url,'geometry':geometry(args.project),'browserStatus':'not run','viewports':[]}
    target=args.output/'capture_all_report.json'
    if args.math_only:
        target.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(report['geometry'],ensure_ascii=False,indent=2));return 0
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            launch={'headless':not args.headed,'args':['--autoplay-policy=no-user-gesture-required']}
            if args.browser!='chromium':launch['channel']=args.browser
            browser=playwright.chromium.launch(**launch)
            for width,height in VIEWPORTS:report['viewports'].append(capture(browser,args.url,width,height,args.output))
            browser.close()
        report['browserStatus']='passed'
        print(f'{len(VIEWPORTS)*(len(CAPTURE_SCENES)*26+len(LOWER))} frames, {len(VIEWPORTS)*(len(CAPTURE_SCENES)+1)} sheets and interaction/layout checks passed.')
        return 0
    except Exception as error:
        report['browserStatus']='failed';report['error']=str(error);print('Capture failed: '+str(error),file=sys.stderr);return 1
    finally:target.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')


if __name__=='__main__':raise SystemExit(main())
