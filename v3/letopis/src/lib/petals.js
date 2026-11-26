import {addFrame} from './core.js';

export function mountPetals(root,{light=false}={}){
  const canvas=document.createElement('canvas');canvas.className='memory-petals';canvas.setAttribute('aria-hidden','true');root.prepend(canvas);
  const context=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,elapsed=0;
  function resize(){
    const ratio=Math.min(devicePixelRatio||1,1.5);width=root.clientWidth;height=root.clientHeight;
    canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);context.setTransform(ratio,0,0,ratio,0,0);
  }
  function state(){canvas.style.display=reduced.matches?'none':'';canvas.dataset.petalCount=reduced.matches?'0':'8';if(reduced.matches)context.clearRect(0,0,width,height);}
  function draw(){
    context.clearRect(0,0,width,height);
    for(let i=0;i<8;i++){
      const seed=i*.61803398875,x=((seed*width+Math.sin(elapsed*.13+i)*27+elapsed*(3+i%3))%(width+24)+width+24)%(width+24)-12;
      const y=((i*.381966*height+elapsed*(9+i%4))%(height+28))-14;
      context.save();context.translate(x,y);context.rotate(elapsed*.24+i);context.scale(.65+Math.abs(Math.sin(elapsed*.4+i))*.35,1);
      context.fillStyle=light?'#fff9ec':'#d7a2aa';context.globalAlpha=light?.7:.4;
      context.beginPath();context.moveTo(0,-6);context.bezierCurveTo(9,-8,8,4,0,7);context.bezierCurveTo(-7,3,-6,-5,0,-6);context.fill();context.restore();
    }
  }
  resize();state();if(!reduced.matches)draw();
  new ResizeObserver(resize).observe(root);reduced.addEventListener('change',state);
  addFrame(root,(_time,delta)=>{if(reduced.matches)return;elapsed+=delta;draw();},{fps:24});
}
