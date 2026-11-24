'use client';
import {carryArtwork} from '../../lib/motion/artwork-transition';
import {AnimatePresence,motion} from 'motion/react';
import {useCallback,useEffect,useRef,useState,type CSSProperties,type PointerEvent} from 'react';
import {ArrowUpRight,Compass,BookOpen,Gem,Sparkles} from 'lucide-react';
import OpeningLivingScene from './OpeningLivingScene';
import MediaImage from './MediaImage';
import BackgroundMusicSlot from './BackgroundMusicSlot';
import {factionGroups,revoltSlots} from '../../lib/discovery';
import {factionSelectionTagline} from '../../lib/faction-selection-taglines';
import standards from '../../public/heraldry/manifest.json';
import {useDiscovery} from './DiscoveryProgress';
import '../opening-moonfall.css';
import '../faction-depth.css';

type R=Record<string,any>;
type Props={contentSettled:boolean;data:R;geo:R[];provinces:R[];lang:string;year:string;replay:boolean;onLanguage:(lang:string)=>void;onPrepare:()=>void;onEnter:(index:number,tab?:string)=>void};
const flags=standards.flags as Record<string,string>;

export default function CinematicEntry({data,replay,onEnter}:Props){
 const [choose,setChoose]=useState(replay),[notice,setNotice]=useState(''),[hoveredId,setHoveredId]=useState<string>('castilian_empire');
 const tilt=useRef<{frame:number;crest:HTMLElement|null;x:number;y:number}>({frame:0,crest:null,x:0,y:0});
 const discovery=useDiscovery();

 const clearTilt=useCallback(()=>{
  const state=tilt.current;
  cancelAnimationFrame(state.frame);
  state.frame=0;
  state.crest?.style.removeProperty('--plaque-pitch');
  state.crest?.style.removeProperty('--plaque-yaw');
  state.crest=null;
 },[]);

 useEffect(()=>{
  if(!choose)return;
  window.addEventListener('blur',clearTilt);
  return()=>{clearTilt();window.removeEventListener('blur',clearTilt);};
 },[choose,clearTilt]);

 function trackPlaque(event:PointerEvent<HTMLButtonElement>){
  if(event.pointerType!=='mouse')return;
  const crest=event.currentTarget.querySelector('.selection-crest');
  if(!(crest instanceof HTMLElement))return;
  const state=tilt.current;
  if(state.crest!==crest)clearTilt();
  state.crest=crest;
  state.x=event.clientX;
  state.y=event.clientY;
  if(state.frame)return;
  state.frame=requestAnimationFrame(()=>{
   state.frame=0;
   if(!crest.isConnected)return;
   const rect=crest.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   const horizontal=Math.max(-1,Math.min(1,2*(state.x-rect.left)/rect.width-1));
   const vertical=Math.max(-1,Math.min(1,2*(state.y-rect.top)/rect.height-1));
   crest.style.setProperty('--plaque-pitch',`${-vertical*11}deg`);
   crest.style.setProperty('--plaque-yaw',`${horizontal*18}deg`);
  });
 }

 useEffect(()=>{
  setChoose(replay||location.hash==='#horizons'||location.hash==='#voyage');
  const sync=()=>setChoose(location.hash==='#horizons'||location.hash==='#voyage');
  window.addEventListener('popstate',sync);
  return()=>window.removeEventListener('popstate',sync);
 },[replay]);

 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timer);},[notice]);

 function horizons(e:React.MouseEvent<HTMLAnchorElement>){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();history.pushState(null,'','#horizons');setChoose(true);window.scrollTo({top:0,behavior:'instant'});}
 function enter(id:string,button:HTMLButtonElement){
  const index=data.factions.findIndex((f:R)=>f.id===id);
  if(index<0||!discovery.canExplore(id)){setNotice(discovery.condition(id));return;}
  try{localStorage.setItem('tfam-last-faction',id);}catch{}
  try{document.documentElement.style.setProperty('--tfam-banner-duration',sessionStorage.getItem('tfam-arrival:'+id)==='seen'?'280ms':'900ms');}catch{}
  carryArtwork(button,()=>onEnter(index,'map'),'tfam-faction-banner',()=>scrollTo({top:0,behavior:'instant'}));
 }
 function openDestination(e:React.MouseEvent<HTMLAnchorElement>,dest:'reader'|'vestigium'){
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  e.preventDefault();
  onEnter(0,dest);
 }

 const hoveredFaction=data.factions.find((f:R)=>f.id===hoveredId);
 const ambientTint=hoveredFaction?.ui_color_primary||'#8c2642';

 return <div className={'atlas-opening tfam-opening-210 tfam-astral-v250 '+(choose?'choosing':'')} data-opening-motion="on" style={{'--astral-tint':ambientTint} as CSSProperties}>
  <OpeningLivingScene scene={choose?'court':'opening'}/>
  <div className="opening-mist" aria-hidden="true"/>
  <div className="astral-nebula-veil" aria-hidden="true"/>

  <header className="opening-toolbar astral-toolbar">
   <a className="opening-wordmark" href="/" aria-label="Through Frost and Myth" onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();history.pushState(null,'',location.pathname);setChoose(false);window.scrollTo({top:0,behavior:'instant'});}}>Through Frost and Myth <sup>©</sup></a>
   <BackgroundMusicSlot className="opening-header-music"/>
  </header>

  <AnimatePresence mode="wait" initial={false}>
   {!choose?<motion.section key="opening" className="opening-title astral-opening-hero" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}} transition={{duration:.65}}>
    <div className="opening-work-title">
     <span className="title-blood-bloom" aria-hidden="true"/>
     <h1><span>Through Frost</span><em>and Myth</em><sup aria-label="copyright">©</sup></h1>
     <p className="opening-byline">An Imperial Dark Fantasy Universe by Leonardo Ravenna</p>
    </div>
    <blockquote className="opening-quote">Who are you in a world buried beneath snow,<br/>where history itself has been bent from its true course?</blockquote>
    <div className="opening-actions">
     <a className="opening-enter" href="/#horizons" onClick={horizons}><Compass size={19} aria-hidden="true"/><span>ENTER THE REALMS</span></a>
     <a className="opening-reader-button" href="/chronicles" onClick={e=>openDestination(e,'reader')}><BookOpen size={19} aria-hidden="true"/><span>The Chronicles</span></a>
     <a className="opening-reader-button" href="/vestigium" onClick={e=>openDestination(e,'vestigium')}><Gem size={19} aria-hidden="true"/><span>MAISON VESTIGIUM</span></a>
    </div>
   </motion.section>:<motion.section key="banners" className="faction-selection faction-depth astral-portal-grid" aria-labelledby="horizon-title" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.65}}>
    <header className="horizon-intro astral-intro">
     <span className="astral-sigil"><Sparkles size={14} aria-hidden="true"/> Sovereign Threshold</span>
     <h1 id="horizon-title">Choose Your Realm</h1>
     <p>Each empire opens a private frozen world of courtly intrigue, doctrine, and power.</p>
    </header>

    <nav className="horizon-chapters" aria-label="Faction constellations">{factionGroups.map((group,i)=><a key={group.name} href={'#horizon-group-'+i} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();document.getElementById('horizon-group-'+i)?.scrollIntoView({behavior:'smooth',block:'start'});}}>{group.name}</a>)}</nav>

    {factionGroups.map((group,i)=><section className={'faction-group astral-constellation '+(group.name==='The Unscored Revolt'?'revolt-group':'')} id={'horizon-group-'+i} key={group.name} aria-labelledby={'group-title-'+i}>
     <header className="faction-group-heading"><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span><h2 id={'group-title-'+i}>{group.name}</h2><span className="group-rule" aria-hidden="true"/></header>
     <div className="faction-card-grid">{group.ids.map(id=>{
      const f=data.factions.find((row:R)=>row.id===id)||revoltSlots.find(row=>row.id===id);
      if(!f)return null;
      const available=discovery.canExplore(id);
      const src=revoltSlots.find(s=>s.id===id)?.flag_asset||flags[id]||f.flag_asset;
      const name=id==='england_ruins'?'Remnants of England':f.name_en;
      const tagline=factionSelectionTagline(f);
      return <button
       type="button"
       className={'faction-card astral-monolith '+(!available?'is-locked':'')+(hoveredId===id?' is-focused':'')}
       data-faction-id={id}
       key={id}
       aria-disabled={!available}
       aria-label={name+'. '+(available?'Enter realm':discovery.condition(id))}
       onMouseEnter={()=>setHoveredId(id)}
       onFocus={()=>setHoveredId(id)}
       onPointerMove={trackPlaque}
       onPointerLeave={clearTilt}
       onPointerCancel={clearTilt}
       onClick={e=>enter(id,e.currentTarget)}
       style={{'--banner-ink':group.name==='The Unscored Revolt'?'#c3a0e5':f.ui_color_primary||'#c3a074'} as CSSProperties}
      >
       <span className="selection-crest" aria-hidden="true">
        <span className="faction-plaque">
         <span className="faction-plaque-back"/>
         <span className="faction-plaque-edge edge-left"/>
         <span className="faction-plaque-edge edge-right"/>
         <span className="faction-plaque-edge edge-top"/>
         <span className="faction-plaque-edge edge-bottom"/>
         <span className="faction-plaque-face"><MediaImage className="horizon-flag" src={src} alt="" loading="lazy"/></span>
         {!available&&<img className="faction-chain-lock" src="/art/update210/chain-lock.webp" alt="" loading="lazy" decoding="async"/>}
        </span>
       </span>
       <strong>{name}</strong>
       {tagline&&<span className="faction-subtitle">{tagline}</span>}
       <span className="faction-card-condition">{available?<><span>Enter realm</span><ArrowUpRight size={15} aria-hidden="true"/></>:<span>{discovery.condition(id)}</span>}</span>
      </button>;
     })}</div>
    </section>)}
    {notice&&<div className="horizon-lock-notice" role="status" key={notice}>{notice}</div>}
   </motion.section>}
  </AnimatePresence>
 </div>;
}
