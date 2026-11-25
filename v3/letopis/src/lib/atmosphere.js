import {addFrame,$$} from './core.js';

const vertex=`attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const fragment=`precision mediump float;
varying vec2 uv;uniform float time;uniform float seed;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.52,n=0.;for(int i=0;i<5;i++){n+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+vec2(5.2,1.3);a*=.49;}return n;}
void main(){vec2 p=uv*vec2(3.5,2.3)+seed;
float a=fbm(p+vec2(time*.013,-time*.006));
float b=fbm(p*1.7+vec2(-time*.008,time*.004)+8.);
float c=fbm(p*.65+vec2(time*.006,0.)+23.);
float density=smoothstep(.22,.8,a*.50+b*.24+c*.26);
float edge=smoothstep(0.,.2,uv.y)*smoothstep(0.,.2,1.-uv.y)*smoothstep(0.,.1,uv.x)*smoothstep(0.,.1,1.-uv.x);
gl_FragColor=vec4(vec3(.79,.82,.77),density*edge*.88);}`;

function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
export function mountAtmosphere() {
  $$('.procedural-fog').forEach((canvas,index)=>{
    const root=canvas.closest('[data-scene]');
    const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,powerPreference:'low-power',antialias:false});
    if(!gl){fallback(canvas,root,index);return;}
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const location=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
    const time=gl.getUniformLocation(program,'time');gl.uniform1f(gl.getUniformLocation(program,'seed'),index*13.7);
    const resize=()=>{canvas.width=Math.min(800,Math.ceil(innerWidth*.55));canvas.height=Math.min(540,Math.ceil(innerHeight*.55));gl.viewport(0,0,canvas.width,canvas.height);};
    resize();addEventListener('resize',resize,{passive:true});
    const draw=t=>{gl.uniform1f(time,t);gl.drawArrays(gl.TRIANGLES,0,6);};
    draw(0);addFrame(root,draw,{fps:24});
  });
}
function fallback(canvas,root,seed) {
  const context=canvas.getContext('2d');canvas.width=256;canvas.height=180;
  const texture=document.createElement('canvas');texture.width=128;texture.height=128;
  const c=texture.getContext('2d'),image=c.createImageData(128,128);
  const random=(x,y)=>{const n=Math.sin(x*127.1+y*311.7+seed)*43758.5453;return n-Math.floor(n);};
  const smooth=(x,y,scale)=>{x/=scale;y/=scale;const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return (random(ix,iy)*(1-u)+random(ix+1,iy)*u)*(1-v)+(random(ix,iy+1)*(1-u)+random(ix+1,iy+1)*u)*v;};
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,n=smooth(x,y,40)*.55+smooth(x,y,20)*.3+smooth(x,y,10)*.15;image.data[i]=202;image.data[i+1]=210;image.data[i+2]=196;image.data[i+3]=Math.pow(n,2)*210;}
  c.putImageData(image,0,0);
  const draw=t=>{context.clearRect(0,0,256,180);for(let i=0;i<3;i++){const width=400+i*100,x=-(t*(1+i*.3))%80-90;context.globalAlpha=.4;context.drawImage(texture,x,-80+i*20,width,300);}};
  draw(0);addFrame(root,draw,{fps:24});
}
