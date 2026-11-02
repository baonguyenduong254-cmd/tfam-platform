'use client';
import {useEffect,useRef} from 'react';
import type {RefObject} from 'react';

export default function useModalFocus(ref:RefObject<HTMLElement|null>,onClose:()=>void,active=true){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  const root=ref.current;if(!active||!root)return;
  const prior=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const nodes=()=>Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],select,input,textarea,summary,[tabindex="0"]')).filter(n=>n.getClientRects().length>0);
  const frame=requestAnimationFrame(()=>nodes()[0]?.focus({preventScroll:true}));
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();close.current();}
   if(e.key==='Tab'){
    const all=nodes(),first=all[0],last=all[all.length-1];
    if(!first){e.preventDefault();root.focus();return;}
    if(!root.contains(document.activeElement)){e.preventDefault();first.focus();}
    else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',key);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',key);document.body.style.overflow=overflow;
   // React removes inert from the underlying page after the dialog unmounts.
   requestAnimationFrame(()=>{if(document.querySelector('[role="dialog"][aria-modal="true"]'))return;if(prior?.isConnected&&!prior.closest('[inert]'))prior.focus({preventScroll:true});else document.querySelector<HTMLElement>('.dossier-toggle')?.focus({preventScroll:true});});
  };
 },[ref,active]);
}
