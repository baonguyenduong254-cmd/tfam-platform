'use client';
import MediaImage from './MediaImage';

import {ArrowDown,ArrowUpRight,ChevronLeft,ChevronRight} from 'lucide-react';
import {factionArt} from '../../lib/campaign-art';
type Faction={id:string;name_vi:string;name_en:string};
type Props={factions:Faction[];selected:number;year:string;lang:string;onSelect:(index:number)=>void;onOpen:(tab:string)=>void};
export default function EditorialHero({factions,selected,year,lang,onSelect,onOpen}:Props){
 const vi=lang==='vi',f=factions[selected]||factions[0],t=(a:string,b:string)=>b;
 return <header className="editorial-hero" aria-labelledby="editorial-title">
  <div className="editorial-hero-art" key={f.id} aria-hidden="true"><MediaImage src={factionArt(f.id)} alt="" fetchPriority="high" decoding="async"/></div>
  <div className="editorial-hero-top"><a href="#map" onClick={e=>{e.preventDefault();onOpen('map');}} className="editorial-wordmark">TFAM<span>LEONARDO RAVENNA</span></a><span className="editorial-volume">{t('BIÊN NIÊN THẾ GIỚI BĂNG GIÁ','CHRONICLES OF A FROZEN WORLD')}<b>{year}</b></span></div>
  <div className="editorial-hero-body"><div className="editorial-hero-heading"><span className="editorial-kicker">An Alternative History in a Frozen World</span><h1 id="editorial-title">Through Frost<span><i>and</i> Myth</span></h1><p className="editorial-author">by Leonardo Ravenna</p></div><div className="editorial-hero-aside"><span className="editorial-label">{t('MỘT THẾ GIỚI ĐỂ BƯỚC VÀO','A WORLD TO STEP INSIDE')}</span><blockquote>{t('Khi băng giá cuối cùng cũng tan và những huyền thoại lặng im, mong bạn vẫn nhận ra những bàn tay đã đưa mình về nhà.','When the frost finally breaks and the myths fall silent, may you still recognize the hands that carried you home.')}</blockquote><button className="editorial-pill" onClick={()=>onOpen('reader')}>{t('Bắt đầu đọc','Begin reading')}<ArrowUpRight size={17}/></button></div></div>
  <div className="editorial-hero-bottom"><button className="editorial-scroll" onClick={()=>onOpen('map')}><ArrowDown size={17}/><span>{t('KHÁM PHÁ THẾ GIỚI','EXPLORE THE WORLD')}</span></button><div className="editorial-scene"><div aria-live="polite"><span>{t('THẾ LỰC TRONG KHUNG HÌNH','INSIDE THE FRAME')}</span><strong>{vi?f.name_vi:f.name_en}</strong></div><div className="editorial-scene-controls"><button onClick={()=>onSelect((selected-1+factions.length)%factions.length)} aria-label={t('Thế lực trước','Previous faction')}><ChevronLeft size={18}/></button><span>{String(selected+1).padStart(2,'0')}<em>/ {String(factions.length).padStart(2,'0')}</em></span><button onClick={()=>onSelect((selected+1)%factions.length)} aria-label={t('Thế lực tiếp theo','Next faction')}><ChevronRight size={18}/></button></div></div></div>
 </header>;
}
