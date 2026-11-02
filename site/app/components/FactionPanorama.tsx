'use client';
import {assetUrl} from '../../lib/media/asset-url';
import MediaImage from './MediaImage';

import {Landmark,Flag,ScrollText} from 'lucide-react';
import {factionCapital} from '../../lib/faction-content';
import chronicleArt from '../../lib/chronicle-art.json';
import {factionArt} from '../../lib/campaign-art';
type Props={faction:Record<string,any>;lang:string;year:string;index:number;regions:number};
export function sceneArt(faction:Record<string,any>){const asset=faction.backdrop_asset;return assetUrl(asset&&!/^\/campaign\/[^/]+-backdrop\.webp$/.test(asset)?asset:factionArt(faction.id));}
export default function FactionPanorama({faction:f,lang,year,index,regions}:Props){const tr=(vi:string,en:string)=>en,name=f['name_'+lang]||f.name_vi,lore=f['lore_'+lang+'_'+year]||f['lore_vi_'+year]||'';const artwork=(chronicleArt as Record<string,{asset:string;title:string;artist:string;source:string;license:string;kind?:string}>)[f.id];const written=lore&&!/^placeholder/i.test(lore);
 return <section className="imperial-panorama panorama-illustrated chronicle-gallery frost-shell" aria-label={tr('Biên niên thế lực','Faction chronicle')} style={{'--empire-color':f.ui_color_secondary||'#d3bb85'} as React.CSSProperties}><div className="panorama-scene" key={f.id} ><MediaImage src={artwork?.asset||sceneArt(f)} alt={artwork?.title||name} decoding="async"/></div><div className="panorama-overview"><div className="panorama-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</div><div className="panorama-copy"><div className="panorama-eyebrow"><span>{tr('BIÊN NIÊN CÁC ĐẾ CHẾ','CHRONICLES OF THE EMPIRES')}</span><b>{year}</b></div><div className="panorama-title-row"><MediaImage className="panorama-emblem" src={f.flag_asset} alt=""/><h2>{name}</h2></div><dl className="panorama-facts"><div><dt><Landmark size={15}/>{tr('Thủ đô','Capital')}</dt><dd>{factionCapital(f,lang,year)}</dd></div><div><dt><Flag size={15}/>{tr('Lãnh thổ','Territories')}</dt><dd>{regions} {tr('vùng','regions')}</dd></div></dl></div></div><article id="faction-lore" className="panorama-lore" key={f.id+lang+year}><div className="chronicle-heading"><ScrollText size={20}/><span>{tr('Biên niên thế lực','Faction chronicle')}</span><b>{year}</b></div><div className="lore">{written?lore.split(/\n\s*\n/).map((p:string,i:number)=><p key={i}>{p}</p>):<p>{tr('Biên niên đang được biên soạn.','The chronicle is being prepared.')}</p>}</div>{lang==='en'&&!f['lore_en_'+year]&&<small>Vietnamese source · English translation pending</small>}</article></section>;
}
