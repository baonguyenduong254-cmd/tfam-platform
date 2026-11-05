'use client';
import {useEffect,useRef,type ReactNode,type CSSProperties} from 'react';

/** Bounded scene choreography. Content is visible before JavaScript; no input is delayed. */
export default function SceneStage({children,className='',identity,kind='character',style}:{children:ReactNode;className?:string;identity:string;kind?:string;style?:CSSProperties}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=host.current;if(!el)return;
  // Wait for the observer's initial result: an offscreen mount must not start motion.
  let visible=false,played=false,disposed=false,run=0;const active:Animation[]=[];
  el.dataset.scenePhase='waiting';delete el.dataset.sceneElapsed;
  const sceneImages=Array.from(el.querySelectorAll<HTMLImageElement>('[data-scene-plane=subject] img,[data-scene-plane=environment] img'));
  const sync=()=>{
   if(disposed)return;
   const enabled=!document.hidden&&visible;
   el.dataset.sceneMotion=enabled?'active':'static';
   if(enabled&&!played&&sceneImages.every(image=>image.complete)){
    played=true;
    el.dataset.scenePhase='entering';const started=performance.now(),currentRun=++run;
    if(typeof el.animate!=='function'){
     el.dataset.scenePhase='css-entry';
     return;
    }
    const specs:[string,Keyframe[],number,number][]=[
     ['[data-scene-plane=environment]',[{transform:'scale(1.09)'},{transform:'scale(1)'}],900,0],
     ['[data-scene-plane=subject]',[{opacity:.4,transform:'translateY(24px) scale(.96)',clipPath:'inset(0 0 18% 0)'},{opacity:1,transform:'translateY(0) scale(1)',clipPath:'inset(0 0 0 0)'}],650,100],
     ['[data-scene-plane=aperture]',[{opacity:0,transform:'scale(.85) rotate(-12deg)'},{opacity:1,transform:'scale(1) rotate(0deg)'}],800,0],
    ];
    for(const [selector,frames,duration,delay] of specs)el.querySelectorAll<HTMLElement>(selector).forEach(node=>{
     const a=node.animate?.(frames,{duration,delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});if(a)active.push(a);
    });
    void Promise.all(active.map(a=>a.finished)).then(()=>{
     if(!disposed&&currentRun===run&&el.isConnected){el.dataset.scenePhase='settled';el.dataset.sceneElapsed=String(Math.round(performance.now()-started));}
    },()=>{});
   }
   active.forEach(a=>{if(a.playState==='finished'||a.playState==='idle')return;enabled?a.play():a.pause();});
  };
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:.05});observer.observe(el);
  sceneImages.forEach(image=>{image.addEventListener('load',sync);image.addEventListener('error',sync);});
  document.addEventListener('visibilitychange',sync);sync();
  return()=>{disposed=true;run++;active.forEach(a=>a.cancel());observer.disconnect();sceneImages.forEach(image=>{image.removeEventListener('load',sync);image.removeEventListener('error',sync);});document.removeEventListener('visibilitychange',sync);};
 },[identity]);
 return <div ref={host} className={'scene-stage '+className} data-scene-kind={kind} data-scene-id={identity} style={style}>{children}</div>;
}
