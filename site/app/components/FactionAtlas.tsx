'use client';

import {useEffect, useId, useMemo, useRef, useState, type PointerEvent} from 'react';
import {Compass, Eye, Layers, Maximize2, Minimize2, Minus, Plus, RotateCcw, Shield, Sparkles, Volume2, VolumeX, X} from 'lucide-react';
import {placeLabels} from '../../lib/static-atlas-places';
import {chartPlaces} from '../../lib/faction-atlas-detail';
import {mapRegion} from '../../lib/map-regions';
import {isSfxMuted, playBrassClick, playParchmentTurn, setSfxMuted} from '../../lib/tactile-sfx';
import {AtlasSymbol, AtlasLegendSymbol, type AtlasSymbolKind} from './AtlasSymbols';
import AtlasGeography, {AtlasTerrainGlyph} from './AtlasGeography';
import '../regional-atlas-refinement.css';
import '../atlas-detail.css';
import '../atlas-game-mode.css';

type Row = Record<string,any>;
type MapLens = 'political' | 'warroom' | 'frost' | 'maritime';

const symbolNames: Record<AtlasSymbolKind,string> = {
  capital:'Capital', city:'City', fortress:'Fortress', port:'Port', landmark:'Landmark',
};

const lensOptions: {id: MapLens; label: string; note: string}[] = [
  {id:'warroom', label:'War Room', note:'Nocturnal tactical table with gilded borders'},
  {id:'political', label:'Imperial Chart', note:'Illuminated sovereign cartography'},
  {id:'frost', label:'Frost Front', note:'Winter relief and atmospheric chill'},
  {id:'maritime', label:'Sea & Trade', note:'Rhumb grid and naval port focus'},
];

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCoord(value: number, pos: string, neg: string) {
  const hemi = value >= 0 ? pos : neg;
  return Math.abs(value).toFixed(2) + '\u00b0 ' + hemi;
}

export default function FactionAtlas({faction, data, year, onYear, onLandmark}: {
  faction: Row; data: Row; year: string; onYear: (year: string) => void; onLandmark: (id: string) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const shieldId = useId().replace(/:/g,'')+'-shield';
  const glowId = useId().replace(/:/g,'')+'-glow';

  const [fullscreenNotice,setFullscreenNotice] = useState('');
  const [isFullscreen,setIsFullscreen] = useState(false);
  const [boundaries,setBoundaries] = useState<{id:string;path:string}[]>([]);
  const [error,setError] = useState('');
  const [attempt,setAttempt] = useState(0);
  const [loading,setLoading] = useState(true);
  const [plateReady,setPlateReady] = useState(false);
  const [placeId,setPlaceId] = useState('');
  const [hoveredPlaceId,setHoveredPlaceId] = useState('');

  // Grand strategy interactive map state
  const [lens,setLens] = useState<MapLens>('warroom');
  const [zoom,setZoom] = useState(1);
  const [pan,setPan] = useState({x:0,y:0});
  const [tilt,setTilt] = useState(false);
  const [showBorders,setShowBorders] = useState(true);
  const [showTerrain,setShowTerrain] = useState(true);
  const [showGrid,setShowGrid] = useState(true);
  const [showLabels,setShowLabels] = useState(true);
  const [sfxMuted,setSfxMutedState] = useState(false);
  const [sweepKey,setSweepKey] = useState(0);
  const [cursorCoords,setCursorCoords] = useState<{lat:number;lon:number}|null>(null);
  const dragRef = useRef<{active:boolean;startX:number;startY:number;origX:number;origY:number}>({active:false,startX:0,startY:0,origX:0,origY:0});

  const region = mapRegion(faction.id);
  const {id:regionId,bounds:[west,south,east,north]} = region;
  const width = 1000;
  const height = width*(north-south)/(east-west);

  useEffect(() => {
    setSfxMutedState(isSfxMuted());
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
    setZoom(1);
    setPan({x:0,y:0});
    setSweepKey(k => k + 1);
    fetch('/atlas-static/'+regionId+'-'+year+'.json',{signal:abort.signal})
      .then(response => {
        if (!response.ok) throw Error();
        return response.json();
      })
      .then(rows => {
        if (abort.signal.aborted) return;
        if (!Array.isArray(rows) || rows.some(row => typeof row?.id !== 'string' || typeof row?.path !== 'string')) throw Error();
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

  async function fullscreen() {
    setFullscreenNotice('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setFullscreenNotice('Fullscreen is unavailable here.');
    }
  }

  function applyZoom(delta: number) {
    playBrassClick();
    setZoom(prev => {
      const next = clamp(Number((prev + delta).toFixed(2)), 1, 2.8);
      if (next === 1) setPan({x:0,y:0});
      return next;
    });
  }

  function resetCamera() {
    playBrassClick();
    setZoom(1);
    setPan({x:0,y:0});
    setTilt(false);
  }

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    function zoomOnWheel(event: WheelEvent) {
      if (!event.deltaY || (!event.ctrlKey && !event.metaKey && zoom === 1 && event.deltaY > 0)) return;
      event.preventDefault();
      applyZoom(event.deltaY < 0 ? 0.25 : -0.25);
    }
    element.addEventListener('wheel', zoomOnWheel, {passive:false});
    return () => element.removeEventListener('wheel', zoomOnWheel);
  }, [zoom]);
  function toggleSfx() {
    const next = !sfxMuted;
    setSfxMuted(next);
    setSfxMutedState(next);
    if (!next) playBrassClick();
  }

  function switchYear(nextYear: string) {
    playParchmentTurn();
    onYear(nextYear);
  }

  function switchLens(nextLens: MapLens) {
    playBrassClick();
    setLens(nextLens);
    setSweepKey(k => k + 1);
  }


  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if ((event.target as HTMLElement).closest('.atlas-detail-marker')) return;
    if (zoom <= 1) return;
    dragRef.current = {active:true,startX:event.clientX,startY:event.clientY,origX:pan.x,origY:pan.y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const transform = svgRef.current?.getScreenCTM();
    if (transform) {
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(transform.inverse());
      const lon = west + clamp(point.x / width, 0, 1) * (east - west);
      const lat = north - clamp(point.y / height, 0, 1) * (north - south);
      setCursorCoords({lat, lon});
    }
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    const limitX = (zoom - 1) * 260;
    const limitY = (zoom - 1) * 180;
    setPan({
      x: clamp(dragRef.current.origX + dx, -limitX, limitX),
      y: clamp(dragRef.current.origY + dy, -limitY, limitY),
    });
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    if (dragRef.current.active) {
      dragRef.current.active = false;
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
    }
  }

  const places = useMemo(() => chartPlaces(data,year,faction.id,region), [data,year,faction.id,region]);
  const placesById = useMemo(() => new Map(places.map(place => [place.id,place])), [places]);
  const selectedPlace = placesById.get(placeId);
  const legendKinds = [...new Set(places.map(place => place.kind))];
  const paths = boundaries.filter(area => area.id === faction.id).map(area => area.path);
  const timelineYears = (data?.timeline || []).filter((entry:Row) => entry.enabled);

  const graticuleLines = useMemo(() => {
    const verticals: number[] = [];
    const horizontals: number[] = [];
    for (let i = 1; i < 8; i++) verticals.push((width / 8) * i);
    for (let j = 1; j < 6; j++) horizontals.push((height / 6) * j);
    return {verticals, horizontals};
  }, [width, height]);

  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of places) counts[p.kind] = (counts[p.kind] || 0) + 1;
    return counts;
  }, [places]);

  // Zoom-Adaptive LOD: at 100% zoom, keep primary strategic points crisp and declutter crowded secondary labels until zoomed > 1.25x or hovered/selected
  const labeledPlaces = useMemo(() => placeLabels(places,region,width), [places,region,width]);

  return <section ref={root} className={'atlas211 atlas211-regional atlas-detailed atlas-game-table atlas-v227 atlas-lens-'+lens+(tilt?' is-tilted':'')} aria-labelledby="atlas211-title">
    <header className="atlas-command-header">
      <div className="atlas-command-title">
        <span className="atlas-command-kicker"><Compass size={14} aria-hidden="true"/> Grand Strategy War Table · {region.en}</span>
        <h2 id="atlas211-title">{faction.name_en}</h2>
        <p>Inspect sovereign holdings, fortified strongpoints, and strategic sea lanes for Anno {year}.</p>
      </div>
      <div className="atlas-command-actions">
        <div className="atlas-year-strip" role="group" aria-label="Chronicle year">
          {timelineYears.map((entry:Row) => <button key={entry.id} aria-pressed={String(entry.id)===year} onClick={()=>switchYear(String(entry.id))}>{entry.id}</button>)}
        </div>
        <button className="atlas-hud-btn atlas-sfx-btn" aria-pressed={!sfxMuted} title={sfxMuted?'Enable tactile audio':'Mute tactile audio'} onClick={toggleSfx}>{sfxMuted?<VolumeX size={15}/>:<Volume2 size={15}/>}</button>
        <button className="atlas-hud-btn" onClick={fullscreen}>{isFullscreen?<><Minimize2 size={15}/> Exit table</>:<><Maximize2 size={15}/> Fullscreen</>}</button>
      </div>
    </header>

    <div className="atlas-mode-bar" role="toolbar" aria-label="Map lenses and tactical layers">
      <div className="atlas-lens-group" role="group" aria-label="Cartographic lens">
        {lensOptions.map(opt => <button key={opt.id} aria-pressed={lens===opt.id} title={opt.note} onClick={()=>switchLens(opt.id)}>{opt.label}</button>)}
      </div>
      <div className="atlas-layer-group" role="group" aria-label="Map layers">
        <button aria-pressed={showBorders} onClick={()=>{playBrassClick();setShowBorders(v=>!v);}}><Shield size={14}/> Borders</button>
        <button aria-pressed={showTerrain} onClick={()=>{playBrassClick();setShowTerrain(v=>!v);}}><Layers size={14}/> Terrain</button>
        <button aria-pressed={showGrid} onClick={()=>{playBrassClick();setShowGrid(v=>!v);}}><Compass size={14}/> Rhumb Grid</button>
        <button aria-pressed={showLabels} onClick={()=>{playBrassClick();setShowLabels(v=>!v);}}><Eye size={14}/> Labels</button>
        <button aria-pressed={tilt} onClick={()=>{playBrassClick();setTilt(v=>!v);}}><Sparkles size={14}/> 2.5D Table</button>
      </div>
    </div>

    <div className="atlas211-stage atlas-game-stage" ref={stage} aria-busy={loading||!plateReady}>
      <div key={sweepKey} className="atlas-chronicle-sweep" aria-hidden="true"/>
      <div className="atlas-table-vignette" aria-hidden="true"/>
      <div className="atlas-frost-sweep" aria-hidden="true"/>
      <div className="atlas-camera-viewport" style={{transform:`translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})`}}>
        <figure className="atlas211-map" style={{aspectRatio:String(Number((width/height).toFixed(4)))}}>
          <svg
            ref={svgRef}
            viewBox={'0 0 '+width+' '+height}
            preserveAspectRatio="xMidYMid slice"
            role="group"
            aria-label={faction.name_en+' · '+region.en+' · '+year}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={()=>setCursorCoords(null)}
            style={{cursor:zoom>1?'grab':'default'}}
          >
            <defs>
              <clipPath id={shieldId}><path d="M1 1H43V24Q43 39 22 49Q1 39 1 24Z"/></clipPath>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.6" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width={width} height={height} fill="#141b22"/>
            <image className="atlas211-land-plate" key={faction.id+regionId+year+attempt} href={'/atlas-static/'+regionId+'-'+year+'.webp'} width={width} height={height} preserveAspectRatio="xMidYMid slice" onLoad={()=>setPlateReady(true)} onError={()=>setError('This map plate could not load. Retry to open it again.')}/>

            {showGrid && <g className="atlas-game-graticule" aria-hidden="true">
              {graticuleLines.verticals.map((x,i) => <line key={'v'+i} x1={x} y1={0} x2={x} y2={height}/>)}
              {graticuleLines.horizontals.map((y,i) => <line key={'h'+i} x1={0} y1={y} x2={width} y2={y}/>)}
              <circle cx={width*0.14} cy={height*0.78} r={Math.min(width,height)*0.16} fill="none"/>
              <line x1={width*0.14} y1={0} x2={width*0.14} y2={height} strokeDasharray="3 5"/>
              <line x1={0} y1={height*0.78} x2={width} y2={height*0.78} strokeDasharray="3 5"/>
            </g>}

            {showBorders && <g aria-hidden="true" className="atlas-context-boundaries">
              {boundaries.map((area,index) => <path key={area.id+index} d={area.path} fillRule="evenodd" className={area.id===faction.id?'atlas-selected-territory':undefined} filter={area.id===faction.id&&lens==='warroom'?'url(#'+glowId+')':undefined} vectorEffect="non-scaling-stroke"/>)}
            </g>}

            {showTerrain && <AtlasGeography region={region} territoryPaths={paths}/>}

            {labeledPlaces.map(label => {
              const place = placesById.get(label.id)!;
              const x = label.x/100*width;
              const y = label.y/100*height;
              const [iconX,iconY,labelX,labelY,anchor] = (faction.id==='castilian_empire' && iberianCallouts[place.id]) || [0,0,label.dx,label.dy+14,'start'];
              const offset = iconX !== 0 || iconY !== 0;
              const isSelected = placeId === place.id;
              const isHovered = hoveredPlaceId === place.id;
              const isPrimary = place.capital || place.kind === 'fortress' || place.kind === 'landmark';
              const showText = showLabels && (zoom >= 1.25 || isPrimary || isSelected || isHovered);

              return <g key={place.id} className={'atlas211-capital atlas-detail-marker'+(place.capital?' is-capital':'')+(isSelected?' is-selected':'')+(!isPrimary&&zoom<1.25?' is-secondary-lod':'')} transform={'translate('+x+' '+y+')'}
                role="button" tabIndex={0} aria-pressed={isSelected}
                aria-label={place.name+' · '+symbolNames[place.kind]}
                onMouseEnter={()=>setHoveredPlaceId(place.id)}
                onMouseLeave={()=>setHoveredPlaceId(cur=>cur===place.id?'':cur)}
                onClick={()=>{playBrassClick();setPlaceId(place.id);}}
                onKeyDown={event=>{
                  if (event.key==='Enter'||event.key===' ') { event.preventDefault(); playBrassClick(); setPlaceId(place.id); }
                }}>
                {(place.capital || isSelected) && <circle cx={iconX} cy={iconY} r={isSelected?18:14} className="atlas-beacon-pulse" aria-hidden="true"/>}
                {showText && <path d={'M0 0 L'+iconX+' '+iconY+' L'+labelX+' '+(labelY-3)} className="atlas-detail-leader"/>}
                {offset && <circle r="1.8" fill="#d8b578" aria-hidden="true"/>}
                <AtlasSymbol kind={place.kind} size={place.capital?25:19} x={iconX} y={iconY}/>
                {showText && <text x={labelX} y={labelY} textAnchor={anchor}>{place.name}</text>}
                <title>{place.name+' · '+symbolNames[place.kind]}</title>
              </g>;
            })}

            {faction.flag_asset && <g className="atlas-detail-heraldry" transform="translate(46 140)" aria-hidden="true">
              <path d="M-4 -4H48V24Q48 43 22 55Q-4 43 -4 24Z" fill="#211622" stroke="#dfc28f" strokeWidth="2.2"/>
              <image href={faction.flag_asset} width="44" height="49" preserveAspectRatio="xMidYMid slice" clipPath={'url(#'+shieldId+')'}/>
            </g>}
          </svg>
        </figure>
      </div>

      {/* In-Map Grand Strategy HUD Overlays */}
      <div className="atlas-hud-top-left" aria-hidden="true">
        <span className="atlas-cartouche-era">Anno {year}</span>
        <strong>{region.en}</strong>
        <small>{zoom<1.25?'Primary strongholds shown · Zoom 125%+ for all cities':places.length+' charted holdings active'}</small>
      </div>

      <div className="atlas-zoom-dock" aria-label="Camera controls">
        <button aria-label="Zoom in" onClick={()=>applyZoom(0.35)} disabled={zoom>=2.8}><Plus size={16}/></button>
        <span className="atlas-zoom-readout">{Math.round(zoom*100)}%</span>
        <button aria-label="Zoom out" onClick={()=>applyZoom(-0.35)} disabled={zoom<=1}><Minus size={16}/></button>
        <button aria-label="Reset map view" onClick={resetCamera} title="Reset view"><RotateCcw size={15}/></button>
      </div>

      <svg className="atlas211-compass atlas-game-compass" viewBox="0 0 80 100" aria-hidden="true"><path d="M40 13 46 45 40 79 34 45Z M13 45 40 39 67 45 40 51Z" fill="none" stroke="currentColor"/><path d="M40 13 40 45 34 45Z" fill="currentColor"/><circle cx="40" cy="45" r="21" fill="none" stroke="currentColor"/><text x="40" y="9" textAnchor="middle" fill="currentColor" fontSize="11">N</text></svg>

      {selectedPlace && <aside className="atlas-floating-dossier" role="status" aria-label={selectedPlace.name}>
        <header>
          <span className="atlas-dossier-badge">{symbolNames[selectedPlace.kind]}</span>
          <button aria-label="Close place information" onClick={()=>setPlaceId('')}><X size={16}/></button>
        </header>
        <h3>{selectedPlace.name}</h3>
        <p>{faction.name_en} · Anno {year}</p>
        <div className="atlas-dossier-actions">
          {selectedPlace.dossier && <button className="atlas-dossier-primary" onClick={()=>{playParchmentTurn();onLandmark(selectedPlace.dossier!);}}>Open landmark dossier</button>}
          <button onClick={()=>applyZoom(0.45)}>Focus sector</button>
        </div>
      </aside>}

      <div className="atlas-hud-bottom-bar">
        <div className="atlas-hud-telemetry">
          <span>{cursorCoords ? formatCoord(cursorCoords.lat,'N','S') + ' · ' + formatCoord(cursorCoords.lon,'E','W') : region.en + ' · Hover chart for coordinates'}</span>
        </div>
        <div className="atlas-hud-counts">
          {legendKinds.map(kind => <span key={kind}><AtlasLegendSymbol kind={kind}/>{symbolNames[kind]} <b>{kindCounts[kind]||0}</b></span>)}
        </div>
      </div>
    </div>

    <div className="atlas-ledger-strip">
      <div className="atlas211-legend" aria-label="Map legend">
        <strong>War-Table Key</strong>
        <span><i className="atlas-key-realm"/>Sovereign Territory</span>
        {regionId==='europe' && paths.length>0 && <span><i className="atlas-key-river"/>Major Rivers</span>}
        {faction.id==='castilian_empire' && paths.length>0 && <><span><svg viewBox="-10 -8 20 16" aria-hidden="true"><AtlasTerrainGlyph kind="peak"/></svg>High Peaks</span><span><svg viewBox="-10 -8 20 16" aria-hidden="true"><AtlasTerrainGlyph kind="forest"/></svg>Named Forests</span></>}
      </div>
      {places.length>0 && <label className="atlas211-city-picker">Quick jump<select value={placeId} onChange={e=>{playBrassClick();setPlaceId(e.target.value);}}><option value="">Select charted holding</option>{places.map(place=><option value={place.id} key={place.id}>{place.name} · {symbolNames[place.kind]}</option>)}</select></label>}
    </div>

    {(loading||!plateReady)&&!error&&<p className="atlas-status-line" role="status">Unrolling the regional campaign chart...</p>}
    {error&&<div className="atlas211-error" role="alert"><p>{error}</p><button onClick={()=>setAttempt(value=>value+1)}>Retry map</button></div>}
    {fullscreenNotice&&<p className="atlas-status-line" role="status">{fullscreenNotice}</p>}
    <p className="map-note">Natural Earth geography · Authored TFAM borders · {region.en}. Drag when zoomed to pan across sectors.</p>
  </section>;
}
