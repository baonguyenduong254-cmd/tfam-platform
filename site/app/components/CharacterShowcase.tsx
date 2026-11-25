'use client';
import {MotionConfig,motion} from 'motion/react';
import {useEffect,useMemo,useState} from 'react';
import {Crown,Search,Shield,Sparkles,Users,X} from 'lucide-react';
import {characterArtwork} from '../../lib/character-artwork';
import {canonicalCharacterArtwork,canonicalCharacterRole,canonicalCharacters} from '../../lib/canonical-characters';
import {courtGroup} from '../../lib/character-attributes';
import {assetUrl} from '../../lib/media/asset-url';
import {playBrassClick} from '../../lib/tactile-sfx';
import {hasWardrobe} from '../../lib/wardrobe-looks';
import CharacterRosterIcon from './CharacterRosterIcon';
import CharacterStageView from './CharacterStageView';
import './character-gamelike.css';

type Row=Record<string,any>;
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

function RosterCardArt({character}:{character:Row}){
 const [failed,setFailed]=useState(false);
 const thumb=characterArtwork(character,true)||canonicalCharacterArtwork(character);
 if(!thumb||failed)return <div className="roster-card-fallback"><CharacterRosterIcon character={character} lang="en"/></div>;
 return <img src={assetUrl(thumb)} alt="" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>;
}

/**
 * TFAM v257 Two-Stage Gamelike Character Showcase:
 * Stage 1 — The Imperial Roster Hall (tall standing collector cards, zero cramped sidebars)
 * Stage 2 — The Full-Viewport 100svh Character Stage (zero-overlap 2-column grid with Overview/Wardrobe/Profile/Skills)
 */
export default function CharacterShowcase({characters}:{characters:Row[]}){
 const deduped=useMemo(()=>canonicalCharacters(characters),[characters]);
 const [query,setQuery]=useState('');
 const [group,setGroup]=useState<string>('all');
 const [stageId,setStageId]=useState<string|null>(null);

 const visible=useMemo(()=>deduped.filter(c=>(group==='all'||courtGroup(c)===group)&&matchesQuery(c,query)),[deduped,group,query]);
 const stageIndex=stageId?deduped.findIndex(c=>c.id===stageId):-1;
 const stageCharacter=stageIndex>=0?deduped[stageIndex]:null;

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

 return <MotionConfig reducedMotion="user"><section className="roster-hall" aria-label="Character selection">
  {/* STAGE 1: THE IMPERIAL ROSTER HALL */}
  <header className="roster-hall-bar">
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

   <div className="roster-hall-search-wrap">
    <label className="roster-hall-search">
     <Search size={15} aria-hidden="true"/>
     <input
      type="text"
      aria-label="Search characters by name or guard number"
      placeholder="Name or Guard 01–97"
      value={query}
      onChange={e=>setQuery(e.target.value)}
     />
     {query&&<button type="button" className="roster-search-clear" aria-label="Clear search" onClick={()=>setQuery('')}><X size={14}/></button>}
    </label>
    <span className="roster-hall-count">{visible.length}</span>
   </div>
  </header>

  {visible.length>0?<div className="roster-hall-grid">
   {visible.map(c=>{
    const guardNum=c.guard_number?String(c.guard_number).padStart(2,'0'):'';
    const isCrown=courtGroup(c)==='crown';
    const atelier=hasWardrobe(c.id);
    const role=canonicalCharacterRole(c);
    return <button key={c.id} type="button" className={'roster-card'+(isCrown?' is-crown':'')} onClick={()=>openCharacter(c.id)} aria-label={'Inspect '+(c.name_en||'')+(guardNum?', Guard '+guardNum:'')}>
     <span className="roster-card-bg" aria-hidden="true"/>
     <span className="roster-card-mark" aria-hidden="true">
      {isCrown?<Crown size={18}/>:guardNum?guardNum:''}
     </span>
     {atelier&&<span className="roster-card-atelier" title="Atelier Wardrobe available" aria-hidden="true"><Sparkles size={13}/></span>}
     <span className="roster-card-media" aria-hidden="true">
      <RosterCardArt character={c}/>
     </span>
     <span className="roster-card-scrim" aria-hidden="true"/>
     <span className="roster-card-copy">
      <small>{guardNum?'Guard '+guardNum:role}</small>
      <strong>{c.name_en||c.name_vi||''}</strong>
     </span>
    </button>;
   })}
  </div>:<div className="roster-hall-empty">
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
