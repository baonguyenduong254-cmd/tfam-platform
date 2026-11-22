'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,Search,ChevronLeft,ChevronRight,Crown,Shield,Users,Sparkles} from 'lucide-react';
import wardrobe from '../../lib/wardrobe-manifest.json';
import {hasWardrobe} from '../../lib/wardrobe-looks';
import {characterArtwork} from '../../lib/character-artwork';
import {attributeDefinitions,characterAttributes,courtGroup} from '../../lib/character-attributes';
import CharacterRosterIcon from './CharacterRosterIcon';
import {preloadLiveIllust} from '../../lib/motion/load-surfaces';
import DecodedCharacterArt,{warmCharacterArt} from './DecodedCharacterArt';
import './character-showcase.css';
import {orderCharacters} from '../../lib/character-order';
import CharacterAtmosphere from './CharacterAtmosphere';

type Row=Record<string,any>;
const art=wardrobe as Record<string,Record<string,string>>;
const groups=[{id:'all',label:'All',Icon:Users},{id:'crown',label:'The Crown',Icon:Crown},{id:'guard',label:'Royal Guard',Icon:Shield},{id:'official',label:'Officials',Icon:Users}];
const guardNames:Record<number,string>={1:'Uno',2:'Dos',3:'Tres',4:'Cuatro',5:'Cinco',6:'Seis',7:'Siete',8:'Ocho',9:'Nueve',10:'Diez',11:'Once',12:'Doce',22:'Veintidós',25:'Veinticinco',28:'Veintiocho',32:'Treinta y dos',37:'Treinta y siete',42:'Cuarenta y dos',44:'Cuarenta y cuatro',52:'Cincuenta y dos',55:'Cincuenta y cinco',68:'Sesenta y ocho',70:'Setenta',88:'Ochenta y ocho',89:'Ochenta y nueve',90:'Noventa',97:'Noventa y siete',99:'Noventa y nueve',100:'Cien'};
const normalize=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const normalizeAsset=(s?:string)=>(s||'').split(/[?#]/)[0].trim().toLowerCase().replace(/^https?:\/\/[^/]+/,'');

export default function CharacterShowcase({characters}:{characters:Row[]}){
 const dedupedCharacters=useMemo(()=>{
  const seenId=new Set<string>();
  const seenArt=new Set<string>();
  const out:Row[]=[];
  for(const c of orderCharacters(characters)){
   if(!c?.id||seenId.has(c.id))continue;
   const resolved=art[c.id]?.uniform||characterArtwork(c)||'';
   const artKey=normalizeAsset(resolved);
   if(artKey&&seenArt.has(artKey))continue;
   seenId.add(c.id);
   if(artKey)seenArt.add(artKey);
   out.push(c);
  }
  return out;
 },[characters]);

 const [query,setQuery]=useState(''),[group,setGroup]=useState('all'),[active,setActive]=useState(dedupedCharacters[0]?.id||''),[entering,setEntering]=useState(false),[rosterOpen,setRosterOpen]=useState(false);
 const root=useRef<HTMLElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const visible=dedupedCharacters.filter(c=>(group==='all'||courtGroup(c)===group)&&normalize([c.name_en,c.name_vi,c.guard_number].join(' ')).includes(normalize(query)));
 const current=visible.find(c=>c.id===active)||visible[0],index=visible.findIndex(c=>c.id===current?.id);
 const name=current?.name_en||current?.name_vi||'',scores=current?characterAttributes(current):null;
 const image=current&&(art[current.id]?.uniform||characterArtwork(current));
 const hasAtelier=!!(current&&hasWardrobe(current.id));

 useEffect(()=>{for(const neighbor of [visible[index-1],visible[index+1]]){const src=neighbor&&(art[neighbor.id]?.uniform||characterArtwork(neighbor));if(src)void warmCharacterArt(src).catch(()=>{});}},[current?.id,group,query]);
 useEffect(()=>{const saved=sessionStorage.getItem('tfam-champion-selection')||localStorage.getItem('tfam-lounge-favorite');if(saved&&dedupedCharacters.some(c=>c.id===saved))setActive(saved);},[dedupedCharacters]);
 useEffect(()=>{const el=root.current;if(!el)return;let onscreen=true;const sync=()=>{el.dataset.motionActive=String(onscreen&&!document.hidden);};const observer=new IntersectionObserver(([e])=>{onscreen=e.isIntersecting;sync();});observer.observe(el);document.addEventListener('visibilitychange',sync);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);if(timer.current)clearTimeout(timer.current);};},[]);

 function cancelEntry(){if(timer.current){clearTimeout(timer.current);timer.current=null;}setEntering(false);}
 function select(id:string){cancelEntry();setActive(id);sessionStorage.setItem('tfam-champion-selection',id);}
 function enter(wardrobe=false){if(!current||entering)return;sessionStorage.setItem('tfam-champion-selection',current.id);setEntering(true);timer.current=setTimeout(()=>window.location.assign('/evelyne-stage?character='+encodeURIComponent(current.id)+(wardrobe?'#wardrobe':'')),480);}

 return <section ref={root} className={'champion-select'+(entering?' is-entering':'')} aria-label="Character selection">
  <div className="champion-scene" aria-hidden="true"><img src="/evelyne-stage/background-uniform.webp" alt=""/><div className="champion-scrim"/><div className="champion-beam"/></div>
  <div className="champion-presentation"><CharacterAtmosphere identity={current?.id||''}/>
   {current?<><div key={current.id+'copy'} className="champion-identity">
    <p className="champion-membership">{current.guard_number?'Royal Guard · '+(guardNames[current.guard_number]||current.guard_number):current.role_en||'The Court'}</p>
    <h2>{name}</h2>
    <div className="champion-cta-row">
     <button className="champion-enter" onClick={()=>enter()} onPointerEnter={()=>void preloadLiveIllust().catch(()=>{})} onFocus={()=>void preloadLiveIllust().catch(()=>{})} disabled={entering}><span>{hasAtelier?'Enter private salon':'Select character'}</span><ArrowUpRight size={19}/></button>
     {hasAtelier&&<button type="button" className="champion-atelier-tag" onClick={()=>enter(true)} onPointerEnter={()=>void preloadLiveIllust().catch(()=>{})} onFocus={()=>void preloadLiveIllust().catch(()=>{})} disabled={entering}><Sparkles size={13} aria-hidden="true"/> Atelier Wardrobe</button>}
    </div>
   </div>
   <div className="champion-art salon-transition-art" aria-label={name+' uniform'}><div className="champion-art-idle"><DecodedCharacterArt src={image} name={name}/></div></div>
   <aside className="champion-aptitudes" key={current.id+'stats'} aria-label={name+' attributes'}><dl>{attributeDefinitions.map(d=><div key={d.key}><dt>{d.en}</dt><dd>{scores?.[d.key]??'N/A'}<small>/100</small></dd><span className="champion-stat-track" aria-hidden="true"><span style={{transform:`scaleX(${(scores?.[d.key]||0)/100})`,background:d.color}}/></span></div>)}</dl></aside>
   <div className="champion-step"><button aria-label="Previous character" disabled={index<=0} onClick={()=>select(visible[index-1].id)}><ChevronLeft/></button><span>{index+1} / {visible.length}</span><button aria-label="Next character" disabled={index>=visible.length-1} onClick={()=>select(visible[index+1].id)}><ChevronRight/></button></div></>:<div className="champion-empty"><h2>No matching characters</h2><button onClick={()=>{cancelEntry();setQuery('');setGroup('all');}}>Clear filters</button></div>}
  </div>
  <div className={'champion-roster'+(rosterOpen?' is-roster-open':'')}>
   <button className="champion-roster-toggle" aria-expanded={rosterOpen} onClick={()=>setRosterOpen(v=>!v)}>Choose character <span>{name}</span><ChevronRight size={18}/></button>
   <div className="champion-roster-tools">
    <div role="group" aria-label="Character groups">{groups.map(({id,label,Icon})=><button key={id} aria-pressed={group===id} onClick={()=>{cancelEntry();setGroup(id);}}><Icon size={15}/>{label}</button>)}</div>
    <label><Search size={17}/><input aria-label="Search character showcase" placeholder="Name or Guard number" value={query} onChange={e=>{cancelEntry();setQuery(e.target.value);}}/></label>
    <span>{visible.length} characters</span>
   </div>
   <div className="champion-portraits" aria-label="Choose a character" onKeyDown={e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();const focused=(e.target as HTMLElement).closest('button');const focusedIndex=visible.findIndex(c=>'champion-'+c.id===focused?.id);const start=focusedIndex<0?index:focusedIndex;const next=visible[(start+(e.key==='ArrowRight'?1:-1)+visible.length)%visible.length];if(next){select(next.id);const target=document.getElementById('champion-'+next.id);target?.focus({preventScroll:true});if(target){const bounds=e.currentTarget.getBoundingClientRect(),item=target.getBoundingClientRect();if(item.top<bounds.top)e.currentTarget.scrollTop+=item.top-bounds.top;else if(item.bottom>bounds.bottom)e.currentTarget.scrollTop+=item.bottom-bounds.bottom;}}}}>{visible.map(c=><button key={c.id} id={'champion-'+c.id} className={current?.id===c.id?'is-selected':''} aria-pressed={current?.id===c.id} aria-label={'Select '+(c.name_en||c.name_vi)} title={c.name_en||c.name_vi} onClick={()=>select(c.id)}><CharacterRosterIcon character={c} lang="en"/>{c.guard_number&&<small>{String(c.guard_number).padStart(2,'0')}</small>}<span className="champion-portrait-name">{c.name_en||c.name_vi}</span></button>)}</div>
  </div>
 </section>;
}
