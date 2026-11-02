'use client';
import {useEffect,useRef} from 'react';
/** Full-resolution artwork stays in the DOM; canvas owns only transparent stardust. */
export default function OpeningLivingScene({paused}:{paused:boolean}){
 const surface=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=surface.current;if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  let frame=0,clock=0,elapsed=0,width=1,height=1;
  const resize=()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=devicePixelRatio||1;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const draw=(now:number)=>{if(!clock)clock=now;elapsed+=(now-clock)/1000;clock=now;ctx.clearRect(0,0,width,height);
   for(let i=0;i<70;i++){const x=((i*61+19)%997)/997*width,y=((((i*43+7)%509)/509*height-elapsed*(2+i%5))%height+height)%height;ctx.globalAlpha=.18+.36*(.5+.5*Math.sin(elapsed*.7+i));ctx.fillStyle=i%3?'#f3e3c9':'#c68496';ctx.beginPath();ctx.arc(x,y,.6+i%3*.35,0,Math.PI*2);ctx.fill();}
   canvas.dataset.motionState='ready';canvas.dataset.frameTime=elapsed.toFixed(2);frame=requestAnimationFrame(draw);
  };
  const sync=()=>{cancelAnimationFrame(frame);clock=0;if(!paused&&!document.hidden){frame=requestAnimationFrame(draw);canvas.classList.add('scene-ready');}else canvas.dataset.motionState='paused';};
  document.addEventListener('visibilitychange',sync);sync();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',sync);};
 },[paused]);
 return <div className="opening-living-scene" aria-hidden="true"><picture><img src="/art/moonfall-duel-209-6688.jpg" alt="" fetchPriority="high" decoding="async"/></picture><canvas ref={surface} className="opening-scene-surface"/></div>;
}
