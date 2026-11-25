'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import {
  Anchor,
  Box,
  CloudSnow,
  Compass,
  Crown,
  Landmark,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  Route,
  Shield,
  X,
} from 'lucide-react';
import {placeLabels} from '../../lib/static-atlas-places';
import {chartPlaces, type ChartPlace} from '../../lib/faction-atlas-detail';
import {mapRegion} from '../../lib/map-regions';
import {assetUrl} from '../../lib/media/asset-url';
import {playBrassClick, playParchmentTurn} from '../../lib/tactile-sfx';
import ImperialSectionHeader, {
  type ImperialFactionOption,
} from './ImperialSectionHeader';
import '../atlas-game-mode.css';

type Row = Record<string, any>;
type HitArea = {id: string; path: string; outline?: string};

const kindMeta: Record<
  ChartPlace['kind'],
  {label: string; badge: string}
> = {
  capital: {label: 'Imperial Capital', badge: 'Capital'},
  city: {label: 'Chartered City', badge: 'City'},
  fortress: {label: 'Bastion Fortress', badge: 'Fortress'},
  port: {label: 'Naval Port', badge: 'Port'},
  landmark: {label: 'Historic Landmark', badge: 'Landmark'},
};

// Staggered label placement so close Iberian holdings never overlap
const labelPlacement: Record<string, string> = {
  madrid: 'pos-top-right',
  'ESP-5844': 'pos-bottom-left',
  toledo: 'pos-bottom-left',
  lisbon: 'pos-left',
  'gibraltar-fortress': 'pos-top-right',
  'ceuta-naval-works': 'pos-bottom-right',
};

const hitCache = new Map<string, HitArea[]>();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCoord(lon: number, lat: number) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

function PinGlyph({kind}: {kind: ChartPlace['kind']}) {
  switch (kind) {
    case 'capital':
      return <Crown size={13} aria-hidden="true" />;
    case 'fortress':
      return <Shield size={12} aria-hidden="true" />;
    case 'port':
      return <Anchor size={12} aria-hidden="true" />;
    case 'landmark':
      return <Landmark size={12} aria-hidden="true" />;
    default:
      return <MapPin size={11} aria-hidden="true" />;
  }
}

export default function FactionAtlas({
  faction,
  factions,
  onFaction,
  data,
  year,
  onYear,
  onLandmark,
}: {
  faction: Row;
  factions?: ImperialFactionOption[];
  onFaction?: (id: string) => void;
  data: Row;
  year: string;
  onYear: (year: string) => void;
  onLandmark: (id: string) => void;
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
  const [isDragging, setIsDragging] = useState(false);

  // Gamelike War-Table layers
  const [warTable3D, setWarTable3D] = useState(false);
  const [showBorders, setShowBorders] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showMist, setShowMist] = useState(true);

  // Real SVG territory layer from /atlas-static/<region>-<year>.json
  const [hitAreas, setHitAreas] = useState<HitArea[]>([]);
  const [hoveredRealmId, setHoveredRealmId] = useState<string | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{lon: number; lat: number} | null>(null);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({active: false, startX: 0, startY: 0, origX: 0, origY: 0});

  const region = mapRegion(faction.id);
  const {id: regionId} = region;
  const [w, s, e, n] = region.bounds;
  const svgHeight = useMemo(() => Number(((1000 * (n - s)) / (e - w)).toFixed(3)), [w, s, e, n]);

  const factionsById = useMemo(() => {
    const m = new Map<string, Row>();
    for (const item of (data?.factions || []) as Row[]) m.set(item.id, item);
    return m;
  }, [data?.factions]);

  const explorableIds = useMemo(
    () => new Set((factions || []).map(f => f.id)),
    [factions]
  );

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    setPlateReady(false);
    setError('');
    setPlaceId('');
    setHoveredRealmId(null);
    setZoom(1);
    setPan({x: 0, y: 0});
  }, [faction.id, regionId, year, attempt]);

  // Load real SVG hitLayer for faction borders & neighboring territories
  useEffect(() => {
    const key = `${regionId}-${year}`;
    if (hitCache.has(key)) {
      setHitAreas(hitCache.get(key)!);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/atlas-static/${regionId}-${year}.json`, {signal: ctrl.signal})
      .then(r => (r.ok ? (r.json() as Promise<HitArea[]>) : []))
      .then((areas: HitArea[]) => {
        if (!Array.isArray(areas)) return;
        hitCache.set(key, areas);
        setHitAreas(areas);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [regionId, year]);

  function clampPan(nextPan: {x: number; y: number}, nextZoom: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    const maxX = rect ? ((nextZoom - 1) * rect.width) / 2 : (nextZoom - 1) * 320;
    const maxY = rect ? ((nextZoom - 1) * rect.height) / 2 : (nextZoom - 1) * 210;
    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY),
    };
  }

  function applyZoom(delta: number) {
    playBrassClick();
    setZoom(prev => {
      const next = clamp(Number((prev + delta).toFixed(2)), 1, 2.8);
      if (next === 1) setPan({x: 0, y: 0});
      else setPan(p => clampPan(p, next));
      return next;
    });
  }

  function flyToPin(pinX: number, pinY: number, targetZoom = 1.75) {
    const rect = stageRef.current?.getBoundingClientRect();
    const nextZoom = clamp(Math.max(zoom, targetZoom), 1, 2.8);
    setZoom(nextZoom);
    if (!rect) return;
    const offsetX = (0.5 - pinX / 100) * rect.width * nextZoom;
    const offsetY = (0.5 - pinY / 100) * rect.height * nextZoom;
    setPan(clampPan({x: offsetX, y: offsetY}, nextZoom));
  }

  function resetView() {
    playBrassClick();
    setZoom(1);
    setPan({x: 0, y: 0});
  }

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    function onWheel(event: WheelEvent) {
      if (!event.deltaY) return;
      if (!event.ctrlKey && !event.metaKey && zoom <= 1 && event.deltaY > 0) return;
      event.preventDefault();
      const step = event.deltaY < 0 ? 0.25 : -0.25;
      setZoom(prev => {
        const next = clamp(Number((prev + step).toFixed(2)), 1, 2.8);
        if (next === 1) setPan({x: 0, y: 0});
        else setPan(p => clampPan(p, next));
        return next;
      });
    }
    el.addEventListener('wheel', onWheel, {passive: false});
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom]);

  async function toggleFullscreen() {
    playBrassClick();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {}
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button,aside')) return;
    if (zoom <= 1) return;
    setIsDragging(true);
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      origX: pan.x,
      origY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      const rx = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const ry = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      setCursorCoords({
        lon: w + rx * (e - w),
        lat: n - ry * (n - s),
      });
    }
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPan(
      clampPan(
        {x: dragRef.current.origX + dx, y: dragRef.current.origY + dy},
        zoom
      )
    );
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current.active) {
      dragRef.current.active = false;
      setIsDragging(false);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {}
    }
  }

  const places = useMemo(
    () => chartPlaces(data, year, faction.id, region),
    [data, year, faction.id, region]
  );
  const placesById = useMemo(() => new Map(places.map(p => [p.id, p])), [places]);
  const pins = useMemo(() => placeLabels(places, region, 1000), [places, region]);
  const pinsById = useMemo(() => new Map(pins.map(p => [p.id, p])), [pins]);
  const selectedPlace = placesById.get(placeId);
  const timelineYears = (data?.timeline || []).filter((entry: Row) => entry.enabled);

  // Build curved imperial supply routes from capital to other holdings
  const supplyRoutes = useMemo(() => {
    const capitalPin = pins.find(p => p.capital) || pins[0];
    if (!capitalPin || pins.length < 2) return [];
    const cx = (capitalPin.x / 100) * 1000;
    const cy = (capitalPin.y / 100) * svgHeight;
    return pins
      .filter(p => p.id !== capitalPin.id)
      .map(target => {
        const tx = (target.x / 100) * 1000;
        const ty = (target.y / 100) * svgHeight;
        const mx = (cx + tx) / 2;
        const my = (cy + ty) / 2 - Math.min(34, Math.hypot(tx - cx, ty - cy) * 0.14);
        return {
          id: `${capitalPin.id}-${target.id}`,
          d: `M ${cx.toFixed(1)} ${cy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`,
          active: placeId === target.id || placeId === capitalPin.id,
        };
      });
  }, [pins, svgHeight, placeId]);

  const hoveredRealm = hoveredRealmId ? factionsById.get(hoveredRealmId) : null;
  const activeFactionColor = faction.ui_color_primary || '#c6465c';

  function selectHolding(id: string, fly = true) {
    playBrassClick();
    setPlaceId(id);
    if (fly) {
      const targetPin = pinsById.get(id);
      if (targetPin) flyToPin(targetPin.x, targetPin.y, 1.7);
    }
  }

  return (
    <section
      ref={root}
      className={
        'atlas-simple-v241 atlas-v250 atlas-v260' +
        (warTable3D ? ' is-wartable-3d' : '') +
        (isDragging ? ' is-dragging' : '') +
        (zoom >= 1.35 ? ' is-zoomed-detail' : '')
      }
      style={{'--atlas-faction-tint': activeFactionColor} as React.CSSProperties}
      aria-labelledby="atlas250-title"
    >
      <ImperialSectionHeader
        kicker={`Imperial Cartography · ${region.en}`}
        title={`${faction.name_en} Atlas`}
        subtitle="Tactical campaign table & engraved imperial chart. Inspect borders, holdings, and supply routes."
        titleId="atlas250-title"
        flagAsset={faction.flag_asset}
        factions={factions}
        activeFactionId={faction.id}
        onFaction={onFaction}
        countValue={places.length}
        countLabel={places.length === 1 ? 'holding' : 'holdings'}
        rightControls={
          <>
            {timelineYears.length > 1 && (
              <div className="imp-hero-seg" role="group" aria-label="Atlas historical year">
                {timelineYears.map((entry: Row) => (
                  <button
                    key={entry.id}
                    type="button"
                    aria-pressed={String(entry.id) === year}
                    onClick={() => {
                      playParchmentTurn();
                      onYear(String(entry.id));
                    }}
                  >
                    {entry.id}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="imp-hero-pill-btn"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={14} aria-hidden="true" /> Exit
                </>
              ) : (
                <>
                  <Maximize2 size={14} aria-hidden="true" /> Fullscreen
                </>
              )}
            </button>
          </>
        }
        bottomBar={
          <>
            <div className="atlas260-layer-toggles" role="group" aria-label="Campaign map layers">
              <button
                type="button"
                className={'imp-hero-pill-btn' + (showBorders ? ' is-active' : '')}
                aria-pressed={showBorders}
                onClick={() => {
                  playBrassClick();
                  setShowBorders(v => !v);
                }}
              >
                <Layers size={14} aria-hidden="true" /> Frontlines &amp; Borders
              </button>
              <button
                type="button"
                className={'imp-hero-pill-btn' + (showRoutes ? ' is-active' : '')}
                aria-pressed={showRoutes}
                onClick={() => {
                  playBrassClick();
                  setShowRoutes(v => !v);
                }}
              >
                <Route size={14} aria-hidden="true" /> Supply Lines
              </button>
              <button
                type="button"
                className={'imp-hero-pill-btn' + (showMist ? ' is-active' : '')}
                aria-pressed={showMist}
                onClick={() => {
                  playBrassClick();
                  setShowMist(v => !v);
                }}
              >
                <CloudSnow size={14} aria-hidden="true" /> Frost Mist
              </button>
              <button
                type="button"
                className={'imp-hero-pill-btn' + (warTable3D ? ' is-active' : '')}
                aria-pressed={warTable3D}
                onClick={() => {
                  playBrassClick();
                  setWarTable3D(v => !v);
                }}
              >
                <Box size={14} aria-hidden="true" /> War Table 3D
              </button>
            </div>

            <div className="atlas260-legend" aria-label="Map key">
              <span><Crown size={12} aria-hidden="true" /> Capital</span>
              <span><Shield size={12} aria-hidden="true" /> Fortress</span>
              <span><Anchor size={12} aria-hidden="true" /> Port</span>
              <span><Landmark size={12} aria-hidden="true" /> Landmark</span>
            </div>
          </>
        }
      />

      {/* GAMELIKE CAMPAIGN MAP VIEWPORT */}
      <div
        ref={stageRef}
        className={'atlas241-stage atlas260-stage' + (plateReady ? ' is-ready' : '')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          setHoveredRealmId(null);
          setCursorCoords(null);
        }}
        onDoubleClick={() => applyZoom(0.45)}
        style={{cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'crosshair'}}
      >
        {/* 3D War Table Perspective Wrapper */}
        <div className="atlas260-perspective">
          <div
            className="atlas241-camera atlas260-camera"
            style={{
              transform: `translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})`,
            }}
          >
            <img
              key={faction.id + regionId + year + attempt}
              src={`/atlas-static/${regionId}-${year}.webp`}
              alt={`${faction.name_en} · ${region.en} · ${year}`}
              className="atlas241-plate atlas260-plate"
              draggable={false}
              onLoad={() => setPlateReady(true)}
              onError={() => setError('Map image could not be loaded.')}
            />

            {/* REAL SVG FACTION TERRITORIES & CAMPAIGN ROUTES */}
            <svg
              className="atlas260-vector-layer"
              viewBox={`0 0 1000 ${svgHeight}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <filter id="tfam-border-glow" x="-15%" y="-15%" width="130%" height="130%">
                  <feGaussianBlur stdDeviation="2.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {showBorders &&
                hitAreas.map(area => {
                  const isOwn = area.id === faction.id;
                  const isHover = hoveredRealmId === area.id;
                  const canVisit = explorableIds.has(area.id) && !isOwn && !!onFaction;
                  return (
                    <g
                      key={area.id}
                      className={
                        'atlas260-realm' +
                        (isOwn ? ' is-own' : '') +
                        (isHover ? ' is-hover' : '') +
                        (canVisit ? ' is-explorable' : '')
                      }
                      onMouseEnter={() => setHoveredRealmId(area.id)}
                      onMouseLeave={() =>
                        setHoveredRealmId(curr => (curr === area.id ? null : curr))
                      }
                      onClick={ev => {
                        if (!canVisit || !onFaction) return;
                        ev.stopPropagation();
                        playParchmentTurn();
                        onFaction(area.id);
                      }}
                    >
                      <path d={area.path} className="atlas260-realm-fill" />
                      {area.outline && (
                        <path
                          d={area.outline}
                          className="atlas260-realm-outline"
                          filter={isOwn ? 'url(#tfam-border-glow)' : undefined}
                        />
                      )}
                    </g>
                  );
                })}

              {showRoutes && supplyRoutes.length > 0 && (
                <g className="atlas260-routes">
                  {supplyRoutes.map(rt => (
                    <path
                      key={rt.id}
                      d={rt.d}
                      strokeDasharray="7 6"
                      className={'atlas260-route-line' + (rt.active ? ' is-active' : '')}
                    />
                  ))}
                </g>
              )}
            </svg>

            {/* Atmospheric Frost Mist & Cartographic Vignette */}
            {showMist && <div className="atlas260-frost-mist" aria-hidden="true" />}
            <div className="atlas241-vignette atlas260-vignette" aria-hidden="true" />

            {/* HERALDIC PINS */}
            <div className="atlas241-pins" aria-label="Interactive map locations">
              {pins.map(pin => {
                const place = placesById.get(pin.id);
                if (!place) return null;
                const isSelected = placeId === place.id;
                const posClass =
                  labelPlacement[place.id] ||
                  labelPlacement[place.name.toLowerCase()] ||
                  'pos-right';
                return (
                  <button
                    key={place.id}
                    type="button"
                    className={
                      `atlas241-pin atlas260-pin kind-${place.kind} ` +
                      posClass +
                      (place.capital ? ' is-capital' : '') +
                      (isSelected ? ' is-selected' : '')
                    }
                    style={{left: `${pin.x}%`, top: `${pin.y}%`}}
                    aria-pressed={isSelected}
                    aria-label={`${place.name} · ${kindMeta[place.kind].label}`}
                    onClick={ev => {
                      ev.stopPropagation();
                      selectHolding(place.id, true);
                    }}
                  >
                    {place.capital && <span className="atlas260-pulse-ring" aria-hidden="true" />}
                    <span className="atlas241-pin-dot atlas260-pin-dot" aria-hidden="true">
                      <PinGlyph kind={place.kind} />
                    </span>
                    <span className="atlas241-pin-label atlas260-pin-label">
                      {place.capital && faction.flag_asset && (
                        <img
                          src={assetUrl(faction.flag_asset)}
                          alt=""
                          className="atlas260-pin-flag"
                        />
                      )}
                      <span>{place.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TOP-LEFT REALM HOVER BANNER (Warhammer Diegetic Territory Readout) */}
        {hoveredRealm && hoveredRealm.id !== faction.id && (
          <div className="atlas260-realm-banner" role="status" aria-live="polite">
            {hoveredRealm.flag_asset && (
              <img src={assetUrl(hoveredRealm.flag_asset)} alt="" aria-hidden="true" />
            )}
            <div>
              <small>
                {explorableIds.has(hoveredRealm.id)
                  ? 'Adjacent Realm · Click to Switch'
                  : 'Charted Neighbour · Locked'}
              </small>
              <strong>{hoveredRealm.name_en || hoveredRealm.name_vi}</strong>
            </div>
          </div>
        )}

        {/* RIGHT ZOOM & CAMERA DOCK */}
        <div className="atlas241-zoom atlas260-zoom" aria-label="Zoom controls">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => applyZoom(0.35)}
            disabled={zoom >= 2.8}
          >
            <Plus size={15} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => applyZoom(-0.35)}
            disabled={zoom <= 1}
          >
            <Minus size={15} />
          </button>
          <button type="button" aria-label="Reset view" onClick={resetView}>
            <RotateCcw size={14} />
          </button>
        </div>

        {/* BOTTOM-LEFT ASTROLABE COMPASS & COORDINATE TELEMETRY */}
        <div className="atlas260-hud-bl" aria-hidden="true">
          <div className="atlas260-compass">
            <Compass size={22} />
            <span>N</span>
          </div>
          <div className="atlas260-telemetry">
            <strong>{region.en} · {year}</strong>
            <span>
              {cursorCoords
                ? formatCoord(cursorCoords.lon, cursorCoords.lat)
                : warTable3D
                  ? 'War Table 3D · Drag or Click Pin'
                  : 'Flat Cartography · Scroll to Zoom'}
            </span>
          </div>
        </div>

        {/* TOP-RIGHT TACTICAL DOSSIER DRAWER */}
        {selectedPlace && (
          <aside
            className="atlas241-card atlas250-card-tr atlas260-drawer"
            role="status"
            aria-label={selectedPlace.name}
          >
            <header>
              <span className="atlas260-drawer-kicker">
                <PinGlyph kind={selectedPlace.kind} />
                {kindMeta[selectedPlace.kind].label} · {year}
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  playBrassClick();
                  setPlaceId('');
                }}
              >
                <X size={16} />
              </button>
            </header>
            <div className="atlas260-drawer-head">
              {faction.flag_asset && (
                <img
                  src={assetUrl(faction.flag_asset)}
                  alt=""
                  className="atlas260-drawer-flag"
                />
              )}
              <div>
                <h3>{selectedPlace.name}</h3>
                <p>{faction.name_en} · {region.en}</p>
              </div>
            </div>
            <div className="atlas260-drawer-coords">
              <Navigation size={12} aria-hidden="true" />
              <span>
                {formatCoord(selectedPlace.coordinates[0], selectedPlace.coordinates[1])}
              </span>
            </div>
            <div className="atlas241-card-actions">
              {selectedPlace.dossier && (
                <button
                  type="button"
                  className="is-primary"
                  onClick={() => {
                    playParchmentTurn();
                    onLandmark(selectedPlace.dossier!);
                  }}
                >
                  Open landmark dossier
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const pin = pinsById.get(selectedPlace.id);
                  if (pin) flyToPin(pin.x, pin.y, Math.min(2.6, zoom + 0.45));
                  else applyZoom(0.45);
                }}
              >
                Fly closer
              </button>
              <button type="button" onClick={resetView}>
                Overview
              </button>
            </div>
          </aside>
        )}

        {error && (
          <div className="atlas241-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setAttempt(n => n + 1)}>
              Retry
            </button>
          </div>
        )}
      </div>

      {/* QUICK FLY-TO HOLDINGS STRIP */}
      {places.length > 0 && (
        <div className="atlas241-footer atlas260-footer">
          <span className="atlas260-footer-label">Quick Fly-To</span>
          <div
            className="atlas241-quick-pins atlas260-quick-pins"
            role="group"
            aria-label="Quick jump to locations"
          >
            {places.map(place => (
              <button
                key={place.id}
                type="button"
                aria-pressed={placeId === place.id}
                onClick={() => selectHolding(place.id, true)}
              >
                <PinGlyph kind={place.kind} />
                <span>{place.name}</span>
                <small>{kindMeta[place.kind].badge}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
