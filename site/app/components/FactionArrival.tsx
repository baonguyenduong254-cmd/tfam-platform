'use client';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import {useEffect,useRef} from 'react';
import MediaImage from './MediaImage';
import ExperienceAtmosphere from './ExperienceAtmosphere';
import {sceneArt} from '../../lib/faction-scene';
import {factionTaglines} from '../../lib/faction-taglines';
import {motionPreference} from '../../lib/motion/preference';
type R=Record<string,any>;
export default function FactionArrival({faction:f,lang,compact=false}:{faction:R;lang:string;compact?:boolean}){
 const root=useRef<HTMLElement>(null);
 const name=presentationPunctuation(f['name_'+lang]||f.name_en||f.name_vi||''),quote=factionTaglines[f.id],arrivalLine=f.id==='castilian_empire'?'An empire forged in war. A crown tested by winter.':f.id==='sultanate_of_morocco'?'Between the Atlas and the sea, a caliphate endures the frost.':quote?.en;
 useEffect(()=>{
  const el=root.current;if(!el||compact||motionPreference.matches)return;
  let repeat=false;try{repeat=sessionStorage.getItem('tfam-arrival:'+f.id)==='seen';sessionStorage.setItem('tfam-arrival:'+f.id,'seen');}catch{}
  const image=el.querySelector('.arrival-art'),flag=el.querySelector('.arrival-flag');
  const animations=[image?.animate([{transform:'scale(1.045)'},{transform:'scale(1)'}],{duration:repeat?280:1050,easing:'cubic-bezier(.16,1,.3,1)'}),flag?.animate([{transform:'translateY(-18px) rotate(-4deg)'},{transform:'translateY(0) rotate(0)'}],{duration:repeat?220:850,easing:'cubic-bezier(.16,1,.3,1)'})];
  let visible=true;
  const sync=()=>animations.forEach(a=>{if(motionPreference.matches){a?.cancel();return;}if(a?.playState==='finished')return;visible&&!document.hidden?a?.play():a?.pause();});
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();});observer.observe(el);
  document.addEventListener('visibilitychange',sync);motionPreference.addEventListener('change',sync);
  return()=>{animations.forEach(a=>a?.cancel());observer.disconnect();document.removeEventListener('visibilitychange',sync);motionPreference.removeEventListener('change',sync);};
 },[f.id,compact]);
 return <header ref={root} className={'world-arrival faction-themed arrival211'+(compact?' is-compact':'')} data-faction={f.id}>
  {!compact&&<ExperienceAtmosphere variant="world"/>}
  {!compact&&<div className="arrival-art" aria-hidden="true"><MediaImage src={sceneArt(f)} alt="" width={1920} height={1080} fetchPriority="high"/></div>}
  <div className="arrival-copy"><MediaImage className="arrival-flag" src={f.flag_asset} width={1200} height={800} alt="" style={{viewTransitionName:'tfam-faction-banner'}}/><div><h1>{name}</h1>{!compact&&quote&&<p className="arrival-quote">{presentationPunctuation((lang==='vi'?quote.vi:arrivalLine)||'')}</p>}</div></div>
 </header>;
}
