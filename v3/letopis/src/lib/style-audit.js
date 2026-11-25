/* Run window.__auditTypography() to test every direct text node against a hostile host. */
export function auditTypography(doc=document){
  const win=doc.defaultView,site=doc.getElementById('site');
  if(!site)throw new Error('Missing #site typography boundary');
  const rules=[];let inaccessibleSheets=0;
  function collect(list){
    for(const rule of list){
      if(rule.selectorText&&rule.style)rules.push(rule);
      else if(rule.cssRules){
        if(rule.media&&win.matchMedia&&!win.matchMedia(rule.media.mediaText).matches)continue;
        collect(rule.cssRules);
      }
    }
  }
  for(const sheet of doc.styleSheets){try{collect(sheet.cssRules);}catch{inaccessibleSheets++;}}
  function ownedValue(value){return value&&!['inherit','unset','revert','revert-layer'].includes(value.trim());}
  const cache={color:new WeakMap(),'font-family':new WeakMap()};
  function owner(element,property){
    if(!element||element===doc.body||element===doc.documentElement)return null;
    if(cache[property].has(element))return cache[property].get(element);
    let result=null;
    if(ownedValue(element.style?.getPropertyValue(property)))result=element;
    else{
      for(const rule of rules){
        if(!ownedValue(rule.style.getPropertyValue(property)))continue;
        try{if(element.matches(rule.selectorText)){result=element;break;}}catch{/* Pseudo-elements have no text nodes. */}
      }
    }
    result??=owner(element.parentElement,property);cache[property].set(element,result);return result;
  }
  const elements=new Set(),walker=doc.createTreeWalker(site,win.NodeFilter.SHOW_TEXT);
  let node,textNodes=0;
  while((node=walker.nextNode())){
    if(!node.textContent.trim()||node.parentElement.closest('script,style,template'))continue;
    textNodes++;elements.add(node.parentElement);
  }
  const label=el=>el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.classList.length?'.'+[...el.classList].slice(0,3).join('.'):'');
  const before=[...elements].map(el=>({el,color:win.getComputedStyle(el).color,font:win.getComputedStyle(el).fontFamily}));
  const saved=[doc.documentElement,doc.body].map(el=>[el,el.getAttribute('style')]);
  let colorFromBody,fontFromBody,changedByHost,emptyComputed,host;
  try{
    for(const [el] of saved){el.style.setProperty('color','#000000','important');el.style.setProperty('font-family','Arial, sans-serif','important');}
    host={color:win.getComputedStyle(doc.body).color,font:win.getComputedStyle(doc.body).fontFamily};
    colorFromBody=before.filter(({el})=>!owner(el,'color')).map(({el})=>label(el));
    fontFromBody=before.filter(({el})=>!owner(el,'font-family')).map(({el})=>label(el));
    changedByHost=before.filter(({el,color,font})=>{const style=win.getComputedStyle(el);return style.color!==color||style.fontFamily!==font;}).map(({el})=>label(el));
    emptyComputed=before.filter(({color,font})=>!color||!font).map(({el})=>label(el));
  }finally{
    for(const [el,style] of saved){if(style===null)el.removeAttribute('style');else el.setAttribute('style',style);}
  }
  return {textNodes,textElements:elements.size,colorFromBody,fontFromBody,changedByHost,emptyComputed,inaccessibleSheets,host,
    passed:colorFromBody.length===0&&fontFromBody.length===0&&changedByHost.length===0&&emptyComputed.length===0};
}
if(typeof window!=='undefined')window.__auditTypography=()=>auditTypography(document);
