'use client';
import {motionPreference} from '../../lib/motion/preference';
import {useEffect} from 'react';
import gsap from 'gsap';
import {pointerPose} from '../../lib/motion/pointer';
import '../kinetic-surfaces.css';
const cards='.destination-banner,.highlight-person,.military-unit-card,.monument-card,.vest-object,.portrait-column';
const surfaces='.faction-flag-frame,.highlight-person-portrait,.military-card-art,.monument-art,.vest-object-art,.portrait';
/** Delegated pointer motion: no per-event React renders, no permanent animation loop. */
export default function KineticSurfaces(){
 useEffect(()=>{const fine=matchMedia('(hover: hover) and (pointer: fine)'),reduced=motionPreference;
 type Handle={node:HTMLElement;rect:DOMRect;rx:ReturnType<typeof gsap.quickTo>;ry:ReturnType<typeof gsap.quickTo>;x:ReturnType<typeof gsap.quickSetter>;y:ReturnType<typeof gsap.quickSetter>};
 let active:Handle|null=null;const touched=new Set<HTMLElement>();
 const enabled=()=>fine.matches&&!reduced.matches&&document.documentElement.dataset.motion!=='off';
 const release=(immediate=false)=>{if(!active)return;const {node,rx,ry}=active;active=null;rx.tween.kill();ry.tween.kill();gsap.to(node,{rotationX:0,rotationY:0,z:0,scale:1,'--kinetic-light':0,duration:immediate?0:.85,ease:'power3.out',overwrite:true,onComplete:()=>{gsap.set(node,{clearProps:'transform,willChange'});delete node.dataset.kinetic;touched.delete(node);}});};
 const find=(target:EventTarget|null)=>{const el=target instanceof Element?target:null,card=el?.closest<HTMLElement>(cards);if(!card||card.closest('[inert],[hidden],.scene-out')||card.matches(':disabled,[aria-disabled=true]'))return null;return card.querySelector<HTMLElement>(surfaces);};
 const enter=(event:PointerEvent)=>{if(event.pointerType!=='mouse'||!enabled())return;const node=find(event.target);if(!node||node===active?.node)return;release();gsap.killTweensOf(node);touched.add(node);const rect=node.getBoundingClientRect();node.dataset.kinetic='true';gsap.set(node,{transformPerspective:900,transformOrigin:'50% 50%',willChange:'transform',rotationX:0,rotationY:0});gsap.to(node,{scale:1.035,z:12,'--kinetic-light':.62,duration:.55,ease:'power3.out',overwrite:'auto'});active={node,rect,rx:gsap.quickTo(node,'rotationX',{duration:.55,ease:'power3.out'}),ry:gsap.quickTo(node,'rotationY',{duration:.55,ease:'power3.out'}),x:gsap.quickSetter(node,'--kinetic-x','%'),y:gsap.quickSetter(node,'--kinetic-y','%')};};
 const move=(event:PointerEvent)=>{if(!enabled()){release(true);return;}if(!active||!active.node.isConnected)return;const a=active,p=pointerPose(event.clientX-a.rect.left,event.clientY-a.rect.top,a.rect.width,a.rect.height,a.node.matches('.portrait')?3:7);a.rx(p.rotationX);a.ry(p.rotationY);a.x(p.spotX);a.y(p.spotY);};
 const out=(event:PointerEvent)=>{if(active&&find(event.relatedTarget)!==active.node)release();};
 const reset=()=>release(true),scroll=()=>release(),press=()=>{if(active)gsap.to(active.node,{scale:1.01,duration:.12,ease:'power2.out'});},lift=()=>{if(active)gsap.to(active.node,{scale:1.035,duration:.5,ease:'power3.out'});};
 const observer=new MutationObserver(()=>{if(!enabled())reset();});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
 document.addEventListener('pointerover',enter,{passive:true});document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerout',out,{passive:true});document.addEventListener('pointerdown',press,{passive:true});document.addEventListener('pointerup',lift,{passive:true});window.addEventListener('scroll',scroll,true);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);fine.addEventListener('change',reset);reduced.addEventListener('change',reset);
 return()=>{release(true);observer.disconnect();document.removeEventListener('pointerover',enter);document.removeEventListener('pointermove',move);document.removeEventListener('pointerout',out);document.removeEventListener('pointerdown',press);document.removeEventListener('pointerup',lift);window.removeEventListener('scroll',scroll,true);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',reset);fine.removeEventListener('change',reset);reduced.removeEventListener('change',reset);for(const node of touched){gsap.killTweensOf(node);gsap.set(node,{clearProps:'transform,willChange'});delete node.dataset.kinetic;}};
 },[]);return null;
}
