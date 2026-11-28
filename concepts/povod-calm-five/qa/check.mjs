import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,all)=>v.startsWith('--')?[...a,[v.slice(2),all[i+1]]]:a,[]));
if(!args['playwright-module'])throw new Error('Pass --playwright-module with the installed Playwright path');
const { chromium }=require(args['playwright-module']);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url=(args.url||'http://127.0.0.1:8865/').replace(/\/?$/,'/');
const output=path.join(root,'qa');
const preview=path.join(root,'previews');
await fs.mkdir(output,{recursive:true});await fs.mkdir(preview,{recursive:true});
const browser=await chromium.launch({headless:true,...(args['browser-path']?{executablePath:args['browser-path']}:{channel:'msedge'}),args:['--disable-gpu']});
const context=await browser.newContext({reducedMotion:'reduce'});
const pages=['01-editorial','02-garden','03-archive','04-letter','05-voice'];
const sizes=[[1440,900],[1024,768],[768,1024],[390,844],[375,812]];
const results={browser:browser.version(),viewports:sizes,pages:[],failures:[]};
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function settle(page){
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(850);
}
for(const name of pages){
 const result={name,viewports:[],interactions:[],errors:[],warnings:[],badResponses:[]};
 const page=await context.newPage();
 page.on('pageerror',e=>result.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());else if(m.type()==='warning')result.warnings.push(m.text())});
 page.on('response',r=>{if(r.status()>=400)result.badResponses.push({status:r.status(),url:new URL(r.url()).pathname})});
 const writes=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
 try{
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height});
   await page.goto(url+name+'/',{waitUntil:'networkidle'});await settle(page);
   const geometry=await page.evaluate(()=>{
    const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};
    return {scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,h1:document.querySelectorAll('h1').length,
      broken:[...document.images].filter(visible).filter(e=>e.complete&&!e.naturalWidth).map(e=>e.getAttribute('src')),
      missingAlts:[...document.images].filter(e=>!e.hasAttribute('alt')).length,
      outside:[...document.querySelectorAll('main *')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.left< -2||r.right>innerWidth+2}).slice(0,8).map(e=>e.tagName+'.'+e.className),
      cta:[...document.querySelectorAll('.hero a[href="#contact"]')].filter(visible).some(e=>e.getBoundingClientRect().bottom<=innerHeight+1)
    };
   });
   assert(geometry.scroll<=geometry.client+1, 'Overflow '+width+': '+JSON.stringify(geometry));
   assert(geometry.outside.length===0,'Elements outside '+width+': '+geometry.outside.join(','));
   assert(geometry.h1===1,'Expected one h1');
   assert(!geometry.broken.length,'Broken images '+geometry.broken);
   assert(geometry.missingAlts===0,'Missing alt');
   assert(geometry.cta,'Hero CTA below fold at '+width);
   result.viewports.push({width,height,...geometry});
   if(width===1440||width===375){
    await page.screenshot({path:path.join(preview,name+'-'+width+'-hero.png')});
    await page.evaluate(async()=>{
      for(let y=0;y<document.documentElement.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,35))}
      window.scrollTo(0,0);
    });
    await page.waitForTimeout(150);
    await page.screenshot({path:path.join(preview,name+'-'+width+'.png'),fullPage:true});
   }
  }
  await page.setViewportSize({width:375,height:812});
  await page.goto(url+name+'/',{waitUntil:'networkidle'});await settle(page);
  const menu=page.locator('[data-menu-toggle]');
  await menu.click();assert(await menu.getAttribute('aria-expanded')==='true','Menu did not open');
  await page.keyboard.press('Escape');assert(await menu.getAttribute('aria-expanded')==='false','Menu did not close');
  await menu.click();await page.locator('[data-menu] a[href="#contact"]').click();
  assert(await menu.getAttribute('aria-expanded')==='false','Anchor left mobile menu open');
  result.interactions.push('mobile menu: open, Escape, anchor close');
  const groups=page.locator('[data-occasion-group]');
  for(let i=0;i<await groups.count();i++){
    const group=groups.nth(i),buttons=group.locator('[data-occasion]');
    for(let j=0;j<await buttons.count();j++){
      const button=buttons.nth(j);await button.click();
      const key=await button.getAttribute('data-occasion');
      assert(await button.getAttribute('aria-pressed')==='true','Occasion not pressed');
      assert(await group.locator('[data-occasion-panel]:visible').count()===1,'Expected one visible occasion');
      assert(await group.locator('[data-occasion-panel="'+key+'"]').isVisible(),'Wrong occasion panel');
    }
  }
  result.interactions.push('occasion switches');
  const details=page.locator('.faq details').last();
  if(await details.count()){const open=await details.getAttribute('open');await details.locator('summary').click();assert((await details.getAttribute('open'))!==open,'FAQ did not toggle');result.interactions.push('FAQ toggles')}
  const form=page.locator('[data-demo-form]');await form.locator('button[type="submit"]').click();
  assert(await form.locator('[aria-invalid="true"]').count()>=1,'Empty form accepted');
  assert(await page.evaluate(()=>document.activeElement?.name)==='name','First invalid field not focused');
  await form.locator('[name="name"]').fill('Тест');
  await form.locator('[name="contact"]').fill('@demo');
  await form.locator('[name="occasion"]').selectOption({label:'День рождения'});
  await form.locator('[name="comment"]').fill('Проверка демонстрационного сценария');
  await form.locator('button[type="submit"]').click();
  assert((await form.locator('[data-form-message]').textContent()).includes('не отправлена'),'Misleading form result');
  assert(writes.length===0,'Form sent a request');
  assert(await page.locator('.voice-demo button:not([disabled])').count()===0,'Enabled fake audio');
  result.interactions.push('form errors, focus, local validation, zero writes','disabled honest audio');
  await page.setViewportSize({width:1440,height:900});await page.goto(url+name+'/',{waitUntil:'networkidle'});await settle(page);
  await page.keyboard.press('Tab');assert(await page.locator('.skip-link').evaluate(e=>e===document.activeElement),'Skip link is not first focus');
  result.interactions.push('keyboard skip link','reduced motion');
  assert(result.errors.length===0,'Console errors: '+result.errors.join(';'));
  assert(result.badResponses.length===0,'HTTP errors: '+JSON.stringify(result.badResponses));
  result.status='PASS';
 }catch(e){result.status='FAIL';result.failure=e.message;results.failures.push({name,error:e.message})}
 results.pages.push(result);
 console.log(JSON.stringify({name,status:result.status,failure:result.failure}));
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
 await page.close();
}
const gallery=await context.newPage();
await gallery.goto(url,{waitUntil:'networkidle'});
assert(await gallery.locator('.concept').count()===5,'Gallery does not have five concepts');
await gallery.screenshot({path:path.join(preview,'gallery.png'),fullPage:true});
results.gallery='PASS';
await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
await browser.close();
if(results.failures.length)process.exitCode=1;
