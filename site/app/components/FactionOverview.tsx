'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {ArrowUpRight,BookOpen,ChevronRight,MapPin} from 'lucide-react';
import {characterArtwork} from '../../lib/character-artwork';
import {orderCharacters} from '../../lib/character-order';
import {courtGroup} from '../../lib/character-attributes';
import {landmarkArtwork} from '../../lib/artwork-presentation';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import featuredMilitary from '../../lib/featured-military.json';
import chroniclesArt from '../../lib/chronicle-art-display.json';
import {factionCapital} from '../../lib/faction-content';
import {traitArtwork} from '../../lib/trait-art';
import {unitIllustration} from '../../lib/unit-art';
import MediaImage from './MediaImage';
import '../overview-empire.css';

type R=Record<string,any>;
type Props={faction:R;data:R;year:string;index:number;characters:R[];units:R[];regions:number;onCharacter:(c:R)=>void;onUnit:(u:R)=>void;onYear:(s:string)=>void;onDestination:(s:string)=>void;onMilitaryUnit:(s:string)=>void;onLandmark?:(s:string)=>void};
const local=(record:R,key:string)=>presentationPunctuation(record[key+'_en']||record[key]||(key==='name'?record.name_native:'')||'');
const monumentCache=new Map<string,R[]>();
export default function FactionOverview({faction:f,year,characters,units,regions,onCharacter,onUnit,onDestination,onMilitaryUnit,onLandmark}:Props){
 const [places,setPlaces]=useState<R[]>([]),[placeState,setPlaceState]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0),[forceIndex,setForceIndex]=useState(0);
 const forceTabs=useRef<(HTMLButtonElement|null)[]>([]),sectionId=useId();
 const featured=(featuredMilitary as Record<string,R[]>)[f.id],forces=(featured?.length?featured:units).slice(0,3),activeIndex=Math.min(forceIndex,Math.max(0,forces.length-1)),activeForce=forces[activeIndex];
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
 function openPlace(id:string){if(onLandmark)onLandmark(id);else onDestination('monuments');}
 function changeForce(index:number,focus=false){setForceIndex(index);if(focus)forceTabs.current[index]?.focus();}
 return <div className="faction-overview empire-overview" data-faction={f.id}>
  {f.id!=='castilian_empire'&&<dl className="empire-facts"><div><dt>Capital</dt><dd>{factionCapital(f,'en',year)}</dd></div><div><dt>Year</dt><dd>{year}</dd></div><div><dt>Territories</dt><dd>{regions} {regions===1?'region':'regions'}</dd></div></dl>}
  <section className="empire-identity" aria-labelledby={sectionId+'-identity'}>
   <div className="empire-section-intro"><h2 id={sectionId+'-identity'}>The character<br/>of an empire.</h2><button className="empire-text-link" onClick={()=>onDestination('atlas')}>Explore its territory <ArrowUpRight size={18} aria-hidden="true"/></button></div>
   <div className="empire-traits">{(f.traits||[]).map((trait:R,index:number)=><article key={trait.id||index}><MediaImage src={traitArtwork(trait,index)} alt="" width={100} height={120} loading="lazy"/><div><h3>{local(trait,'label')}</h3><p>{local(trait,'effect')||presentationPunctuation(trait.effect_ui||'Record pending.')}</p></div></article>)}{!f.traits?.length&&<p>Faction traits are being prepared.</p>}</div>
  </section>
  <section className="empire-places" aria-labelledby={sectionId+'-places'}>
   <header className="empire-section-heading"><h2 id={sectionId+'-places'}>Places that shape<br/>the realm.</h2><button className="empire-text-link" onClick={()=>onDestination('monuments')}>All landmarks <ArrowUpRight size={18} aria-hidden="true"/></button></header>
   {placeState==='loading'?<div className="empire-place-notice" role="status">Opening the gazetteer…</div>:placeState==='error'?<div className="empire-place-notice" role="alert"><p>The landmark collection could not be loaded.</p><button className="empire-text-link" onClick={()=>setRetry(n=>n+1)}>Try again <ChevronRight size={18}/></button></div>:places.length?<div className="empire-place-composition">{places.map((place,index)=><button className={'empire-place '+(index===0?'empire-place-lead':'')} key={place.id} onClick={()=>openPlace(place.id)} aria-label={'Explore '+local(place,'name')}><MediaImage src={landmarkArtwork(place,true)} alt={local(place,'name')} width={index===0?1600:1000} height={index===0?1200:600} loading="lazy"/><div className="empire-place-caption"><span><MapPin size={14} aria-hidden="true"/>{local(place,'location')}</span><h3>{local(place,'name')}</h3>{index===0&&<p>{local(place,'epithet')}</p>}<span className="empire-place-open">Explore landmark <ArrowUpRight size={18} aria-hidden="true"/></span></div></button>)}</div>:<p className="empire-place-notice">Landmark records are being prepared.</p>}
  </section>
  <section className={'empire-court '+(!sovereign?'empire-court-without-crown':'')} aria-labelledby={sectionId+'-court'}>
   {sovereign&&<button className="empire-sovereign" onClick={()=>onCharacter(sovereign)} aria-label={'Open '+local(sovereign,'name')+' character dossier'}>{sovereign.portrait_asset?<MediaImage src={characterArtwork(sovereign)} alt={local(sovereign,'name')} width={900} height={1200} loading="lazy"/>:<div className="empire-portrait-pending">Portrait forthcoming</div>}<span><strong>{local(sovereign,'name')}</strong><span>{local(sovereign,'role')}</span><span className="empire-text-link">View character <ArrowUpRight size={18} aria-hidden="true"/></span></span></button>}
   <div className="empire-court-copy"><h2 id={sectionId+'-court'}>{sovereign?'The Crown.\nIts circle.':'People of the age.'}</h2><button className="empire-text-link" onClick={()=>onDestination('characters')}>Meet the characters <ArrowUpRight size={18} aria-hidden="true"/></button><div className="empire-entourage">{entourage.map(person=><button key={person.id} onClick={()=>onCharacter(person)}>{person.portrait_asset?<MediaImage src={characterArtwork(person)} alt={local(person,'name')} width={400} height={600} loading="lazy"/>:<div className="empire-portrait-pending">Portrait forthcoming</div>}<span><small>{local(person,'role')||'Character dossier'}</small><strong>{local(person,'name')}</strong><ArrowUpRight size={16} aria-hidden="true"/></span></button>)}</div>{!people.length&&<p>Character dossiers are being prepared.</p>}</div>
  </section>
  <section className="empire-military" aria-labelledby={sectionId+'-military'}>
   <header className="empire-section-heading"><h2 id={sectionId+'-military'}>Under the banner.</h2><button className="empire-text-link" onClick={()=>onDestination('military')}>Explore the military <ArrowUpRight size={18} aria-hidden="true"/></button></header>
   {activeForce?<><div className="empire-force-tabs" role="tablist" aria-label="Featured military units">{forces.map((force,index)=><button ref={element=>{forceTabs.current[index]=element;}} key={force.id} id={sectionId+'-unit-tab-'+index} role="tab" aria-selected={index===activeIndex} aria-controls={sectionId+'-unit-panel'} tabIndex={index===activeIndex?0:-1} onClick={()=>changeForce(index)} onKeyDown={event=>{let target:number|undefined;if(event.key==='ArrowRight')target=(index+1)%forces.length;if(event.key==='ArrowLeft')target=(index-1+forces.length)%forces.length;if(event.key==='Home')target=0;if(event.key==='End')target=forces.length-1;if(target!==undefined){event.preventDefault();changeForce(target,true);}}}>{local(force,'name')}</button>)}</div><div className="empire-force-stage" role="tabpanel" id={sectionId+'-unit-panel'} aria-labelledby={sectionId+'-unit-tab-'+activeIndex} tabIndex={0} data-branch={activeForce.branch}><div className="empire-force-art" key={activeForce.id}><MediaImage src={activeForce.artwork||activeForce.thumbnail||unitIllustration(f.id,activeForce.image_asset)} alt={local(activeForce,'name')} width={1400} height={1000} loading="lazy"/></div><div className="empire-force-copy"><h3>{local(activeForce,'name')}</h3>{local(activeForce,'class')&&<p className="empire-force-class">{local(activeForce,'class')}</p>}<p>{local(activeForce,'role')}</p><button className="empire-text-link" onClick={()=>featured?.length?onMilitaryUnit(activeForce.id):onUnit(activeForce)}>Inspect unit <ArrowUpRight size={18} aria-hidden="true"/></button></div></div></>:<p>Unit dossiers are being prepared.</p>}
  </section>
  <section className="empire-history" aria-labelledby={sectionId+'-history'}>
   <div className="empire-history-heading"><BookOpen size={28} aria-hidden="true"/><h2 id={sectionId+'-history'}>The imperial<br/>chronicle.</h2><span>{year}</span>{f.id!=='castilian_empire'&&chronicleArt&&<figure className="empire-chronicle-art"><MediaImage src={chronicleArt.asset} alt={presentationPunctuation(chronicleArt.title)} width={1200} height={800} loading="lazy"/><figcaption>{presentationPunctuation(chronicleArt.title)}</figcaption></figure>}</div>
   <article className="empire-history-text">{written?<><p>{paragraphs[0]}</p>{paragraphs.length>1&&<details><summary>Read the full history <ChevronRight size={18} aria-hidden="true"/></summary><div>{paragraphs.slice(1).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div></details>}{!f['lore_en_'+year]&&<small>Vietnamese source · English translation pending</small>}</>:<p>The chronicle is being prepared.</p>}</article>
  </section>
 </div>;
}
