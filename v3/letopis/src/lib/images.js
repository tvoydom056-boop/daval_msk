import {imageSizes} from './image-sizes.js';

export function prepareImages(root=document){
  const apply=image=>{
    let path;try{path=new URL(image.src,document.baseURI).pathname.split('/media/')[1];}catch{return;}
    const size=imageSizes[path];if(size){image.width=size[0];image.height=size[1];}
    image.decoding='async';
    const bounds=image.getBoundingClientRect();
    if(bounds.top>=innerHeight||bounds.bottom<=0)image.loading='lazy';
    if(!image.hasAttribute('loading')){
      const rect=image.getBoundingClientRect();
      image.loading=rect.top<innerHeight&&rect.bottom>0&&!image.closest('dialog:not([open])')?'eager':'lazy';
    }
  };
  root.querySelectorAll('img').forEach(apply);
  new MutationObserver(records=>records.forEach(record=>{if(record.type==='attributes'){apply(record.target);return;}record.addedNodes.forEach(node=>{
    if(node.nodeType!==1)return;
    if(node.matches('img'))apply(node);node.querySelectorAll('img').forEach(apply);
  });})).observe(document.querySelector('#site'),{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
}
