'use client';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import {useEffect,useRef} from 'react';
import MediaImage from './MediaImage';
import ExperienceAtmosphere from './ExperienceAtmosphere';
import {sceneArt} from '../../lib/faction-scene';
import {factionTaglines} from '../../lib/faction-taglines';
import {factionCapital} from '../../lib/faction-content';
import ImperialWeather from './ImperialWeather';
import '../imperial-arrival.css';
type R=Record<string,any>;
export default function FactionArrival({faction:f,lang,compact=false,year='1715',regions=0}:{faction:R;lang:string;compact?:boolean;year?:string;regions?:number}){
 const root=useRef<HTMLElement>(null);
 const imperial=f.id==='castilian_empire'&&!compact;
 const name=presentationPunctuation(f['name_'+lang]||f.name_en||f.name_vi||''),quote=factionTaglines[f.id],arrivalLine=f.id==='castilian_empire'?'An empire forged in war. A crown tested by winter.':f.id==='sultanate_of_morocco'?'Between the Atlas and the sea, a caliphate endures the frost.':quote?.en;
 useEffect(()=>{
  const el=root.current;if(!el||compact)return;
  let repeat=false;try{repeat=sessionStorage.getItem('tfam-arrival:'+f.id)==='seen';sessionStorage.setItem('tfam-arrival:'+f.id,'seen');}catch{}
  const image=el.querySelector('.arrival-art'),flag=el.querySelector('.arrival-flag'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animations=[image?.animate?.(reduced?[{opacity:.85},{opacity:1}]:[{transform:'scale(1.045)'},{transform:'scale(1)'}],{duration:repeat?280:900,easing:'cubic-bezier(.16,1,.3,1)'}),flag?.animate?.(reduced?[{opacity:.7},{opacity:1}]:[{transform:'perspective(680px) translate3d(0,-18px,55px) rotateY(-24deg)'},{transform:'perspective(680px) translate3d(0,0,0) rotateY(0)'}],{duration:repeat?220:650,easing:'cubic-bezier(.16,1,.3,1)'})];
  let visible=true;
  const sync=()=>{el.dataset.running=visible&&!document.hidden?'true':'false';animations.forEach(a=>{if(a?.playState==='finished')return;visible&&!document.hidden?a?.play():a?.pause();});};
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();});observer.observe(el);
  document.addEventListener('visibilitychange',sync);
  return()=>{animations.forEach(a=>a?.cancel());observer.disconnect();document.removeEventListener('visibilitychange',sync);};
 },[f.id,compact]);
 return <header ref={root} className={'world-arrival faction-themed arrival211'+(compact?' is-compact':'')+(imperial?' empire-arrival':'')} data-faction={f.id}>
  {!compact&&(imperial?<ImperialWeather/>:<ExperienceAtmosphere variant="world"/>)}
  {!compact&&<div className="arrival-art" aria-hidden="true"><MediaImage src={imperial?'/overview223/castilian-arrival.webp':sceneArt(f)} alt="" width={1920} height={1080} fetchPriority="high"/></div>}
  <div className="arrival-copy"><MediaImage className="arrival-flag" src={f.flag_asset} width={1200} height={800} alt="" style={{viewTransitionName:'tfam-faction-banner'}}/><div><h1>{name}</h1>{!compact&&quote&&<p className="arrival-quote">{presentationPunctuation((lang==='vi'?quote.vi:arrivalLine)||'')}</p>}</div></div>
  {imperial&&<dl className="imperial-facts"><div><dt>Year</dt><dd>{year}</dd></div><div><dt>Capital</dt><dd>{factionCapital(f,lang,year)}</dd></div><div><dt>Territories</dt><dd>{regions} regions</dd></div></dl>}
 </header>;
}
