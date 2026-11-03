'use client';
import {useEffect,useRef} from 'react';
/** Bounded image-space atmosphere. Artwork remains a real image, never a pretend model. */
export default function AtmosphereCanvas({variant,onFailure}:{variant:string;onFailure:()=>void}){
 const surface=useRef<HTMLCanvasElement>(null),failure=useRef(onFailure);failure.current=onFailure;
 useEffect(()=>{
  const canvas=surface.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx){failure.current();return;}
  let frame=0,width=1,height=1,last=0,elapsed=0;const intervals:number[]=[];
  const resize=()=>{const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const particles=Array.from({length:64},(_,i)=>({x:((i*173+61)%997)/997,y:((i*251+37)%991)/991,depth:i%3,size:.45+(i%3)*.45}));
  const draw=(now:number)=>{
   if(document.hidden)return;
   const delta=last?now-last:16.67;last=now;elapsed+=Math.min(delta,50)/1000;
   ctx.clearRect(0,0,width,height);
   for(const p of particles){const drift=elapsed*(2+p.depth*3),x=(p.x*width+Math.sin(elapsed*.18+p.y*20)*(8+p.depth*6)+drift*.4)%width,y=(p.y*height+drift)%height;ctx.globalAlpha=.16+p.depth*.13;ctx.fillStyle=variant==='archive'?'#ead0a3':'#e4eef8';ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();}
   ctx.globalAlpha=1;
   if(process.env.NODE_ENV!=='production'){intervals.push(delta);if(intervals.length>120)intervals.shift();if(intervals.length%30===0)canvas.dataset.motionSample=JSON.stringify({frames:intervals.length,averageMs:Math.round(intervals.reduce((a,b)=>a+b,0)/intervals.length*100)/100,maxMs:Math.round(Math.max(...intervals)*100)/100});}
   frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[variant]);
 return <canvas ref={surface} className="scene211-atmosphere" aria-hidden="true"/>;
}
