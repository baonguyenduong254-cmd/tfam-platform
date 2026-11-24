'use client';
import {characterArtwork} from '../../lib/character-artwork';
import MediaImage from './MediaImage';

import {useRef} from 'react';
import {createPortal} from 'react-dom';
import {BookOpen,Crown,Flag,Landmark,Shield,Swords,Users,X} from 'lucide-react';
import {factionCapital} from '../../lib/faction-content';
import {sceneArt} from '../../lib/faction-scene';
import {unitIllustration} from '../../lib/unit-art';
import useModalFocus from '../hooks/useModalFocus';
type R=Record<string,any>;
type Props={faction:R;characters:R[];units:R[];lang:string;year:string;regions:number;motion:boolean;onClose:()=>void;onCharacter:(character:R)=>void;onUnit:(unit:R)=>void};
const written=(v:unknown)=>typeof v==='string'&&v.trim().length>0&&!/^(placeholder|place holder|tbd|chưa (có|bổ sung|điền))([ .:…]|$)/i.test(v.trim());
export default function FactionGallery({faction:f,characters,units,lang,year,regions,motion,onClose,onCharacter,onUnit}:Props){
 const ref=useRef<HTMLDivElement>(null);useModalFocus(ref,onClose);
 const tr=(vi:string,en:string)=>en,local=(r:R,k:string)=>r[k+'_'+lang]||r[k+'_vi']||r[k]||'',name=local(f,'name'),lore=f['lore_'+lang+'_'+year]||f['lore_vi_'+year]||'',traits=(f.traits||[]).filter((r:R)=>written(local(r,'label')));
 function jump(id:string){ref.current?.querySelector('#'+id)?.scrollIntoView({behavior:motion?'smooth':'instant',block:'start'});}
 return createPortal(<div ref={ref} className="faction-gallery" role="dialog" aria-modal="true" aria-labelledby="gallery-title" tabIndex={-1} data-language={lang} data-motion={motion?'on':'off'} style={{'--empire-color':f.ui_color_secondary||'#d3bb85'} as React.CSSProperties}>
  <div className="gallery-toolbar"><div><span>TFAM</span><small>{tr('Hồ sơ thế lực','Faction dossier')} · {year}</small></div><button className="gallery-close" onClick={onClose}><X size={20}/><span>{tr('Trở về Atlas','Return to Atlas')}</span></button></div>
  <header className="gallery-hero">
   <MediaImage className="gallery-cover" src={sceneArt(f)} alt="" decoding="async"/>
   <div className="gallery-hero-copy"><span className="eyebrow">{tr('BIÊN NIÊN CÁC ĐẾ CHẾ','CHRONICLES OF THE EMPIRES')}</span><MediaImage className="gallery-banner" src={f.flag_asset} alt=""/><h1 id="gallery-title">{name}</h1><dl><div><dt><Landmark size={16}/>{tr('Thủ đô','Capital')}</dt><dd>{factionCapital(f,lang,year)}</dd></div><div><dt><Flag size={16}/>{tr('Lãnh thổ','Territories')}</dt><dd>{regions} {tr('vùng','regions')}</dd></div></dl></div>
  </header>
  <div className="gallery-body">
   <nav className="gallery-index" aria-label={tr('Mục lục hồ sơ','Dossier contents')}><span>{tr('TRONG HỒ SƠ','IN THIS DOSSIER')}</span>{[{id:'gallery-chronicle',icon:BookOpen,vi:'Biên niên',en:'Chronicle'},{id:'gallery-identity',icon:Crown,vi:'Đặc trưng',en:'Identity'},{id:'gallery-people',icon:Users,vi:'Nhân vật',en:'People'},{id:'gallery-armies',icon:Swords,vi:'Quân đội',en:'Armies'}].map(n=><button key={n.id} onClick={()=>jump(n.id)}><n.icon size={17}/>{tr(n.vi,n.en)}</button>)}</nav>
   <div className="gallery-record">
    <section id="gallery-chronicle" className="gallery-chronicle"><img className="gallery-chronicle-art" src={sceneArt(f)} alt="" loading="lazy"/><span className="gallery-section-label">I · {year}</span><h2>{tr('Biên niên thế lực','The faction chronicle')}</h2>{written(lore)?<div className="gallery-prose" key={year+'-'+lang}>{lore.split(/\n\s*\n/).filter(Boolean).map((p:string,i:number)=><p key={i}>{p}</p>)}</div>:<p className="archive-pending">{tr('Biên niên đang được biên soạn.','The chronicle is being prepared.')}</p>}{lang==='en'&&!f['lore_en_'+year]&&<small>Vietnamese source · English translation pending</small>}</section>
    <section id="gallery-identity"><span className="gallery-section-label">II</span><h2>{tr('Bản sắc đế chế','Imperial identity')}</h2><div className="gallery-traits">{traits.map((a:R,i:number)=><article key={a.id}><span className="gallery-trait-number">{String(i+1).padStart(2,'0')}</span><h3>{local(a,'label')}</h3><p>{local(a,'effect')||a.effect_ui}</p></article>)}</div>{!traits.length&&<p className="archive-pending">{tr('Hồ sơ đặc trưng đang được biên soạn.','The identity record is being prepared.')}</p>}</section>
    <section id="gallery-people"><span className="gallery-section-label">III</span><h2>{tr('Những người làm nên thời đại','People of the age')}</h2><div className="gallery-people">{characters.map(c=><button className="gallery-person" key={c.id} onClick={()=>onCharacter(c)}><span className={'gallery-person-image '+(!c.portrait_asset?'emblem-portrait':'')} style={c.portrait_asset?{backgroundImage:`url(${sceneArt(f)})`}:undefined}>{c.portrait_asset&&<MediaImage src={characterArtwork(c)} alt="" loading="lazy"/>}</span><span className="gallery-card-copy"><strong>{local(c,'name')}</strong><span className="gallery-card-action">{tr('Mở hồ sơ nhân vật','Open character dossier')}</span></span></button>)}</div>{!characters.length&&<p className="archive-pending">{tr('Hồ sơ nhân vật đang được biên soạn.','Character records are being prepared.')}</p>}</section>
    <section id="gallery-armies"><span className="gallery-section-label">IV</span><h2>{tr('Dưới quân kỳ','Under the banner')}</h2><div className="gallery-armies">{units.map(u=><button className="gallery-unit" key={u.id} onClick={()=>onUnit(u)}><span className="gallery-unit-image" style={{backgroundImage:`url(${unitIllustration(f.id,u.image_asset)})`}}></span><span className="gallery-card-copy"><strong>{local(u,'name')}</strong><small>{local(u,'role')}</small><span className="gallery-card-action">{tr('Mở hồ sơ đơn vị','Open unit dossier')}</span></span></button>)}</div>{!units.length&&<p className="archive-pending">{tr('Hồ sơ quân đội đang được biên soạn.','Military records are being prepared.')}</p>}</section>
    <div className="gallery-end"><MediaImage src={f.flag_asset} alt=""/><span>{name} · {year}</span><button onClick={onClose}>{tr('Trở về Atlas','Return to Atlas')}</button></div>
   </div>
  </div>
 </div>,document.body);
}
