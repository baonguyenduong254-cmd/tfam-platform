'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {useDiscovery} from './DiscoveryProgress';
import {atlasPlaces,placeLabels} from '../../lib/static-atlas-places';
import {mapRegion} from '../../lib/map-regions';
import {motionPreference} from '../../lib/motion/preference';
import '../regional-atlas-refinement.css';

type R=Record<string,any>;
type View=[number,number,number,number];
export default function FactionAtlas({faction:f,data,year,onYear,onFaction}:{faction:R;data:R;year:string;onYear:(s:string)=>void;onFaction:(id:string)=>void}){
 const discovery=useDiscovery(),root=useRef<HTMLElement>(null),clipId=useId().replace(/:/g,'');
 const [notice,setNotice]=useState(''),[fullscreenNotice,setFullscreenNotice]=useState(''),[isFullscreen,setIsFullscreen]=useState(false);
 const [boundaries,setBoundaries]=useState<R[]>([]),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[loading,setLoading]=useState(true),[plateReady,setPlateReady]=useState(false),[city,setCity]=useState('');
 const r=mapRegion(f.id),active=r.id,height=1000*(r.bounds[3]-r.bounds[1])/(r.bounds[2]-r.bounds[0]);
 useEffect(()=>{const sync=()=>setIsFullscreen(document.fullscreenElement===root.current);document.addEventListener('fullscreenchange',sync);return()=>document.removeEventListener('fullscreenchange',sync);},[]);
 useEffect(()=>{
  const abort=new AbortController();setLoading(true);setError('');setBoundaries([]);setPlateReady(false);setNotice('');setCity('');
  fetch('/atlas-static/'+active+'-'+year+'.json',{signal:abort.signal}).then(response=>{if(!response.ok)throw Error();return response.json();}).then(rows=>{if(!abort.signal.aborted){setBoundaries(rows as R[]);setLoading(false);}}).catch(e=>{if(e.name!=='AbortError'){setError('Territory outlines could not load. Retry to restore them.');setLoading(false);}});
  return()=>abort.abort();
 },[f.id,active,year,attempt]);
 useEffect(()=>{if(motionPreference.matches)return;const el=root.current?.querySelector('.atlas211-map');const animation=el?.animate([{opacity:.65},{opacity:1}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'});return()=>animation?.cancel();},[f.id,year]);
 const view:View=[0,0,1000,height];
 async function fullscreen(){setFullscreenNotice('');try{if(document.fullscreenElement)await document.exitFullscreen();else await root.current?.requestFullscreen();}catch{setFullscreenNotice('Fullscreen is unavailable here. The map controls remain available.');}}
 const [west,south,east,north]=r.bounds;
 const places=atlasPlaces(data,year,f.id,r,[],'en').filter(p=>p.capital||p.selected);
 const labelSize=Math.max(3,view[2]/1000*11);
 const labels=placeLabels(places,r,1000),selectedCity=places.find(p=>p.id===city);
 function chooseFaction(id:string){if(!discovery.canExplore(id)){setNotice(discovery.condition(id));return;}setNotice('');onFaction(id);}
 return <section ref={root} className="atlas211 atlas211-regional" aria-labelledby="atlas211-title">
  <header className="atlas211-tools"><div><h2 id="atlas211-title">The imperial atlas</h2><p>{r.en}, with {f.name_en} highlighted. Select a city to inspect its allegiance.</p></div><label>Year<select value={year} onChange={e=>onYear(e.target.value)}>{data.timeline.filter((t:R)=>t.enabled).map((t:R)=><option key={t.id}>{t.id}</option>)}</select></label><button onClick={fullscreen}>{isFullscreen?'Exit fullscreen':'Fullscreen'}</button></header>
  <div className="atlas211-chart-heading"><span>{r.en}</span><span>{year}</span></div>
  <div className="atlas211-stage" aria-busy={loading||!plateReady}>
   <figure className="atlas211-map">
    <svg viewBox={view.join(' ')} preserveAspectRatio="xMidYMid meet" role="group" aria-label={f.name_en+' · '+r.en+' · '+year}>
     <defs><pattern id={clipId+'-sealed'} patternUnits="userSpaceOnUse" width="8" height="8"><path d="M-2 2 2-2 M0 8 8 0 M6 10 10 6" stroke="#28212b" strokeWidth=".6" opacity=".28"/></pattern></defs>
     <rect x={0} y={0} width={1000} height={height} fill="#243639"/>
     <image className="atlas211-land-plate" key={f.id+active+year+attempt} href={'/atlas-static/'+active+'-'+year+'.webp'} width={1000} height={height} onLoad={()=>setPlateReady(true)} onError={()=>setError('This map plate could not load. Retry to open it again.')}/>
     {boundaries.map((a:R,i:number)=>{const country=data.factions.find((c:R)=>c.id===a.id);if(!country)return null;const locked=!discovery.canExplore(a.id),selected=a.id===f.id;return <path className="atlas211-territory" key={a.id+i} d={a.path} fillRule="evenodd" fill={selected?'#8b344b35':locked?'url(#'+clipId+'-sealed)':'transparent'} stroke={selected?'#7a293d':'#4d444699'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" role="button" tabIndex={0} aria-label={country.name_en+' · '+discovery.condition(a.id)} aria-pressed={selected} aria-disabled={locked} onClick={()=>chooseFaction(a.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseFaction(a.id);}}}><title>{country.name_en+' · '+discovery.condition(a.id)}</title></path>;})}
     {labels.map(p=>{const x=(p.coordinates[0]-west)/(east-west)*1000,y=(north-p.coordinates[1])/(north-south)*height,locked=!discovery.canExplore(p.owner),dx=p.dx,dy=p.dy+14;if(x<view[0]||x>view[0]+view[2]||y<view[1]||y>view[1]+view[3])return null;return <g key={p.id} className="atlas211-capital" transform={'translate('+x+' '+y+')'} role="button" tabIndex={0} aria-pressed={city===p.id} aria-label={p.name+(p.capital?' · Capital':' · City')+' · '+discovery.condition(p.owner)} onClick={()=>setCity(p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setCity(p.id);}}}><path d={'M0 0 L'+dx+' '+(dy-4)} stroke="#382e24" strokeWidth=".6" opacity=".6"/><circle r={labelSize*(p.capital ? .42 : .25)} fill={p.selected?'#7b213b':'#25202a'} stroke="#fff2ce" strokeWidth={labelSize*.13}/>{p.capital&&<path d={'M0 '+(-labelSize*.7)+' L'+labelSize*.7+' 0 L0 '+labelSize*.7+' L'+(-labelSize*.7)+' 0Z'} fill="none" stroke="#392827" strokeWidth=".8"/>}<text x={dx} y={dy} fontSize={labelSize} fill="#211620" stroke="#f3dfb9" strokeWidth={labelSize*.22} paintOrder="stroke" strokeLinejoin="round">{p.name}</text><title>{p.name+' · '+(locked?discovery.condition(p.owner):'Select city')}</title></g>;})}
    </svg>
    <figcaption>{f.name_en}<span>Regional context</span></figcaption>
   </figure>
   <svg className="atlas211-compass" viewBox="0 0 80 100" aria-hidden="true"><path d="M40 13 46 45 40 79 34 45Z M13 45 40 39 67 45 40 51Z" fill="none" stroke="currentColor"/><path d="M40 13 40 45 34 45Z" fill="currentColor"/><circle cx="40" cy="45" r="21" fill="none" stroke="currentColor"/><text x="40" y="9" textAnchor="middle" fill="currentColor" fontSize="11">N</text></svg>
  </div>
  <div className="atlas211-legend" aria-label="Map legend"><strong>Chart legend</strong><span><i className="atlas-key-realm"/>Selected realm</span><span><i className="atlas-key-border"/>Other realms</span><span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2 8 8-8 8-8-8Z"/><circle cx="10" cy="10" r="3"/></svg>Capital</span><span><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3"/></svg>City</span><span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 9V6a4 4 0 0 1 8 0v3M4 9h12v9H4Z" fill="none"/></svg>Locked realms require reading progress</span></div>
  <label className="atlas211-city-picker">Cities on this chart<select value={city} onChange={e=>setCity(e.target.value)}><option value="">Select a city</option>{places.map(p=><option value={p.id} key={p.id}>{p.name}{p.capital?' · Capital':''}</option>)}</select></label>
  {selectedCity&&<div className="atlas211-city-record" role="status"><div><h3>{selectedCity.name}</h3><p>{selectedCity.capital?'Capital':'City'} · {data.factions.find((country:R)=>country.id===selectedCity.owner)?.name_en} · {year}</p></div><button onClick={()=>chooseFaction(selectedCity.owner)}>{discovery.canExplore(selectedCity.owner)?'Explore faction':discovery.condition(selectedCity.owner)}</button><button aria-label="Close city information" onClick={()=>setCity('')}>Close</button></div>}
  {(loading||!plateReady)&&!error&&<p role="status">Opening the map & territory outlines…</p>}{error&&<div className="atlas211-error" role="alert"><p>{error}</p><button onClick={()=>setAttempt(n=>n+1)}>Retry map</button></div>}{fullscreenNotice&&<p role="status">{fullscreenNotice}</p>}{notice&&<p className="atlas211-lock-notice" role="status">{notice} <a href="/chronicles">Read the chronicles</a></p>}
  <p className="map-note">Natural Earth geography · Fictional TFAM borders · {r.en}. The chart shows this region only; distant holdings remain outside its frame.</p>
 </section>;
}
