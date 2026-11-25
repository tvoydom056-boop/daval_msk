import {addFrame} from './core.js';

export function particles(canvas,{type='sparks',count=45,origin=[.52,.34]}={}) {
  const root=canvas.closest('[data-scene]'),context=canvas.getContext('2d');
  let width,height;
  const dots=Array.from({length:count},()=>({phase:Math.random(),x:Math.random(),size:Math.random()*1.6+.4,speed:Math.random()*.3+.15}));
  const resize=()=>{width=canvas.width=innerWidth;height=canvas.height=innerHeight;};resize();addEventListener('resize',resize,{passive:true});
  addFrame(root,(time)=>{
    if(Number(getComputedStyle(canvas).opacity)<.01)return;
    context.clearRect(0,0,width,height);
    const point=typeof origin==='function'?origin():origin;
    dots.forEach(dot=>{
      const age=(time*dot.speed+dot.phase)%1;
      const x=type==='sparks'?width*(point[0]+(dot.x-.5)*age*.2):width*((dot.x+time*.002)%1);
      const y=type==='sparks'?height*(point[1]+age*age*.36):height*(point[1]+age*.2);
      context.globalAlpha=(1-age)*(type==='sparks'?.85:.32);context.fillStyle=type==='sparks'?'#ffd6a0':'#edf0d9';
      context.beginPath();context.ellipse(x,y,dot.size,type==='sparks'?dot.size*2.5:dot.size,0,0,Math.PI*2);context.fill();
    });
  });
}
