'use client';
import {useEffect,useId,useMemo,useRef,useState,type MouseEvent} from 'react';
import {ArrowUpRight,BookOpen,ChevronRight,Compass,MapPin,Shield,Sparkles} from 'lucide-react';
import {canonicalCharacterArtwork,canonicalCharacterRole,canonicalCharacters} from '../../lib/canonical-characters';
import {courtGroup} from '../../lib/character-attributes';
import {landmarkArtwork} from '../../lib/artwork-presentation';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import {factionTaglines} from '../../lib/faction-taglines';
import {sceneArt} from '../../lib/faction-scene';
import featuredMilitary from '../../lib/featured-military.json';
import {traitArtwork} from '../../lib/trait-art';
import {unitIllustration} from '../../lib/unit-art';
import MediaImage from './MediaImage';
import OverviewAtmosphere from './OverviewAtmosphere';
import '../overview-empire.css';

type R=Record<string,any>;
type Props={
 faction:R;
 characters:R[];
 units:R[];
 onCharacter:(c:R)=>void;
 onUnit:(u:R)=>void;
 onDestination:(s:string)=>void;
 onMilitaryUnit:(s:string)=>void;
 onLandmark?:(s:string)=>void;
};

const local=(record:R,key:string)=>presentationPunctuation(record[key+'_en']||record[key]||(key==='name'?record.name_native:'')||'');
const roman=['I','II','III','IV','V','VI'];
const monumentCache=new Map<string,R[]>();

/**
 * TFAM v250 Headerless Full-Viewport Cinematic Scroll Experience:
 * Each full-screen Act immerses the visitor in one facet of the faction's world
 * with zero cluttered top headers and direct deep-dive buttons into every module.
 */
export default function FactionOverview({faction:f,characters,units,onCharacter,onUnit,onDestination,onMilitaryUnit,onLandmark}:Props){
 const [places,setPlaces]=useState<R[]>([]),[placeState,setPlaceState]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0),[forceIndex,setForceIndex]=useState(0);
 const forceTabs=useRef<(HTMLButtonElement|null)[]>([]),sectionId=useId();

 const featured=(featuredMilitary as Record<string,R[]>)[f.id];
 const forces=(featured?.length?featured:units).slice(0,3);
 const activeIndex=Math.min(forceIndex,Math.max(0,forces.length-1));
 const activeForce=forces[activeIndex];

 // Strictly unified with CharacterShowcase; show Sovereign + top 3 entourage (never dump 31 cards on Overview!)
 const people=useMemo(()=>canonicalCharacters(characters),[characters]);
 const sovereign=people.find(c=>courtGroup(c)==='crown')||people[0];
 const entourage=people.filter(c=>c!==sovereign).slice(0,3);
 const sovereignArt=canonicalCharacterArtwork(sovereign);

 const lore=presentationPunctuation(f.lore_en_1715||f.lore_en||'');
 const written=lore&&!/^placeholder/i.test(lore);
 const paragraphs=written?lore.split(/\n\s*\n/):[];
 const heroBackdrop=f.id==='castilian_empire'?'/overview223/castilian-arrival.webp':sceneArt(f);
 const quoteLine=f.id==='castilian_empire'?'An empire forged in war. A crown tested by winter.':f.id==='sultanate_of_morocco'?'Between the Atlas and the sea, a caliphate endures the frost.':factionTaglines[f.id]?.en||'';

 useEffect(()=>{setForceIndex(0);},[f.id]);

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

 function openPlace(id:string){if(onLandmark)onLandmark(id);else onDestination('monuments');}
 function changeForce(index:number,focus=false){setForceIndex(index);if(focus)forceTabs.current[index]?.focus();}
 function trackSpotlight(event:MouseEvent<HTMLElement>){
  const rect=event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx',((event.clientX-rect.left)/Math.max(1,rect.width)*100).toFixed(1)+'%');
  event.currentTarget.style.setProperty('--my',((event.clientY-rect.top)/Math.max(1,rect.height)*100).toFixed(1)+'%');
 }

 return <div className="faction-overview empire-overview empire-v250-cinematic" data-faction={f.id}>
  <div className="empire-atmosphere-layer" aria-hidden="true">
   <OverviewAtmosphere factionId={f.id}/>
   <div className="empire-velvet-vignette"/>
  </div>

  <header className="faction-arrival" aria-labelledby={sectionId+'-arrival-title'}>
   <div className="faction-arrival-arch">
    <div className="faction-arrival-window">
     <MediaImage className="faction-arrival-scene" src={heroBackdrop} alt="" width={1920} height={1080} fetchPriority="high"/>
     <div className="faction-arrival-identity">
      {f.flag_asset&&<MediaImage className="faction-arrival-flag" src={f.flag_asset} width={320} height={220} alt="" style={{viewTransitionName:'tfam-faction-banner'}}/>}
      <h1 id={sectionId+'-arrival-title'}>{presentationPunctuation(f.name_en||f.name_native||'')}</h1>
      {quoteLine&&<p>{presentationPunctuation(quoteLine)}</p>}
     </div>
    </div>
    <div className="faction-arrival-fasteners" aria-hidden="true">
     <span/><span/><span/><span/><span/><span/><span/><span/><span/>
    </div>
   </div>
  </header>

  {/* ACT II: LORE & IMPERIAL TRAITS */}
  <section id={sectionId+'-doctrine'} data-act="doctrine" className="v250-act empire-identity" aria-labelledby={sectionId+'-identity-title'}>
   <div className="empire-section-intro">
    <h2 id={sectionId+'-identity-title'}>Lore &amp; imperial<br/>doctrine.</h2>
    {written&&<p className="empire-intro-note v250-lore-lead">{paragraphs[0]}</p>}
    {written&&paragraphs.length>1&&<details className="empire-history-folio v250-inline-chronicle">
     <summary>Unseal full imperial chronicle ({paragraphs.length-1} more passages) <ChevronRight size={17} aria-hidden="true"/></summary>
     <div className="v250-chronicle-body">{paragraphs.slice(1).map((p,idx)=><p key={idx}>{p}</p>)}</div>
    </details>}
    <button className="empire-text-link empire-action-gilded" onClick={()=>onDestination('atlas')}><Compass size={16} aria-hidden="true"/> Open interactive atlas <ArrowUpRight size={17} aria-hidden="true"/></button>
   </div>
   <div className="empire-traits">
    {(f.traits||[]).map((trait:R,index:number)=><article key={trait.id||index} className="empire-trait-folio" onMouseMove={trackSpotlight}>
     <span className="empire-trait-roman" aria-hidden="true">{roman[index]||String(index+1)}</span>
     <div className="empire-trait-emblem"><MediaImage src={traitArtwork(trait,index)} alt="" width={100} height={120} loading="lazy"/></div>
     <div className="empire-trait-copy"><h3>{local(trait,'label')}</h3><p>{local(trait,'effect')||presentationPunctuation(trait.effect_ui||'Record pending.')}</p></div>
    </article>)}
    {!f.traits?.length&&<p className="empire-empty-state">Faction traits are being prepared.</p>}
   </div>
  </section>

  {/* ACT III: THE COURT (UNIFIED WITH CHARACTER SHOWCASE, SOVEREIGN + TOP 3 ONLY) */}
  <section id={sectionId+'-court'} data-act="court" className={'v250-act empire-court '+(!sovereign?'empire-court-without-crown':'')} aria-labelledby={sectionId+'-court-title'}>
   {sovereign&&<button className="empire-sovereign" onClick={()=>onCharacter(sovereign)} onMouseMove={trackSpotlight} aria-label={'Open '+local(sovereign,'name')}>
    <div className="empire-sovereign-halo" aria-hidden="true"/>
    {sovereignArt?<MediaImage src={sovereignArt} alt={local(sovereign,'name')} width={900} height={1200} loading="eager"/>:<div className="empire-portrait-pending">Portrait forthcoming</div>}
    <span className="empire-sovereign-plate">
     <small className="empire-sovereign-tag"><Sparkles size={13} aria-hidden="true"/> Sovereign Figure</small>
     <strong>{local(sovereign,'name')}</strong>
     <span>{canonicalCharacterRole(sovereign)}</span>
     <span className="empire-text-link">Enter private salon <ArrowUpRight size={17} aria-hidden="true"/></span>
    </span>
   </button>}
   <div className="empire-court-copy">
    <h2 id={sectionId+'-court-title'}>{sovereign?'The Crown.\nIts inner circle.':'Figures of the realm.'}</h2>
    <p className="empire-intro-note">Commanders, confidantes, and royal retainers whose private loyalties bend the fate of the realm.</p>
    <button className="empire-text-link empire-action-gilded" onClick={()=>onDestination('characters')}>Explore all {people.length} characters <ArrowUpRight size={17} aria-hidden="true"/></button>
    <div className="empire-entourage">{entourage.map(person=>{
     const artSrc=canonicalCharacterArtwork(person);
     return <button key={person.id} className="empire-entourage-card" onClick={()=>onCharacter(person)} onMouseMove={trackSpotlight}>
      <div className="empire-entourage-frame">{artSrc?<MediaImage src={artSrc} alt={local(person,'name')} width={400} height={600} loading="lazy"/>:<div className="empire-portrait-pending">Portrait forthcoming</div>}</div>
      <span><small>{canonicalCharacterRole(person)}</small><strong>{local(person,'name')}</strong><ArrowUpRight size={16} aria-hidden="true"/></span>
     </button>;
    })}</div>
   </div>
  </section>

  {/* ACT IV: LOCATIONS & INTERACTIVE ATLAS */}
  <section id={sectionId+'-realm'} data-act="realm" className="v250-act empire-places" aria-labelledby={sectionId+'-places-title'}>
   <header className="empire-section-heading">
    <div><h2 id={sectionId+'-places-title'}>Locations &amp; imperial<br/>landmarks.</h2></div>
    <div className="v250-act-cta-pair">
     <button className="empire-text-link empire-action-gilded" onClick={()=>onDestination('atlas')}><Compass size={16} aria-hidden="true"/> Interactive Atlas <ArrowUpRight size={17} aria-hidden="true"/></button>
     <button className="empire-text-link empire-action-gilded" onClick={()=>onDestination('monuments')}>All landmarks <ArrowUpRight size={17} aria-hidden="true"/></button>
    </div>
   </header>
   {placeState==='loading'?<div className="empire-place-notice" role="status">Opening the gazetteer...</div>:placeState==='error'?<div className="empire-place-notice" role="alert"><p>The landmark collection could not be loaded.</p><button className="empire-text-link" onClick={()=>setRetry(n=>n+1)}>Try again <ChevronRight size={18}/></button></div>:places.length?<div className="empire-place-composition">{places.map((place,index)=><button className={'empire-place '+(index===0?'empire-place-lead':'')} key={place.id} onClick={()=>openPlace(place.id)} onMouseMove={trackSpotlight} aria-label={'Explore '+local(place,'name')}><MediaImage src={landmarkArtwork(place,true)} alt={local(place,'name')} width={index===0?1600:1000} height={index===0?1200:600} loading={index===0?'eager':'lazy'}/><div className="empire-place-frame" aria-hidden="true"/><div className="empire-place-caption"><span className="empire-place-loc"><MapPin size={14} aria-hidden="true"/>{local(place,'location')}</span><h3>{local(place,'name')}</h3>{index===0&&<p>{local(place,'epithet')}</p>}<span className="empire-place-open">Inspect landmark dossier <ArrowUpRight size={17} aria-hidden="true"/></span></div></button>)}</div>:<p className="empire-place-notice">Landmark records are being prepared.</p>}
  </section>

  {/* ACT V: ORDER OF BATTLE (MILITARY) */}
  <section id={sectionId+'-forces'} data-act="forces" className="v250-act empire-military" aria-labelledby={sectionId+'-military-title'}>
   <header className="empire-section-heading">
    <div><h2 id={sectionId+'-military-title'}>Under the banner.</h2></div>
    <button className="empire-text-link empire-action-gilded" onClick={()=>onDestination('military')}><Shield size={16} aria-hidden="true"/> Inspect full military roster <ArrowUpRight size={17} aria-hidden="true"/></button>
   </header>
   {activeForce?<div className="empire-war-table">
    <div className="empire-force-tabs" role="tablist" aria-label="Featured military units">{forces.map((force,index)=><button ref={element=>{forceTabs.current[index]=element;}} key={force.id} id={sectionId+'-unit-tab-'+index} role="tab" aria-selected={index===activeIndex} aria-controls={sectionId+'-unit-panel'} tabIndex={index===activeIndex?0:-1} onClick={()=>changeForce(index)} onKeyDown={event=>{let target:number|undefined;if(event.key==='ArrowRight')target=(index+1)%forces.length;if(event.key==='ArrowLeft')target=(index-1+forces.length)%forces.length;if(event.key==='Home')target=0;if(event.key==='End')target=forces.length-1;if(target!==undefined){event.preventDefault();changeForce(target,true);}}}><span className="empire-tab-index">0{index+1}</span><span>{local(force,'name')}</span></button>)}</div>
    <div className="empire-force-stage" role="tabpanel" id={sectionId+'-unit-panel'} aria-labelledby={sectionId+'-unit-tab-'+activeIndex} tabIndex={0} data-branch={activeForce.branch}>
     <div className="empire-force-art" key={activeForce.id}><MediaImage src={activeForce.artwork||activeForce.thumbnail||unitIllustration(f.id,activeForce.image_asset)} alt={local(activeForce,'name')} width={1400} height={1000} loading="eager"/></div>
     <div className="empire-force-copy">
      <span className="empire-force-branch">{activeForce.branch||'Imperial Regiments'}</span>
      <h3>{local(activeForce,'name')}</h3>
      {local(activeForce,'class')&&<p className="empire-force-class">{local(activeForce,'class')}</p>}
      <p>{local(activeForce,'role')}</p>
      <button className="empire-text-link empire-action-gilded" onClick={()=>featured?.length?onMilitaryUnit(activeForce.id):onUnit(activeForce)}>Inspect unit dossier <ArrowUpRight size={17} aria-hidden="true"/></button>
     </div>
    </div>
   </div>:<p className="empire-empty-state">Unit dossiers are being prepared.</p>}
  </section>
 </div>;
}
