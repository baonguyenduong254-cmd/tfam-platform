'use client';
import {useEffect,useId,useRef,useState,type MouseEvent} from 'react';
import {ArrowUpRight,BookOpen,ChevronRight,Compass,MapPin,Shield,Sparkles} from 'lucide-react';
import {characterArtwork} from '../../lib/character-artwork';
import {orderCharacters} from '../../lib/character-order';
import {courtGroup} from '../../lib/character-attributes';
import {landmarkArtwork} from '../../lib/artwork-presentation';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import featuredMilitary from '../../lib/featured-military.json';
import chroniclesArt from '../../lib/chronicle-art-display.json';
import {traitArtwork} from '../../lib/trait-art';
import {unitIllustration} from '../../lib/unit-art';
import MediaImage from './MediaImage';
import OverviewAtmosphere from './OverviewAtmosphere';
import '../overview-empire.css';

type R=Record<string,any>;
type Props={faction:R;year:string;characters:R[];units:R[];onCharacter:(c:R)=>void;onUnit:(u:R)=>void;onDestination:(s:string)=>void;onMilitaryUnit:(s:string)=>void;onLandmark?:(place:R,trigger:HTMLElement)=>void};
const local=(record:R,key:string)=>presentationPunctuation(record[key+'_en']||record[key]||(key==='name'?record.name_native:'')||'');
const roman=['I','II','III','IV','V','VI'];
const monumentCache=new Map<string,R[]>();

export default function FactionOverview({faction:f,year,characters,units,onCharacter,onUnit,onDestination,onMilitaryUnit,onLandmark}:Props){
 const [places,setPlaces]=useState<R[]>([]),[placeState,setPlaceState]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0),[forceIndex,setForceIndex]=useState(0);
 const [loadedForce,setLoadedForce]=useState<Record<string,boolean>>({});
 const forceTabs=useRef<(HTMLButtonElement|null)[]>([]),sectionId=useId();
 const featured=(featuredMilitary as Record<string,R[]>)[f.id],forces=(featured?.length?featured:units).slice(0,3),activeIndex=Math.min(forceIndex,Math.max(0,forces.length-1)),activeForce=forces[activeIndex];
 const visibleForce=loadedForce[activeForce?.id]?activeForce:forces.find(force=>loadedForce[force.id])||activeForce;
 const people=orderCharacters(characters),sovereign=people.find(c=>courtGroup(c)==='crown'),entourage=people.filter(c=>c!==sovereign).slice(0,3),chronicleArt=(chroniclesArt as Record<string,R>)[f.id];
 const lore=presentationPunctuation(f['lore_en_'+year]||f['lore_vi_'+year]||''),written=lore&&!/^placeholder/i.test(lore),paragraphs=written?lore.split(/\n\s*\n/):[];

 useEffect(()=>{setForceIndex(0);},[f.id]);
 useEffect(()=>{
  const controller=new AbortController();let alive=true;setPlaces([]);setPlaceState('loading');
  (async()=>{
   const response=await fetch('/monuments/manifest.json',{signal:controller.signal,cache:'no-cache'});if(!response.ok)throw Error('manifest');
   const manifest=await response.json() as R,entry=manifest.factions.find((row:R)=>row.id===f.id);
   if(!entry){if(alive)setPlaceState('ready');return;}
   const key=manifest.version+f.id;let records=monumentCache.get(key);
   if(!records){const response=await fetch(entry.url+'?v='+manifest.version,{signal:controller.signal});if(!response.ok)throw Error('places');records=await response.json() as R[];monumentCache.set(key,records);}
   if(alive){setPlaces(records.slice(0,3));setPlaceState('ready');}
  })().catch(error=>{if(alive&&error.name!=='AbortError')setPlaceState('error');});
  return()=>{alive=false;controller.abort();};
 },[f.id,retry]);

 function openPlace(place:R,trigger:HTMLElement){if(onLandmark)onLandmark(place,trigger);else onDestination('monuments');}
 function changeForce(index:number,focus=false){setForceIndex(index);if(focus)forceTabs.current[index]?.focus();}
 function trackSpotlight(event:MouseEvent<HTMLElement>){
  const rect=event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx',((event.clientX-rect.left)/Math.max(1,rect.width)*100).toFixed(1)+'%');
  event.currentTarget.style.setProperty('--my',((event.clientY-rect.top)/Math.max(1,rect.height)*100).toFixed(1)+'%');
 }

 return <div className="faction-overview empire-overview empire-v226" data-faction={f.id}>
  <div className="empire-atmosphere-layer" aria-hidden="true">
   <OverviewAtmosphere factionId={f.id}/>
   <div className="empire-velvet-vignette"/>
  </div>

  <nav className="empire-chapter-rail" aria-label="Overview chapters">
   {([['identity','The realm'],['places','Places'],['court','The court'],['military','Order of Battle'],['history','Chronicle']] as const).map(([id,label])=>
    <a key={id} href={'#overview-'+id} onClick={event=>{
     if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
     const target=document.getElementById('overview-'+id);
     if(!target)return;
     event.preventDefault();
     target.focus({preventScroll:true});
     target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }}>{label}</a>)}
  </nav>

  <section className="empire-identity" id="overview-identity" tabIndex={-1} aria-labelledby={sectionId+'-identity'}>
   <div className="empire-section-intro">
    <h2 id={sectionId+'-identity'}>The character<br/>of an empire.</h2>
    <p className="empire-intro-note">Foundational edicts, diplomatic doctrine, and courtly temper that govern {f.name_en} in {year}.</p>
    <button className="empire-text-link empire-action-gilded" onClick={()=>onDestination('atlas')}><Compass size={16} aria-hidden="true"/> Explore the strategic atlas <ArrowUpRight size={17} aria-hidden="true"/></button>
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

  <section className="empire-places" id="overview-places" tabIndex={-1} aria-labelledby={sectionId+'-places'}>
   <header className="empire-section-heading">
    <div>
     <h2 id={sectionId+'-places'}>Places that shape<br/>the realm.</h2>
    </div>
    <button className="empire-text-link empire-action-gilded" onClick={()=>onDestination('monuments')}>All landmarks <ArrowUpRight size={17} aria-hidden="true"/></button>
   </header>
   {placeState==='loading'?<div className="empire-place-notice" role="status">Opening the gazetteer...</div>:placeState==='error'?<div className="empire-place-notice" role="alert"><p>The landmark collection could not be loaded.</p><button className="empire-text-link" onClick={()=>setRetry(n=>n+1)}>Try again <ChevronRight size={18}/></button></div>:places.length?<div className="empire-place-composition">{places.map((place,index)=><button className={'empire-place '+(index===0?'empire-place-lead':'')} key={place.id} onClick={event=>openPlace(place,event.currentTarget)} onMouseMove={trackSpotlight} aria-label={'Explore '+local(place,'name')}><MediaImage src={landmarkArtwork(place,true)} alt={local(place,'name')} width={index===0?1600:1000} height={index===0?1200:600} loading="lazy"/><div className="empire-place-frame" aria-hidden="true"/><div className="empire-place-caption"><span className="empire-place-loc"><MapPin size={14} aria-hidden="true"/>{local(place,'location')}</span><h3>{local(place,'name')}</h3>{index===0&&<p>{local(place,'epithet')}</p>}<span className="empire-place-open">Inspect landmark dossier <ArrowUpRight size={17} aria-hidden="true"/></span></div></button>)}</div>:<p className="empire-place-notice">Landmark records are being prepared.</p>}
  </section>

  <section className={'empire-court '+(!sovereign?'empire-court-without-crown':'')} id="overview-court" tabIndex={-1} aria-labelledby={sectionId+'-court'}>
   {sovereign&&<button className="empire-sovereign" onClick={()=>onCharacter(sovereign)} onMouseMove={trackSpotlight} aria-label={'Open '+local(sovereign,'name')+' character dossier'}>
    <div className="empire-sovereign-halo" aria-hidden="true"/>
    {sovereign.portrait_asset?<MediaImage src={characterArtwork(sovereign)} alt={local(sovereign,'name')} width={900} height={1200} loading="lazy"/>:<div className="empire-portrait-pending">Portrait forthcoming</div>}
    <span className="empire-sovereign-plate">
     <small className="empire-sovereign-tag"><Sparkles size={13} aria-hidden="true"/> Sovereign Figure</small>
     <strong>{local(sovereign,'name')}</strong>
     <span>{local(sovereign,'role')}</span>
     <span className="empire-text-link">Enter character dossier <ArrowUpRight size={17} aria-hidden="true"/></span>
    </span>
   </button>}
   <div className="empire-court-copy">
    <h2 id={sectionId+'-court'}>{sovereign?'Velvet & Steel':'People of the age.'}</h2>
    <p className="empire-intro-note">Commanders, confidantes, and royal retainers whose private loyalties bend the fate of the realm.</p>
    <button className="empire-text-link empire-action-gilded" onClick={()=>onDestination('characters')}>Enter character showcase <ArrowUpRight size={17} aria-hidden="true"/></button>
    <div className="empire-entourage">{entourage.map(person=><button key={person.id} className="empire-entourage-card" onClick={()=>onCharacter(person)} onMouseMove={trackSpotlight}>
     <div className="empire-entourage-frame">{person.portrait_asset?<MediaImage src={characterArtwork(person)} alt={local(person,'name')} width={400} height={600} loading="lazy"/>:<div className="empire-portrait-pending">Portrait forthcoming</div>}</div>
     <span><small>{local(person,'role')||'Character dossier'}</small><strong>{local(person,'name')}</strong><ArrowUpRight size={16} aria-hidden="true"/></span>
    </button>)}</div>
    {!people.length&&<p className="empire-empty-state">Character dossiers are being prepared.</p>}
   </div>
  </section>

  <section className="empire-military" id="overview-military" tabIndex={-1} aria-labelledby={sectionId+'-military'}>
   <header className="empire-section-heading">
    <div>
     <h2 id={sectionId+'-military'}>Order of Battle</h2>
    </div>
    <button className="empire-text-link empire-action-gilded" onClick={()=>onDestination('military')}><Shield size={16} aria-hidden="true"/> Explore the military <ArrowUpRight size={17} aria-hidden="true"/></button>
   </header>
   {activeForce?<div className="empire-war-table">
    <div className="empire-force-tabs" role="tablist" aria-label="Featured military units">{forces.map((force,index)=><button ref={element=>{forceTabs.current[index]=element;}} key={force.id} id={sectionId+'-unit-tab-'+index} role="tab" aria-selected={index===activeIndex} aria-controls={sectionId+'-unit-panel'} tabIndex={index===activeIndex?0:-1} onClick={()=>changeForce(index)} onKeyDown={event=>{let target:number|undefined;if(event.key==='ArrowRight')target=(index+1)%forces.length;if(event.key==='ArrowLeft')target=(index-1+forces.length)%forces.length;if(event.key==='Home')target=0;if(event.key==='End')target=forces.length-1;if(target!==undefined){event.preventDefault();changeForce(target,true);}}}><span className="empire-tab-index">0{index+1}</span><span>{local(force,'name')}</span></button>)}</div>
    <div className="empire-force-stage" role="tabpanel" id={sectionId+'-unit-panel'} aria-labelledby={sectionId+'-unit-tab-'+activeIndex} tabIndex={0} data-branch={activeForce.branch}>
     <div className="empire-force-art">{forces.map(force=><MediaImage key={force.id} hidden={force.id!==visibleForce?.id} src={force.artwork||force.thumbnail||unitIllustration(f.id,force.image_asset)} alt={local(force,'name')} width={1400} height={1050} loading="eager" fetchPriority={force.id===activeForce.id?"high":undefined} onLoad={()=>setLoadedForce(prior=>prior[force.id]?prior:{...prior,[force.id]:true})}/>)}</div>
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

  <section className="empire-history" id="overview-history" tabIndex={-1} aria-labelledby={sectionId+'-history'}>
   <div className="empire-history-heading">
    <div className="empire-history-seal"><BookOpen size={24} aria-hidden="true"/><span>Anno {year}</span></div>
    <h2 id={sectionId+'-history'}>The imperial<br/>chronicle.</h2>
    {f.id!=='castilian_empire'&&chronicleArt&&<figure className="empire-chronicle-art"><MediaImage src={chronicleArt.asset} alt={presentationPunctuation(chronicleArt.title)} width={1200} height={800} loading="lazy"/><figcaption>{presentationPunctuation(chronicleArt.title)}</figcaption></figure>}
   </div>
   <article className="empire-history-text">
    {written?<><p>{paragraphs[0]}</p>{paragraphs.length>1&&<details className="empire-history-folio"><summary>Unseal the full chronicle ({paragraphs.length-1} more sections) <ChevronRight size={18} aria-hidden="true"/></summary><div>{paragraphs.slice(1).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div></details>}{!f['lore_en_'+year]&&<small className="empire-source-note">Vietnamese source · English translation pending</small>}</>:<p>The chronicle is being prepared.</p>}
   </article>
  </section>
 </div>;
}
