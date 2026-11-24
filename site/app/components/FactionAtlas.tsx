'use client';

import {useEffect, useMemo, useRef, useState, type PointerEvent} from 'react';
import {Compass, MapPin, Maximize2, Minimize2, Minus, Plus, RotateCcw, X} from 'lucide-react';
import {placeLabels} from '../../lib/static-atlas-places';
import {chartPlaces} from '../../lib/faction-atlas-detail';
import {mapRegion} from '../../lib/map-regions';
import {playBrassClick, playParchmentTurn} from '../../lib/tactile-sfx';
import '../atlas-game-mode.css';

type Row = Record<string, any>;

const kindLabels: Record<string, string> = {
  capital: 'Capital',
  city: 'City',
  fortress: 'Fortress',
  port: 'Port',
  landmark: 'Landmark',
};

// Staggered label placement so close Iberian cities (Madrid / Toledo / Lisbon / Ceuta / Gibraltar) never overlap
const labelPlacement: Record<string, string> = {
  madrid: 'pos-top-right',
  'ESP-5844': 'pos-bottom-left',
  toledo: 'pos-bottom-left',
  lisbon: 'pos-left',
  'gibraltar-fortress': 'pos-top-right',
  'ceuta-naval-works': 'pos-bottom-right',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function FactionAtlas({faction, data, year, onYear, onLandmark}: {
  faction: Row; data: Row; year: string; onYear: (year: string) => void; onLandmark: (id: string) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [plateReady, setPlateReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [placeId, setPlaceId] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const dragRef = useRef<{active: boolean; startX: number; startY: number; origX: number; origY: number}>({
    active: false, startX: 0, startY: 0, origX: 0, origY: 0,
  });

  const region = mapRegion(faction.id);
  const {id: regionId} = region;

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    setPlateReady(false);
    setError('');
    setPlaceId('');
    setZoom(1);
    setPan({x: 0, y: 0});
  }, [faction.id, regionId, year, attempt]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    function onWheel(event: WheelEvent) {
      if (!event.deltaY || (!event.ctrlKey && !event.metaKey && zoom === 1 && event.deltaY > 0)) return;
      event.preventDefault();
      applyZoom(event.deltaY < 0 ? 0.25 : -0.25);
    }
    el.addEventListener('wheel', onWheel, {passive: false});
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom]);

  function applyZoom(delta: number) {
    playBrassClick();
    setZoom(prev => {
      const next = clamp(Number((prev + delta).toFixed(2)), 1, 2.5);
      if (next === 1) setPan({x: 0, y: 0});
      return next;
    });
  }

  function resetView() {
    playBrassClick();
    setZoom(1);
    setPan({x: 0, y: 0});
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {}
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return;
    if (zoom <= 1) return;
    dragRef.current = {active: true, startX: event.clientX, startY: event.clientY, origX: pan.x, origY: pan.y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    const limX = (zoom - 1) * 240;
    const limY = (zoom - 1) * 160;
    setPan({
      x: clamp(dragRef.current.origX + dx, -limX, limX),
      y: clamp(dragRef.current.origY + dy, -limY, limY),
    });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current.active) {
      dragRef.current.active = false;
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
    }
  }

  const places = useMemo(() => chartPlaces(data, year, faction.id, region), [data, year, faction.id, region]);
  const placesById = useMemo(() => new Map(places.map(p => [p.id, p])), [places]);
  const pins = useMemo(() => placeLabels(places, region, 1000), [places, region]);
  const selectedPlace = placesById.get(placeId);
  const timelineYears = (data?.timeline || []).filter((entry: Row) => entry.enabled);

  return (
    <section ref={root} className="atlas-simple-v241 atlas-v250" aria-labelledby="atlas250-title">
      <header className="atlas241-header">
        <div>
          <h2 id="atlas250-title">{faction.name_en} Atlas</h2>
          <p>{region.en} · Interactive regional chart. Select any pin to inspect its record.</p>
        </div>
        <div className="atlas241-controls">
          {timelineYears.length > 1 && (
            <div className="atlas241-years" role="group" aria-label="Atlas historical year">
              {timelineYears.map((entry: Row) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={String(entry.id) === year}
                  onClick={() => { playParchmentTurn(); onYear(String(entry.id)); }}
                >
                  {entry.id}
                </button>
              ))}
            </div>
          )}
          <button type="button" className="atlas241-btn" onClick={toggleFullscreen}>
            {isFullscreen ? <><Minimize2 size={15}/> Exit</> : <><Maximize2 size={15}/> Fullscreen</>}
          </button>
        </div>
      </header>

      <div
        ref={stageRef}
        className={'atlas241-stage' + (plateReady ? ' is-ready' : '')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{cursor: zoom > 1 ? 'grab' : 'default'}}
      >
        <div className="atlas241-camera" style={{transform: `translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})`}}>
          <img
            key={faction.id + regionId + year + attempt}
            src={`/atlas-static/${regionId}-${year}.webp`}
            alt={`${faction.name_en} · ${region.en} · ${year}`}
            className="atlas241-plate"
            draggable={false}
            onLoad={() => setPlateReady(true)}
            onError={() => setError('Map image could not be loaded.')}
          />
          <div className="atlas241-vignette" aria-hidden="true"/>

          <div className="atlas241-pins" aria-label="Interactive map locations">
            {pins.map(pin => {
              const place = placesById.get(pin.id);
              if (!place) return null;
              const isSelected = placeId === place.id;
              const posClass = labelPlacement[place.id] || labelPlacement[place.name.toLowerCase()] || 'pos-right';
              return (
                <button
                  key={place.id}
                  type="button"
                  className={'atlas241-pin ' + posClass + (place.capital ? ' is-capital' : '') + (isSelected ? ' is-selected' : '')}
                  style={{left: `${pin.x}%`, top: `${pin.y}%`}}
                  aria-pressed={isSelected}
                  aria-label={`${place.name} · ${kindLabels[place.kind] || 'Location'}`}
                  onClick={() => { playBrassClick(); setPlaceId(place.id); }}
                >
                  <span className="atlas241-pin-dot" aria-hidden="true">
                    {place.capital ? <Compass size={13}/> : <MapPin size={11}/>}
                  </span>
                  <span className="atlas241-pin-label">{place.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="atlas241-zoom" aria-label="Zoom controls">
          <button type="button" aria-label="Zoom in" onClick={() => applyZoom(0.35)} disabled={zoom >= 2.5}><Plus size={15}/></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom out" onClick={() => applyZoom(-0.35)} disabled={zoom <= 1}><Minus size={15}/></button>
          <button type="button" aria-label="Reset view" onClick={resetView}><RotateCcw size={14}/></button>
        </div>

        {/* Docked Top-Right (clear of zoom dock) so it NEVER covers Ceuta or Gibraltar at bottom-left */}
        {selectedPlace && (
          <aside className="atlas241-card atlas250-card-tr" role="status" aria-label={selectedPlace.name}>
            <header>
              <span>{kindLabels[selectedPlace.kind] || 'Holding'} · {year}</span>
              <button type="button" aria-label="Close" onClick={() => setPlaceId('')}><X size={16}/></button>
            </header>
            <h3>{selectedPlace.name}</h3>
            <p>{faction.name_en} · {region.en}</p>
            <div className="atlas241-card-actions">
              {selectedPlace.dossier && (
                <button type="button" className="is-primary" onClick={() => { playParchmentTurn(); onLandmark(selectedPlace.dossier!); }}>
                  Open landmark dossier
                </button>
              )}
              <button type="button" onClick={() => applyZoom(0.45)}>Zoom closer</button>
            </div>
          </aside>
        )}

        {error && (
          <div className="atlas241-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setAttempt(n => n + 1)}>Retry</button>
          </div>
        )}
      </div>

      {places.length > 0 && (
        <div className="atlas241-footer">
          <div className="atlas241-quick-pins" role="group" aria-label="Quick jump to locations">
            {places.map(place => (
              <button
                key={place.id}
                type="button"
                aria-pressed={placeId === place.id}
                onClick={() => { playBrassClick(); setPlaceId(place.id); }}
              >
                {place.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
