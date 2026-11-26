'use client';
import {carryArtwork} from '../../lib/motion/artwork-transition';
import {AnimatePresence,MotionConfig,motion} from 'motion/react';
import {startTransition,useCallback,useEffect,useMemo,useRef,useState,type CSSProperties,type PointerEvent} from 'react';
import {ArrowLeft,ArrowUpRight,BookOpen,ChevronLeft,ChevronRight,Compass,Gem,Lock,Trophy} from 'lucide-react';
import OpeningLivingScene from './OpeningLivingScene';
import MediaImage from './MediaImage';
import {factionGroups,revoltSlots} from '../../lib/discovery';
import {factionSelectionTagline} from '../../lib/faction-selection-taglines';
import {sceneArt} from '../../lib/faction-scene';
import {artSlugs} from '../../lib/campaign-art';
import {factionCapital} from '../../lib/faction-content';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import {playBrassClick} from '../../lib/tactile-sfx';
import standards from '../../public/heraldry/manifest.json';
import {useDiscovery} from './DiscoveryProgress';
import '../opening-moonfall.css';
import '../faction-depth.css';

type R=Record<string,any>;
type Props={contentSettled:boolean;data:R;geo:R[];provinces:R[];lang:string;year:string;replay:boolean;onLanguage:(lang:string)=>void;onPrepare:()=>void;onEnter:(index:number,tab?:string)=>void};
const flags=standards.flags as Record<string,string>;

function resolveStageBackdrop(id:string,f:R|undefined){
 if(id==='castilian_empire')return '/overview223/castilian-arrival.webp';
 if(!f||!(id in artSlugs))return '/overview223/imperial-court.webp';
 return sceneArt(f);
}

function summarizeLore(raw:unknown){
 if(typeof raw!=='string')return '';
 const clean=presentationPunctuation(raw).replace(/\s+/g,' ').trim();
 if(!clean||/^(placeholder|place holder|tbd|chưa (có|bổ sung|điền))/i.test(clean))return '';
 if(clean.length<=170)return clean;
 const firstSentence=clean.match(/^[^.!?]{45,175}[.!?]/);
 if(firstSentence)return firstSentence[0];
 return clean.slice(0,165).replace(/\s+\S*$/,'')+'…';
}

export default function CinematicEntry({data,replay,year,onEnter}:Props){
 const [choose,setChoose]=useState(replay),[notice,setNotice]=useState(''),[activeId,setActiveId]=useState<string>('castilian_empire'),[activeGroup,setActiveGroup]=useState<number>(0);
 const tilt=useRef<{frame:number;crest:HTMLElement|null;card:HTMLElement|null;x:number;y:number}>({frame:0,crest:null,card:null,x:0,y:0});
 const stageRef=useRef<HTMLElement>(null);
 const discovery=useDiscovery();

 const allRealmIds=useMemo(()=>factionGroups.flatMap(g=>g.ids),[]);
 const findRecord=useCallback((id:string):(R&{id:string;subtitle?:string})|undefined=>data.factions.find((row:R)=>row.id===id)||revoltSlots.find(row=>row.id===id),[data.factions]);

 const clearTilt=useCallback(()=>{
  const state=tilt.current;
  cancelAnimationFrame(state.frame);
  state.frame=0;
  state.crest?.style.removeProperty('--plaque-pitch');
  state.crest?.style.removeProperty('--plaque-yaw');
  state.card?.style.removeProperty('--mx');
  state.card?.style.removeProperty('--my');
  state.crest=null;
  state.card=null;
 },[]);

 useEffect(()=>{
  if(!choose)return;
  window.addEventListener('blur',clearTilt);
  return()=>{clearTilt();window.removeEventListener('blur',clearTilt);};
 },[choose,clearTilt]);

 function trackPlaque(event:PointerEvent<HTMLButtonElement>){
  if(event.pointerType!=='mouse')return;
  if(typeof matchMedia==='function'&&(matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(hover: hover) and (pointer: fine)').matches))return;
  const card=event.currentTarget;
  const crest=card.querySelector('.selection-crest');
  const state=tilt.current;
  if(state.card!==card)clearTilt();
  state.card=card;
  state.crest=crest instanceof HTMLElement?crest:null;
  state.x=event.clientX;
  state.y=event.clientY;
  if(state.frame)return;
  state.frame=requestAnimationFrame(()=>{
   state.frame=0;
   if(!card.isConnected)return;
   const cardRect=card.getBoundingClientRect();
   if(cardRect.width&&cardRect.height){
    card.style.setProperty('--mx',`${Math.max(0,Math.min(100,((state.x-cardRect.left)/cardRect.width)*100)).toFixed(1)}%`);
    card.style.setProperty('--my',`${Math.max(0,Math.min(100,((state.y-cardRect.top)/cardRect.height)*100)).toFixed(1)}%`);
   }
   if(state.crest&&state.crest.isConnected){
    const rect=state.crest.getBoundingClientRect();
    if(rect.width&&rect.height){
     const horizontal=Math.max(-1,Math.min(1,2*(state.x-rect.left)/rect.width-1));
     const vertical=Math.max(-1,Math.min(1,2*(state.y-rect.top)/rect.height-1));
     state.crest.style.setProperty('--plaque-pitch',`${-vertical*9}deg`);
     state.crest.style.setProperty('--plaque-yaw',`${horizontal*14}deg`);
    }
   }
  });
 }

 useEffect(()=>{
  setChoose(replay||location.hash==='#horizons'||location.hash==='#voyage');
  const sync=()=>setChoose(location.hash==='#horizons'||location.hash==='#voyage');
  window.addEventListener('popstate',sync);
  return()=>window.removeEventListener('popstate',sync);
 },[replay]);

 useEffect(()=>{
  try{
   const saved=localStorage.getItem('tfam-last-faction');
   if(saved&&allRealmIds.includes(saved)&&discovery.canExplore(saved)){
    setActiveId(saved);
    const savedGroup=factionGroups.findIndex(g=>g.ids.includes(saved));
    if(savedGroup>=0)setActiveGroup(savedGroup);
   }
  }catch{}
 },[allRealmIds,discovery]);

 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timer);},[notice]);

 function horizons(e:React.MouseEvent<HTMLAnchorElement>){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();playBrassClick();history.pushState(null,'','#horizons');setChoose(true);window.scrollTo({top:0,behavior:'instant'});}
 function returnToPortal(e?:React.MouseEvent<HTMLElement>){if(e&&(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey))return;e?.preventDefault();playBrassClick();history.pushState(null,'',location.pathname);setChoose(false);window.scrollTo({top:0,behavior:'instant'});}

 function focusRealm(id:string){
  if(id===activeId)return;
  startTransition(()=>setActiveId(id));
 }

 function stepRealm(delta:number){
  const pool=factionGroups[activeGroup]?.ids||allRealmIds;
  const idx=pool.indexOf(activeId);
  const next=pool[((idx<0?0:idx)+delta+pool.length)%pool.length];
  if(next){playBrassClick();startTransition(()=>setActiveId(next));}
 }

 function selectConstellation(next:number){
  playBrassClick();
  startTransition(()=>{
   setActiveGroup(next);
   const ids=factionGroups[next]?.ids||[];
   if(ids.length&&!ids.includes(activeId)){
    const firstOpen=ids.find(id=>discovery.canExplore(id));
    setActiveId(firstOpen||ids[0]);
   }
  });
 }

 function enter(id:string,button:HTMLButtonElement){
  const index=data.factions.findIndex((f:R)=>f.id===id);
  if(index<0||!discovery.canExplore(id)){
   playBrassClick();
   startTransition(()=>setActiveId(id));
   setNotice(discovery.condition(id));
   if(stageRef.current){
    const rect=stageRef.current.getBoundingClientRect();
    if(rect.top<-120||rect.bottom<120)stageRef.current.scrollIntoView({behavior:'smooth',block:'nearest'});
   }
   return;
  }
  playBrassClick();
  try{localStorage.setItem('tfam-last-faction',id);}catch{}
  try{document.documentElement.style.setProperty('--tfam-banner-duration',sessionStorage.getItem('tfam-arrival:'+id)==='seen'?'280ms':'650ms');}catch{}
  carryArtwork(button,()=>onEnter(index,'map'),'tfam-faction-banner',()=>scrollTo({top:0,behavior:'instant'}));
 }

 function openDestination(e:React.MouseEvent<HTMLAnchorElement>,dest:'reader'|'vestigium'){
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  e.preventDefault();
  onEnter(0,dest);
 }

 const activeFaction=findRecord(activeId)||findRecord('castilian_empire');
 const activeGroupObj=factionGroups.find(g=>g.ids.includes(activeId))||factionGroups[0];
 const activeIsRevolt=activeGroupObj?.name==='The Unscored Revolt';
 const activeAvailable=discovery.canExplore(activeId);
 const activeName=activeId==='england_ruins'?'Remnants of England':(activeFaction?.name_en||'Castilian Empire');
 const activeTagline=activeFaction?factionSelectionTagline(activeFaction):'';
 const activeFlag=revoltSlots.find(s=>s.id===activeId)?.flag_asset||flags[activeId]||activeFaction?.flag_asset;
 const activeBackdrop=resolveStageBackdrop(activeId,activeFaction);
 const activeCapital=activeFaction&&!activeIsRevolt?factionCapital(activeFaction,'en',year||'1715'):'';
 const activeLore=summarizeLore(activeFaction?.lore_en_1715||activeFaction?.lore_en);
 const ambientTint=activeIsRevolt?'#7e4aa8':(activeFaction?.ui_color_primary||'#8c2642');

 const activePool=factionGroups[activeGroup]?.ids||allRealmIds;
 const poolIndex=Math.max(0,activePool.indexOf(activeId));
 const visibleGroups=[{group:factionGroups[activeGroup]||factionGroups[0],index:activeGroup}];

 return <MotionConfig reducedMotion="user"><div className={'atlas-opening tfam-opening-210 tfam-astral-v250 tfam-opening-v251 '+(choose?'choosing':'')} data-opening-motion="on" style={{'--astral-tint':ambientTint} as CSSProperties}>
  <OpeningLivingScene scene={choose?'court':'opening'}/>
  <div className="opening-mist" aria-hidden="true"/>
  <div className="astral-nebula-veil" aria-hidden="true"/>

  <header className="opening-toolbar astral-toolbar">
   <a className="opening-wordmark" href="/" aria-label="Through Frost and Myth" onClick={returnToPortal}>Through Frost and Myth <sup aria-hidden="true">©</sup></a>
   {choose&&<button type="button" className="opening-return-btn" onClick={()=>returnToPortal()}><ArrowLeft size={16} aria-hidden="true"/><span>Portal</span></button>}
  </header>

  <AnimatePresence mode="wait" initial={false}>
   {!choose?<motion.section key="opening" className="opening-title astral-opening-hero" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.36,ease:[0.2,0,0,1]}}>
    <div className="opening-work-title">
     <span className="opening-crest-rule" aria-hidden="true"/>
     <h1><span>Through Frost</span><em>and Myth<sup aria-label="copyright">©</sup></em></h1>
     <p className="opening-byline">An Imperial Dark Fantasy Universe by Leonardo Ravenna</p>
    </div>
    <blockquote className="opening-quote">Who are you in a world buried beneath snow, where history itself has been bent from its true course?</blockquote>
    <div className="opening-actions">
     <a className="opening-enter" href="/#horizons" onClick={horizons}><Compass size={19} aria-hidden="true"/><span>Enter the Realms</span><ArrowUpRight size={17} aria-hidden="true"/></a>
     <div className="opening-secondary-actions">
      <a className="opening-reader-button" href="/chronicles" onClick={e=>openDestination(e,'reader')}><BookOpen size={18} aria-hidden="true"/><span>The Chronicles</span></a>
      <a className="opening-reader-button" href="/vestigium" onClick={e=>openDestination(e,'vestigium')}><Gem size={18} aria-hidden="true"/><span>Maison Vestigium</span></a>
     </div>
    </div>
   </motion.section>:<motion.section key="banners" className="faction-selection faction-depth astral-portal-grid" aria-labelledby="horizon-title" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.36,ease:[0.2,0,0,1]}}>
    <header className="horizon-intro astral-intro">
     <h1 id="horizon-title">Choose Your Realm</h1>
     <p>Inspect any sovereign standard below to summon its domain, or step directly into an unlocked empire.</p>
    </header>

    {/* LIVE IMPERIAL STAGE */}
    <section ref={stageRef} className={'horizon-stage '+(activeAvailable?'is-open':'is-sealed')+(activeIsRevolt?' is-revolt':'')} aria-label={'Featured realm: '+activeName} style={{'--stage-accent':ambientTint} as CSSProperties}>
     <div className="horizon-stage-backdrop" aria-hidden="true">
      <AnimatePresence mode="sync" initial={false}>
       <motion.div key={activeBackdrop} className="horizon-stage-media" initial={{opacity:0,scale:1.03}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.42,ease:[0.2,0,0,1]}}>
        <MediaImage src={activeBackdrop} alt="" fetchPriority="high"/>
       </motion.div>
      </AnimatePresence>
      <div className="horizon-stage-scrim"/>
     </div>

     <div className="horizon-stage-content">
      <div className="horizon-stage-identity">
       <div className="horizon-stage-emblem" aria-hidden="true">
        {activeFlag&&<MediaImage className="horizon-stage-flag" src={activeFlag} alt=""/>}
        {!activeAvailable&&<img className="horizon-stage-lock-overlay" src="/art/update210/chain-lock.webp" alt="" decoding="async"/>}
       </div>
       <div className="horizon-stage-copy">
        <p className="horizon-stage-constellation">{activeGroupObj?.name}</p>
        <h2>{activeName}</h2>
        {activeTagline&&<p className="horizon-stage-epithet">{activeTagline}</p>}
        {activeCapital&&activeCapital!=='Not recorded'&&<p className="horizon-stage-fact">Seat of rule · {activeCapital}</p>}
        {activeLore&&activeAvailable&&<p className="horizon-stage-excerpt">{activeLore}</p>}
        {!activeAvailable&&<p className="horizon-stage-seal-note"><Lock size={14} aria-hidden="true"/><span>{discovery.condition(activeId)}</span></p>}
        <div className="horizon-stage-actions">
         {activeAvailable?<button type="button" className="horizon-stage-enter" onClick={e=>enter(activeId,e.currentTarget)}><span>Enter {activeName}</span><ArrowUpRight size={17} aria-hidden="true"/></button>:<><a className="horizon-stage-enter is-chronicle" href="/chronicles" onClick={e=>openDestination(e,'reader')}><BookOpen size={17} aria-hidden="true"/><span>Read Chronicles to Unlock</span><ArrowUpRight size={16} aria-hidden="true"/></a><a className="horizon-stage-secondary" href="/achievements"><Trophy size={15} aria-hidden="true"/><span>Achievements</span></a></>}
        </div>
       </div>
      </div>

      <div className="horizon-stage-stepper" aria-label="Browse realms on stage">
       <button type="button" onClick={()=>stepRealm(-1)} aria-label="Previous realm"><ChevronLeft size={18} aria-hidden="true"/></button>
       <span className="horizon-stage-counter">{String(poolIndex+1).padStart(2,'0')} / {String(activePool.length).padStart(2,'0')}</span>
       <button type="button" onClick={()=>stepRealm(1)} aria-label="Next realm"><ChevronRight size={18} aria-hidden="true"/></button>
      </div>
     </div>
    </section>

    {/* CONSTELLATION FILTER BAR (5 Faction Groups) */}
    <nav className="horizon-chapters" role="tablist" aria-label="Faction constellations">
     {factionGroups.map((group,i)=><button type="button" role="tab" aria-selected={activeGroup===i} key={group.name} className={'horizon-tab '+(activeGroup===i?'is-active':'')} onClick={()=>selectConstellation(i)}>
      <span>{group.name}</span>
      {activeGroup===i&&<motion.span layoutId="tfam-constellation-rail" className="horizon-tab-indicator" transition={{type:'spring',duration:.36,bounce:0}}/>}
     </button>)}
    </nav>

    {/* HYBRID ASYMMETRIC GALLERY */}
    {visibleGroups.map(({group,index:i})=>{
     const isRevolt=group.name==='The Unscored Revolt';
     return <section className={'faction-group astral-constellation '+(isRevolt?'revolt-group':'')} id={'horizon-group-'+i} key={group.name} aria-labelledby={'group-title-'+i}>
      <header className="faction-group-heading">
       <span aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
       <h2 id={'group-title-'+i}>{group.name}</h2>
       <span className="group-rule" aria-hidden="true"/>
       <span className="group-count">{group.ids.length} realms</span>
      </header>
      <div className="faction-card-grid">{group.ids.map(id=>{
       const f=findRecord(id);
       if(!f)return null;
       const available=discovery.canExplore(id);
       const src=revoltSlots.find(s=>s.id===id)?.flag_asset||flags[id]||f.flag_asset;
       const name=id==='england_ruins'?'Remnants of England':f.name_en;
       const tagline=factionSelectionTagline(f);
       const cardBackdrop=available?resolveStageBackdrop(id,f):'';
       const focused=activeId===id;
       return <button
        type="button"
        className={'faction-card astral-monolith '+(available?'is-unlocked':'is-locked')+(focused?' is-focused':'')}
        data-faction-id={id}
        key={id}
        aria-pressed={focused}
        aria-label={name+'. '+(available?'Enter realm':'Preview locked realm. '+discovery.condition(id))}
        onMouseEnter={()=>focusRealm(id)}
        onFocus={()=>focusRealm(id)}
        onPointerMove={trackPlaque}
        onPointerLeave={clearTilt}
        onPointerCancel={clearTilt}
        onClick={e=>enter(id,e.currentTarget)}
        style={{'--banner-ink':isRevolt?'#c3a0e5':f.ui_color_primary||'#c3a074'} as CSSProperties}
       >
        {available&&cardBackdrop&&<span className="faction-card-art" aria-hidden="true"><MediaImage src={cardBackdrop} alt="" loading="lazy"/></span>}
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
        <span className="faction-card-body">
         <strong>{name}</strong>
         {tagline&&<span className="faction-subtitle">{tagline}</span>}
         <span className="faction-card-condition">{available?<><span>Enter realm</span><ArrowUpRight size={15} aria-hidden="true"/></>:<span>{discovery.condition(id)}</span>}</span>
        </span>
       </button>;
      })}</div>
     </section>;
    })}
    {notice&&<div className="horizon-lock-notice" role="status" key={notice}>{notice}</div>}
   </motion.section>}
  </AnimatePresence>
 </div></MotionConfig>;
}
