'use client';
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent} from 'react';
import {ArrowLeft,BookOpen,Eye,EyeOff,Maximize2,Minimize2,X,Users,Shirt,Swords,Link2,Search,Star,Sparkles} from 'lucide-react';
import {attributeDefinitions,characterAttributes} from '../../lib/character-attributes';
import seed from '../../lib/seed.json';
import {isRemovedRosterCharacter,withCharacterPortraits} from '../../lib/character-portraits';
import {characterArtwork} from '../../lib/character-artwork';
import {belongsToFaction} from '../../lib/castilian-presentation';
import collectionNames from '../../lib/wardrobe-collection-names.json';
import {getLooks,hasWardrobe} from '../../lib/wardrobe-looks';
import {playBrassClick,playVelvetChime} from '../../lib/tactile-sfx';
import AtelierAtmosphere from '../components/AtelierAtmosphere';
import dynamic from 'next/dynamic';
import {preloadLiveIllust} from '../../lib/motion/load-surfaces';
import CharacterDossier from '../components/CharacterDossier';
import CharacterRosterIcon from '../components/CharacterRosterIcon';
import {presentCharacter} from '../../lib/revelation';
import {useDiscovery} from '../components/DiscoveryProgress';
import './lounge.css';
import {orderCharacters} from '../../lib/character-order';

const LiveIllust25D=dynamic(preloadLiveIllust,{ssr:false});

const skins=[
 {id:'uniform',name:'Ceremonial Uniform',short:'Uniform',scene:'The Imperial Observatory',note:'Official regalia and courtly bearing'},
 {id:'office',name:'Private Study',short:'Office',scene:'The Candlelit Chancellery',note:'Tailored attire for state correspondence'},
 {id:'naughty_office',name:'After Hours',short:'After Hours',scene:'The Locked Study · Candlelit Boudoir',note:'Intimate velvet study edition',adult:true},
 {id:'afterwork',name:'Evening Salon',short:'Afterwork',scene:'The Velvet Drawing Room · Past Dusk',note:'Unbound evening couture',adult:true},
 {id:'beach',name:'Coastal Terrace',short:'Coastal',scene:'The Mediterranean Pavilion · Golden Dusk',note:'Warm coastal twilight edition',adult:true},
];

const initial=withCharacterPortraits(seed);
type Panel='profile'|'abilities'|'bonds'|'wardrobe'|'roster'|null;
function preference(key:string){try{return localStorage.getItem(key)||'';}catch{return '';}}
const normalize=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

export default function CharacterLounge(){
 const discovery=useDiscovery();
 const [characterId,setCharacterId]=useState('evelyne_vesper'),[selected,setSelected]=useState('uniform'),[ready,setReady]=useState(false),[records,setRecords]=useState<Record<string,any>[]>(initial.characters);
 const [variant,setVariant]=useState('');
 const [panel,setPanel]=useState<Panel>(null),[focus,setFocus]=useState(false),[closeup,setCloseup]=useState(false),[failedSrc,setFailedSrc]=useState(''),[favorite,setFavorite]=useState(''),[query,setQuery]=useState('');
 const [liveArt,setLiveArt]=useState(true);
 const [veilDrawn,setVeilDrawn]=useState(true);
 const root=useRef<HTMLElement>(null),drawer=useRef<HTMLElement>(null),close=useRef<HTMLButtonElement>(null),lastFocus=useRef<HTMLElement|null>(null);

 const character=records.find(c=>c.id===characterId),name=character?.name_en||character?.name_vi||(collectionNames as Record<string,string>)[characterId]||'Character forthcoming';
 const safeRecords=records.map(c=>presentCharacter(c,discovery.earned)),safe=safeRecords.find(c=>c.id===characterId);
 const attributes=character?characterAttributes(character):null,skin=skins.find(s=>s.id===selected)||skins[0];
 const isMature=!!skin.adult;
 const looks=getLooks(characterId,selected);
 const look=looks.find(l=>l.id===variant)||looks[0];
 const portrait=look?.src||(selected==='uniform'&&character?characterArtwork(character):undefined);
 const environment=look?.background||'/evelyne-stage/background-'+(selected==='naughty_office'?'office':selected)+'.webp';
 const artStyle={
  ...(look?.size?{'--look-size':look.size+'%','--look-bottom':look.bottom+'%','--look-warmth':look.warmth}:{}),
 } as CSSProperties;
 const error=!!portrait&&failedSrc===portrait;
 const faction=character?.faction_id==='england_ruins'?'castilian_empire':character?.faction_id||'castilian_empire';

 const canonicalRoster=orderCharacters(safeRecords).filter(c=>c.presentation_visible&&(belongsToFaction(c,faction)||hasWardrobe(c.id)));
 const roster=canonicalRoster.filter(c=>normalize([c.name_en,c.name_vi,c.guard_number].join(' ')).includes(normalize(query)));
 const rosterIdSet=new Set(safeRecords.map(c=>c.id));
 const rosterNameSet=new Set(safeRecords.flatMap(c=>[c.name_en,c.name_vi].filter(Boolean).map(normalize)));
 const artworkOnly=Object.entries(collectionNames).filter(([id,label])=>!isRemovedRosterCharacter(id)&&!rosterIdSet.has(id)&&!rosterNameSet.has(normalize(label))&&normalize(label).includes(normalize(query)));
 const availableSkins=skins.filter(s=>getLooks(characterId,s.id).length>0||(s.id==='uniform'&&!!character));

 useEffect(()=>{function sync(){const url=new URL(location.href);const favoriteId=preference('tfam-lounge-favorite');const requestedId=url.searchParams.get('character')||favoriteId;setVariant(url.searchParams.get('look')||'');setCharacterId(requestedId&&!isRemovedRosterCharacter(requestedId)?requestedId:'evelyne_vesper');setPanel(url.hash==='#wardrobe'?'wardrobe':null);setSelected(skins.some(s=>s.id===url.hash.slice(1))?url.hash.slice(1):'uniform');setReady(true);}sync();const savedFavorite=preference('tfam-lounge-favorite');setFavorite(isRemovedRosterCharacter(savedFavorite)?'':savedFavorite);window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);const controller=new AbortController();fetch('/api/content',{signal:controller.signal}).then(r=>r.ok?r.json() as Promise<{data?:any}>:null).then(r=>{if(r?.data?.characters)setRecords(withCharacterPortraits(r.data).characters);}).catch(()=>{});return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync);controller.abort();};},[]);
 useEffect(()=>{setFailedSrc('');},[characterId,selected,variant]);
 useEffect(()=>{
  if(isMature){
   setVeilDrawn(false);
   const timer=setTimeout(()=>setVeilDrawn(true),420);
   return()=>clearTimeout(timer);
  }
  setVeilDrawn(true);
 },[characterId,selected,isMature]);
 useEffect(()=>{const stage=root.current;if(!stage)return;let visible=false;const sync=()=>{stage.dataset.motionActive=String(visible&&!document.hidden);};const obs=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();});obs.observe(stage);document.addEventListener('visibilitychange',sync);return()=>{obs.disconnect();document.removeEventListener('visibilitychange',sync);};},[]);
 useEffect(()=>{if(!panel)return;close.current?.focus({preventScroll:true});const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();dismiss();}if(e.key==='Tab'){const nodes=Array.from(drawer.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]')||[]).filter(n=>n.tabIndex>=0&&n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(!drawer.current?.contains(document.activeElement)){e.preventDefault();(e.shiftKey?last:first).focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[panel]);

 function dismiss(){if(location.hash==='#wardrobe')history.replaceState(history.state,'',location.pathname+location.search);setPanel(null);requestAnimationFrame(()=>lastFocus.current?.focus({preventScroll:true}));}
 function open(next:Panel,button:HTMLElement){playBrassClick();lastFocus.current=button;setPanel(next);setFocus(false);}
 function setLocation(id:string,category:string,lookId=''){const url=new URL(location.href);url.searchParams.set('character',id);if(lookId)url.searchParams.set('look',lookId);else url.searchParams.delete('look');url.hash=category==='uniform'?'':category;history.pushState(null,'',url);}
 function chooseSkin(id:string,closeDrawer=true){
  const nextMeta=skins.find(s=>s.id===id);
  if(nextMeta?.adult)playVelvetChime(); else playBrassClick();
  setSelected(id);setVariant('');setCloseup(false);setLocation(characterId,id);
  if(closeDrawer)dismiss();
 }
 function chooseVariant(id:string){playBrassClick();setVariant(id);setCloseup(false);setLocation(characterId,selected,id);}
 function chooseCharacter(id:string){playBrassClick();const category=getLooks(id,selected).length?selected:getLooks(id,'uniform').length?'uniform':getLooks(id,'beach').length?'beach':'uniform';setCharacterId(id);setSelected(category);setVariant('');setCloseup(false);setQuery('');sessionStorage.setItem('tfam-champion-selection',id);setLocation(id,category);dismiss();}
 function pin(){playBrassClick();const next=favorite===characterId?'':characterId;setFavorite(next);try{if(next)localStorage.setItem('tfam-lounge-favorite',next);else localStorage.removeItem('tfam-lounge-favorite');}catch{}}
 function handleParallax(e:PointerEvent<HTMLElement>){
  if(e.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const rect=e.currentTarget.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const nx=((e.clientX-rect.left)/rect.width)-.5;
  const ny=((e.clientY-rect.top)/rect.height)-.5;
  e.currentTarget.style.setProperty('--px',nx*14+'px');
  e.currentTarget.style.setProperty('--py',ny*10+'px');
 }

 return <main ref={root} onPointerMove={handleParallax} onPointerLeave={e=>{e.currentTarget.style.removeProperty('--px');e.currentTarget.style.removeProperty('--py');}} className={'character-lounge lounge-v226 lounge-v227 look-'+selected+(isMature?' is-mature-atelier':'')+(veilDrawn?' is-veiled-open':' is-veiled-shut')+(closeup?' is-closeup':'')+(focus?' is-art-focus':'')+(panel?' has-panel':'')+(look?.size?' has-authored-scene':'')} style={artStyle} data-ready={ready}>
  <div className="lounge-environment" aria-hidden="true">
   <img key={environment} src={environment} alt="" onError={e=>{const fallback='/evelyne-stage/background-'+(selected==='naughty_office'?'office':selected)+'.webp';if(e.currentTarget.getAttribute('src')!==fallback)e.currentTarget.src=fallback;}}/>
   <div className="lounge-scrim"/>
   <div className="lounge-daylight"/>
   <div className="lounge-chiaroscuro-rim"/>
   <AtelierAtmosphere mood={selected} mature={isMature}/>
  </div>

  <div className="lounge-ui" inert={panel?true:undefined}>
   <header className="lounge-top">
    <a href="/">Through Frost and Myth</a>
    <button onClick={()=>window.location.assign('/#archive/'+faction+'/characters')}><ArrowLeft size={16}/> Character register</button>
   </header>

   <section className="lounge-identity" key={characterId}>
    <h1>{ready?name:'Character lounge'}</h1>
    <p>{character?.guard_number?'Royal Guard · '+String(character.guard_number).padStart(2,'0')+(characterId==='sonia'?' · Setenta':characterId==='trucia'?' · Noventa y Siete':''):character?.role_en||(character?'The Court':'Artwork collection')}</p>
    <button className="lounge-favorite" aria-pressed={favorite===characterId} onClick={pin}><Star size={15} fill={favorite===characterId?'currentColor':'none'}/>{favorite===characterId?'Your lobby character':'Set as lobby character'}</button>
   </section>

   <div className="lounge-look-title" key={selected}>
    <div className="lounge-look-heading">
     <h2>{skin.name}</h2>
     {isMature&&<span className="lounge-adult-seal">Private 18+</span>}
    </div>
    <p>{look?.scene||skin.scene}</p>
    {availableSkins.length>1&&<div className="lounge-quick-ribbon" role="group" aria-label="Quick attire switch">
     {availableSkins.map(s=><button key={s.id} className={s.adult?'is-adult-tab':''} aria-pressed={selected===s.id} onClick={()=>chooseSkin(s.id,false)}>{s.short}</button>)}
    </div>}
    {looks.length>1&&<div className="lounge-versions" aria-label="Artwork versions">{looks.map((l,i)=><button key={l.id} aria-pressed={look?.id===l.id} aria-label={l.label} onClick={()=>chooseVariant(l.id)}>{String(i+1).padStart(2,'0')}<span>{l.label}</span></button>)}</div>}
   </div>

   <section className="lounge-art salon-transition-art" aria-label={name+' '+skin.name+' artwork'}>
    <div key={portrait} className="lounge-art-arrival">
     <div className="lounge-art-idle">
      {look?.size&&<div className="lounge-contact-shadow" aria-hidden="true"/>}
      {isMature&&<div className="lounge-silk-veil" aria-hidden="true"/>}
      {ready&&portrait&&!error?(liveArt?<LiveIllust25D src={portrait} alt={name+' · '+skin.name} mood={selected} mature={isMature} onError={()=>setFailedSrc(portrait||'')}/>:<img src={portrait} alt={name+' · '+skin.name} fetchPriority="high" onError={()=>setFailedSrc(portrait)}/>):<div className="lounge-missing"><Shirt size={38}/><p>{error?'Artwork could not load':'Artwork forthcoming'}</p><span>{skin.name}</span>{error&&<button onClick={()=>setFailedSrc('')}>Retry artwork</button>}</div>}
     </div>
    </div>
   </section>

   {character&&<section className="lounge-quick-stats" aria-label="Personal aptitudes">{attributeDefinitions.map(d=><div key={d.key}><span>{d.en}</span><strong>{attributes?.[d.key]??'N/A'}</strong></div>)}</section>}

   <nav className="lounge-actions" aria-label="Character lounge">
    <button disabled={!character} onClick={e=>open('profile',e.currentTarget)}><BookOpen/><span>Profile</span></button>
    <button disabled={!character} onClick={e=>open('abilities',e.currentTarget)}><Swords/><span>Abilities</span></button>
    <button disabled={!character} onClick={e=>open('bonds',e.currentTarget)}><Link2/><span>Bonds</span></button>
    <button onClick={e=>open('wardrobe',e.currentTarget)}><Shirt/><span>Atelier</span></button>
    <button onClick={e=>open('roster',e.currentTarget)}><Users/><span>Characters</span></button>
   </nav>

   <div className="lounge-view-controls">
    {portrait&&!error&&<button onClick={()=>setLiveArt(v=>!v)} aria-pressed={liveArt}>{liveArt?'Live 2.5D':'Static art'}</button>}
    {isMature&&<button aria-pressed={veilDrawn} onClick={()=>{playVelvetChime();setVeilDrawn(v=>!v);}}>{veilDrawn?<EyeOff size={17}/>:<Eye size={17}/>}<span>{veilDrawn?'Unveil':'Silk veil'}</span></button>}
    <button aria-pressed={closeup} onClick={()=>{playBrassClick();setCloseup(v=>!v);}}>{closeup?<Minimize2 size={17}/>:<Maximize2 size={17}/>}<span>{closeup?'Full figure':'Close-up'}</span></button>
    <button aria-pressed={focus} onClick={()=>{playBrassClick();setFocus(v=>!v);}}><Maximize2 size={17}/><span>{focus?'Show interface':'Art focus'}</span></button>
   </div>
  </div>

  {panel&&<><div className="lounge-panel-shade" aria-hidden="true" onClick={dismiss}/><aside ref={drawer} className={'lounge-panel panel-'+panel} role="dialog" aria-modal="true" aria-labelledby="lounge-panel-title">
   <header>
    <div>
     <h2 id="lounge-panel-title">{panel==='roster'?'Choose your company':panel==='wardrobe'?'Private Wardrobe':panel==='profile'?'Profile':panel==='abilities'?'Abilities':'Bonds & Vestigium'}</h2>
    </div>
    <button ref={close} aria-label="Close panel" onClick={dismiss}><X size={22}/></button>
   </header>

   {panel==='wardrobe'?<div className="lounge-atelier-body">
    <p className="lounge-panel-intro">Curated editions for <strong>{name}</strong>. Private 18+ plates shift the salon into Velvet Chiaroscuro lighting.</p>
    <div className="lounge-outfits">{skins.map(s=>{
     const available=getLooks(characterId,s.id);
     const first=available[0];
     const fallbackUniform=s.id==='uniform'&&!first&&character?characterArtwork(character):undefined;
     const previewSrc=first?.thumbnail||first?.src||fallbackUniform;
     const count=available.length||(fallbackUniform?1:0);
     return <button key={s.id} className={'atelier-plate'+(s.adult?' is-mature-plate':'')+(count===0?' is-pending':'')} aria-pressed={selected===s.id} onClick={()=>chooseSkin(s.id)}>
      <span className="atelier-plate-media">
       {previewSrc?<img src={previewSrc} alt="" loading="eager"/>:<Shirt size={30}/>}
       {s.adult&&<em className="atelier-seal">Private 18+</em>}
      </span>
      <span className="atelier-plate-meta">
       <strong>{s.name}</strong>
       <span className="atelier-plate-note">{s.note}</span>
       <small>{count===0?'Forthcoming':count===1?'Curated edition':count+' variations'}</small>
      </span>
     </button>;
    })}</div>
   </div>:panel==='roster'?<>
    <label className="lounge-search"><Search size={17}/><input aria-label="Search lounge characters" placeholder="Name or Guard number" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="lounge-roster">
     {roster.map(c=><button key={c.id} aria-pressed={c.id===characterId} onClick={()=>chooseCharacter(c.id)}><CharacterRosterIcon character={c} lang="en"/><span>{c.name_en||c.name_vi}<small>{c.guard_number?'Guard '+String(c.guard_number).padStart(2,'0'):c.role_en}</small></span></button>)}
     {artworkOnly.map(([id,label])=><button key={id} aria-pressed={id===characterId} onClick={()=>chooseCharacter(id)}><CharacterRosterIcon character={{id,name_en:label}} lang="en"/><span>{label}<small>Atelier Collection</small></span></button>)}
    </div>
    {!roster.length&&!artworkOnly.length&&<p>No matching characters.</p>}
   </>:safe?<CharacterDossier key={characterId+'-'+panel} initialTab={panel==='abilities'?2:0} character={safe} lang="en" characters={safeRecords.filter(c=>c.presentation_visible)} onCharacter={c=>chooseCharacter(c.id)}/>:<p>Character dossier forthcoming.</p>}
  </aside></>}
 </main>;
}
