/* Geometry checks execute the layout/alignment functions from the actual app.
   This is a calculation check, not a substitute for a Chromium screenshot. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const site = path.join(root, 'letopis');
const app = fs.readFileSync(path.join(site, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(site, 'styles.css'), 'utf8');
const context = vm.createContext({
  window:{}, innerWidth:1440, reduced:true, rows:[], selected:'nikolay', hovered:null,
  locked:false, performance:{now:()=>0}, renderPositions:()=>{}, lines:{innerHTML:''}
});
vm.runInContext(fs.readFileSync(path.join(site, 'data.js'), 'utf8'), context);
context.P = context.window.LETOPIS.people;
function section(start, end) {
  const a = app.indexOf(start), b = app.indexOf(end, a);
  assert(a>=0 && b>a, `Missing source section: ${start}`);
  return app.slice(a,b);
}
vm.runInContext([
  app.match(/  const clamp = [^\n]+/)[0],
  app.match(/  const ease = [^\n]+/)[0],
  app.match(/  const kids = [^\n]+/)[0],
  section('  const normalize = row', '  const personHTML'),
  section('  const personHTML', '  function ribbonLayout('),
  section('  function ribbonLayout(', '  function renderPositions('),
  section('  function align(', '  function select('),
  section('  function point(', '  /* Однократное появление'),
  section('  function slotDock(', '  function positionSlots('),
  'this.normalizeRow=normalize;this.edgeCount=parentEdges.length;'
].join('\n'), context);

const D = context.window.LETOPIS;
const report = {kind:'calculation, not browser rendering',viewports:[],alignmentChecks:0,maxAlignmentErrorPx:0,parentChildPairs:context.edgeCount,missingAssets:[]};
const models = [];
for (const [width,height] of [[1440,900],[375,812]]) {
  context.innerWidth = width;
  const mobile = width<=700, rowHeight=mobile?129:118, roleGap=mobile?0:12, roleRoom=mobile?10:12, photoInset=mobile?16:0;
  function rowsAt(fraction) {
    return D.generations.map((g,i)=>{
      const layout=context.ribbonLayout(g,i,width,mobile);
      return {...g,...layout,basePositions:{...layout.positions},offset:layout.span*fraction,pause:1,velocity:0,hover:false,group:null,tween:null,geometryTween:null,track:{style:{}},y:i*(rowHeight+roleGap)+photoInset,buttons:[]};
    });
  }
  const layoutRows = rowsAt(-.5);
  for(const row of layoutRows) {
    assert(row.span>width,'A face repeats before the next screen');
    const expected=Math.max(mobile?132:230,1.04*width/row.ids.length);
    assert.equal(row.baseStep,expected,'Incorrect spacing formula');
    for(const step of row.steps)assert(Math.abs(step/expected-1)<=.080000001,'Spacing exceeds 8 percent variation');
    if(mobile)assert(Math.min(...row.steps)>=132,'Phone person spacing is below 132 px');
    else assert(Math.abs(row.span-expected*row.ids.length)<1e-6,'Variation changed the loop period');
    assert(!('memories' in row)&&!('lights' in row),'Decorative tile data remains in a ribbon');
  }
  const ribbonHolder={innerHTML:''};context.$=()=>ribbonHolder;
  vm.runInContext('(()=>{const D=window.LETOPIS,mobile=innerWidth<=700;'+section('    const layouts = D.generations','    rows = D.generations.map')+'})()',context);
  const ribbonMarkup=ribbonHolder.innerHTML;
  const sources=[...ribbonMarkup.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
  const nonPortraits=sources.filter(src=>!/^assets\/v2\/people\/[a-z]+\.jpg$/.test(src));
  const tiles=[...ribbonMarkup.matchAll(/class="[^"]*\b(?:memory|memory-light|prop|tile)\b[^\"]*"/g)];
  assert.equal(nonPortraits.length,0,'Ribbon HTML contains non-person images');
  assert.equal(tiles.length,0,'Ribbon HTML contains a decorative tile');
  const header=mobile?26:68,gap=mobile?6:18;
  const stageHeight=5*rowHeight+4*roleGap+roleRoom;
  const occupied=header+gap+stageHeight,stageTop=mobile?76+header+gap:(height-occupied)/2+header+gap;
  assert(occupied<=height,'All five strips do not fit');
  assert(stageTop+stageHeight<=height,'Fifth strip is outside the screen');
  const roleBottom=photoInset+(mobile?70:90)+2+(mobile?30:15)+11+(mobile?10:11);
  assert(roleBottom<=rowHeight+roleRoom,'Role is clipped');
  assert(roleBottom<=rowHeight+(mobile?photoInset:roleGap),'Role touches the next portrait');
  if(mobile)assert(14<photoInset,'Generation label overlaps the portrait');
  const shiftedStageBottom=stageTop+stageHeight-(mobile?0:12);
  const panelHeight=mobile?86.2:65,panelTop=mobile?stageTop+stageHeight+14:height-18-panelHeight;
  assert(shiftedStageBottom<panelTop,'Selection panel overlaps the tree');
  const slotTop=height-(mobile?72:14)-30;
  const result={width,height,treeHeight:height,headerPx:header,stripHeight:rowHeight,allStripsHeight:5*rowHeight,roleGap,roleRoom,stageBottom:stageTop+stageHeight,selectedStageBottom:shiftedStageBottom,selectionPanelTop:panelTop,slotsButtonTop:slotTop,roleBottom,loopPeriods:layoutRows.map(r=>r.span),baseSteps:layoutRows.map(r=>r.baseStep),personSpacingRanges:layoutRows.map(r=>[Math.min(...r.steps),Math.max(...r.steps)]),generatedRibbonHtml:{portraitImages:sources.length,nonPortraitImages:nonPortraits.length,decorativeTiles:tiles.length},speeds:D.generations.map(g=>g.speed)};
  for(const fraction of [-.99,-.51,-.01])for(const id of Object.keys(D.people)) {
    context.rows=rowsAt(fraction);
    context.align(id,true);
    const person=D.people[id],children=Object.keys(D.people).filter(key=>D.people[key].parents?.includes(id));
    const groups=[person.parents||[],[id],children].filter(g=>g.length);
    for(const group of groups){
      const points=group.map(key=>context.point(key));
      const x=points.reduce((sum,p)=>sum+p.x,0)/points.length;
      const error=Math.abs(x-width/2);
      report.maxAlignmentErrorPx=Math.max(report.maxAlignmentErrorPx,error);
      report.alignmentChecks++;assert(error<=4,`${id}: family alignment error ${error}`);
      if(mobile)for(const p of points)assert(p.x>=55-1e-8&&p.x<=width-55+1e-8,`${id}: selected relative or name is clipped`);
    }
    if(mobile)for(const row of context.rows)for(let i=1;i<row.ids.length;i++)assert(row.positions[row.ids[i]]-row.positions[row.ids[i-1]]>=132-1e-8,'Selected phone labels became too close');
    if(id==='nikolay'&&fraction===-.51)result.nikolay={parents:(context.point('petr').x+context.point('maria').x)/2,self:context.point('nikolay').x,children:(context.point('sergey').x+context.point('olga').x)/2};
  }
  // Use source CSS bounds, not scrollWidth: Chromium cannot launch here.
  assert(css.includes('.hero__media{inset:-10% 0}'),'Hero still extends beyond the phone');
  assert(!css.includes('inset:-10% -18%'),'Old 67.5 px overflow remains');
  assert(css.includes('overflow-x:clip;height:100vh'),'Hero clipping is missing');
  assert(css.includes('>* {min-width:0;max-width:100%}'),'Grid intrinsic-size fix is missing');
  result.horizontalOverflow={modelPx:0,browserMeasured:false,oldHeroOverflowPx:mobile?width*.18:0};
  context.rows=rowsAt(-.5);context.locked=false;
  for(const row of context.rows){const first=row.positions[row.ids[0]],last=row.positions[row.ids.at(-1)];const anchor=(first+last)/2;row.offset=width/2+(mobile?0:60)-row.width/2-anchor;context.normalizeRow(row)}
  if(mobile)context.align('nikolay',true);
  result.initialMobileBranch=mobile?{parents:(context.point('petr').x+context.point('maria').x)/2,self:context.point('nikolay').x,children:(context.point('sergey').x+context.point('olga').x)/2}:null;
  if(mobile){
    context.touchHint={hidden:false};context.drag=null;context.reduced=false;context.locked=false;
    context.dt=1000/60;context.frames=1;context.now=0;
    const before=context.rows.slice(0,3).map(r=>r.offset);
    const loop=section('        rows.forEach(row => {','        drawConnections(now);');
    for(let i=0;i<120;i++){context.now+=context.dt;vm.runInContext(loop,context)}
    assert.deepEqual(context.rows.slice(0,3).map(r=>r.offset),before,'Initial branch drifts away before first touch');
    result.initialBranchHeldFor2Seconds=true;
    context.touchHint.hidden=true;vm.runInContext(loop,context);
    assert(context.rows.slice(0,3).some((r,i)=>r.offset!==before[i]),'First touch did not release the initial branch');
    context.reduced=true;
  }
  result.visiblePeople=context.rows.map(row=>{
    const count=(offset,fully)=>row.ids.filter(id=>[-1,0,1,2,3].some(copy=>{
      const left=offset+row.positions[id]+copy*row.span;
      return fully?left>=0&&left+row.width<=width:left+row.width>0&&left<width;
    })).length;
    const initialFullyVisible=count(row.offset,true);
    const minDistinctIntersecting=Math.min(...Array.from({length:201},(_,i)=>count(-row.span*i/200,false)));
    if(!mobile)assert(initialFullyVisible>=4,`${row.label}: fewer than four full portraits on entry`);
    return {generation:row.label,initialFullyVisible,minDistinctIntersecting};
  });
  const profileObstacles=context.rows.flatMap(row=>row.ids.flatMap(id=>context.visiblePoints(id).map(p=>({left:p.x-(mobile?55:78),right:p.x+(mobile?55:78),top:stageTop+p.top,bottom:stageTop+p.bottom+(mobile?53:39)}))));
  function checkDock(obstacles){
    const dock=context.slotDock(width,height,obstacles);
    if(!dock.hidden)assert(obstacles.every(r=>dock.left+dock.width<=r.left||dock.left>=r.right||dock.top+dock.height<=r.top||dock.top>=r.bottom),'Slots covers content');
    return dock;
  }
  result.slotsDefault=checkDock([]);
  result.slotsAtTree=checkDock(profileObstacles);
  result.slotsNearCta=checkDock([...profileObstacles,{left:width-135,right:width-20,top:slotTop-10,bottom:slotTop+60}]);
  assert(!result.slotsDefault.hidden&&!result.slotsAtTree.hidden&&!result.slotsNearCta.hidden,'No safe dock in a normal viewport');
  assert.equal(result.slotsDefault.height,30);
  if(mobile)assert.equal(height-result.slotsDefault.top-30,72);
  context.drawConnections(0);
  result.visibleBaseCurves=(context.lines.innerHTML.match(/class="kin-line"/g)||[]).length;
  assert(result.visibleBaseCurves>0,'No default family network');
  models.push({width,height,stageTop,rowHeight,rows:context.rows,paths:context.lines.innerHTML});
  report.viewports.push(result);
}
assert.equal(report.missingAssets.length,0,'Archive image not found');
assert.deepEqual(Array.from(D.generations,g=>g.speed),[-.10,-.14,-.12,-.16,-.13]);
for(const file of ['index.html','styles.css','app.js','data.js'])assert(!/[\u2013\u2014]/u.test(fs.readFileSync(path.join(site,file),'utf8')),file);
// Exercise the real visibility controller with deterministic media/observer mocks.
// This checks play/pause decisions, not rendering or currentTime in Chromium.
const mediaContext=vm.createContext({window:{},reduced:false});
vm.runInContext(fs.readFileSync(path.join(site,'data.js'),'utf8'),mediaContext);
const chapterHolder={innerHTML:''};
mediaContext.$=()=>chapterHolder;
vm.runInContext('const D=window.LETOPIS,P=D.people;'+section('  const escaped =','  /* Главы собираются'),mediaContext);
vm.runInContext(section("  $('#chapters').innerHTML",'  /* Бесшовные ленты.'),mediaContext);
assert.equal((chapterHolder.innerHTML.match(/class="prop(?: prop--photo)?"/g)||[]).length,16,'History chapter props changed');
const markup=fs.readFileSync(path.join(site,'index.html'),'utf8')+chapterHolder.innerHTML;
const tags=markup.match(/<video\b[^>]*>/g)||[];
const mediaElements=tags.map(tag=>({
  dataset:{src:tag.match(/data-src="([^"]+)"/)[1]},_src:null,paused:true,playCalls:0,pauseCalls:0,handlers:{},
  getAttribute(name){return name==='src'?this._src:null},
  set src(value){this._src=value},get src(){return this._src},
  play(){this.playCalls++;this.paused=false;return Promise.resolve()},
  pause(){this.pauseCalls++;this.paused=true},
  removeAttribute(name){if(name==='src')this._src=null},load(){this.paused=true},
  addEventListener(name,callback){this.handlers[name]=callback}
}));
for(const tag of tags)for(const attr of ['muted','loop','playsinline','preload="none"','data-slot='])assert(tag.includes(attr),`Missing video attribute: ${attr}`);
const pageEvents={},observed=[];
mediaContext.document={hidden:false,addEventListener:(name,callback)=>{pageEvents[name]=callback}};
mediaContext.$$=selector=>{assert.equal(selector,'video');return mediaElements};
let observer;
mediaContext.IntersectionObserver=class {
  constructor(callback){observer=callback}
  observe(video){observed.push(video)}
};
vm.runInContext(section("  const videos = $$('video')",'  /* Навигация и исходные инструменты v1.'),mediaContext);
assert.equal(observed.length,15);
assert(mediaElements.every(v=>v.playCalls===0&&v.src===null),'Offscreen media loaded early');
observer(mediaElements.map(target=>({target,isIntersecting:true})));
assert(mediaElements.every(v=>!v.paused&&v.src===v.dataset.src),'Visible media did not play');
observer(mediaElements.map(target=>({target,isIntersecting:false})));
assert(mediaElements.every(v=>v.paused),'Offscreen media did not pause');
observer(mediaElements.map(target=>({target,isIntersecting:true})));
mediaContext.document.hidden=true;pageEvents.visibilitychange();
assert(mediaElements.every(v=>v.paused),'Hidden tab plays media');
mediaContext.document.hidden=false;pageEvents.visibilitychange();
assert(mediaElements.every(v=>!v.paused),'Visible tab did not resume media');
mediaContext.reduced=true;mediaElements.forEach(v=>mediaContext.playIfVisible(v));
assert(mediaElements.every(v=>v.paused),'Reduced motion plays media');
mediaContext.reduced=false;
const failed=mediaElements[0];failed.handlers.error({preventDefault(){}});const attempts=failed.playCalls;
mediaContext.playIfVisible(failed);assert(failed.paused&&failed.src===null&&failed.playCalls===attempts,'Failed video retried');
const filenames=[...new Set(mediaElements.map(v=>path.basename(v.dataset.src)))].sort();
assert.deepEqual(filenames,Array.from(D.videos,name=>name+'.mp4').sort());
assert(!fs.readFileSync(path.join(site,'data.js'),'utf8').includes('povod'),'Foreign couple assets remain');
report.videoController={kind:'mocked observer/media policy, not browser playback',elements:mediaElements.length,files:filenames,visiblePlays:true,offscreenPauses:true,hiddenTabPauses:true,visibleTabResumes:true,reducedMotionPauses:true,errorFallback:true};
// Run the actual mouse handlers, including capture loss and the following click.
class PointerTarget {
  constructor(){this.listeners={};this.capture=new Set();this.classList={add(){},remove(){}}}
  addEventListener(name,fn,options){(this.listeners[name]||=[]).push({fn,once:options?.once})}
  setPointerCapture(id){this.capture.add(id)}
  hasPointerCapture(id){return this.capture.has(id)}
  releasePointerCapture(id){this.capture.delete(id);this.emit('lostpointercapture',{pointerId:id})}
  emit(name,props={}){
    const event={type:name,pointerId:7,button:0,isPrimary:true,pointerType:'mouse',clientX:0,clientY:10,preventDefault(){this.prevented=true},...props};
    for(const listener of [...(this.listeners[name]||[])]){listener.fn(event);if(listener.once)this.listeners[name].splice(this.listeners[name].indexOf(listener),1)}
    return event;
  }
}
let mouseNow=0;
const mouseRow={offset:-800,velocity:0,pause:0,speed:-.1};
const mouseViewport=new PointerTarget(),mouseStage=new PointerTarget(),selectedClicks=[];
const mouse=vm.createContext({row:mouseRow,viewport:mouseViewport,stage:mouseStage,drag:null,suppressClickUntil:0,performance:{now:()=>mouseNow},setHovered(){},release(){},select(id){selectedClicks.push(id)}});
vm.runInContext(app.match(/  const clamp = [^\n]+/)[0]+'\n'+section("      viewport.addEventListener('pointerenter'",'      return row;'),mouse);
vm.runInContext(section("  stage.addEventListener('click'","  family.addEventListener('click'"),mouse);
const personTarget={closest:()=>({dataset:{person:'nikolay'}})};
const beforeDrag=mouseRow.offset;
mouseViewport.emit('pointerdown',{clientX:100,target:personTarget});
for(let i=1;i<=20;i++){mouseNow+=1000/60;mouseViewport.emit('pointermove',{clientX:100+i*20,target:personTarget})}
assert.equal(mouseRow.offset-beforeDrag,400,'Mouse drag did not move the strip 1:1');
mouseNow++;mouseViewport.emit('pointerup',{clientX:500,target:personTarget});
mouseStage.emit('click',{target:personTarget});assert.equal(selectedClicks.length,0,'Drag became a click');
const releaseOffset=mouseRow.offset;
vm.runInContext('const frames=1;',mouse);
const inertiaSource=section('            row.offset += row.speed','            normalize(row);');
for(let i=0;i<10;i++)vm.runInContext(inertiaSource,mouse);
const inertiaDistance=mouseRow.offset-releaseOffset;assert(inertiaDistance>0,'No inertia after release');
mouseNow+=10;const beforeClick=mouseRow.offset;
mouseViewport.emit('pointerdown',{clientX:100,target:personTarget});
mouseNow+=10;mouseViewport.emit('pointermove',{clientX:105,target:personTarget});
mouseNow++;mouseViewport.emit('pointerup',{clientX:105,target:personTarget});
mouseStage.emit('click',{target:personTarget});
assert.equal(selectedClicks.length,1,'A 5 px movement did not select the person');
assert.equal(mouseRow.offset,beforeClick,'Click moved the strip');
mouseViewport.emit('pointerdown',{clientX:100,target:personTarget});mouseNow+=10;
mouseViewport.emit('pointermove',{clientX:106,target:personTarget});mouseNow++;
mouseViewport.emit('pointerup',{clientX:106,target:personTarget});mouseStage.emit('click',{target:personTarget});
assert.equal(selectedClicks.length,1,'A 6 px drag became a click');
assert(mouseViewport.emit('dragstart').prevented,'Browser image/text dragging is not prevented');
const hint={hidden:false},hintFamily=new PointerTarget(),hintContext=vm.createContext({$:()=>hint,family:hintFamily});
vm.runInContext(section('  const touchHint =','  let rows ='),hintContext);
hintFamily.emit('pointerdown');assert(hint.hidden,'Hint remains after the first touch');
report.pointerController={kind:'actual event handlers with pointer mocks',mouseDragPx:400,stripMovementPx:400,inertiaDistanceAfter10Frames:inertiaDistance,dragClickSuppressed:true,fivePxSelects:true,sixPxDrags:true,nativeDragPrevented:true,firstTouchHidesHint:hint.hidden};
assert(css.includes('width:120px;height:calc(100% + var(--role-room))'),'Generation column is missing');
assert(css.includes('width:110px;max-width:110px'),'Phone label width is missing');
assert(css.includes('stroke:rgba(201,137,74,.38);stroke-width:1.1'),'Base connections are too faint');
assert(css.includes('font-size:11px;line-height:28px'),'Compact slots typography is missing');
const output=path.join(__dirname,'qa_letopis');fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'tree_revision_checks.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(output,'tree_revision_model.json'),JSON.stringify(models,null,2));
console.log(JSON.stringify(report,null,2));
