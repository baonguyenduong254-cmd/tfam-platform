'use client';
import {useEffect,useRef} from 'react';

const vertex='attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}';

const fragment=`precision mediump float;
uniform vec2 uSize;
uniform float uTime;
uniform vec3 uPrimary;
uniform vec3 uAccent;
uniform vec2 uPointer;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);
 vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
 float v=0.,a=.5;
 for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(13.1,7.7);a*=.5;}
 return v;
}

void main(){
 vec2 uv=gl_FragCoord.xy/uSize;
 vec2 aspect=vec2(uSize.x/max(1.,uSize.y),1.);
 float t=uTime*.08;
 float veil=fbm(uv*vec2(2.6,1.9)+vec2(t*.55,-t*.32));
 float frost=fbm(uv*vec2(5.2,3.8)-vec2(t*.35,t*.28)+veil*.6);
 float pointerGlow=exp(-length((uv-uPointer)*aspect)*2.8)*.22;

 float ember=0.;
 for(int i=0;i<18;i++){
  float fi=float(i);
  vec2 pos=vec2(fract(hash(vec2(fi,1.3))+sin(uTime*.06+fi)*.02),fract(hash(vec2(fi,7.9))+uTime*(.005+hash(vec2(fi,3.1))*.007)));
  float d=length((uv-pos)*aspect);
  float twinkle=.35+.65*pow(sin(uTime*.85+fi*1.7)*.5+.5,2.5);
  ember+=(1.-smoothstep(0.,.0045,d))*twinkle*.55;
 }

 vec3 col=mix(uPrimary,uAccent,smoothstep(.25,.85,frost));
 col+=vec3(.92,.79,.56)*(ember*.9+pointerGlow*.85);
 float edge=smoothstep(0.,.18,uv.y)*(1.-smoothstep(.82,1.,uv.y));
 float alpha=clamp((veil*.16+frost*.09+ember*.42+pointerGlow)*edge,0.,.34);
 gl_FragColor=vec4(col,alpha);
}`;

const factionPalettes:Record<string,[[number,number,number],[number,number,number]]>={
 castilian_empire:[[.46,.14,.23],[.84,.69,.45]],
 annam:[[.18,.34,.31],[.86,.72,.44]],
 ottoman_empire:[[.48,.16,.18],[.88,.71,.38]],
 russian_empire:[[.18,.28,.40],[.78,.84,.90]],
 british_empire:[[.24,.17,.32],[.82,.68,.46]],
};

/** Low-power GLSL atmosphere plane for the imperial overview. */
export default function OverviewAtmosphere({factionId}:{factionId:string}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const paletteRef=useRef(factionPalettes[factionId]||factionPalettes.castilian_empire);
 const pointerRef=useRef<[number,number]>([.5,.5]);

 useEffect(()=>{
  paletteRef.current=factionPalettes[factionId]||factionPalettes.castilian_empire;
 },[factionId]);

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

  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.useProgram(program);
  const pos=gl.getAttribLocation(program,'aPosition');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);

  const uSize=gl.getUniformLocation(program,'uSize');
  const uTime=gl.getUniformLocation(program,'uTime');
  const uPrimary=gl.getUniformLocation(program,'uPrimary');
  const uAccent=gl.getUniformLocation(program,'uAccent');
  const uPointer=gl.getUniformLocation(program,'uPointer');

  let frame=0,onscreen=true,stopped=false,last=0,t=0;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');

  const draw=(now:number)=>{
   frame=0;
   if(stopped||document.hidden||!onscreen)return;
   t+=Math.min((now-last)/1000,.05);
   last=now;
   const [p,a]=paletteRef.current;
   gl.uniform1f(uTime,t*(reduce.matches?.22:1));
   gl.uniform3f(uPrimary,p[0],p[1],p[2]);
   gl.uniform3f(uAccent,a[0],a[1],a[2]);
   gl.uniform2f(uPointer,pointerRef.current[0],pointerRef.current[1]);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   frame=requestAnimationFrame(draw);
  };

  const sync=()=>{
   cancelAnimationFrame(frame);
   if(!stopped&&!document.hidden&&onscreen){last=performance.now();frame=requestAnimationFrame(draw);}
  };

  const onMove=(event:PointerEvent)=>{
   const rect=el.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   pointerRef.current=[
    Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width)),
    1-Math.min(1,Math.max(0,(event.clientY-rect.top)/rect.height)),
   ];
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
   gl.deleteBuffer(buffer);
   gl.deleteProgram(program);
   gl.deleteShader(vs);
   gl.deleteShader(fs);
  };
 },[]);

 return <canvas ref={canvasRef} className="empire-glsl-atmosphere" aria-hidden="true"/>;
}
