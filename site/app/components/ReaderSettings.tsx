'use client';
import {useEffect,useRef} from 'react';
import {Moon,SlidersHorizontal,Sun} from 'lucide-react';
import type {ReaderPreferences} from '../../lib/reader-state';

export default function ReaderSettings({
 value,
 onChange,
 font,
 onFont,
}:{
 value:ReaderPreferences;
 onChange:(p:ReaderPreferences)=>void;
 lang:string;
 font?:number;
 onFont?:(n:number)=>void;
}){
 const panel=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  const dismiss=(e:PointerEvent)=>{if(panel.current&&!panel.current.contains(e.target as Node))panel.current.open=false;};
  document.addEventListener('pointerdown',dismiss);
  return()=>document.removeEventListener('pointerdown',dismiss);
 },[]);

 return (
  <details
   ref={panel}
   className="reader-preferences"
   onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus();}}}
  >
   <summary>
    <SlidersHorizontal size={15} aria-hidden="true"/>
    <span>Page Settings</span>
   </summary>
   <div className="reader-preferences-grid">
    <fieldset className="reader266-theme-field">
     <legend>Reading Surface</legend>
     <div className="reader266-theme-pills">
      {(['dark','cream'] as const).map(theme=>(
       <button key={theme} type="button" aria-pressed={value.theme===theme} onClick={()=>onChange({...value,theme})}>
        {theme==='dark'?<><Moon size={14} aria-hidden="true"/><span>Obsidian Night</span></>:<><Sun size={14} aria-hidden="true"/><span>Royal Parchment</span></>}
       </button>
      ))}
     </div>
    </fieldset>

    {onFont&&(
     <label>
      <span>Text size</span>
      <output>{font}px</output>
      <input aria-label="Reading text size" type="range" min="16" max="28" value={font} onChange={e=>onFont(Number(e.target.value))}/>
     </label>
    )}

    <label>
     <span>Typeface</span>
     <select value={value.fontFamily||'serif'} onChange={e=>onChange({...value,fontFamily:e.target.value as 'serif'|'sans'})}>
      <option value="serif">Book · Serif</option>
      <option value="sans">Clear · Sans</option>
     </select>
    </label>

    <label>
     <span>Page width</span>
     <select value={value.width} onChange={e=>onChange({...value,width:e.target.value as ReaderPreferences['width']})}>
      <option value="compact">Compact</option>
      <option value="regular">Regular</option>
      <option value="wide">Wide</option>
     </select>
    </label>

    <label>
     <span>Line spacing</span>
     <output>{value.lineHeight.toFixed(2)}</output>
     <input aria-label="Line spacing" type="range" min="1.5" max="2.4" step="0.05" value={value.lineHeight} onChange={e=>onChange({...value,lineHeight:Number(e.target.value)})}/>
    </label>

    <label>
     <span>Paragraph spacing</span>
     <output>{value.paragraphGap.toFixed(2)}</output>
     <input aria-label="Paragraph spacing" type="range" min="0.5" max="2" step="0.05" value={value.paragraphGap} onChange={e=>onChange({...value,paragraphGap:Number(e.target.value)})}/>
    </label>
   </div>
  </details>
 );
}
