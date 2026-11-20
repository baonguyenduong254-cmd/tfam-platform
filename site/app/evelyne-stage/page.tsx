'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowLeft,BookOpen,Maximize2,Minimize2,X,Users,Shirt,Heart,Swords,Link2,Search,Star} from 'lucide-react';
import {attributeDefinitions,characterAttributes} from '../../lib/character-attributes';
import seed from '../../lib/seed.json';
import {withCharacterPortraits} from '../../lib/character-portraits';
import {characterArtwork} from '../../lib/character-artwork';
import {belongsToFaction} from '../../lib/castilian-presentation';
import collectionNames from '../../lib/wardrobe-collection-names.json';
import {getLooks,hasWardrobe} from '../../lib/wardrobe-looks';
import CharacterDossier from '../components/CharacterDossier';
import CharacterRosterIcon from '../components/CharacterRosterIcon';
import {presentCharacter} from '../../lib/revelation';
import {useDiscovery} from '../components/DiscoveryProgress';
import './lounge.css';
import {orderCharacters} from '../../lib/character-order';
const skins=[{id:'uniform',name:'Uniform',scene:'The observatory'},{id:'office',name:'Office',scene:'The private study'},{id:'naughty_office',name:'Naughty Office',scene:'The private study',adult:true},{id:'afterwork',name:'Afterwork',scene:'The evening salon',adult:true},{id:'beach',name:'Beach',scene:'The coastal terrace',adult:true}];
const initial=withCharacterPortraits(seed);
type Panel='profile'|'abilities'|'bonds'|'wardrobe'|'roster'|null;
function preference(key:string){try{return localStorage.getItem(key)||'';}catch{return '';}}
const normalize=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export default function CharacterLounge(){
 const discovery=useDiscovery();
 const [characterId,setCharacterId]=useState('evelyne_vesper'),[selected,setSelected]=useState('uniform'),[ready,setReady]=useState(false),[records,setRecords]=useState<Record<string,any>[]>(initial.characters);
 const [variant,setVariant]=useState('');
 const [panel,setPanel]=useState<Panel>(null),[focus,setFocus]=useState(false),[closeup,setCloseup]=useState(false),[failedSrc,setFailedSrc]=useState(''),[favorite,setFavorite]=useState(''),[query,setQuery]=useState('');
 const root=useRef<HTMLElement>(null),drawer=useRef<HTMLElement>(null),close=useRef<HTMLButtonElement>(null),lastFocus=useRef<HTMLElement|null>(null);
 const character=records.find(c=>c.id===characterId),name=character?.name_en||character?.name_vi||(collectionNames as Record<string,string>)[characterId]||'Character forthcoming';
 const safeRecords=records.map(c=>presentCharacter(c,discovery.earned)),safe=safeRecords.find(c=>c.id===characterId);
 const attributes=character?characterAttributes(character):null,skin=skins.find(s=>s.id===selected)||skins[0];
 const looks=getLooks(characterId,selected);
 const look=looks.find(l=>l.id===variant)||looks[0];
 const portrait=look?.src||(selected==='uniform'&&character?characterArtwork(character):undefined);
 const environment=look?.background||'/evelyne-stage/background-'+(selected==='naughty_office'?'office':selected)+'.webp';
 const artStyle=look?.size?{'--look-size':look.size+'%','--look-bottom':look.bottom+'%','--look-warmth':look.warmth} as CSSProperties:undefined;
 const error=!!portrait&&failedSrc===portrait;
 const faction=character?.faction_id==='england_ruins'?'castilian_empire':character?.faction_id||'castilian_empire';
 const roster=orderCharacters(safeRecords).filter(c=>c.presentation_visible&&(belongsToFaction(c,faction)||hasWardrobe(c.id))&&normalize([c.name_en,c.guard_number].join(' ')).includes(normalize(query)));
 const artworkOnly=Object.entries(collectionNames).filter(([id,label])=>!records.some(c=>c.id===id)&&normalize(label).includes(normalize(query)));
 useEffect(()=>{function sync(){const url=new URL(location.href);setVariant(url.searchParams.get('look')||'');setCharacterId(url.searchParams.get('character')||preference('tfam-lounge-favorite')||'evelyne_vesper');setSelected(skins.some(s=>s.id===url.hash.slice(1))?url.hash.slice(1):'uniform');setReady(true);}sync();setFavorite(preference('tfam-lounge-favorite')||'');window.addEventListener('popstate',sync);const controller=new AbortController();fetch('/api/content',{signal:controller.signal}).then(r=>r.ok?r.json() as Promise<{data?:any}>:null).then(r=>{if(r?.data?.characters)setRecords(withCharacterPortraits(r.data).characters);}).catch(()=>{});return()=>{window.removeEventListener('popstate',sync);controller.abort();};},[]);
 useEffect(()=>{setFailedSrc('');},[characterId,selected,variant]);
 useEffect(()=>{const stage=root.current;if(!stage)return;let visible=false;const sync=()=>{stage.dataset.motionActive=String(visible&&!document.hidden);};const obs=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();});obs.observe(stage);document.addEventListener('visibilitychange',sync);return()=>{obs.disconnect();document.removeEventListener('visibilitychange',sync);};},[]);
 useEffect(()=>{if(!panel)return;close.current?.focus({preventScroll:true});const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();dismiss();}if(e.key==='Tab'){const nodes=Array.from(drawer.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]')||[]).filter(n=>n.tabIndex>=0&&n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(!drawer.current?.contains(document.activeElement)){e.preventDefault();(e.shiftKey?last:first).focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[panel]);
 function dismiss(){setPanel(null);requestAnimationFrame(()=>lastFocus.current?.focus({preventScroll:true}));}
 function open(next:Panel,button:HTMLElement){lastFocus.current=button;setPanel(next);setFocus(false);}
 function setLocation(id:string,category:string,lookId=''){const url=new URL(location.href);url.searchParams.set('character',id);if(lookId)url.searchParams.set('look',lookId);else url.searchParams.delete('look');url.hash=category==='uniform'?'':category;history.pushState(null,'',url);}
 function chooseSkin(id:string){setSelected(id);setVariant('');setCloseup(false);setLocation(characterId,id);dismiss();}
 function chooseVariant(id:string){setVariant(id);setCloseup(false);setLocation(characterId,selected,id);}
 function chooseCharacter(id:string){const category=getLooks(id,selected).length?selected:getLooks(id,'uniform').length?'uniform':getLooks(id,'beach').length?'beach':'uniform';setCharacterId(id);setSelected(category);setVariant('');setCloseup(false);setQuery('');sessionStorage.setItem('tfam-champion-selection',id);setLocation(id,category);dismiss();}
 function pin(){const next=favorite===characterId?'':characterId;setFavorite(next);try{if(next)localStorage.setItem('tfam-lounge-favorite',next);else localStorage.removeItem('tfam-lounge-favorite');}catch{}}
 return <main ref={root} className={'character-lounge look-'+selected+(closeup?' is-closeup':'')+(focus?' is-art-focus':'')+(panel?' has-panel':'')+(look?.size?' has-authored-scene':'')} style={artStyle} data-ready={ready}>
 <div className="lounge-environment" aria-hidden="true"><img key={environment} src={environment} alt="" onError={e=>{const fallback='/evelyne-stage/background-'+(selected==='naughty_office'?'office':selected)+'.webp';if(e.currentTarget.getAttribute('src')!==fallback)e.currentTarget.src=fallback;}}/><div className="lounge-scrim"/><div className="lounge-daylight"/></div>
 <div className="lounge-ui" inert={panel?true:undefined}>
 <header className="lounge-top"><a href="/">Through Frost and Myth</a><button onClick={()=>window.location.assign('/#archive/'+faction+'/characters')}><ArrowLeft size={16}/> Character register</button></header>
 <section className="lounge-identity" key={characterId}><h1>{ready?name:'Character lounge'}</h1><p>{character?.guard_number?'Royal Guard · '+String(character.guard_number).padStart(2,'0')+(characterId==='sonia'?' · Setenta':characterId==='trucia'?' · Noventa y Siete':''):character?.role_en||(character?'The Court':'Artwork collection')}</p><button className="lounge-favorite" aria-pressed={favorite===characterId} onClick={pin}><Star size={16} fill={favorite===characterId?'currentColor':'none'}/>{favorite===characterId?'Your lobby character':'Set as lobby character'}</button></section>
 <div className="lounge-look-title" key={selected}><h2>{skin.name}</h2><p>{look?.scene||skin.scene}{skin.adult?' · 18+':''}</p>{looks.length>1&&<div className="lounge-versions" aria-label="Artwork versions">{looks.map((l,i)=><button key={l.id} aria-pressed={look?.id===l.id} aria-label={l.label} onClick={()=>chooseVariant(l.id)}>{String(i+1).padStart(2,'0')}<span>{l.label}</span></button>)}</div>}</div>
 <section className="lounge-art" aria-label={name+' '+skin.name+' artwork'}><div key={portrait} className="lounge-art-arrival"><div className="lounge-art-idle">{look?.size&&<div className="lounge-contact-shadow" aria-hidden="true"/>}{ready&&portrait&&!error?<img src={portrait} alt={name+' · '+skin.name} fetchPriority="high" onError={()=>setFailedSrc(portrait||'')}/>:<div className="lounge-missing"><Shirt size={38}/><p>{error?'Artwork could not load':'Artwork forthcoming'}</p><span>{skin.name}</span>{error&&<button onClick={()=>setFailedSrc('')}>Retry artwork</button>}</div>}</div></div></section>
 {character&&<section className="lounge-quick-stats" aria-label="Personal aptitudes">{attributeDefinitions.map(d=><div key={d.key}><span>{d.en}</span><strong>{attributes?.[d.key]??'—'}</strong></div>)}</section>}
 <nav className="lounge-actions" aria-label="Character lounge"><button disabled={!character} onClick={e=>open('profile',e.currentTarget)}><BookOpen/><span>Profile</span></button><button disabled={!character} onClick={e=>open('abilities',e.currentTarget)}><Swords/><span>Abilities</span></button><button disabled={!character} onClick={e=>open('bonds',e.currentTarget)}><Link2/><span>Bonds</span></button><button onClick={e=>open('wardrobe',e.currentTarget)}><Shirt/><span>Wardrobe</span></button><button onClick={e=>open('roster',e.currentTarget)}><Users/><span>Characters</span></button></nav>
 <div className="lounge-view-controls"><button aria-pressed={closeup} onClick={()=>setCloseup(v=>!v)}>{closeup?<Minimize2 size={17}/>:<Maximize2 size={17}/>}<span>{closeup?'Full figure':'Close-up'}</span></button><button aria-pressed={focus} onClick={()=>setFocus(v=>!v)}><Maximize2 size={17}/><span>{focus?'Show interface':'Art focus'}</span></button></div>
 </div>
 {panel&&<><div className="lounge-panel-shade" aria-hidden="true" onClick={dismiss}/><aside ref={drawer} className={'lounge-panel panel-'+panel} role="dialog" aria-modal="true" aria-labelledby="lounge-panel-title"><header><h2 id="lounge-panel-title">{panel==='roster'?'Choose your company':panel==='wardrobe'?'Wardrobe':panel==='profile'?'Profile':panel==='abilities'?'Abilities':'Bonds & Vestigium'}</h2><button ref={close} aria-label="Close panel" onClick={dismiss}><X size={22}/></button></header>
 {panel==='wardrobe'?<><p className="lounge-panel-intro">{name}</p><div className="lounge-outfits">{skins.map(s=>{const available=getLooks(characterId,s.id),first=available[0];return <button key={s.id} aria-pressed={selected===s.id} onClick={()=>chooseSkin(s.id)}><span>{first?<img src={first.thumbnail||first.src} alt="" loading="lazy"/>:<Shirt size={30}/>}</span><strong>{s.name}</strong><small>{s.adult?'18+ · ':''}{available.length?available.length===1?'Available':available.length+' versions':'Artwork forthcoming'}</small></button>;})}</div></>:panel==='roster'?<><label className="lounge-search"><Search size={17}/><input aria-label="Search lounge characters" placeholder="Name or Guard number" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="lounge-roster">{roster.map(c=><button key={c.id} aria-pressed={c.id===characterId} onClick={()=>chooseCharacter(c.id)}><CharacterRosterIcon character={c} lang="en"/><span>{c.name_en||c.name_vi}<small>{c.guard_number?'Guard '+String(c.guard_number).padStart(2,'0'):c.role_en}</small></span></button>)}{artworkOnly.map(([id,label])=><button key={id} aria-pressed={id===characterId} onClick={()=>chooseCharacter(id)}><span className="lounge-artwork-icon"><img src={getLooks(id,'beach')[0]?.thumbnail} alt="" loading="lazy"/></span><span>{label}<small>Artwork collection</small></span></button>)}</div>{!roster.length&&!artworkOnly.length&&<p>No matching characters.</p>}</>:safe?<CharacterDossier key={characterId+'-'+panel} initialTab={panel==='abilities'?2:0} character={safe} lang="en" characters={safeRecords.filter(c=>c.presentation_visible)} onCharacter={c=>chooseCharacter(c.id)}/>:<p>Character dossier forthcoming.</p>}
 </aside></>}
 </main>;
}



