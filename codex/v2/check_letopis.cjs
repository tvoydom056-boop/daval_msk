/* Browser QA for the local v2 mockup. No website dependencies are added.
   Usage: node check_letopis.cjs [--cdp http://127.0.0.1:9333]
   A regular local Playwright installation is used for the test runner only. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const site = path.join(root, 'letopis');
const output = path.join(__dirname, 'qa_letopis');

async function check({browser, baseURL='http://127.0.0.1:8765/letopis/', progress=console.log}) {
  fs.mkdirSync(output, {recursive:true});
  const report = {date:new Date().toISOString(), baseURL, sources:{}, viewports:[], missing:[]};
  for (const name of ['index.html','styles.css','app.js','data.js']) {
    const text = fs.readFileSync(path.join(site,name),'utf8');
    report.sources[name] = {asciiDashes:!/[\u2013\u2014]/u.test(text)};
    assert(report.sources[name].asciiDashes, `${name}: non-ASCII dash`);
  }
  const sandbox = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(site,'data.js'),'utf8'),sandbox);
  const data = sandbox.window.LETOPIS;
  for (const id of Object.keys(data.people)) if (!fs.existsSync(path.join(site,`assets/v2/people/${id}.jpg`))) report.missing.push(`people/${id}.jpg`);
  for (const name of ['hero','fog','war','bridge','football','school']) if (!fs.existsSync(path.join(site,`assets/v2/scenes/${name}.jpg`))) report.missing.push(`scenes/${name}.jpg`);
  for (const ch of data.chapters) for (const [name,,type] of ch.props) if (type !== 'portrait' && !fs.existsSync(path.join(site,`assets/v2/props/${name}.png`))) report.missing.push(`props/${name}.png`);
  for (const [width,height] of [[1440,900],[375,812]]) {
    progress(`Checking ${width}x${height}`);
    const context = await browser.newContext({viewport:{width,height},hasTouch:width===375,deviceScaleFactor:1});
    const page = await context.newPage();
    const result = {width,height,consoleErrors:[],pageErrors:[],overflow:[],screens:[],assertions:{}};
    page.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(m.text())});
    page.on('pageerror',e=>result.pageErrors.push(String(e)));
    await page.goto(baseURL,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    const noOverflow = async label => {
      const dimensions = await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      if(dimensions.scroll>dimensions.client)result.overflow.push({label,...dimensions});
    };
    const go = async (selector, travel=0) => {
      await page.evaluate(({selector,travel})=>{const el=document.querySelector(selector);const r=el.getBoundingClientRect();window.scrollTo({top:window.scrollY+r.top+travel*(r.height-window.innerHeight),behavior:'instant'})},{selector,travel});
      await page.waitForTimeout(350);
      await noOverflow(selector);
    };
    const shot = async name => {
      await page.waitForTimeout(3200);
      const filename=`${width}_${name}.png`;
      await page.screenshot({path:path.join(output,filename),animations:'allow'});
      result.screens.push(filename);
    };
    const offset = i=>page.locator('.ribbon__track').nth(i).evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
    await shot('hero');
    await go('#treeStage');
    await page.mouse.move(1,1);
    const before=await offset(0);await page.waitForTimeout(2000);const after=await offset(0);
    result.assertions.movingPx=after-before;
    assert(Math.abs(after-before)>1,'Ribbons do not move');
    const box=await page.locator('.ribbon__viewport').first().boundingBox();
    await page.mouse.move(width-10,Math.max(100,box.y+50));await page.waitForTimeout(650);
    const paused=await offset(0);await page.waitForTimeout(2000);
    result.assertions.hoverDriftPx=(await offset(0))-paused;
    assert(Math.abs(result.assertions.hoverDriftPx)<.1,'Ribbon does not stop on hover');
    await page.mouse.move(1,1);await shot('tree');
    const target=await page.locator('[data-person="nikolay"]').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+50,d:Math.abs(r.x+r.width/2-innerWidth/2)}}).sort((a,b)=>a.d-b.d)[0]);
    if(width===375)await page.touchscreen.tap(target.x,target.y);
    else {await page.mouse.move(target.x,target.y);await page.waitForTimeout(600);await page.mouse.click(target.x,target.y)}
    await page.waitForTimeout(1150);
    result.assertions.alignment=await page.evaluate(()=>{
      const center=id=>[...document.querySelectorAll(`[data-person="${id}"]`)].map(el=>{const r=el.getBoundingClientRect();return r.left+r.width/2}).sort((a,b)=>Math.abs(a-innerWidth/2)-Math.abs(b-innerWidth/2))[0];
      return {parents:(center('petr')+center('maria'))/2,self:center('nikolay'),children:(center('sergey')+center('olga'))/2,screen:innerWidth/2};
    });
    for(const name of ['parents','self','children'])assert(Math.abs(result.assertions.alignment[name]-width/2)<=4,`Alignment: ${name}`);
    assert(await page.locator('#selection').isVisible(),'Selection panel is not visible');
    await shot('tree_selected');
    await page.keyboard.press('Escape');
    result.assertions.escapeReleases=await page.locator('#selection').isHidden();
    assert(result.assertions.escapeReleases,'Escape does not release selection');
    for(const ch of data.chapters) {
      progress(`${width}: chapter ${ch.id}`);
      await go(`#chapter-${ch.id}`);await shot(`${ch.id}_opening`);
      await go(`#chapter-${ch.id} .chapter-panel`,.55);await shot(`${ch.id}_panel`);
      const props=await page.locator(`#chapter-${ch.id} .prop.is-in`).count();
      assert.equal(props,4,`Missing props in ${ch.id}`);
    }
    await go('#prices');await shot('prices');
    result.assertions.prices=await page.locator('.plan__price').allTextContents();
    assert.deepEqual(result.assertions.prices,['3 990 ₽','7 900 ₽','от 14 900 ₽']);
    await page.locator('[data-plan="История жизни"]').click();
    await page.locator('input[name=name]').fill('Тест макета');
    await page.locator('input[name=contact]').fill('@demo');
    let posted=false;page.on('request',r=>{if(r.method()==='POST')posted=true});
    await page.locator('#form button[type=submit]').click();
    result.assertions.demoForm=!posted && (await page.locator('#formNote').textContent()).includes('Это макет: заявка не отправляется.');
    assert(result.assertions.demoForm,'Demo form attempted to send data');
    await page.locator('#slotsToggle').click();
    result.assertions.slots=await page.locator('body').evaluate(el=>el.classList.contains('show-slots'));
    await page.locator('#slotsToggle').click();
    if(width===375){await page.locator('#menuToggle').click();assert(await page.locator('#mobileMenu').isVisible());await page.keyboard.press('Escape');assert(await page.locator('#mobileMenu').isHidden())}
    await go('#compare');await page.locator('#compare input').fill('75');
    assert.equal(await page.locator('#compare').evaluate(el=>el.style.getPropertyValue('--pos')),'75%');
    await page.emulateMedia({reducedMotion:'reduce'});await go('#treeStage');
    const reducedBefore=await offset(0);await page.waitForTimeout(2000);
    result.assertions.reducedMotionDriftPx=(await offset(0))-reducedBefore;
    assert(Math.abs(result.assertions.reducedMotionDriftPx)<.1,'Reduced motion still moves');
    assert(await page.locator('video').evaluateAll(nodes=>nodes.every(v=>v.paused)),'Video plays under reduced motion');
    assert.equal(result.consoleErrors.length,0,'Console errors');assert.equal(result.pageErrors.length,0,'Page errors');assert.equal(result.overflow.length,0,'Horizontal overflow');
    report.viewports.push(result);
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));
    await context.close();
  }
  progress(JSON.stringify(report,null,2));
  return report;
}
module.exports={check};
if(require.main===module){
  (async()=>{
    let pw;try{pw=require('playwright')}catch(_){
      const {execFileSync}=require('node:child_process');
      const driver=execFileSync('python',['-c','import pathlib,playwright;print(pathlib.Path(playwright.__file__).parent/"driver"/"package")'],{encoding:'utf8'}).trim();pw=require(driver);
    }
    const cdp=process.argv.indexOf('--cdp');
    const browser=cdp>=0?await pw.chromium.connectOverCDP(process.argv[cdp+1]):await pw.chromium.launch();
    try{await check({browser})}finally{if(cdp<0)await browser.close()}
  })().catch(error=>{console.error(error);process.exitCode=1});
}
