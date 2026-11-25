'use client';
import {MotionConfig,motion} from 'motion/react';
import {useEffect,useMemo,useState,type CSSProperties} from 'react';
import {ArrowUpRight,ChevronDown,Crown,Search,Shield,Users,X} from 'lucide-react';
import {characterArtwork} from '../../lib/character-artwork';
import {canonicalCharacterArtwork,canonicalCharacterRole,canonicalCharacters} from '../../lib/canonical-characters';
import {courtGroup} from '../../lib/character-attributes';
import {characterRating,RATING_AXES} from '../../lib/character-rating';
import {assetUrl} from '../../lib/media/asset-url';
import {playBrassClick} from '../../lib/tactile-sfx';
import {AXIS_PALETTE} from './CharacterRadar';
import CharacterRosterIcon, {rosterIconPath} from './CharacterRosterIcon';
import CharacterStageView from './CharacterStageView';
import './character-gamelike.css';

type Row=Record<string,any>;
type FactionOption={id:string;name_en?:string;name_vi?:string;flag_asset?:string;tagline_en?:string};

const GROUPS=[
 {id:'all',label:'All',Icon:Users},
 {id:'crown',label:'The Crown',Icon:Crown},
 {id:'guard',label:'Royal Guard',Icon:Shield},
 {id:'official',label:'Officials',Icon:Users},
] as const;

const normalize=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

function matchesQuery(c:Row,rawQuery:string){
 const q=normalize(rawQuery.trim());
 if(!q)return true;
 const guardRaw=c.guard_number?String(c.guard_number):'';
 const guardPadded=guardRaw?guardRaw.padStart(2,'0'):'';
 const hay=normalize([c.name_en,c.name_vi,c.role_en,guardRaw,guardPadded].filter(Boolean).join(' '));
 return hay.includes(q);
}

function RosterCardArt({character,full=false}:{character:Row;full?:boolean}){
 const [failed,setFailed]=useState(false);
 const iconSrc=!full?rosterIconPath(character.id):undefined;
 const src=full
  ?(canonicalCharacterArtwork(character)||characterArtwork(character,false))
  :(iconSrc||canonicalCharacterArtwork(character)||characterArtwork(character,true));
 if(!src||failed)return <div className="roster-card-fallback"><CharacterRosterIcon character={character} lang="en"/></div>;
 return <img src={assetUrl(src)} className={iconSrc?'is-roster-icon':undefined} alt="" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>;
}

/**
 * TFAM v258 Two-Stage Gamelike Character Showcase:
 * Stage 1 — Unified Imperial Roster Hero + Featured Sovereign Spotlight + Spacious 4-Column Collector Hall
 * Stage 2 — Full-Viewport 100svh Character Stage with Glow-Gradient Hexagon Radar
 */
export default function CharacterShowcase({
 characters,
 faction,
 factions,
 onFaction,
}:{
 characters:Row[];
 faction?:FactionOption;
 factions?:FactionOption[];
 onFaction?:(id:string)=>void;
}){
 const deduped=useMemo(()=>canonicalCharacters(characters),[characters]);
 const [query,setQuery]=useState('');
 const [group,setGroup]=useState<string>('all');
 const [stageId,setStageId]=useState<string|null>(null);

 const visible=useMemo(()=>deduped.filter(c=>(group==='all'||courtGroup(c)===group)&&matchesQuery(c,query)),[deduped,group,query]);
 const stageIndex=stageId?deduped.findIndex(c=>c.id===stageId):-1;
 const stageCharacter=stageIndex>=0?deduped[stageIndex]:null;

 const showSpotlight=group==='all'&&!query.trim();
 const featuredCrown=useMemo(()=>showSpotlight?visible.find(c=>courtGroup(c)==='crown')||null:null,[showSpotlight,visible]);
 const gridCharacters=useMemo(()=>featuredCrown?visible.filter(c=>c.id!==featuredCrown.id):visible,[visible,featuredCrown]);

 // Open Stage 2 directly if a specific character ID is requested in the hash (#archive/<faction>/characters/<id>)
 useEffect(()=>{
  const parts=location.hash.slice(1).split('/');
  const requested=parts[2]==='characters'&&parts[3]?decodeURIComponent(parts[3]):'';
  if(requested&&deduped.some(c=>c.id===requested))setStageId(requested);
 },[deduped]);

 function openCharacter(id:string){
  playBrassClick();
  setStageId(id);
  try{sessionStorage.setItem('tfam-champion-selection',id);}catch{}
 }

 const factionName=faction?.name_en||faction?.name_vi||'Imperial Roster';
 const featuredRating=useMemo(()=>featuredCrown?characterRating(featuredCrown):null,[featuredCrown]);
 const featuredTopAxis=featuredRating?featuredRating.topAxes[0]:'presence';
 const featuredPal=AXIS_PALETTE[featuredTopAxis];

 return <MotionConfig reducedMotion="user"><section className="roster-hall" aria-labelledby="archive-title">
  {/* UNIFIED IMPERIAL ROSTER HERO HEADER */}
  <header className="roster-hero">
   <div className="roster-hero-aura" aria-hidden="true"/>
   <div className="roster-hero-top">
    <div className="roster-hero-identity">
     {faction?.flag_asset&&<img className="roster-hero-flag" src={assetUrl(faction.flag_asset)} alt="" aria-hidden="true"/>}
     <div className="roster-hero-titles">
      <span className="roster-hero-kicker">Imperial Character Register</span>
      <h2 id="archive-title">{factionName}</h2>
     </div>
    </div>

    <div className="roster-hero-controls">
     {factions&&factions.length>1&&onFaction&&faction&&<label className="roster-faction-select">
      <span className="sr-only">Choose faction</span>
      <select value={faction.id} onChange={e=>onFaction(e.target.value)}>
       {factions.map(a=><option key={a.id} value={a.id}>{a.name_en||a.name_vi}</option>)}
      </select>
      <ChevronDown size={14} aria-hidden="true"/>
     </label>}
     <span className="roster-hall-count"><strong>{visible.length}</strong> dossiers</span>
    </div>
   </div>

   <div className="roster-hero-bar">
    <nav className="roster-hall-filters" role="tablist" aria-label="Character groups">
     {GROUPS.map(({id,label,Icon})=>{
      const active=group===id;
      return <button key={id} type="button" role="tab" aria-selected={active} className={'roster-filter-tab'+(active?' is-active':'')} onClick={()=>{playBrassClick();setGroup(id);}}>
       <Icon size={14} aria-hidden="true"/>
       <span>{label}</span>
       {active&&<motion.span layoutId="tfam-roster-filter-rail" className="roster-filter-rail" transition={{type:'spring',duration:.32,bounce:0}}/>}
      </button>;
     })}
    </nav>

    <label className="roster-hall-search">
     <Search size={15} aria-hidden="true"/>
     <input
      type="text"
      aria-label="Search characters by name or guard number"
      placeholder="Search name or Guard 01–97"
      value={query}
      onChange={e=>setQuery(e.target.value)}
     />
     {query&&<button type="button" className="roster-search-clear" aria-label="Clear search" onClick={()=>setQuery('')}><X size={14}/></button>}
    </label>
   </div>
  </header>

  {/* STAGE 1: FEATURED SOVEREIGN SPOTLIGHT + SPACIOUS 4-COLUMN COLLECTOR HALL */}
  {visible.length>0?<>
   {featuredCrown&&<button
    type="button"
    className="roster-spotlight"
    style={{
     '--card-from':featuredPal.from,
     '--card-to':featuredPal.to,
     '--card-glow':featuredPal.glow,
     '--card-tint':featuredPal.tint,
    } as CSSProperties}
    onClick={()=>openCharacter(featuredCrown.id)}
    aria-label={'Inspect sovereign '+(featuredCrown.name_en||'')}
   >
    <span className="roster-spotlight-bg" aria-hidden="true"/>
    <span className="roster-spotlight-art" aria-hidden="true">
     <RosterCardArt character={featuredCrown} full/>
    </span>
    <span className="roster-spotlight-body">
     <span className="roster-spotlight-kicker"><Crown size={14} aria-hidden="true"/>{canonicalCharacterRole(featuredCrown)||'Sovereign'}</span>
     <strong>{featuredCrown.name_en||featuredCrown.name_vi||''}</strong>
     {featuredRating&&<span className="roster-spotlight-stats">
      <span className="roster-spotlight-grade"><em>{featuredRating.overallGrade}</em><small>{featuredRating.overallScore}</small></span>
      <span className="roster-spotlight-arch">
       <b>{featuredRating.archetype}</b>
       <small>{RATING_AXES.find(a=>a.key===featuredRating.topAxes[0])?.label} · {RATING_AXES.find(a=>a.key===featuredRating.topAxes[1])?.label}</small>
      </span>
     </span>}
     <span className="roster-spotlight-cta">Inspect Dossier <ArrowUpRight size={15} aria-hidden="true"/></span>
    </span>
   </button>}

   {gridCharacters.length>0&&<div className="roster-hall-grid">
    {gridCharacters.map(c=>{
     const guardNum=c.guard_number?String(c.guard_number).padStart(2,'0'):'';
     const isCrown=courtGroup(c)==='crown';
     const role=canonicalCharacterRole(c);
     const subtitle=role||(guardNum?'Royal Guard · '+guardNum:'Imperial Official');
     const rating=characterRating(c);
     const pal=AXIS_PALETTE[rating?rating.topAxes[0]:'statecraft'];
     return <button
      key={c.id}
      type="button"
      className={'roster-card'+(isCrown?' is-crown':'')}
      style={{
       '--card-from':pal.from,
       '--card-to':pal.to,
       '--card-glow':pal.glow,
       '--card-tint':pal.tint,
      } as CSSProperties}
      onClick={()=>openCharacter(c.id)}
      aria-label={'Inspect '+(c.name_en||'')+(guardNum?', Guard '+guardNum:'')}
     >
      <span className="roster-card-bg" aria-hidden="true"/>
      {rating&&<span className="roster-card-grade" aria-hidden="true">{rating.overallGrade}</span>}
      <span className="roster-card-mark" aria-hidden="true">
       {isCrown?<Crown size={17}/>:guardNum?guardNum:''}
      </span>
      <span className="roster-card-media" aria-hidden="true">
       <RosterCardArt character={c}/>
      </span>
      <span className="roster-card-scrim" aria-hidden="true"/>
      <span className="roster-card-copy">
       <small>{subtitle}</small>
       <strong>{c.name_en||c.name_vi||''}</strong>
      </span>
      <span className="roster-card-beam" aria-hidden="true"/>
     </button>;
    })}
   </div>}
  </>:<div className="roster-hall-empty">
   <p>No matching characters found.</p>
   <button type="button" onClick={()=>{playBrassClick();setQuery('');setGroup('all');}}>Reset filters</button>
  </div>}

  {/* STAGE 2: FULL-VIEWPORT 100svh GAMELIKE CHARACTER STAGE */}
  {stageCharacter&&<CharacterStageView
   character={stageCharacter}
   roster={deduped}
   index={stageIndex}
   total={deduped.length}
   isOverlay
   onBack={()=>setStageId(null)}
   onSelectCharacter={id=>setStageId(id)}
  />}
 </section></MotionConfig>;
}
