'use client';
import {useEffect,useRef,useState} from 'react';

const vertexSrc='attribute vec2 aPos;varying vec2 vUv;void main(){vUv=aPos*.5+.5;gl_Position=vec4(aPos,0.,1.);}';

const fragmentSrc=`precision highp float;
varying vec2 vUv;
uniform sampler2D uArt;
uniform vec2 uSize;
uniform float uArtAspect;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMature;
uniform vec3 uRimColor;

void main(){
  float viewAspect = uSize.x / max(1.0, uSize.y);
  vec2 centered = vUv - vec2(0.5, 0.5);
  if(viewAspect > uArtAspect){
    centered.x *= viewAspect / uArtAspect;
  } else {
    float ratio = uArtAspect / viewAspect;
    centered.y = (centered.y + 0.5) * ratio - 0.5;
  }
  vec2 uv = vec2(centered.x + 0.5, 0.5 - centered.y);
  if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0){
    gl_FragColor = vec4(0.0);
    return;
  }

  // Procedural anatomical depth profile (works across all TFAM character cutouts)
  float dFace = exp(-dot((uv - vec2(0.50, 0.16)) / vec2(0.16, 0.13), (uv - vec2(0.50, 0.16)) / vec2(0.16, 0.13)));
  float dTorso = exp(-dot((uv - vec2(0.50, 0.42)) / vec2(0.24, 0.20), (uv - vec2(0.50, 0.42)) / vec2(0.24, 0.20)));
  float dLower = exp(-dot((uv - vec2(0.50, 0.78)) / vec2(0.34, 0.22), (uv - vec2(0.50, 0.78)) / vec2(0.34, 0.22)));
  float depth = clamp(0.16 + 0.74 * max(max(dFace * 0.85, dTorso), dLower * 0.9), 0.0, 1.0);

  // 1. 2.5D depth parallax
  vec2 pUv = uv - uMouse * (depth - 0.42) * 0.022;

  // 2. Face-safe organic breathing (chest & ribcage zone)
  float breathWave = pow(sin(uTime * 1.42) * 0.5 + 0.5, 1.35) - 0.5;
  float faceGuard = 1.0 - exp(-dot((pUv - vec2(0.50, 0.15)) / vec2(0.17, 0.13), (pUv - vec2(0.50, 0.15)) / vec2(0.17, 0.13)) * 2.4);
  vec2 breathShift = vec2(
    (pUv.x - 0.50) * breathWave * -0.013,
    breathWave * 0.0072 + (pUv.y - 0.42) * breathWave * -0.015
  ) * dTorso * faceGuard;

  // 3. Flowing hair & fabric breeze on outer silhouette and lower skirt/veil
  float sideMask = smoothstep(0.15, 0.36, abs(pUv.x - 0.50)) * smoothstep(0.12, 0.34, pUv.y);
  float lowerMask = smoothstep(0.48, 0.76, pUv.y) * smoothstep(0.05, 0.28, abs(pUv.x - 0.50));
  float breeze = sin(pUv.y * 8.2 - uTime * 1.75 + pUv.x * 3.8) * 0.65 + sin(pUv.y * 13.5 - uTime * 2.5) * 0.35;
  vec2 windShift = vec2(
    breeze * (0.0056 * sideMask + 0.0038 * lowerMask),
    cos(pUv.x * 6.5 - uTime * 1.4) * 0.0022 * lowerMask
  ) * faceGuard;

  float idleSway = sin(uTime * 0.62) * 0.0024 * (1.0 - smoothstep(0.65, 0.98, pUv.y));
  vec2 finalUv = pUv + breathShift + windShift + vec2(idleSway, 0.0);

  if(finalUv.x < 0.002 || finalUv.x > 0.998 || finalUv.y < 0.002 || finalUv.y > 0.998){
    gl_FragColor = vec4(0.0);
    return;
  }

  vec4 texel = texture2D(uArt, finalUv);
  if(texel.a < 0.01){
    gl_FragColor = vec4(0.0);
    return;
  }

  // 4. Dynamic silhouette rim light & subtle specular sheen (intensifies on 18+ editions)
  vec2 px = vec2(2.0 / 900.0, 2.0 / 1000.0);
  float aL = texture2D(uArt, clamp(finalUv - vec2(px.x, 0.0), 0.0, 1.0)).a;
  float aR = texture2D(uArt, clamp(finalUv + vec2(px.x, 0.0), 0.0, 1.0)).a;
  float aU = texture2D(uArt, clamp(finalUv - vec2(0.0, px.y), 0.0, 1.0)).a;
  float aD = texture2D(uArt, clamp(finalUv + vec2(0.0, px.y), 0.0, 1.0)).a;
  vec2 edgeNormal = vec2(aL - aR, aU - aD);
  vec2 lightDir = normalize(vec2(0.62 + uMouse.x * 0.55, -0.42 + uMouse.y * 0.45));
  float rim = clamp(dot(edgeNormal, lightDir) * 2.1, 0.0, 1.0);

  float lum = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
  float sweepOffset = (finalUv.x * 0.8 + finalUv.y * 0.35 - (0.54 + uMouse.x * 0.22 + sin(uTime * 0.48) * 0.07)) / 0.19;
  float sweep = exp(-sweepOffset * sweepOffset);
  float sheen = smoothstep(0.56, 0.95, lum) * sweep * (0.07 + uMature * 0.09);

  vec3 color = texel.rgb + uRimColor * (rim * (0.20 + uMature * 0.24) + sheen);
  gl_FragColor = vec4(color * texel.a, texel.a);
}`;

const rimByMood:Record<string,[number,number,number]>={
 uniform:[0.86,0.74,0.52],
 office:[0.88,0.70,0.46],
 naughty_office:[0.96,0.62,0.42],
 afterwork:[0.94,0.68,0.56],
 beach:[0.98,0.78,0.54],
};

/**
 * Reusable WebGL 2.5D Live-Illust renderer for transparent character cutouts.
 * Falls back cleanly to a standard <img> if WebGL fails, CORS blocks upload,
 * or the graphics context is lost.
 */
export default function LiveIllust25D({src,alt,mood,mature,onError}:{
 src:string;alt:string;mood:string;mature:boolean;onError?:()=>void;
}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const [fallback,setFallback]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const moodRef=useRef({mood,mature});
 const pointerRef=useRef({tx:0,ty:0,mx:0,my:0});

 useEffect(()=>{
  moodRef.current={mood,mature};
 },[mood,mature]);

 useEffect(()=>{
  setFallback(false);
  setLoaded(false);
 },[src]);

 useEffect(()=>{
  if(fallback)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduce.matches){setFallback(true);return;}

  const el=canvasRef.current;
  if(!el)return;
  const gl=el.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,powerPreference:'high-performance'});
  if(!gl){setFallback(true);return;}

  const compile=(type:number,code:string)=>{
   const sh=gl.createShader(type);
   if(!sh)return null;
   gl.shaderSource(sh,code);
   gl.compileShader(sh);
   if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);return null;}
   return sh;
  };
  const vs=compile(gl.VERTEX_SHADER,vertexSrc),fs=compile(gl.FRAGMENT_SHADER,fragmentSrc);
  if(!vs||!fs){if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);setFallback(true);return;}
  const prog=gl.createProgram();
  if(!prog){gl.deleteShader(vs);gl.deleteShader(fs);setFallback(true);return;}
  gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){gl.deleteProgram(prog);gl.deleteShader(vs);gl.deleteShader(fs);setFallback(true);return;}

  const buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.useProgram(prog);
  const loc=gl.getAttribLocation(prog,'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

  const uArt=gl.getUniformLocation(prog,'uArt');
  const uSize=gl.getUniformLocation(prog,'uSize');
  const uArtAspect=gl.getUniformLocation(prog,'uArtAspect');
  const uTime=gl.getUniformLocation(prog,'uTime');
  const uMouse=gl.getUniformLocation(prog,'uMouse');
  const uMature=gl.getUniformLocation(prog,'uMature');
  const uRimColor=gl.getUniformLocation(prog,'uRimColor');

  const tex=gl.createTexture();
  let stopped=false,onscreen=true,frame=0,texReady=false;
  const img=new Image();
  if(/^https?:/.test(src))img.crossOrigin='anonymous';
  img.onload=()=>{
   if(stopped)return;
   try{
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.uniform1i(uArt,0);
    gl.uniform1f(uArtAspect,img.naturalWidth/Math.max(1,img.naturalHeight));
    texReady=true;

   }catch{
    setFallback(true);
   }
  };
  img.onerror=()=>{
   if(!stopped){
    setFallback(true);

   }
  };
  img.src=src;

  const onMove=(e:PointerEvent)=>{
   pointerRef.current.tx=(e.clientX/Math.max(1,window.innerWidth))*2-1;
   pointerRef.current.ty=(e.clientY/Math.max(1,window.innerHeight))*2-1;
  };
  const onLeave=()=>{pointerRef.current.tx=0;pointerRef.current.ty=0;};

  const resize=()=>{
   const dpr=Math.min(window.devicePixelRatio||1,2);
   el.width=Math.max(1,Math.round(el.clientWidth*dpr));
   el.height=Math.max(1,Math.round(el.clientHeight*dpr));
   gl.viewport(0,0,el.width,el.height);
   gl.uniform2f(uSize,el.width,el.height);
  };
  const ro=new ResizeObserver(resize);
  ro.observe(el);
  resize();

  const io=new IntersectionObserver(([entry])=>{onscreen=entry.isIntersecting;sync();});
  io.observe(el);

  const t0=performance.now();
  let painted=false;
  const draw=(now:number)=>{
   frame=0;
   if(stopped||document.hidden||!onscreen)return;
   if(texReady){
    const p=pointerRef.current;
    p.mx+=(p.tx-p.mx)*0.08;
    p.my+=(p.ty-p.my)*0.08;
    const rim=rimByMood[moodRef.current.mood]||rimByMood.uniform;
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uTime,(now-t0)/1000);
    gl.uniform2f(uMouse,p.mx,p.my);
    gl.uniform1f(uMature,moodRef.current.mature?1:0);
    gl.uniform3f(uRimColor,rim[0],rim[1],rim[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(!painted){painted=true;setLoaded(true);}
   }
   frame=requestAnimationFrame(draw);
  };
  const sync=()=>{
   cancelAnimationFrame(frame);
   if(!stopped&&!document.hidden&&onscreen)frame=requestAnimationFrame(draw);
  };
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pointermove',onMove,{passive:true});
  window.addEventListener('pointerleave',onLeave);
  const lost=()=>{stopped=true;cancelAnimationFrame(frame);setFallback(true);};
  el.addEventListener('webglcontextlost',lost);
  sync();

  return()=>{
   stopped=true;
   cancelAnimationFrame(frame);
   ro.disconnect();
   io.disconnect();
   document.removeEventListener('visibilitychange',sync);
   window.removeEventListener('pointermove',onMove);
   window.removeEventListener('pointerleave',onLeave);
   el.removeEventListener('webglcontextlost',lost);
   gl.deleteTexture(tex);
   gl.deleteBuffer(buf);
   gl.deleteProgram(prog);
   gl.deleteShader(vs);
   gl.deleteShader(fs);
  };
 },[src,fallback]);

 if(fallback){
  return <img src={src} alt={alt} fetchPriority="high" onError={onError}/>;
 }

 return <>
  {!loaded&&<img src={src} alt={alt} fetchPriority="high" className="live25d-preload-img" onError={onError}/>}
  <canvas ref={canvasRef} className={'live25d-canvas'+(loaded?' is-ready':'')} role={loaded?"img":undefined} aria-hidden={!loaded} aria-label={loaded?alt:undefined}/>
 </>;
}
