'use client';
import MediaImage from './MediaImage';

import {useEffect,useRef} from 'react';
import {Eye,X,ArrowUpRight} from 'lucide-react';
type R=Record<string,any>;
export default function QuickPreview({item,kind,lang,year,faction,onClose,onOpen}:{item:R;kind:string;lang:string;year:string;faction:R;onClose:()=>void;onOpen:()=>void}){
 const ref=useRef<HTMLElement>(null),t=(vi:string,en:string)=>en;
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};const outside=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node)&&!(e.target as HTMLElement).closest('[data-preview-faction],.character-list,.quick-view-trigger'))onClose();};document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside);};},[onClose]);
 const lore=kind==='character'?(item['lore_'+lang]||item.lore_vi):(item['lore_'+lang+'_'+year]||item['lore_vi_'+year]);
 return <aside ref={ref} className="quick-preview" aria-label={t('Xem nhanh hồ sơ','Dossier preview')}><button className="preview-close" aria-label={t('Đóng xem nhanh','Close preview')} onClick={onClose}><X size={17}/></button><MediaImage className="preview-art" src={kind==='character'?item.portrait_asset:faction.flag_asset} alt=""/><div><small><Eye size={13}/>{t('XEM NHANH','QUICK LOOK')} · {kind==='faction'?year:t('NHÂN VẬT','CHARACTER')}</small><h3>{item['name_'+lang]||item.name_vi||item.name}</h3><p>{lore}</p><button className="preview-open" onClick={onOpen}>{t('Khám phá hồ sơ','Explore dossier')}<ArrowUpRight size={15}/></button></div></aside>;
}
