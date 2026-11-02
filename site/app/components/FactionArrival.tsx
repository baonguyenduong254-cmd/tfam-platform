'use client';
import ExperienceAtmosphere from './ExperienceAtmosphere';
import MediaImage from './MediaImage';
import {sceneArt} from './FactionPanorama';
import {factionTaglines} from '../../lib/faction-taglines';
type R=Record<string,any>;
export default function FactionArrival({faction:f,lang}:{faction:R;lang:string}){
 const name=f['name_'+lang]||f.name_vi,quote=factionTaglines[f.id];
 return <header className="world-arrival faction-themed" data-faction={f.id} style={{'--arrival-color':f.ui_color_primary||'#c8b38a','--arrival-secondary':f.ui_color_secondary||'#183342'} as React.CSSProperties}><div className="arrival-art" key={f.id} aria-hidden="true"><MediaImage src={sceneArt(f)} alt="" fetchPriority="high"/></div><ExperienceAtmosphere variant="world"/><div className="arrival-copy"><span className="experience-eyebrow">THROUGH FROST AND MYTH · {lang==='vi'?'BIÊN NIÊN THẾ GIỚI':'WORLD CHRONICLES'}</span><h1>{name}</h1>{quote&&<p className="arrival-quote">{lang==='en'?quote.en:quote.vi}</p>}</div></header>;
}
