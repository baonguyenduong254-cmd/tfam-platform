'use client';
import {useEffect,useRef} from 'react';

const vertex='attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}';

const fragment=`precision mediump float;
uniform vec2 uSize;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uRim;
uniform vec2 uPointer;
uniform float uMature;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);
 vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}

void main(){
 vec2 uv=gl_FragCoord.xy/uSize;
 vec2 asp=vec2(uSize.x/max(1.,uSize.y),1.);
 float t=uTime*.12;

 // Soft silk caustic wave
 float silk=noise(uv*vec2(3.2,2.1)+vec2(t*.6,-t*.35));
 float silk2=noise(uv*vec2(6.0,4.2)-vec2(t*.4,t*.25)+silk*.7);
 float halo=exp(-length((uv-vec2(.56,.46))*asp)*1.65)*(.28+uMature*.22);
 float cursorWarmth=exp(-length((uv-uPointer)*asp)*2.6)*(.14+uMature*.16);

 // Warm candlelit bokeh motes
 float bokeh=0.;
 for(int i=0;i<16;i++){
  float fi=float(i);
  vec2 pos=vec2(
   fract(hash(vec2(fi,2.1))+sin(uTime*.08+fi*1.3)*.03),
   fract(hash(vec2(fi,9.7))+uTime*(.006+hash(vec2(fi,4.3))*.008))
  );
  float d=length((uv-pos)*asp);
  float radius=.006+hash(vec2(fi,5.5))*(.014+uMature*.01);
  float pulse=.4+.6*pow(sin(uTime*.9+fi*2.1)*.5+.5,2.);
  bokeh+=(1.-smoothstep(radius*.25,radius,d))*pulse*(.26+uMature*.22);
 }

 vec3 col=mix(uBase,uRim,clamp(silk2*.75+halo,0.,1.));
 col+=uRim*(bokeh*.9+cursorWarmth);
 float alpha=clamp((silk*.12+halo*.38+bokeh*.36+cursorWarmth)*(.55+uMature*.45),0.,.46);
 gl_FragColor=vec4(col,alpha);
}`;

const moodPalettes:Record<string,[[number,number,number],[number,number,number]]>={
 uniform:[[.18,.14,.26],[.84,.72,.48]],
 office:[[.24,.15,.22],[.86,.68,.44]],
 naughty_office:[[.52,.10,.20],[.94,.62,.42]],
 afterwork:[[.42,.11,.26],[.92,.68,.56]],
 beach:[[.34,.18,.22],[.96,.78,.54]],
};

/**
 * Low-power WebGL GLSL Chiaroscuro Candlelight & Velvet Bokeh shader
 * for the Imperial Couture Atelier (shifts visual temperature for 18+ editions).
 */
export default function AtelierAtmosphere({mood,mature}:{mood:string;mature:boolean}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const stateRef=useRef({mood,mature,px:.55,py:.48});

 useEffect(()=>{
  stateRef.current.mood=mood;
  stateRef.current.mature=mature;
 },[mood,mature]);

 useEffect(()=>{
  const el=canvasRef.current;
  if(!el)return;
  const gl=el.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,powerPreference:'low-power'});
  if(!gl)return;

  const compile=(type:number,src:string)=>{
   const sh=gl.createShader(type);
   if(!sh)return null;
   gl.shaderSource(sh,src);
   gl.compileShader(sh);
   if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);return null;}
   return sh;
  };
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  if(!vs||!fs){if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return;}
  const program=gl.createProgram();
  if(!program){gl.deleteShader(vs);gl.deleteShader(fs);return;}
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);return;}

  const buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.useProgram(program);
  const pos=gl.getAttribLocation(program,'aPosition');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);

  const uSize=gl.getUniformLocation(program,'uSize');
  const uTime=gl.getUniformLocation(program,'uTime');
  const uBase=gl.getUniformLocation(program,'uBase');
  const uRim=gl.getUniformLocation(program,'uRim');
  const uPointer=gl.getUniformLocation(program,'uPointer');
  const uMature=gl.getUniformLocation(program,'uMature');

  let frame=0,onscreen=true,stopped=false,last=0,t=0;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');

  const draw=(now:number)=>{
   frame=0;
   if(stopped||document.hidden||!onscreen)return;
   t+=Math.min((now-last)/1000,.05);
   last=now;
   const [b,r]=moodPalettes[stateRef.current.mood]||moodPalettes.uniform;
   gl.uniform1f(uTime,t*(reduce.matches?.2:1));
   gl.uniform3f(uBase,b[0],b[1],b[2]);
   gl.uniform3f(uRim,r[0],r[1],r[2]);
   gl.uniform2f(uPointer,stateRef.current.px,stateRef.current.py);
   gl.uniform1f(uMature,stateRef.current.mature?1:0);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   frame=requestAnimationFrame(draw);
  };

  const sync=()=>{
   cancelAnimationFrame(frame);
   if(!stopped&&!document.hidden&&onscreen){last=performance.now();frame=requestAnimationFrame(draw);}
  };

  const onMove=(e:PointerEvent)=>{
   const rect=el.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   stateRef.current.px=Math.min(1,Math.max(0,(e.clientX-rect.left)/rect.width));
   stateRef.current.py=1-Math.min(1,Math.max(0,(e.clientY-rect.top)/rect.height));
  };

  const resize=new ResizeObserver(()=>{
   el.width=Math.max(1,Math.round(el.clientWidth*.55));
   el.height=Math.max(1,Math.round(el.clientHeight*.55));
   gl.viewport(0,0,el.width,el.height);
   gl.uniform2f(uSize,el.width,el.height);
  });
  resize.observe(el);

  const observer=new IntersectionObserver(([entry])=>{onscreen=entry.isIntersecting;sync();});
  observer.observe(el);
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pointermove',onMove,{passive:true});
  const lost=()=>{stopped=true;cancelAnimationFrame(frame);};
  el.addEventListener('webglcontextlost',lost);
  sync();

  return()=>{
   stopped=true;
   cancelAnimationFrame(frame);
   resize.disconnect();
   observer.disconnect();
   document.removeEventListener('visibilitychange',sync);
   window.removeEventListener('pointermove',onMove);
   el.removeEventListener('webglcontextlost',lost);
   gl.deleteBuffer(buf);
   gl.deleteProgram(program);
   gl.deleteShader(vs);
   gl.deleteShader(fs);
  };
 },[]);

 return <canvas ref={canvasRef} className="atelier-glsl-atmosphere" aria-hidden="true"/>;
}
