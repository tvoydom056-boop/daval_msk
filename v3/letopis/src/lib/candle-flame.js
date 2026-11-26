import {addFrame} from './core.js';

const vertex=`attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const fragment=`precision mediump float;
varying vec2 uv;uniform float time;uniform float growth;uniform float impulse;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
float fbm(vec2 p){float value=0.,a=.5;for(int i=0;i<4;i++){value+=a*noise(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return value;}
void main(){
  float g=max(growth,.001),h=uv.y/(.84*g);if(h>1.06||growth<.001){gl_FragColor=vec4(0.);return;}
  float gust=pow(max(0.,sin(time*.18+.7)),12.);
  float lean=.027*sin(time*.71)+.016*sin(time*.29)+.12*gust*sin(time*.43)+impulse*.045;
  float jitter=.0035*sin(time*37.+h*8.)+.002*sin(time*59.-h*13.);
  float x=uv.x-.5-.10*smoothstep(.04,.31,h)-lean*h*h-jitter*h;
  float flow=fbm(vec2(x*17.+3.,h*8.-time*2.8));
  float width=(.22*pow(max(0.,sin(3.14159*clamp(h,0.,1.))),.76)*(1.-.28*h)+.018*(1.-h))*(.25+.75*sqrt(g));
  float r=abs(x)/(max(.002,width)*(1.+(flow-.5)*.12));
  float vertical=smoothstep(0.,.024,h)*(1.-smoothstep(.91,1.01,h));
  float body=(1.-smoothstep(.60,1.12,r))*vertical;
  float halo=exp(-r*r*2.9)*.07*(1.-smoothstep(.84,1.07,h));
  vec3 color=mix(vec3(1.,.64,.18),vec3(1.,.91,.58),1.-smoothstep(.65,1.05,r));
  float core=(1.-smoothstep(.36,.85,r))*smoothstep(.12,.29,h)*(1.-smoothstep(.75,.96,h));
  color=mix(color,vec3(1.,.985,.88),core);
  float blue=exp(-pow((h-.055)/.041,2.))*(1.-smoothstep(.36,.96,r));
  color=mix(color,vec3(.27,.49,1.),blue*.55);
  float hollow=(1.-smoothstep(.12,.47,r))*(1.-smoothstep(.11,.31,h))*smoothstep(.015,.06,h);
  float alpha=clamp(body*(.91-hollow*.64)+halo,0.,1.);
  color*=.985+.015*sin(time*29.+flow*4.);
  gl_FragColor=vec4(color,alpha);
}`;

function shader(gl,type,source){const value=gl.createShader(type);gl.shaderSource(value,source);gl.compileShader(value);if(!gl.getShaderParameter(value,gl.COMPILE_STATUS))throw Error('Candle shader unavailable');return value;}
function webgl(canvas){
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});if(!gl)return null;
  const program=gl.createProgram();gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Candle program unavailable');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  const uniforms=['time','growth','impulse'].map(name=>gl.getUniformLocation(program,name));
  canvas.width=192;canvas.height=356;gl.viewport(0,0,canvas.width,canvas.height);canvas.dataset.renderer='webgl';
  return (time,growth,impulse)=>{gl.uniform1f(uniforms[0],time);gl.uniform1f(uniforms[1],growth);gl.uniform1f(uniforms[2],impulse);gl.drawArrays(gl.TRIANGLES,0,6);};
}
function fallback(canvas){
  canvas.width=192;canvas.height=356;canvas.dataset.renderer='2d';const c=canvas.getContext('2d');
  return (time,growth,impulse)=>{
    c.clearRect(0,0,192,356);if(!growth)return;
    c.save();c.translate(96,356);c.scale(192*growth,356*growth);
    const lean=.026*Math.sin(time*.71)+.004*Math.sin(time*37)+impulse*.04;
    c.beginPath();c.moveTo(-.015,0);c.bezierCurveTo(-.23,-.22,-.16,-.52,.1+lean,-.84);c.bezierCurveTo(.25+lean,-.55,.24,-.18,.025,0);c.closePath();
    const body=c.createRadialGradient(.06,-.38,.015,.06,-.38,.52);body.addColorStop(0,'#fffdea');body.addColorStop(.48,'#fff2bce8');body.addColorStop(.82,'#ffdc8f8c');body.addColorStop(1,'#ffd08012');c.fillStyle=body;c.filter='blur(1.6px)';c.shadowColor='#ffe3a166';c.shadowBlur=3;c.fill();c.shadowBlur=0;
    c.beginPath();c.moveTo(.005,-.06);c.bezierCurveTo(-.095,-.28,-.005,-.59,.10+lean,-.75);c.bezierCurveTo(.19,-.48,.16,-.22,.055,-.06);c.fillStyle='#fffce6ef';c.filter='blur(2.2px)';c.fill();c.filter='none';
    const blue=c.createRadialGradient(.02,-.045,0,.02,-.045,.1);blue.addColorStop(0,'#628aff99');blue.addColorStop(1,'#628aff00');c.fillStyle=blue;c.fillRect(-.12,-.14,.3,.16);
    c.globalCompositeOperation='destination-out';c.globalAlpha=.55;c.beginPath();c.ellipse(.025,-.09,.04,.08,0,0,Math.PI*2);c.fill();c.restore();
  };
}

export function createCandleFlame(root){
  const image=root.querySelector('.candle-image'),air=root.querySelector('.candle-air'),context=air.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let canvas=root.querySelector('.candle-flame'),paint;
  try{paint=webgl(canvas);}catch{/* Keep the candle usable when a GPU context is unavailable. */}
  if(!paint){const replacement=canvas.cloneNode();canvas.replaceWith(replacement);canvas=replacement;paint=fallback(canvas);}
  let lit=false,age=0,clock=0,last=null,pulseAge=100,igniting=false,frames=0;
  function resize(){const size=Math.max(1,Math.min(900,Math.ceil(image.clientWidth*2)));air.width=size;air.height=size;context.setTransform(size/1254,0,0,size/1254,0,0);}
  function atmosphere(t,grow,pulse){
    context.clearRect(0,0,1254,1254);if(!lit||reduced.matches)return;
    if(age<.28&&igniting){
      const fade=1-age/.28;context.save();context.globalAlpha=fade;context.fillStyle='#fff8db';context.shadowColor='#ffb954';context.shadowBlur=16;context.beginPath();context.arc(652,425,5+fade*3,0,Math.PI*2);context.fill();
      for(let i=0;i<4;i++){context.globalAlpha=fade*.65;context.beginPath();context.arc(652+Math.sin(i*2.4)*age*80,425-age*(50+i*20),1.3,0,Math.PI*2);context.fill();}context.restore();
    }
    if(grow<.95)return;
    for(let i=0;i<6;i++){
      const phase=(t*.075+i/6)%1,y=202-phase*205,x=645+Math.sin(phase*5+t*.23+i*.4)*(5+phase*16),alpha=Math.sin(phase*Math.PI)*.045;
      context.save();context.globalAlpha=alpha;context.strokeStyle=root.dataset.theme==='paper'?'#7c746a':'#dad3c6';context.lineWidth=2+phase*2;context.shadowColor=context.strokeStyle;context.shadowBlur=3;
      context.beginPath();context.moveTo(x,y+18);context.bezierCurveTo(x+8,y+10,x-5,y,x+4,y-15);context.stroke();context.restore();
    }
  }
  function draw(){
    const progress=igniting?Math.min(1,age/.8):1,growth=lit?progress*progress*(3-2*progress):0;
    const impulse=pulseAge<1?Math.sin(pulseAge*9)*Math.exp(-pulseAge*4):0;
    const t=reduced.matches?6.2:clock;
    canvas.style.transform=`translate(${(13.333*(1-growth)).toFixed(3)}%,${(-22.82*(1-growth)).toFixed(3)}%)`;
    paint(t,growth,reduced.matches?0:impulse);atmosphere(t,growth,impulse);
    const flicker=reduced.matches?1:.92+.035*Math.sin(t*24)+.025*Math.sin(t*43+.4)+.025*Math.sin(t*2)+impulse*.10;
    root.style.setProperty('--candle-power',(growth*flicker).toFixed(4));
    root.dataset.candlePhase=!lit?'unlit':igniting&&age<.8?'igniting':pulseAge<1?'pulse':'lit';canvas.dataset.frames=String(++frames);
  }
  function state(){if(reduced.matches){age=1;pulseAge=100;igniting=false;}draw();}
  resize();new ResizeObserver(()=>{resize();draw();}).observe(image);reduced.addEventListener('change',state);draw();
  addFrame(root,time=>{
    const delta=last===null?1/30:Math.min(.05,Math.max(0,time-last));last=time;
    if(reduced.matches||!lit)return;
    clock+=delta;if(lit)age+=delta;pulseAge+=delta;draw();
  },{fps:30});
  return {
    setLit(value,{animate=false}={}){lit=value;age=animate&&!reduced.matches?0:1;igniting=animate&&!reduced.matches;pulseAge=100;root.classList.toggle('is-lit',lit);draw();},
    pulse(){if(!lit||reduced.matches)return;pulseAge=0;draw();}
  };
}
