'use client';
import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {motionPreference} from '../../lib/motion/preference';
export default function BookHandoff({onEnd,cover}:{onEnd:()=>void;cover:string}){
 const host=useRef<HTMLDivElement>(null);
 const latestEnd=useRef(onEnd);
 useEffect(()=>{latestEnd.current=onEnd;},[onEnd]);
 useEffect(()=>{
  const el=host.current;if(!el)return;
  let disposed=false,ended=false;
  const finish=()=>{if(disposed||ended)return;ended=true;latestEnd.current();};
  if(motionPreference.matches||document.hidden){finish();return()=>{disposed=true;};}
  const book=el.firstElementChild as HTMLElement;
  const opening=book.animate([{transform:'translateX(12%) rotateY(-12deg) scale(.9)',opacity:1},{transform:'translateX(-12%) rotateY(-96deg) scale(1.5)',opacity:1,offset:.7},{transform:'translateX(-18%) rotateY(-118deg) scale(1.7)',opacity:0}],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'});
  const background=el.animate([{opacity:1},{opacity:0}],{duration:600,easing:'ease-in'});
  void background.finished.catch(()=>{});
  const stop=()=>{if(motionPreference.matches||document.hidden){opening.cancel();background.cancel();finish();}};
  motionPreference.addEventListener('change',stop);document.addEventListener('visibilitychange',stop);
  void opening.finished.then(finish,()=>{});
  return()=>{disposed=true;opening.cancel();background.cancel();motionPreference.removeEventListener('change',stop);document.removeEventListener('visibilitychange',stop);};
 },[cover]);
 if(typeof document==='undefined')return null;
 return createPortal(<div ref={host} className="book-handoff" aria-hidden="true"><div><img src={cover} alt=""/><span>Through Frost<br/>and Myth</span></div></div>,document.body);
}
