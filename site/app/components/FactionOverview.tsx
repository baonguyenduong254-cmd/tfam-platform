'use client';
import {AnimatePresence,MotionConfig,motion} from 'motion/react';
import {useEffect,useId,useMemo,useRef,useState,type MouseEvent} from 'react';
import {ArrowUpRight,ChevronRight} from 'lucide-react';
import {canonicalCharacterArtwork,canonicalCharacterRole,canonicalCharacters} from '../../lib/canonical-characters';
import {courtGroup} from '../../lib/character-attributes';
import {landmarkArtwork} from '../../lib/artwork-presentation';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import {factionTaglines} from '../../lib/faction-taglines';
import {sceneArt} from '../../lib/faction-scene';
import {playBrassClick} from '../../lib/tactile-sfx';
import featuredMilitary from '../../lib/featured-military.json';
import {traitArtwork} from '../../lib/trait-art';
import {unitIllustration} from '../../lib/unit-art';
import {militaryCutout} from '../../lib/military-cutouts';
import {rosterIconPath} from './CharacterRosterIcon';
import MediaImage from './MediaImage';
import '../overview-empire.css';

type R=Record<string,any>;
type Props={
 faction:R;
 year?:string;
 regions?:number;
 characters:R[];
 units:R[];
 onReturn?:()=>void;
 onCharacter:(c:R)=>void;
 onUnit:(u:R)=>void;
 onDestination:(s:string)=>void;
 onMilitaryUnit:(s:string)=>void;
 onLandmark?:(s:string)=>void;
};

const local=(record:R,key:string)=>presentationPunctuation(record[key+'_en']||record[key]||(key==='name'?record.name_native:'')||'');
const monumentCache=new Map<string,R[]>();
const SCREEN_LABELS=['Empire','Doctrine','Court','Landmarks','Forces'] as const;
// Populated only with author-approved splash arts (e.g. ChatGPT painterly scenes)
const UNIT_SPLASH_ART:Record<string,string>={};

/**
 * TFAM v256 Pure Full-Screen Scrollytelling Overview:
 * Five edge-to-edge 100svh full-bleed canvases with zero top chrome, zero filler metadata,
 * and whisper-minimal typography letting artwork and characters command the frame.
 */
export default function FactionOverview({faction:f,characters,units,onCharacter,onUnit,onDestination,onMilitaryUnit,onLandmark}:Props){
 const [places,setPlaces]=useState<R[]>([]),[placeState,setPlaceState]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0);
 const [forceIndex,setForceIndex]=useState(0),[placeIndex,setPlaceIndex]=useState(0),[courtIndex,setCourtIndex]=useState(0),[activeScreen,setActiveScreen]=useState(0);
 const screenRefs=useRef<(HTMLElement|null)[]>([]),forceTabs=useRef<(HTMLButtonElement|null)[]>([]),sectionId=useId();

 const featured=(featuredMilitary as Record<string,R[]>)[f.id];
 const forces=(featured?.length?featured:units).slice(0,3);
 const activeForceIndex=Math.min(forceIndex,Math.max(0,forces.length-1));
 const activeForce=forces[activeForceIndex];

 const people=useMemo(()=>canonicalCharacters(characters),[characters]);
 const sovereign=people.find(c=>courtGroup(c)==='crown')||people[0];
 const courtRoster=useMemo(()=>{
  return sovereign?[sovereign,...people.filter(c=>c!==sovereign).slice(0,3)]:people.slice(0,4);
 },[people,sovereign]);
 const activeCourtIndex=Math.min(courtIndex,Math.max(0,courtRoster.length-1));
 const activePerson=courtRoster[activeCourtIndex];
 const activeIsSovereign=!!sovereign&&activePerson===sovereign;

 const activePlaceIndex=Math.min(placeIndex,Math.max(0,places.length-1));
 const activePlace=places[activePlaceIndex];

 const lore=presentationPunctuation(f.lore_en_1715||f.lore_en||'');
 const written=lore&&!/^placeholder/i.test(lore);
 const paragraphs=written?lore.split(/\n\s*\n/):[];
 const quoteLine=f.id==='castilian_empire'?'An empire forged in war. A crown tested by winter.':f.id==='sultanate_of_morocco'?'Between the Atlas and the sea, a caliphate endures the frost.':factionTaglines[f.id]?.en||'';
 const factionName=presentationPunctuation(f.name_en||f.name_native||'');

 // Five distinct full-bleed backdrops (one per full-viewport screen)
 const arrivalBackdrop=f.id==='castilian_empire'?'/overview223/castilian-arrival.webp':sceneArt(f);
 const doctrineBackdrop=f.id==='castilian_empire'?'/imperial/castilian.webp':(places[1]?landmarkArtwork(places[1],true):sceneArt(f));
 const courtBackdrop='/overview223/imperial-court.webp';
 const landmarkBackdrop=activePlace?landmarkArtwork(activePlace,true):(f.id==='castilian_empire'?'/overview223/castilian-madrid.webp':sceneArt(f));
 const forcesBackdrop='/overview223/imperial-forces.webp';
 const activeForceSplash=activeForce?UNIT_SPLASH_ART[activeForce.id]||'':'';

 useEffect(()=>{
  setForceIndex(0);
  setPlaceIndex(0);
  setCourtIndex(0);
  setActiveScreen(0);
 },[f.id]);

 useEffect(()=>{
  const controller=new AbortController();let alive=true;setPlaces([]);setPlaceState('loading');
  (async()=>{
   const response=await fetch('/monuments/manifest.json',{signal:controller.signal,cache:'no-cache'});if(!response.ok)throw Error('manifest');
   const manifest=await response.json() as R,entry=manifest.factions.find((row:R)=>row.id===f.id);
   if(!entry){if(alive)setPlaceState('ready');return;}
   const key=manifest.version+f.id;let records=monumentCache.get(key);
   if(!records){const r=await fetch(entry.url+'?v='+manifest.version,{signal:controller.signal});if(!r.ok)throw Error('places');records=await r.json() as R[];monumentCache.set(key,records);}
   if(alive){setPlaces(records.slice(0,3));setPlaceState('ready');}
  })().catch(error=>{if(alive&&error.name!=='AbortError')setPlaceState('error');});
  return()=>{alive=false;controller.abort();};
 },[f.id,retry]);

 useEffect(()=>{
  if(typeof IntersectionObserver!=='function')return;
  const observer=new IntersectionObserver(entries=>{
   let bestIndex=-1,bestRatio=0;
   for(const entry of entries){
    if(entry.isIntersecting&&entry.intersectionRatio>bestRatio){
     const idx=Number((entry.target as HTMLElement).dataset.screenIndex);
     if(!Number.isNaN(idx)){bestRatio=entry.intersectionRatio;bestIndex=idx;}
    }
   }
   if(bestIndex>=0)setActiveScreen(bestIndex);
  },{threshold:[0.35,0.6]});
  screenRefs.current.forEach(el=>{if(el)observer.observe(el);});
  return()=>observer.disconnect();
 },[f.id]);

 function scrollToScreen(index:number){
  playBrassClick();
  const target=screenRefs.current[index];
  if(!target)return;
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
 }
 function openPlace(id:string){playBrassClick();if(onLandmark)onLandmark(id);else onDestination('monuments');}
 function changeForce(index:number,focus=false){if(index!==forceIndex)playBrassClick();setForceIndex(index);if(focus)forceTabs.current[index]?.focus();}
 function trackSpotlight(event:MouseEvent<HTMLElement>){
  if(typeof matchMedia==='function'&&!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  const rect=event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx',((event.clientX-rect.left)/Math.max(1,rect.width)*100).toFixed(1)+'%');
  event.currentTarget.style.setProperty('--my',((event.clientY-rect.top)/Math.max(1,rect.height)*100).toFixed(1)+'%');
 }

 return <MotionConfig reducedMotion="user"><div className="faction-overview empire-overview empire-v255-screens" data-faction={f.id}>
  {/* QUIET RIGHT-EDGE PROGRESS PIPS (Desktop only, pure minimal diamonds) */}
  <nav className="screen-chapter-rail" aria-label="Overview chapters">
   {SCREEN_LABELS.map((label,idx)=><button type="button" key={label} className={'screen-rail-dot '+(activeScreen===idx?'is-active':'')} aria-current={activeScreen===idx?'step':undefined} aria-label={label} title={label} onClick={()=>scrollToScreen(idx)}>
    <span className="screen-rail-pip" aria-hidden="true"/>
   </button>)}
  </nav>

  {/* =====================================================================
      SCREEN 1 (100svh): ARRIVAL — PURE FULL-BLEED PANORAMA
     ===================================================================== */}
  <header ref={el=>{screenRefs.current[0]=el;}} data-screen-index={0} className="story-screen screen-arrival" aria-labelledby={sectionId+'-arrival-title'}>
   <div className="screen-bg" aria-hidden="true">
    <MediaImage className="screen-bg-img is-hero" src={arrivalBackdrop} alt="" width={1920} height={1080} fetchPriority="high"/>
    <div className="screen-scrim scrim-arrival"/>
   </div>
   <div className="screen-inner screen-arrival-inner">
    <div className="screen-arrival-lockup">
     {f.flag_asset&&<div className="screen-flag-wrap">
      <MediaImage className="screen-flag" src={f.flag_asset} width={320} height={220} alt="" style={{viewTransitionName:'tfam-faction-banner'}}/>
     </div>}
     <div className="screen-arrival-copy">
      <h1 id={sectionId+'-arrival-title'}>{factionName}</h1>
      {quoteLine&&<p className="screen-arrival-quote">{presentationPunctuation(quoteLine)}</p>}
     </div>
    </div>
    <button type="button" className="screen-scroll-hairline" aria-label="Scroll to next section" onClick={()=>scrollToScreen(1)}/>
   </div>
  </header>

  {/* =====================================================================
      SCREEN 2 (100svh): DOCTRINE & LORE
     ===================================================================== */}
  <section ref={el=>{screenRefs.current[1]=el;}} data-screen-index={1} id={sectionId+'-doctrine'} className="story-screen screen-doctrine" aria-labelledby={sectionId+'-identity-title'}>
   <div className="screen-bg" aria-hidden="true">
    <MediaImage className="screen-bg-img is-doctrine" src={doctrineBackdrop} alt="" width={1920} height={1080} loading="lazy"/>
    <div className="screen-scrim scrim-doctrine"/>
   </div>
   <div className="screen-inner screen-doctrine-inner">
    <div className="screen-doctrine-intro">
     <h2 id={sectionId+'-identity-title'}>Lore &amp; Imperial<br/>Doctrine</h2>
     {written&&<p className="screen-lead">{paragraphs[0]}</p>}
     {written&&paragraphs.length>1&&<details className="screen-chronicle">
      <summary><span>Read full chronicle</span><ChevronRight size={15} aria-hidden="true"/></summary>
      <div className="screen-chronicle-body">{paragraphs.slice(1).map((p,idx)=><p key={idx}>{p}</p>)}</div>
     </details>}
    </div>
    <div className="screen-traits">
     {(f.traits||[]).map((trait:R,index:number)=><article key={trait.id||index} className="screen-trait-card" onMouseMove={trackSpotlight}>
      <div className="screen-trait-icon"><MediaImage src={traitArtwork(trait,index)} alt="" width={100} height={120} loading="lazy"/></div>
      <div className="screen-trait-copy">
       <h3>{local(trait,'label')}</h3>
       <p>{local(trait,'effect')||presentationPunctuation(trait.effect_ui||'Record pending.')}</p>
      </div>
     </article>)}
     {!f.traits?.length&&<p className="screen-empty">Faction traits are being prepared.</p>}
    </div>
   </div>
  </section>

  {/* =====================================================================
      SCREEN 3 (100svh): THE COURT — TRUE 2-COLUMN THRONE HALL STAGE
     ===================================================================== */}
  <section ref={el=>{screenRefs.current[2]=el;}} data-screen-index={2} id={sectionId+'-court'} className="story-screen screen-court" aria-labelledby={sectionId+'-court-title'}>
   <div className="screen-bg" aria-hidden="true">
    <MediaImage className="screen-bg-img is-throne" src={courtBackdrop} alt="" width={1920} height={1080} loading="lazy"/>
    <div className="screen-scrim scrim-court"/>
   </div>

   <div className="screen-inner screen-court-inner">
    <div className="screen-court-copy">
     {activePerson?<div className="screen-court-spotlight">
      <h2 id={sectionId+'-court-title'}>{local(activePerson,'name')}</h2>
      <p className="screen-person-role">{canonicalCharacterRole(activePerson)}</p>
      <div className="screen-link-row">
       <button type="button" className="screen-link is-primary" onClick={()=>{playBrassClick();onCharacter(activePerson);}}>
        <span>{activeIsSovereign?'Enter private salon':'Open dossier'}</span>
        <ArrowUpRight size={15} aria-hidden="true"/>
       </button>
       <button type="button" className="screen-link" onClick={()=>{playBrassClick();onDestination('characters');}}>
        <span>All characters</span>
        <ArrowUpRight size={15} aria-hidden="true"/>
       </button>
      </div>
     </div>:<h2 id={sectionId+'-court-title'}>Figures of the Realm</h2>}

     {courtRoster.length>1&&<div className="screen-court-roster" role="tablist" aria-label="Featured figures of the court">
      {courtRoster.map((person,idx)=>{
       const art=rosterIconPath(person.id)||canonicalCharacterArtwork(person);
       const active=idx===activeCourtIndex;
       return <button type="button" key={person.id} role="tab" aria-selected={active} className={'screen-roster-chip '+(active?'is-active':'')} onClick={()=>{if(idx!==courtIndex)playBrassClick();setCourtIndex(idx);}}>
        <span className="screen-roster-thumb">{art&&<MediaImage src={art} alt="" width={160} height={160} loading="lazy"/>}</span>
        <strong>{local(person,'name')}</strong>
       </button>;
      })}
     </div>}
    </div>

    {courtRoster.length>0&&<div className="screen-court-figure" aria-hidden="true">
     <div className="screen-court-aura"/>
     {courtRoster.map((person,idx)=>{
      const art=canonicalCharacterArtwork(person);
      const active=idx===activeCourtIndex;
      return <div key={person.id} className={'screen-court-portrait '+(active?'is-active':'')}>
       {art?<MediaImage src={art} alt="" width={900} height={1200} loading={idx===0?'eager':'lazy'}/>:<div className="screen-portrait-empty">Portrait forthcoming</div>}
      </div>;
     })}
    </div>}
   </div>
  </section>

  {/* =====================================================================
      SCREEN 4 (100svh): IMPERIAL LANDMARKS — PURE FULL-SCREEN VISTA
     ===================================================================== */}
  <section ref={el=>{screenRefs.current[3]=el;}} data-screen-index={3} id={sectionId+'-realm'} className="story-screen screen-landmarks" aria-labelledby={sectionId+'-places-title'}>
   <div className="screen-bg" aria-hidden="true">
    <AnimatePresence mode="sync" initial={false}>
     <motion.div key={landmarkBackdrop} className="screen-bg-crossfade" initial={{opacity:0,scale:1.03}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.55,ease:[0.2,0,0,1]}}>
      <MediaImage className="screen-bg-img is-landmark" src={landmarkBackdrop} alt="" width={1920} height={1080} loading="eager"/>
     </motion.div>
    </AnimatePresence>
    <div className="screen-scrim scrim-landmarks"/>
   </div>

   <div className="screen-inner screen-landmarks-inner">
    {placeState==='loading'?<div className="screen-place-state" role="status">Opening the gazetteer…</div>:placeState==='error'?<div className="screen-place-state" role="alert"><p>The landmark collection could not be loaded.</p><button type="button" className="screen-link is-primary" onClick={()=>setRetry(n=>n+1)}><span>Try again</span><ChevronRight size={15}/></button></div>:activePlace?<div className="screen-landmarks-stage">
     <div className="screen-landmark-copy">
      <h2 id={sectionId+'-places-title'}>{local(activePlace,'name')}</h2>
      {local(activePlace,'epithet')&&<p className="screen-landmark-epithet">{local(activePlace,'epithet')}</p>}
      <div className="screen-link-row">
       <button type="button" className="screen-link is-primary" onClick={()=>openPlace(activePlace.id)}>
        <span>Inspect landmark</span><ArrowUpRight size={15} aria-hidden="true"/>
       </button>
       <button type="button" className="screen-link" onClick={()=>{playBrassClick();onDestination('monuments');}}>
        <span>All landmarks</span><ArrowUpRight size={15} aria-hidden="true"/>
       </button>
      </div>
     </div>

     <div className="screen-landmark-switcher" role="tablist" aria-label="Select featured landmark">
      {places.map((place,idx)=>{
       const active=idx===activePlaceIndex;
       return <button type="button" key={place.id} role="tab" aria-selected={active} className={'screen-landmark-pill '+(active?'is-active':'')} onClick={()=>{if(idx!==placeIndex)playBrassClick();setPlaceIndex(idx);}}>
        <span className="screen-landmark-thumb"><MediaImage src={landmarkArtwork(place,true)} alt="" width={320} height={200} loading="lazy"/></span>
        <strong>{local(place,'name')}</strong>
       </button>;
      })}
     </div>
    </div>:<p className="screen-empty">Landmark records are being prepared.</p>}
   </div>
  </section>

  {/* =====================================================================
      SCREEN 5 (100svh): ORDER OF BATTLE — FULL-SCREEN GAMING SPLASH STAGE
     ===================================================================== */}
  <section ref={el=>{screenRefs.current[4]=el;}} data-screen-index={4} id={sectionId+'-forces'} className={'story-screen screen-forces '+(activeForceSplash?'is-splash-stage':'')} aria-labelledby={sectionId+'-military-title'}>
   <div className="screen-bg" aria-hidden="true">
    {activeForceSplash?<AnimatePresence mode="sync" initial={false}>
     <motion.div key={activeForceSplash} className="screen-bg-crossfade" initial={{opacity:0,scale:1.03}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.55,ease:[0.2,0,0,1]}}>
      <MediaImage className="screen-bg-img is-splash" src={activeForceSplash} alt="" width={1920} height={1080} loading="eager"/>
     </motion.div>
    </AnimatePresence>:<MediaImage className="screen-bg-img is-forces" src={forcesBackdrop} alt="" width={1920} height={1080} loading="lazy"/>}
    <div className={'screen-scrim '+(activeForceSplash?'scrim-splash':'scrim-forces')}/>
   </div>

   {activeForceSplash&&activeForce?<div className="screen-inner screen-splash-inner">
    <div className="screen-landmarks-stage">
     <div className="screen-landmark-copy" role="tabpanel" id={sectionId+'-unit-panel'} aria-labelledby={sectionId+'-unit-tab-'+activeForceIndex}>
      <h2 id={sectionId+'-military-title'}>{local(activeForce,'name')}</h2>
      <p className="screen-force-role">{local(activeForce,'role')}</p>
      <div className="screen-link-row">
       <button type="button" className="screen-link is-primary" onClick={()=>{playBrassClick();if(featured?.length)onMilitaryUnit(activeForce.id);else onUnit(activeForce);}}>
        <span>Inspect unit</span><ArrowUpRight size={15} aria-hidden="true"/>
       </button>
       <button type="button" className="screen-link" onClick={()=>{playBrassClick();onDestination('military');}}>
        <span>Full roster</span><ArrowUpRight size={15} aria-hidden="true"/>
       </button>
      </div>
     </div>

     <div className="screen-landmark-switcher" role="tablist" aria-label="Featured military units">
      {forces.map((force,index)=>{
       const active=index===activeForceIndex;
       const thumb=UNIT_SPLASH_ART[force.id]||force.thumbnail||force.artwork||unitIllustration(f.id,force.image_asset);
       return <button type="button" ref={element=>{forceTabs.current[index]=element;}} key={force.id} id={sectionId+'-unit-tab-'+index} role="tab" aria-selected={active} aria-controls={sectionId+'-unit-panel'} tabIndex={active?0:-1} className={'screen-landmark-pill '+(active?'is-active':'')} onClick={()=>changeForce(index)} onKeyDown={event=>{let target:number|undefined;if(event.key==='ArrowRight'||event.key==='ArrowDown')target=(index+1)%forces.length;if(event.key==='ArrowLeft'||event.key==='ArrowUp')target=(index-1+forces.length)%forces.length;if(event.key==='Home')target=0;if(event.key==='End')target=forces.length-1;if(target!==undefined){event.preventDefault();changeForce(target,true);}}}>
        <span className="screen-landmark-thumb"><MediaImage src={thumb} alt="" width={320} height={180} loading="lazy"/></span>
        <strong>{local(force,'name')}</strong>
       </button>;
      })}
     </div>
    </div>
   </div>:<div className="screen-inner screen-forces-inner screen-forces-v264">
    <div className="screen-forces-left">
     {activeForce?<div className="screen-force-copy" role="tabpanel" id={sectionId+'-unit-panel'} aria-labelledby={sectionId+'-unit-tab-'+activeForceIndex}>
      <span className="screen-force-kicker">
       Order of Battle{activeForce.branch?' · '+String(activeForce.branch):''}{activeForce.number?' · No. '+String(activeForce.number).padStart(2,'0'):''}
      </span>
      <h2 id={sectionId+'-military-title'}>{local(activeForce,'name')}</h2>
      {local(activeForce,'class')&&<p className="screen-force-class">{local(activeForce,'class')}</p>}
      <p className="screen-force-role">{local(activeForce,'role')}</p>
      {local(activeForce,'quote')&&<blockquote className="screen-force-quote">{local(activeForce,'quote')}</blockquote>}
      <div className="screen-link-row">
       <button type="button" className="screen-link is-primary" onClick={()=>{playBrassClick();if(featured?.length)onMilitaryUnit(activeForce.id);else onUnit(activeForce);}}>
        <span>Inspect unit</span><ArrowUpRight size={15} aria-hidden="true"/>
       </button>
       <button type="button" className="screen-link" onClick={()=>{playBrassClick();onDestination('military');}}>
        <span>Full roster</span><ArrowUpRight size={15} aria-hidden="true"/>
       </button>
      </div>
     </div>:<h2 id={sectionId+'-military-title'}>Under the Banner</h2>}

     {forces.length>0&&<div className="screen-landmark-switcher screen-force-switcher" role="tablist" aria-label="Featured military units">
      {forces.map((force,index)=>{
       const active=index===activeForceIndex;
       const thumb=force.thumbnail||force.artwork||unitIllustration(f.id,force.image_asset);
       return <button type="button" ref={element=>{forceTabs.current[index]=element;}} key={force.id} id={sectionId+'-unit-tab-'+index} role="tab" aria-selected={active} aria-controls={sectionId+'-unit-panel'} tabIndex={active?0:-1} className={'screen-landmark-pill screen-force-pill '+(active?'is-active':'')} data-branch={force.branch||'infantry'} onClick={()=>changeForce(index)} onKeyDown={event=>{let target:number|undefined;if(event.key==='ArrowRight'||event.key==='ArrowDown')target=(index+1)%forces.length;if(event.key==='ArrowLeft'||event.key==='ArrowUp')target=(index-1+forces.length)%forces.length;if(event.key==='Home')target=0;if(event.key==='End')target=forces.length-1;if(target!==undefined){event.preventDefault();changeForce(target,true);}}}>
        <span className="screen-landmark-thumb screen-force-thumb"><MediaImage src={thumb} alt="" width={240} height={180} loading="lazy"/></span>
        <span className="screen-force-pill-copy">
         <small>{force.branch?String(force.branch):'Regiment'}</small>
         <strong>{local(force,'name')}</strong>
        </span>
       </button>;
      })}
     </div>}
    </div>

    {activeForce&&(()=>{
     const cutoutSrc=militaryCutout(activeForce.id);
     if(cutoutSrc){
      return <div className="screen-forces-right">
       <div className="screen-force-cutout-stage" data-branch={activeForce.branch||'infantry'}>
        <div className="screen-force-cutout-aura" aria-hidden="true"/>
        <AnimatePresence mode="wait" initial={false}>
         <motion.div key={activeForce.id} className="screen-force-cutout-figure" initial={{opacity:0,scale:.95,y:14}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:1.02}} transition={{duration:.38,ease:[0.22,1,0.36,1]}}>
          <img src={cutoutSrc} alt={local(activeForce,'name')} width={1024} height={1536} loading="eager"/>
         </motion.div>
        </AnimatePresence>
       </div>
      </div>;
     }
     return <div className="screen-forces-right">
      <div className="screen-force-arch-shrine" data-branch={activeForce.branch||'infantry'}>
       <div className="screen-force-arch-halo" aria-hidden="true"/>
       <div className="screen-force-arch-frame">
        <div className="screen-force-arch-canvas">
         <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeForce.id} className="screen-force-art-arch" initial={{opacity:0,scale:.97,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:1.01}} transition={{duration:.36,ease:[0.22,1,0.36,1]}}>
           <MediaImage src={activeForce.artwork||activeForce.thumbnail||unitIllustration(f.id,activeForce.image_asset)} alt={local(activeForce,'name')} width={1200} height={1500} loading="eager"/>
          </motion.div>
         </AnimatePresence>
         <div className="screen-force-arch-vignette" aria-hidden="true"/>
        </div>
        <div className="screen-force-arch-plaque" aria-hidden="true">
         <span>{activeForce.number?'Plate '+String(activeForce.number).padStart(2,'0'):'Imperial Plate'}</span>
         <b>{activeForce.branch?String(activeForce.branch):'Regiment'}</b>
        </div>
       </div>
      </div>
     </div>;
    })()}
   </div>}
  </section>
 </div></MotionConfig>;
}
