'use client';
import {useEffect,useRef} from 'react';
const vertex='attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}';
const fragment=`precision mediump float;uniform vec2 uSize;uniform float uTime;uniform float uPulse;
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
void main(){vec2 uv=gl_FragCoord.xy/uSize;float light=0.;
for(int i=0;i<22;i++){float n=float(i);vec2 p=vec2(hash(n+1.),fract(hash(n+25.)+uTime*(.006+hash(n+9.)*.008)));vec2 d=(uv-p)*vec2(uSize.x/uSize.y,1.);float r=length(d);float sparkle=.4+.6*pow(sin(uTime*.7+n)*.5+.5,3.);light+=(1.-smoothstep(0.,.0035,r))*sparkle*.48;}
float sweep=exp(-pow((uv.x-(1.-uPulse)*1.3)/.09,2.))*uPulse*.11;
float vignette=smoothstep(.08,.35,uv.x)*(1.-smoothstep(.88,1.,uv.x));
float alpha=clamp((light+sweep)*vignette,0.,.4);gl_FragColor=vec4(.86,.74,.53,alpha);}`;
/** One bounded low-resolution atmosphere, independent of the artwork and text. */
export default function CharacterAtmosphere({identity}:{identity:string}){
 const canvas=useRef<HTMLCanvasElement>(null),pulse=useRef(0);
 useEffect(()=>{pulse.current=performance.now();},[identity]);
 useEffect(()=>{const el=canvas.current;if(!el)return;const gl=el.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return;
 const compile=(type:number,src:string)=>{const shader=gl.createShader(type);if(!shader)return null;gl.shaderSource(shader,src);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}return shader;};
 const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs){if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return;}
 const program=gl.createProgram();if(!program){gl.deleteShader(vs);gl.deleteShader(fs);return;}gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);return;}
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);gl.useProgram(program);const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);const size=gl.getUniformLocation(program,'uSize'),time=gl.getUniformLocation(program,'uTime'),flash=gl.getUniformLocation(program,'uPulse');
 let frame=0,onscreen=true,stopped=false,last=0,t=0;const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const draw=(now:number)=>{frame=0;if(stopped||document.hidden||!onscreen)return;t+=Math.min((now-last)/1000,.05);last=now;gl.uniform1f(time,t*(reduce.matches?.35:1));gl.uniform1f(flash,reduce.matches?0:Math.max(0,1-(now-pulse.current)/550));gl.drawArrays(gl.TRIANGLE_STRIP,0,4);frame=requestAnimationFrame(draw);};
 const sync=()=>{cancelAnimationFrame(frame);if(!stopped&&!document.hidden&&onscreen){last=performance.now();frame=requestAnimationFrame(draw);}};
 const resize=new ResizeObserver(()=>{el.width=Math.max(1,Math.round(el.clientWidth*.65));el.height=Math.max(1,Math.round(el.clientHeight*.65));gl.viewport(0,0,el.width,el.height);gl.uniform2f(size,el.width,el.height);});resize.observe(el);
 const observer=new IntersectionObserver(([e])=>{onscreen=e.isIntersecting;sync();});observer.observe(el);document.addEventListener('visibilitychange',sync);
 const lost=()=>{stopped=true;cancelAnimationFrame(frame);};el.addEventListener('webglcontextlost',lost);sync();
 return()=>{stopped=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',sync);el.removeEventListener('webglcontextlost',lost);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);};
 },[]);
 return <canvas ref={canvas} className="champion-atmosphere" aria-hidden="true"/>;
}

