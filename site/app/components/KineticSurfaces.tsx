'use client';
import {useEffect} from 'react';
import gsap from 'gsap';
import {pointerPose} from '../../lib/motion/pointer';
import '../kinetic-surfaces.css';

const legacyCards='.destination-banner,.highlight-person,.military-unit-card,.monument-card,.vest-object,.portrait-column';
const legacySurfaces='.faction-flag-frame,.highlight-person-portrait,.military-card-art,.monument-art,.vest-object-art,.portrait';
const direct3DCards='.empire-trait-folio,.empire-place,.empire-sovereign,.empire-entourage-card,.empire-force-art,.atelier-plate,.atlas-floating-dossier';
const revealTargets='.empire-trait-folio,.empire-place,.empire-sovereign,.empire-entourage-card,.empire-war-table,.empire-chronicle-art,.military-unit-card,.monument-card,.vest-object';

/**
 * Delegated 3D product-launch pointer tilt, specular glass sheen,
 * and scroll-triggered 3D depth choreography.
 * Zero per-event React renders; strictly respects prefers-reduced-motion
 * and never animates long-form reading prose.
 */
export default function KineticSurfaces(){
 useEffect(()=>{
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  type Handle={node:HTMLElement;rect:DOMRect;rx:ReturnType<typeof gsap.quickTo>;ry:ReturnType<typeof gsap.quickTo>;x:ReturnType<typeof gsap.quickSetter>;y:ReturnType<typeof gsap.quickSetter>};
  let active:Handle|null=null;
  const touched=new Set<HTMLElement>();
  const revealed=new WeakSet<Element>();
  const enabled=()=>fine.matches&&!reduce.matches;

  const release=(immediate=false)=>{
   if(!active)return;
   const {node,rx,ry}=active;
   active=null;
   rx.tween.kill();
   ry.tween.kill();
   gsap.to(node,{
    rotationX:0,rotationY:0,z:0,scale:1,'--kinetic-light':0,
    duration:immediate?0:.75,ease:'power3.out',overwrite:true,
    onComplete:()=>{gsap.set(node,{clearProps:'transform,willChange'});delete node.dataset.kinetic;touched.delete(node);},
   });
  };

  const find=(target:EventTarget|null)=>{
   const el=target instanceof Element?target:null;
   if(!el)return null;
   const direct=el.closest<HTMLElement>(direct3DCards);
   if(direct&&!direct.closest('[inert],[hidden],.scene-out')&&!direct.matches(':disabled,[aria-disabled=true]'))return direct;
   const card=el.closest<HTMLElement>(legacyCards);
   if(!card||card.closest('[inert],[hidden],.scene-out')||card.matches(':disabled,[aria-disabled=true]'))return null;
   return card.querySelector<HTMLElement>(legacySurfaces);
  };

  const enter=(event:PointerEvent)=>{
   if(event.pointerType!=='mouse'||!enabled())return;
   const node=find(event.target);
   if(!node||node===active?.node)return;
   release();
   gsap.killTweensOf(node);
   touched.add(node);
   const rect=node.getBoundingClientRect();
   node.dataset.kinetic='true';
   const liftScale=node.matches('.empire-place,.empire-sovereign,.empire-force-art')?1.018:1.032;
   gsap.set(node,{transformPerspective:1050,transformOrigin:'50% 50%',willChange:'transform',rotationX:0,rotationY:0});
   gsap.to(node,{scale:liftScale,z:18,'--kinetic-light':.72,duration:.5,ease:'power3.out',overwrite:'auto'});
   active={
    node,rect,
    rx:gsap.quickTo(node,'rotationX',{duration:.48,ease:'power3.out'}),
    ry:gsap.quickTo(node,'rotationY',{duration:.48,ease:'power3.out'}),
    x:gsap.quickSetter(node,'--kinetic-x','%'),
    y:gsap.quickSetter(node,'--kinetic-y','%'),
   };
  };

  const move=(event:PointerEvent)=>{
   if(!enabled()){release(true);return;}
   if(!active||!active.node.isConnected)return;
   const a=active;
   const maxDeg=a.node.matches('.portrait,.empire-place,.empire-sovereign,.empire-force-art')?4.2:8;
   const p=pointerPose(event.clientX-a.rect.left,event.clientY-a.rect.top,a.rect.width,a.rect.height,maxDeg);
   a.rx(p.rotationX);
   a.ry(p.rotationY);
   a.x(p.spotX);
   a.y(p.spotY);
  };

  const out=(event:PointerEvent)=>{if(active&&find(event.relatedTarget)!==active.node)release();};
  const reset=()=>release(true);
  const scroll=()=>release();
  const press=()=>{if(active)gsap.to(active.node,{scale:1.006,duration:.12,ease:'power2.out'});};
  const lift=()=>{if(active)gsap.to(active.node,{scale:1.028,duration:.46,ease:'power3.out'});};

  // Scroll-triggered 3D Product-Launch Choreography
  let io:IntersectionObserver|null=null;
  let mo:MutationObserver|null=null;
  if(!reduce.matches&&typeof IntersectionObserver!=='undefined'){
   io=new IntersectionObserver(entries=>{
    const batch=entries.filter(e=>e.isIntersecting&&!revealed.has(e.target));
    batch.forEach((entry,idx)=>{
     revealed.add(entry.target);
     io?.unobserve(entry.target);
     const el=entry.target as HTMLElement;
     if(el.closest('[hidden],[inert]'))return;
     gsap.fromTo(el,
      {opacity:0,y:42,z:-75,rotationX:7.5,scale:.965,transformPerspective:1300,transformOrigin:'50% 100%'},
      {opacity:1,y:0,z:0,rotationX:0,scale:1,duration:.78,delay:Math.min(idx*0.075,0.3),ease:'power3.out',clearProps:'transform,opacity'}
     );
    });
   },{threshold:.12,rootMargin:'0px 0px -40px 0px'});

   const scan=()=>{
    document.querySelectorAll(revealTargets).forEach(el=>{
     if(revealed.has(el))return;
     const rect=el.getBoundingClientRect();
     if(rect.height>0&&rect.top<window.innerHeight*0.92){
      revealed.add(el);
      return;
     }
     io?.observe(el);
    });
   };
   scan();
   mo=new MutationObserver(scan);
   mo.observe(document.body,{childList:true,subtree:true});
  }

  document.addEventListener('pointerover',enter,{passive:true});
  document.addEventListener('pointermove',move,{passive:true});
  document.addEventListener('pointerout',out,{passive:true});
  document.addEventListener('pointerdown',press,{passive:true});
  document.addEventListener('pointerup',lift,{passive:true});
  window.addEventListener('scroll',scroll,true);
  window.addEventListener('blur',reset);
  document.addEventListener('visibilitychange',reset);
  fine.addEventListener('change',reset);

  return()=>{
   release(true);
   io?.disconnect();
   mo?.disconnect();
   document.removeEventListener('pointerover',enter);
   document.removeEventListener('pointermove',move);
   document.removeEventListener('pointerout',out);
   document.removeEventListener('pointerdown',press);
   document.removeEventListener('pointerup',lift);
   window.removeEventListener('scroll',scroll,true);
   window.removeEventListener('blur',reset);
   document.removeEventListener('visibilitychange',reset);
   fine.removeEventListener('change',reset);
   for(const node of touched){gsap.killTweensOf(node);gsap.set(node,{clearProps:'transform,willChange'});delete node.dataset.kinetic;}
  };
 },[]);
 return null;
}
