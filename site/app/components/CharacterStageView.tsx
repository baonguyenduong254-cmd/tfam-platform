'use client';
import {MotionConfig,motion} from 'motion/react';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,BookOpen,ChevronLeft,ChevronRight,Shield,Shirt,Sparkles,Star} from 'lucide-react';
import {characterRating} from '../../lib/character-rating';
import {characterArtwork} from '../../lib/character-artwork';
import {canonicalCharacterArtwork,canonicalCharacterRole} from '../../lib/canonical-characters';
import connections from '../../lib/character-connections.json';
import {assetUrl} from '../../lib/media/asset-url';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import {canRevealBond,canRevealExhibit,presentCharacter} from '../../lib/revelation';
import {playBrassClick,playVelvetChime} from '../../lib/tactile-sfx';
import {getLooks} from '../../lib/wardrobe-looks';
import CharacterRadar from './CharacterRadar';
import {useDiscovery} from './DiscoveryProgress';
import './character-gamelike.css';

type Row=Record<string,any>;
export type StageTab='overview'|'wardrobe'|'profile'|'skills';

export const STAGE_SKINS=[
 {id:'uniform',name:'Ceremonial Uniform',scene:'The Imperial Observatory',note:'Official regalia and courtly bearing',adult:false},
 {id:'office',name:'Private Study',scene:'The Candlelit Chancellery',note:'Tailored attire for state correspondence',adult:false},
 {id:'naughty_office',name:'After Hours',scene:'The Locked Study · Candlelit Boudoir',note:'Intimate velvet study edition',adult:true},
 {id:'afterwork',name:'Evening Salon',scene:'The Velvet Drawing Room · Past Dusk',note:'Unbound evening couture',adult:true},
 {id:'beach',name:'Coastal Terrace',scene:'The Mediterranean Pavilion · Golden Dusk',note:'Warm coastal twilight edition',adult:true},
] as const;

const TABS:{id:StageTab;label:string}[]=[
 {id:'overview',label:'Overview'},
 {id:'wardrobe',label:'Wardrobe'},
 {id:'profile',label:'Profile'},
 {id:'skills',label:'Skills'},
];

type Props={
 character:Row;
 roster:Row[];
 index:number;
 total:number;
 isOverlay?:boolean;
 initialTab?:StageTab;
 initialSkin?:string;
 initialVariant?:string;
 onBack:()=>void;
 onSelectCharacter:(id:string)=>void;
 onLocationSync?:(characterId:string,skinId:string,variantId:string)=>void;
};

function pref(key:string){try{return localStorage.getItem(key)||'';}catch{return '';}}

export default function CharacterStageView({character,roster,index,total,isOverlay=false,initialTab='overview',initialSkin='uniform',initialVariant='',onBack,onSelectCharacter,onLocationSync}:Props){
 const discovery=useDiscovery();
 const [tab,setTab]=useState<StageTab>(initialTab);
 const [selectedSkin,setSelectedSkin]=useState<string>(initialSkin);
 const [variant,setVariant]=useState<string>(initialVariant);
 const [favorite,setFavorite]=useState('');
 const [failedSrc,setFailedSrc]=useState('');

 const safeCharacter=useMemo(()=>presentCharacter(character,discovery.earned),[character,discovery.earned]);
 const safeRoster=useMemo(()=>roster.map(c=>presentCharacter(c,discovery.earned)),[roster,discovery.earned]);

 const name=presentationPunctuation(safeCharacter.name_en||safeCharacter.name_vi||safeCharacter.name||'Character');
 const role=canonicalCharacterRole(safeCharacter);
 const guardNum=safeCharacter.guard_number?String(safeCharacter.guard_number).padStart(2,'0'):'';
 const rating=useMemo(()=>characterRating(safeCharacter),[safeCharacter]);

 const availableSkins=useMemo(()=>STAGE_SKINS.filter(s=>getLooks(safeCharacter.id,s.id).length>0||(s.id==='uniform'&&!!canonicalCharacterArtwork(safeCharacter))),[safeCharacter]);
 const activeSkin=STAGE_SKINS.find(s=>s.id===selectedSkin)||availableSkins[0]||STAGE_SKINS[0];
 const isMature=!!activeSkin.adult;
 const looks=useMemo(()=>getLooks(safeCharacter.id,activeSkin.id),[safeCharacter.id,activeSkin.id]);
 const activeLook=looks.find(l=>l.id===variant)||looks[0];
 const portrait=activeLook?.src||(activeSkin.id==='uniform'?canonicalCharacterArtwork(safeCharacter):undefined);
 const environment=activeLook?.background||'/evelyne-stage/background-'+(activeSkin.id==='naughty_office'?'office':activeSkin.id)+'.webp';
 const hasError=!!portrait&&failedSrc===portrait;

 const localText=(key:string)=>{
  const val=safeCharacter[key+'_en']??safeCharacter[key];
  return typeof val==='string'?presentationPunctuation(val):val;
 };
 const lore=String(localText('lore')||'');
 const loreParagraphs=useMemo(()=>lore.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean),[lore]);
 const traits:string[]=useMemo(()=>(localText('traits')||[]).filter((v:unknown)=>typeof v==='string'&&v.trim()),[safeCharacter]);
 const skills:string[]=useMemo(()=>(localText('skills')||[]).filter((v:unknown)=>typeof v==='string'&&v.trim()),[safeCharacter]);
 const bonds=useMemo(()=>((connections.bonds as Record<string,{id:string;kind:string}[]>)[safeCharacter.id]||[]).flatMap(link=>{
  const person=safeRoster.find(c=>c.id===link.id);
  return person&&canRevealBond(safeCharacter.id,link.id,discovery.covered)?[{...link,person}]:[];
 }),[safeCharacter.id,safeRoster,discovery.covered]);
 const items=useMemo(()=>((connections.items as Record<string,{id:string;name_vi:string;name_en:string;href:string;image?:string}[]>)[safeCharacter.id]||[]).filter(item=>canRevealExhibit(item.id,discovery.covered)),[safeCharacter.id,discovery.covered]);

 useEffect(()=>{setFavorite(pref('tfam-lounge-favorite'));},[]);
 useEffect(()=>{
  setFailedSrc('');
  const validSkin=availableSkins.some(s=>s.id===initialSkin)?initialSkin:(availableSkins[0]?.id||'uniform');
  setSelectedSkin(validSkin);
  setVariant(initialVariant);
 },[safeCharacter.id,initialSkin,initialVariant]);

 useEffect(()=>{
  if(!isOverlay)return;
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onBack();}};
  const prev=document.body.style.overflow;
  document.body.style.overflow='hidden';
  window.addEventListener('keydown',onKey);
  return()=>{
   document.body.style.overflow=prev;
   window.removeEventListener('keydown',onKey);
  };
 },[isOverlay,onBack]);

 function chooseSkin(skinId:string){
  const meta=STAGE_SKINS.find(s=>s.id===skinId);
  if(meta?.adult)playVelvetChime(); else playBrassClick();
  setSelectedSkin(skinId);
  setVariant('');
  onLocationSync?.(safeCharacter.id,skinId,'');
 }
 function chooseVariant(lookId:string){
  playBrassClick();
  setVariant(lookId);
  onLocationSync?.(safeCharacter.id,activeSkin.id,lookId);
 }
 function toggleFavorite(){
  playBrassClick();
  const next=favorite===safeCharacter.id?'':safeCharacter.id;
  setFavorite(next);
  try{if(next)localStorage.setItem('tfam-lounge-favorite',next);else localStorage.removeItem('tfam-lounge-favorite');}catch{}
 }
 function stepCharacter(delta:number){
  if(roster.length<2)return;
  playBrassClick();
  const nextIdx=(index+delta+roster.length)%roster.length;
  onSelectCharacter(roster[nextIdx].id);
 }

 return <MotionConfig reducedMotion="user"><div
  className={'char-stage-shell'+(isOverlay?' is-overlay':'')+(isMature?' is-mature':'')}
  role={isOverlay?'dialog':undefined}
  aria-modal={isOverlay?true:undefined}
  aria-label={name+' character showcase'}
 >
  {/* FULL-BLEED DYNAMIC ROOM ENVIRONMENT */}
  <div className="char-stage-env" aria-hidden="true">
   <img key={environment} src={assetUrl(environment)} alt="" onError={e=>{const fb='/evelyne-stage/background-uniform.webp';if(e.currentTarget.getAttribute('src')!==fb)e.currentTarget.src=fb;}}/>
   <div className="char-stage-scrim"/>
  </div>

  {/* TRUE 2-COLUMN FULL-HEIGHT STAGE (LEFT = MONUMENTAL PORTRAIT, RIGHT = DOSSIER) */}
  <div className="char-stage-body">
   {/* LEFT COLUMN: FULL-HEIGHT MONUMENTAL CHARACTER STAGE */}
   <section className="char-stage-visual" aria-label={name+' '+activeSkin.name}>
    {/* Minimal floating Roster + Stepper tucked cleanly at top-left of visual stage */}
    <header className="char-stage-topbar">
     <button type="button" className="char-stage-pill" onClick={()=>{playBrassClick();onBack();}}>
      <ArrowLeft size={15} aria-hidden="true"/><span>Roster</span>
     </button>
     {total>1&&<div className="char-stage-stepper" aria-label="Switch character">
      <button type="button" aria-label="Previous character" onClick={()=>stepCharacter(-1)}><ChevronLeft size={16}/></button>
      <span>{String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</span>
      <button type="button" aria-label="Next character" onClick={()=>stepCharacter(1)}><ChevronRight size={16}/></button>
     </div>}
    </header>

    <div className="char-stage-figure-wrap">
     {portrait&&!hasError?(
      <img
       key={portrait}
       className="char-stage-static-img"
       src={assetUrl(portrait)}
       alt={name+' · '+activeSkin.name}
       fetchPriority="high"
       onError={()=>setFailedSrc(portrait)}
      />
     ):<div className="char-stage-missing"><Shirt size={34}/><p>{hasError?'Artwork could not load':'Artwork forthcoming'}</p>{hasError&&<button type="button" onClick={()=>setFailedSrc('')}>Retry</button>}</div>}
    </div>
   </section>

   {/* RIGHT COLUMN: GAMELIKE 4-TAB DOSSIER PANEL */}
   <aside className="char-stage-panel" aria-label={name+' dossier'}>
    <div className="char-panel-header">
     <div className="char-panel-meta">
      <span className="char-panel-role">{guardNum?'Royal Guard · '+guardNum:role}</span>
      <button type="button" className={'char-panel-fav'+(favorite===safeCharacter.id?' is-pinned':'')} aria-pressed={favorite===safeCharacter.id} onClick={toggleFavorite} title="Pin as lobby character">
       <Star size={14} fill={favorite===safeCharacter.id?'currentColor':'none'}/>
       <span>{favorite===safeCharacter.id?'Pinned':'Lobby'}</span>
      </button>
     </div>
     <h1>{name}</h1>
     {guardNum&&role&&<p className="char-panel-subrole">{role}</p>}
    </div>

    <nav className="char-panel-tabs" role="tablist" aria-label="Character sections">
     {TABS.map(item=><button key={item.id} type="button" role="tab" aria-selected={tab===item.id} className={tab===item.id?'is-active':''} onClick={()=>{playBrassClick();setTab(item.id);}}>
      <span>{item.label}</span>
      {item.id==='wardrobe'&&availableSkins.length>1&&<small>{availableSkins.length}</small>}
      {tab===item.id&&<motion.span layoutId="tfam-char-stage-tab" className="char-tab-rail" transition={{type:'spring',duration:.34,bounce:0}}/>}
     </button>)}
    </nav>

    <div className="char-panel-scroll" role="tabpanel">
     {tab==='overview'&&<div className="char-tab-overview">
      {rating&&<CharacterRadar key={safeCharacter.id} rating={rating}/>}

      {loreParagraphs[0]&&<div className="char-overview-bio">
       <p>{loreParagraphs[0]}</p>
       {loreParagraphs.length>1&&<button type="button" className="char-text-btn" onClick={()=>{playBrassClick();setTab('profile');}}>
        <BookOpen size={14} aria-hidden="true"/><span>Read full biography</span><ChevronRight size={14}/>
       </button>}
      </div>}

      {availableSkins.length>1&&<div className="char-quick-wardrobe">
       <div className="char-subhead">
        <span>Attire</span>
        <button type="button" onClick={()=>{playBrassClick();setTab('wardrobe');}}>Open Wardrobe</button>
       </div>
       <div className="char-skin-chips" role="group" aria-label="Quick attire switch">
        {availableSkins.map(s=><button key={s.id} type="button" className={(s.adult?'is-adult ':'')+(activeSkin.id===s.id?'is-active':'')} aria-pressed={activeSkin.id===s.id} onClick={()=>chooseSkin(s.id)}>
         <span>{s.name}</span>
         {s.adult&&<em>18+</em>}
        </button>)}
       </div>
      </div>}
     </div>}

     {tab==='wardrobe'&&<div className="char-tab-wardrobe">
      <p className="char-tab-intro">{activeLook?.scene||activeSkin.scene}</p>
      {looks.length>1&&<div className="char-variant-row" role="group" aria-label="Artwork variations">
       {looks.map((l,i)=><button key={l.id} type="button" className={activeLook?.id===l.id?'is-active':''} aria-pressed={activeLook?.id===l.id} onClick={()=>chooseVariant(l.id)}>
        <span>{String(i+1).padStart(2,'0')}</span>
        <small>{l.label}</small>
       </button>)}
      </div>}
      <div className="char-outfit-grid">
       {STAGE_SKINS.map(s=>{
        const sLooks=getLooks(safeCharacter.id,s.id);
        const first=sLooks[0];
        const fallback=s.id==='uniform'&&!first?canonicalCharacterArtwork(safeCharacter):undefined;
        const preview=first?.thumbnail||first?.src||fallback;
        const count=sLooks.length||(fallback?1:0);
        const isSelected=activeSkin.id===s.id;
        return <button key={s.id} type="button" disabled={count===0} className={'char-outfit-card'+(s.adult?' is-adult':'')+(isSelected?' is-active':'')+(count===0?' is-pending':'')} aria-pressed={isSelected} onClick={()=>count>0&&chooseSkin(s.id)}>
         <span className="char-outfit-thumb">
          {preview?<img src={assetUrl(preview)} alt="" loading="lazy"/>:<Shirt size={24}/>}
          {s.adult&&<em>18+</em>}
         </span>
         <span className="char-outfit-meta">
          <strong>{s.name}</strong>
          <small>{count===0?'Forthcoming':count===1?'1 edition':count+' variations'}</small>
         </span>
        </button>;
       })}
      </div>
     </div>}

     {tab==='profile'&&<div className="char-tab-profile">
      {safeCharacter.presentation_prelude&&<p className="char-prelude-tag">Before the chronicles · Prelude record</p>}
      {localText('office')&&<p className="char-office-line"><Shield size={14} aria-hidden="true"/><span>{localText('office')}</span></p>}
      {loreParagraphs.length?<div className="char-bio-prose">{loreParagraphs.map((p,i)=><p key={i}>{p}</p>)}</div>:<p className="char-empty-note">Biography is being prepared for this dossier.</p>}
      {traits.length>0&&<div className="char-sig-traits">
       {traits.slice(0,4).map(text=><span key={text}><Sparkles size={12} aria-hidden="true"/>{presentationPunctuation(text.split(': ')[0])}</span>)}
      </div>}
     </div>}

     {tab==='skills'&&<div className="char-tab-skills">
      {traits.length>0&&<div className="char-skill-group">
       <h3>Traits</h3>
       <ul>{traits.map((text,i)=>{
        const d=presentationPunctuation(text),sp=d.indexOf(': ');
        return <li key={text}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{sp<0?d:d.slice(0,sp)}</strong>{sp>=0&&<p>{d.slice(sp+2)}</p>}</div></li>;
       })}</ul>
      </div>}

      {skills.length>0&&<div className="char-skill-group">
       <h3>Abilities</h3>
       <ul>{skills.map((text,i)=>{
        const d=presentationPunctuation(text),sp=d.indexOf(': ');
        return <li key={text}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{sp<0?d:d.slice(0,sp)}</strong>{sp>=0&&<p>{d.slice(sp+2)}</p>}</div></li>;
       })}</ul>
      </div>}

      <div className="char-skill-group">
       <h3>Special Bonds</h3>
       {bonds.length?<div className="char-bond-list">
        {bonds.map(link=><button key={link.id} type="button" className="char-bond-item" onClick={()=>{playBrassClick();onSelectCharacter(link.person.id);}}>
         {link.person.portrait_asset&&<img src={assetUrl(characterArtwork(link.person,true))} alt="" loading="lazy"/>}
         <span><strong>{presentationPunctuation(link.person.name_en||link.person.name||'')}</strong><small>{link.kind==='spouse'?'Spouse':link.kind==='companion'?'Companion':'Special bond'}</small></span>
         <ChevronRight size={15}/>
        </button>)}
       </div>:<p className="char-empty-note">{safeCharacter.presentation_limited?'Continue the chronicles to reveal verified connections.':'No verified bonds recorded yet.'}</p>}
      </div>

      {items.length>0&&<div className="char-skill-group">
       <h3>Arms &amp; Vestigium</h3>
       <div className="char-bond-list">
        {items.map(item=><a key={item.id} className="char-bond-item" href={item.href}>
         {item.image&&<img src={assetUrl(item.image)} alt="" loading="lazy"/>}
         <span><strong>{presentationPunctuation(item.name_en)}</strong><small>Vestigium Exhibit</small></span>
         <ChevronRight size={15}/>
        </a>)}
       </div>
      </div>}

      {!traits.length&&!skills.length&&!bonds.length&&!items.length&&<p className="char-empty-note">Combat and bond dossiers are being expanded.</p>}
     </div>}
    </div>
   </aside>
  </div>
 </div></MotionConfig>;
}
