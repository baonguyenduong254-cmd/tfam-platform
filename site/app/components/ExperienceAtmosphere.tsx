'use client';
import dynamic from 'next/dynamic';
import {motionPreference} from '../../lib/motion/preference';
import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
const Scene=dynamic(()=>import('./engine/AtmosphereCanvas'),{ssr:false});
/** Decorative only: DOM text and navigation remain available without WebGL. */
export default function ExperienceAtmosphere({variant='world'}:{variant?:'world'|'archive'|'reader'}){
 const host=useRef<HTMLDivElement>(null),[active,setActive]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{const el=host.current;if(!el)return;let visible=false;const reduced=motionPreference,fine=matchMedia('(pointer: fine)');
  const sync=()=>setActive(visible&&!document.hidden&&!reduced.matches&&fine.matches&&document.documentElement.dataset.motion!=='off'&&document.body.dataset.atmosphere!=='off');
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{rootMargin:'60px'});io.observe(el);
  const mo=new MutationObserver(sync);mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});mo.observe(document.body,{attributes:true,attributeFilter:['data-atmosphere']});document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);fine.addEventListener('change',sync);
  return()=>{io.disconnect();mo.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);fine.removeEventListener('change',sync);};
 },[]);
 useEffect(()=>{if(!active||!host.current)return;gsap.registerPlugin(ScrollTrigger);const el=host.current;const ctx=gsap.context(()=>{gsap.to(el,{yPercent:12,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top top',end:'bottom top',scrub:1}});},el);return()=>ctx.revert();},[active]);
 return <div ref={host} className={'experience-atmosphere atmosphere-'+variant} aria-hidden="true"><div className="atmosphere-orbit"><i/><i/><b/></div>{active&&!failed&&<Scene variant={variant} onFailure={()=>setFailed(true)}/>}</div>;
}
