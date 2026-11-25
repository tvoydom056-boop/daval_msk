export function initGrain(reduced) {
  const canvas=document.querySelector('.film-grain'),context=canvas.getContext('2d',{alpha:false});
  const tile=document.createElement('canvas');tile.width=128;tile.height=128;
  const c=tile.getContext('2d',{alpha:false}),noise=c.createImageData(128,128);
  const resize=()=>{canvas.width=Math.ceil(innerWidth/2);canvas.height=Math.ceil(innerHeight/2);};resize();addEventListener('resize',resize,{passive:true});
  const draw=()=>{for(let i=0;i<noise.data.length;i+=4){const value=Math.random()*255;noise.data[i]=value;noise.data[i+1]=value;noise.data[i+2]=value;noise.data[i+3]=255;}c.putImageData(noise,0,0);context.fillStyle=context.createPattern(tile,'repeat');context.fillRect(0,0,canvas.width,canvas.height);};
  draw();let last=0;
  function tick(time){if(!document.hidden&&!reduced.matches&&time-last>=1000/24){draw();last=time-(time-last)%(1000/24);}requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
