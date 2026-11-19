'use client';
import CharacterRosterIcon from './CharacterRosterIcon';
import {useEffect,useRef,useState} from 'react';
import {Crown,Search,Shield,ScrollText,ChevronDown,Swords,Compass,Users,ArrowUpRight} from 'lucide-react';
import useModalFocus from '../hooks/useModalFocus';
import {attributeDefinitions,characterAttributes,courtGroup} from '../../lib/character-attributes';
import '../castilian-court.css';
import '../character-command.css';
type Row=Record<string,any>;
const groups=[['crown','Vương miện','The Crown',Crown],['guard','Cận vệ Hoàng gia','Royal Guard',Shield],['official','Quan chức Hoàng gia','Royal Officials',ScrollText],['household','Gia quyến & cộng đồng','Household & community',Users],['affiliate','Liên hệ ngoại giao','Diplomatic affiliations',Users]] as const;
export function CastilianInstitutions({characters,selected,lang,onCharacter}:{characters:Row[];selected:string;lang:string;onCharacter:(c:Row)=>void}){
 const t=(a:string,b:string)=>b,crown=characters.find(c=>courtGroup(c)==='crown'),affiliates=characters.filter(c=>courtGroup(c)==='affiliate'),household=characters.filter(c=>courtGroup(c)==='household');
 function person(c:Row,root=false){return <button key={c.id} type="button" onClick={()=>onCharacter(c)} aria-pressed={selected===c.id} className={'court-person-node'+(root?' crown-person':'')}><CharacterRosterIcon character={c} lang={lang}/><span><strong>{c['name_'+lang]||c.name}</strong><small>{c['office_'+lang]||c['role_'+lang]||c.role_vi}</small></span>{c.guard_number&&<b>{String(c.guard_number).padStart(2,'0')}</b>}</button>;}
 return <details className="royal-organization"><summary><span className="organization-emblem"><Crown size={22} strokeWidth={1.2}/></span><span><strong>{t('Triều đình Castilian','The Castilian court')}</strong><small>{t('Sơ đồ tổ chức · Vương miện và hai nhánh phụng sự','Organisation · The Crown and its two branches of service')}</small></span><ChevronDown size={18}/></summary><div className="organization-content"><div className="organization-root"><span><Crown size={15}/>{t('Vương miện','The Crown')}</span>{crown&&person(crown,true)}</div><div className="organization-branches">{groups.filter(g=>g[0]==='guard'||g[0]==='official').map(([key,vi,en,Icon])=>{const members=characters.filter(c=>courtGroup(c)===key).sort((a,b)=>(a.guard_number||0)-(b.guard_number||0));return <section key={key} className="organization-branch"><h3><Icon size={20}/>{t(vi,en)}<span>{members.length}</span></h3><p>{key==='guard'?t('Số hiệu và trọng trách riêng của từng Cận vệ.','Each guard retains their number and individual responsibilities.'):t('Chính sự, tham mưu và các sĩ quan phục vụ Hoàng gia.','Government, counsel and officers serving the Crown.')}</p><div className="organization-members">{members.map(c=>person(c))}</div></section>;})}</div><p className="organization-note">{t('Sơ đồ tổng hợp vai trò qua các arc. Chức vụ kiêm nhiệm được giữ trên từng thẻ; số hiệu Cận vệ được trình bày cùng hồ sơ cá nhân.','This tree summarises roles across the arcs. Concurrent offices remain on their cards; guard numbers accompany individual dossiers.')}</p>{household.length>0&&<aside className="organization-household"><h3>{t('Gia quyến & cộng đồng','Household & community')}</h3><p>{t('Các mối liên hệ gia đình, được ghi riêng với chức vụ trong bộ máy Hoàng gia.','Family connections are recorded separately from appointments in the royal government.')}</p><div>{household.map(c=>person(c))}</div></aside>}{affiliates.length>0&&<aside className="organization-affiliations"><span><ArrowUpRight size={15}/>{t('Liên hệ ngoại giao · hồ sơ ở triều đình khác','Diplomatic affiliations · dossiers of other courts')}</span><div>{affiliates.map(c=>person(c))}</div></aside>}</div></details>;
}
export default function CastilianCourt({characters,selected,lang,onCharacter,factionId='castilian_empire',factionName='Castilian'}:{characters:Row[];selected:string;lang:string;onCharacter:(c:Row)=>void;factionId?:string;factionName?:string}){
 const [query,setQuery]=useState(''),[affinity,setAffinity]=useState('all'),[mobile,setMobile]=useState(false),[drawer,setDrawer]=useState(false);
 const panel=useRef<HTMLElement>(null),t=(a:string,b:string)=>b,isCastilian=factionId==='castilian_empire';
 useModalFocus(panel,()=>setDrawer(false),mobile&&drawer);
 useEffect(()=>{const media=matchMedia('(max-width:900px)');const sync=()=>{setMobile(media.matches);if(!media.matches)setDrawer(false);};sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 useEffect(()=>{try{const p=JSON.parse(sessionStorage.getItem('tfam-roster:'+factionId)||'{}');setQuery(p.query||'');setAffinity(p.affinity||'all');}catch{}},[factionId]);
 function filters(q:string,a:string){setQuery(q);setAffinity(a);try{sessionStorage.setItem('tfam-roster:'+factionId,JSON.stringify({query:q,affinity:a}));}catch{}}
 const normalize=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/g,'d').toLowerCase();
 const matches=characters.filter(c=>normalize([c.name_en,c.name_vi,c.name,c.role_en,c.guard_number].join(' ')).includes(normalize(query))&&(affinity==='all'||(characterAttributes(c)?.[affinity]??-1)>=80));
 const branchGroups=isCastilian?groups:[['all','Nhân vật','Characters',Users] as const];
 function choose(c:Row){setDrawer(false);onCharacter(c);}
 return <aside ref={panel} className="character-list command-roster" data-drawer={mobile&&drawer?'open':'closed'} role={mobile&&drawer?'dialog':undefined} aria-modal={mobile&&drawer?true:undefined} aria-label="Character register">
  <header><h2>Character register</h2><p>{characters.length} dossiers</p><button className="roster-drawer-toggle" aria-expanded={drawer} aria-controls="roster211-content" onClick={()=>setDrawer(v=>!v)}>{drawer?'Close register':'Choose a character'}<ChevronDown size={18}/></button></header>
  <div id="roster211-content" hidden={mobile&&!drawer}>{mobile&&drawer&&isCastilian&&<CastilianInstitutions characters={characters} selected={selected} lang={lang} onCharacter={choose}/>}
   <label className="command-search"><Search size={16}/><input value={query} onChange={e=>filters(e.target.value,affinity)} placeholder="Name, office, guard number…" aria-label={isCastilian?'Search Castilian characters':'Search characters'}/></label>
   <label className="command-affinity-filter"><span>Affinity</span><select aria-label="Filter by dominant attribute" value={affinity} onChange={e=>filters(query,e.target.value)}><option value="all">All</option>{attributeDefinitions.map(d=><option key={d.key} value={d.key}>{d.en}</option>)}</select></label>
   {!matches.length&&<div role="status"><p>No matching dossiers.</p><button onClick={()=>filters('','all')}>Clear filters</button></div>}
   <div className="command-roster-groups">{branchGroups.map(([key,vi,en,Icon])=>{
    const group=matches.filter(c=>key==='all'||courtGroup(c)===key).sort((a,b)=>(a.guard_number||0)-(b.guard_number||0));
    return group.length?<section key={key}><h3><Icon size={15}/>{en}<span>{group.length}</span></h3>{group.map(c=><button key={c.id} type="button" aria-pressed={selected===c.id} onClick={()=>choose(c)}>
     <CharacterRosterIcon character={c} lang={lang}/><span className="command-person-copy"><strong>{c['name_'+lang]||c.name}</strong><small>{c['role_'+lang]||c.role_vi}</small></span>{c.guard_number&&<em>{String(c.guard_number).padStart(2,'0')}</em>}
    </button>)}</section>:null;
   })}</div>
  </div>
 </aside>;
}
