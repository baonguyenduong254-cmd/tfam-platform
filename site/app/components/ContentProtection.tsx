'use client';
import {useEffect,useState} from 'react';
const PROTECTED='.story-reader .story-prose,.panorama-lore .lore,.character-copy .lore,.unit-dossier-copy .lore,.gallery-prose';
const EDITABLE='input,textarea,[contenteditable="true"],.editor,.story-editor';
export function protectedElement(node:Node|null){const element=node instanceof Element?node:node?.parentElement;return !!element&&!element.closest(EDITABLE)&&!!element.closest(PROTECTED);}
export default function ContentProtection(){
 const [notice,setNotice]=useState(false);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const selected=()=>{const selection=window.getSelection();if(!selection||selection.isCollapsed)return false;if(protectedElement(selection.anchorNode)||protectedElement(selection.focusNode))return true;for(const p of document.querySelectorAll(PROTECTED))try{for(let i=0;i<selection.rangeCount;i++)if(selection.getRangeAt(i).intersectsNode(p))return true;}catch{}return false;};
  const warn=()=>{setNotice(true);clearTimeout(timer);timer=setTimeout(()=>setNotice(false),3500);};
  const guard=(e:Event)=>{const target=e.target as Node|null;const element=target instanceof Element?target:target?.parentElement;if(element?.closest(EDITABLE))return;if(protectedElement(target)||((e.type==='copy'||e.type==='cut')&&selected())){e.preventDefault();if(e.type!=='selectstart'&&e.type!=='dragstart')warn();}};
  const shortcut=(e:KeyboardEvent)=>{const target=e.target as Element|null;if(target?.closest?.(EDITABLE))return;if((e.ctrlKey||e.metaKey)&&['c','x'].includes(e.key.toLowerCase())&&selected()){e.preventDefault();warn();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&document.querySelector('.story-reader')){e.preventDefault();warn();}};
  for(const event of ['copy','cut','contextmenu','selectstart','dragstart'])document.addEventListener(event,guard);
  document.addEventListener('keydown',shortcut);
  return()=>{clearTimeout(timer);for(const event of ['copy','cut','contextmenu','selectstart','dragstart'])document.removeEventListener(event,guard);document.removeEventListener('keydown',shortcut);};
 },[]);
 return notice?<div className="copyright-notice" role="status">{typeof document!=='undefined'&&document.documentElement.lang==='en'?'© Leonardo Ravenna · Please read on the official website.':'© Leonardo Ravenna · Vui lòng đọc tại website chính thức.'}</div>:null;
}
