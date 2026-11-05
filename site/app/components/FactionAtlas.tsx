'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {placeLabels} from '../../lib/static-atlas-places';
import {chartPlaces} from '../../lib/faction-atlas-detail';
import {mapRegion} from '../../lib/map-regions';
import {AtlasSymbol, AtlasLegendSymbol, type AtlasSymbolKind} from './AtlasSymbols';
import AtlasGeography, {AtlasTerrainGlyph} from './AtlasGeography';
import '../regional-atlas-refinement.css';
import '../atlas-detail.css';

type Row = Record<string,any>;
const symbolNames: Record<AtlasSymbolKind,string> = {
  capital:'Capital', city:'City', fortress:'Fortress', port:'Port', landmark:'Landmark',
};

// Spaced callouts at the fixed regional scale. Their hairlines keep the mapped city anchors exact.
const iberianCallouts: Record<string,[number,number,number,number,'start'|'end']> = {
  madrid: [0,0,12,-5,'start'],
  lisbon: [0,0,-12,-3,'end'],
  'ESP-5809': [0,0,13,-5,'start'],
  'ESP-5849': [0,0,13,3,'start'],
  'ESP-5836': [0,0,14,4,'start'],
  'ESP-5844': [0,0,-12,3,'end'],
  'ESP-5848': [-11,8,-23,9,'end'],
  'gibraltar-fortress': [13,0,25,3,'start'],
  'ceuta-naval-works': [-13,13,-25,17,'end'],
};

export default function FactionAtlas({faction, data, year, onYear, onLandmark}: {
  faction: Row; data: Row; year: string; onYear: (year: string) => void; onLandmark: (id: string) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const shieldId = useId().replace(/:/g,'')+'-shield';
  const [fullscreenNotice,setFullscreenNotice] = useState('');
  const [isFullscreen,setIsFullscreen] = useState(false);
  const [boundaries,setBoundaries] = useState<{id:string;path:string}[]>([]);
  const [error,setError] = useState('');
  const [attempt,setAttempt] = useState(0);
  const [loading,setLoading] = useState(true);
  const [plateReady,setPlateReady] = useState(false);
  const [placeId,setPlaceId] = useState('');
  const region = mapRegion(faction.id);
  const {id:regionId,bounds:[west,south,east,north]} = region;
  const width = 1000;
  const height = width*(north-south)/(east-west);

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange',sync);
    return () => document.removeEventListener('fullscreenchange',sync);
  },[]);

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError('');
    setBoundaries([]);
    setPlateReady(false);
    setPlaceId('');
    fetch('/atlas-static/'+regionId+'-'+year+'.json',{signal:abort.signal})
      .then(response => {
        if (!response.ok) throw Error();
        return response.json();
      })
      .then(rows => {
        if (abort.signal.aborted) return;
        if (!Array.isArray(rows) || rows.some(row => typeof row?.id !== "string" || typeof row?.path !== "string")) throw Error();
        setBoundaries(rows);
        setLoading(false);
      })
      .catch(() => {
        if (abort.signal.aborted) return;
        setError('Territory outlines could not load. Retry to restore them.');
        setLoading(false);
      });
    return () => abort.abort();
  },[faction.id,regionId,year,attempt]);

  useEffect(() => {
    const animation = root.current?.querySelector('.atlas211-map')?.animate?.(
      [{opacity:.72},{opacity:1}],{duration:380,easing:'cubic-bezier(.16,1,.3,1)'},
    );
    return () => animation?.cancel();
  },[faction.id,year]);

  async function fullscreen() {
    setFullscreenNotice('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setFullscreenNotice('Fullscreen is unavailable here.');
    }
  }

  const places = chartPlaces(data,year,faction.id,region);
  const placesById = new Map(places.map(place => [place.id,place]));
  const selectedPlace = placesById.get(placeId);
  const legendKinds = [...new Set(places.map(place => place.kind))];
  const paths = boundaries.filter(area => area.id === faction.id).map(area => area.path);


  return <section ref={root} className="atlas211 atlas211-regional atlas-detailed" aria-labelledby="atlas211-title">
    <header className="atlas211-tools">
      <div><h2 id="atlas211-title">The imperial atlas</h2><p>{region.en}, charted for {faction.name_en}. Select a mark to inspect its record.</p></div>
      <label>Year<select value={year} onChange={e=>onYear(e.target.value)}>{data.timeline.filter((entry:Row)=>entry.enabled).map((entry:Row)=><option key={entry.id}>{entry.id}</option>)}</select></label>
      <button onClick={fullscreen}>{isFullscreen?'Exit fullscreen':'Fullscreen'}</button>
    </header>
    <div className="atlas211-chart-heading"><span>{region.en}</span><span>{year}</span></div>
    <div className="atlas211-stage" aria-busy={loading||!plateReady}>
      <figure className="atlas211-map">
        <svg viewBox={'0 0 '+width+' '+height} role="group" aria-label={faction.name_en+' · '+region.en+' · '+year}>
          <defs><clipPath id={shieldId}><path d="M1 1H43V24Q43 39 22 49Q1 39 1 24Z"/></clipPath></defs>
          <rect width={width} height={height} fill="#243639"/>
          <image className="atlas211-land-plate" key={faction.id+regionId+year+attempt} href={'/atlas-static/'+regionId+'-'+year+'.webp'} width={width} height={height} onLoad={()=>setPlateReady(true)} onError={()=>setError('This map plate could not load. Retry to open it again.')}/>
          <g aria-hidden="true" className="atlas-context-boundaries">
            {boundaries.map((area,index) => <path key={area.id+index} d={area.path} fillRule="evenodd" className={area.id===faction.id?'atlas-selected-territory':undefined} vectorEffect="non-scaling-stroke"/>)}
          </g>
          <AtlasGeography region={region} territoryPaths={paths}/>
          {placeLabels(places,region,width).map(label => {
            const place = placesById.get(label.id)!;
            const x = label.x/100*width;
            const y = label.y/100*height;
            const [iconX,iconY,labelX,labelY,anchor] = (faction.id==='castilian_empire' && iberianCallouts[place.id]) || [0,0,label.dx,label.dy+14,'start'];
            const offset = iconX !== 0 || iconY !== 0;
            return <g key={place.id} className="atlas211-capital atlas-detail-marker" transform={'translate('+x+' '+y+')'}
              role="button" tabIndex={0} aria-pressed={placeId===place.id}
              aria-label={place.name+' · '+symbolNames[place.kind]}
              onClick={()=>setPlaceId(place.id)} onKeyDown={event=>{
                if (event.key==='Enter'||event.key===' ') { event.preventDefault(); setPlaceId(place.id); }
              }}>
              <path d={'M0 0 L'+iconX+' '+iconY+' L'+labelX+' '+(labelY-3)} className="atlas-detail-leader"/>
              {offset && <circle r="1.6" fill="#772e39" aria-hidden="true"/>}
              <AtlasSymbol kind={place.kind} size={place.capital?24:18} x={iconX} y={iconY}/>
              <text x={labelX} y={labelY} textAnchor={anchor}>{place.name}</text>
              <title>{place.name+' · '+symbolNames[place.kind]}</title>
            </g>;
          })}
          {faction.flag_asset && <g className="atlas-detail-heraldry" transform="translate(48 155)" aria-hidden="true">
            <path d="M-3 -3H47V24Q47 42 22 54Q-3 42 -3 24Z" fill="#42303a" stroke="#ccb280" strokeWidth="2"/>
            <image href={faction.flag_asset} width="44" height="49" preserveAspectRatio="xMidYMid slice" clipPath={'url(#'+shieldId+')'}/>
          </g>}
        </svg>
        <figcaption>{faction.name_en}<span>Regional chart</span></figcaption>
      </figure>
      <svg className="atlas211-compass" viewBox="0 0 80 100" aria-hidden="true"><path d="M40 13 46 45 40 79 34 45Z M13 45 40 39 67 45 40 51Z" fill="none" stroke="currentColor"/><path d="M40 13 40 45 34 45Z" fill="currentColor"/><circle cx="40" cy="45" r="21" fill="none" stroke="currentColor"/><text x="40" y="9" textAnchor="middle" fill="currentColor" fontSize="11">N</text></svg>
    </div>
    <div className="atlas211-legend" aria-label="Map legend">
      <strong>Chart legend</strong><span><i className="atlas-key-realm"/>Selected realm</span>
      {legendKinds.map(kind=><span key={kind}><AtlasLegendSymbol kind={kind}/>{symbolNames[kind]}</span>)}
      {regionId==='europe' && paths.length>0 && <span><i className="atlas-key-river"/>River</span>}
      {faction.id==='castilian_empire' && paths.length>0 && <><span><svg viewBox="-10 -8 20 16" aria-hidden="true"><AtlasTerrainGlyph kind="peak"/></svg>Summit</span><span><svg viewBox="-10 -8 20 16" aria-hidden="true"><AtlasTerrainGlyph kind="forest"/></svg>Named forest</span></>}
    </div>
    {places.length>0 && <label className="atlas211-city-picker">Places on this chart<select value={placeId} onChange={e=>setPlaceId(e.target.value)}><option value="">Select a place</option>{places.map(place=><option value={place.id} key={place.id}>{place.name} · {symbolNames[place.kind]}</option>)}</select></label>}
    {!places.length && !loading && !error && <p className="map-note">No named places have been charted for this realm in this region.</p>}
    {selectedPlace && <div className="atlas211-city-record" role="status">
      <div><h3>{selectedPlace.name}</h3><p>{symbolNames[selectedPlace.kind]} · {faction.name_en} · {year}</p></div>
      {selectedPlace.dossier && <button onClick={()=>onLandmark(selectedPlace.dossier!)}>Open landmark dossier</button>}
      <button aria-label="Close place information" onClick={()=>setPlaceId('')}>Close</button>
    </div>}
    {(loading||!plateReady)&&!error&&<p role="status">Opening the map and territory outlines…</p>}
    {error&&<div className="atlas211-error" role="alert"><p>{error}</p><button onClick={()=>setAttempt(value=>value+1)}>Retry map</button></div>}
    {fullscreenNotice&&<p role="status">{fullscreenNotice}</p>}
    <p className="map-note">Natural Earth geography · Fictional TFAM borders · {region.en}. Detail is charted for {faction.name_en}.</p>
  </section>;
}
