'use client';
import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
export default function BookHandoff({onEnd,cover}:{onEnd:()=>void;cover:string}){
 const host=useRef<HTMLDivElement>(null);
 const latestEnd=useRef(onEnd);
 useEffect(()=>{latestEnd.current=onEnd;},[onEnd]);
 useEffect(()=>{
  const el=host.current;if(!el)return;
  let disposed=false,ended=false;
  const finish=()=>{if(disposed||ended)return;ended=true;latestEnd.current();};
  if(document.hidden||typeof el.animate!=='function'){finish();return()=>{disposed=true;};}
  const book=el.firstElementChild as HTMLElement;
  const coverPanel=book.querySelector('.spatial-book-cover');
  const hinge=coverPanel?.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(-122deg)'}],{duration:600,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
  void hinge?.finished.catch(()=>{});
  const opening=book.animate([{transform:'translateX(12%) rotateY(-12deg) scale(.9)',opacity:1},{transform:'translate3d(-8%,0,90px) rotateY(19deg) scale(1.14)',opacity:1,offset:.7},{transform:'translate3d(-10%,0,155px) rotateY(12deg) scale(1.25)',opacity:0}],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'});
  const background=el.animate([{opacity:1},{opacity:0}],{duration:600,easing:'ease-in'});
  void background.finished.catch(()=>{});
  const stop=()=>{if(document.hidden){opening.cancel();hinge?.cancel();background.cancel();finish();}};
  document.addEventListener('visibilitychange',stop);
  void opening.finished.then(finish,()=>{});
  return()=>{disposed=true;opening.cancel();hinge?.cancel();background.cancel();document.removeEventListener('visibilitychange',stop);};
 },[cover]);
 if(typeof document==='undefined')return null;
 return createPortal(<div ref={host} className="book-handoff" aria-hidden="true"><div className="spatial-book"><div className="spatial-book-leaves"/><div className="spatial-book-spine"/><div className="spatial-book-cover"><img src={cover} alt=""/><span>Through Frost<br/>and Myth</span></div></div></div>,document.body);
}
