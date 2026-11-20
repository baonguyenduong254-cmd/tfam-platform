'use client';
import {useEffect,useRef} from 'react';

/** Decorative winter atmosphere; no image distortion or input/scroll interception. */
export default function ImperialWeather(){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext('2d');if(!el||!ctx)return;
  let frame=0,visible=true,disposed=false,last=0,time=0,width=1,height=1;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const flakes=Array.from({length:42},(_,i)=>({x:((i*73+19)%101)/101,y:((i*37+11)%97)/97,z:.25+(i%5)/7,phase:i*1.73}));
  const draw=(now:number)=>{frame=0;if(disposed||!visible||document.hidden)return;
   const dt=Math.min((now-last)/1000,.05);last=now;time+=dt*(reduce.matches?.1:1);
   ctx.clearRect(0,0,width,height);
   // Drifting snow stays in the scene, below the stable identity typography.
   ctx.fillStyle='#dbe6ed';
   if(!reduce.matches)for(const p of flakes){const x=((p.x+time*.012*p.z+Math.sin(time*.22+p.phase)*.008)%1)*width,y=((p.y+time*.026*p.z)%1)*height;ctx.globalAlpha=.18+p.z*.25;ctx.beginPath();ctx.arc(x,y,.5+p.z*1.3,0,Math.PI*2);ctx.fill();}
   // Soft mist belongs at the city's base; text is rendered above this canvas.
   ctx.globalAlpha=1;const mist=ctx.createRadialGradient(width*(.5+Math.sin(time*.06)*.09),height*.86,0,width*.5,height*.86,width*.65);mist.addColorStop(0,'rgba(166,188,208,.10)');mist.addColorStop(1,'rgba(166,188,208,0)');ctx.fillStyle=mist;ctx.fillRect(0,height*.4,width,height*.6);
   frame=requestAnimationFrame(draw);
  };
  const sync=()=>{cancelAnimationFrame(frame);if(!disposed&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(draw);}};
  const resize=new ResizeObserver(()=>{width=Math.max(1,Math.round(el.clientWidth*.75));height=Math.max(1,Math.round(el.clientHeight*.75));el.width=width;el.height=height;});resize.observe(el);
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();});observer.observe(el);document.addEventListener('visibilitychange',sync);sync();
  return()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',sync);};
 },[]);
 return <canvas className="imperial-weather" ref={canvas} aria-hidden="true"/>;
}
