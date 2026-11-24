import Link from 'next/link';
import {BookOpen,Compass,Gem} from 'lucide-react';
import type {MouseEventHandler} from 'react';
import SiteEmblem from './SiteEmblem';
import {preloadChronicles,preloadVestigium} from '../../lib/motion/load-surfaces';

type Props={
 section?: 'faction'|'vestigium'|'reader';
 lang?: string;
 onClickCapture?: MouseEventHandler<HTMLElement>;
};

export default function SiteSectionNav({section,lang='en',onClickCapture}:Props){
 const t=(vi:string,en:string)=>lang==='vi'?vi:en;
 const preload=(task:()=>Promise<unknown>)=>void task().catch(()=>{});
 return <nav onClickCapture={onClickCapture} className="site-section-nav" aria-label={t('Các không gian TFAM','TFAM destinations')}><span className="site-end-emblem"><SiteEmblem/></span><Link className="site-section-brand" href="/#map">{t('Qua Băng Giá và Thần Thoại','Through Frost and Myth')}</Link><div><Link href="/#map" aria-current={section==='faction'?'page':undefined}><Compass size={16}/>{t('Thế giới','The world')}</Link><Link href="/vestigium" onPointerEnter={()=>preload(preloadVestigium)} onFocus={()=>preload(preloadVestigium)} aria-current={section==='vestigium'?'page':undefined}><Gem size={16}/>Vestigium</Link><Link href="/chronicles" onPointerEnter={()=>preload(preloadChronicles)} onFocus={()=>preload(preloadChronicles)} aria-current={section==='reader'?'page':undefined}><BookOpen size={16}/>{t('Đọc truyện','Chronicles')}</Link></div><span className="site-end-emblem" aria-hidden="true"><SiteEmblem/></span></nav>;
}
