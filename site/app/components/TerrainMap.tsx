'use client';
import {useEffect,useState,useRef,type ComponentProps,type CSSProperties} from 'react';
import {Compass} from 'lucide-react';
import type CampaignMap from './CampaignMap';
import {atlasPlaces,placeLabels} from '../../lib/static-atlas-places';
import {positions,labels} from '../../lib/map-markers';
import {mapRegion,inMapRegion} from '../../lib/map-regions';
import MediaImage from './MediaImage';
import type {CampaignCity} from '../../lib/campaign-cities';
import '../atlas-static.css';
type Props=ComponentProps<typeof CampaignMap>&{onWorldReady?:()=>void;cities?:CampaignCity[];onEditCity?:(city:CampaignCity)=>void};
type Area={id:string;path:string;outline:string};
const cache=new Map<string,Promise<Area[]>>();
/** Static painted plates and a semantic hit layer. No WebGL, GIS worker or RAF. */
export default function TerrainMap({data,year,selected,onSelect,lang,onWorldReady,cities=[]}:Props){
 const plate=useRef<HTMLDivElement>(null);
 const [plateWidth,setPlateWidth]=useState(1000);
 useEffect(()=>{const el=plate.current;if(!el)return;const observer=new ResizeObserver(([entry])=>{if(entry.contentRect.width>0)setPlateWidth(entry.contentRect.width);});observer.observe(el);return()=>observer.disconnect();},[]);
 const [areas,setAreas]=useState<Area[]>([]),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 const faction=data.factions[selected]||data.factions[0],region=mapRegion(faction.id),tr=(vi:string,en:string)=>en;
 const key=region.id+'-'+year;
 useEffect(()=>{let live=true;setAreas([]);setFailed(false);let request=cache.get(key);if(!request){request=fetch('/atlas-static/'+key+'.json').then(r=>{if(!r.ok)throw Error('Atlas unavailable');return r.json() as Promise<Area[]>;}).catch(e=>{cache.delete(key);throw e;});cache.set(key,request);}request.then(a=>{if(live)setAreas(a);}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[key,attempt]);
 const [w,s,e,n]=region.bounds,box=[0,0,1000,1000*(n-s)/(e-w)];
 const present=new Set(Object.values(data.territories[year]||{}));
 const visible=data.factions.map((f:Record<string,any>,index:number)=>({f,index,position:(f.id==='ottoman_empire'&&year==='1716'?[44.36,33.31]:f.map_position||positions[f.id]) as number[]})).filter(({f,position}:any)=>position&&present.has(f.id)&&inMapRegion(position,region));
 const places=placeLabels(atlasPlaces(data,year,faction.id,region,cities,lang).filter(p=>p.capital),region,plateWidth);
 return <div className="static-atlas is-illustrated" data-region={region.id}>
  <header className="static-atlas-caption"><div><span>{tr('ATLAS CỦA THỜI ĐẠI','ATLAS OF THE AGE')} · {year}</span><h3>{lang==='vi'?region.vi:region.en}</h3></div></header>
  <div ref={plate} className="static-atlas-plate" style={{aspectRatio:`${box[2]} / ${box[3]}`}}>
   <img key={key+attempt} src={'/atlas-static/'+key+'.webp'} alt={tr('Địa hình '+region.vi,'Terrain of '+region.en)} width={1600} height={Math.round(1600*box[3]/box[2])} decoding="async" onLoad={()=>onWorldReady?.()} onError={()=>setFailed(true)}/>
   <div className="atlas-manuscript-layer" aria-hidden="true"/>
   <svg viewBox={box.join(' ')} className="static-atlas-hit" aria-label={tr('Chọn lãnh thổ trên bản đồ','Select a territory on the atlas')}>
    {areas.map(area=>{const index=data.factions.findIndex((f:Record<string,any>)=>f.id===area.id),f=data.factions[index];return index<0?null:<path key={area.id} d={area.path} className={f.id===faction.id?'selected':''} style={{'--territory-ink':f.ui_color_primary||'#877c61'} as CSSProperties} fillRule="evenodd" role="button" tabIndex={0} aria-label={f['name_'+lang]||f.name_vi} aria-pressed={f.id===faction.id} onClick={()=>onSelect(index,false)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(index,false);}}}><title>{f['name_'+lang]||f.name_vi}</title></path>;})}
   {areas.filter(a=>a.id===faction.id).map(a=><path key={'outline-'+a.id} className="static-national-outline" d={a.outline} aria-hidden="true"/>)}</svg>
   <svg className="atlas-place-leaders" aria-hidden="true">{places.map(p=><line key={p.id} x1={p.x+'%'} y1={p.y+'%'} x2={(p.x+(p.dx+p.labelWidth/2)/plateWidth*100)+'%'} y2={(p.y+(p.dy+11.5)/(plateWidth*box[3]/box[2])*100)+'%'}/>)}</svg>
   {places.map(p=><button key={p.id} className={'atlas-place'+(p.selected?' selected':'')+(p.capital?' is-capital':'')} style={{left:p.x+'%',top:p.y+'%','--label-x':(p.dx+8)+'px','--label-y':(p.dy+8)+'px','--label-width':p.labelWidth+'px'} as CSSProperties} onClick={()=>onSelect(p.index,false)} aria-label={p.name+' · '+(data.factions[p.index]['name_'+lang]||data.factions[p.index].name_vi)+(p.capital?' · '+tr('Thủ đô','Capital'):'')} aria-pressed={p.selected}><i aria-hidden="true"/><span className="atlas-place-label">{p.capital&&<MediaImage src={p.flag} alt="" loading="lazy"/>}<strong>{p.name}</strong>{p.capital&&<b aria-hidden="true">✦</b>}</span></button>)}
   {failed&&<div className="static-atlas-loading" role="status">{tr('Chưa tải được bản đồ.','The atlas could not load.')}<button onClick={()=>{setFailed(false);setAttempt(a=>a+1);}}>{tr('Thử lại','Retry')}</button></div>}
  </div>
  <div className="atlas-symbol-legend" aria-label={tr('Chú giải bản đồ','Map legend')}><span><i className="legend-capital"/> {tr('Thủ đô','Capital')}</span><span><i className="legend-selected"/> {tr('Lãnh thổ đang chọn','Selected territory')}</span><span><i className="legend-border"/> {tr('Biên giới thế lực','Faction border')}</span></div>
 </div>;
}
