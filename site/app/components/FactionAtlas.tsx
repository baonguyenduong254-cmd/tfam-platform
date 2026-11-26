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
  BookOpen,
  Box,
  Compass,
  Crown,
  Landmark,
  Layers,
  Lock,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  Route,
  ScrollText,
  Shield,
  Unlock,
  X,
} from 'lucide-react';
import {placeLabels} from '../../lib/static-atlas-places';
import {chartPlaces, type ChartPlace} from '../../lib/faction-atlas-detail';
import {revoltSlots} from '../../lib/discovery';
import {factionSelectionTagline} from '../../lib/faction-selection-taglines';
import {type MapRegion} from '../../lib/map-regions';
import {assetUrl} from '../../lib/media/asset-url';
import {playBrassClick, playParchmentTurn} from '../../lib/tactile-sfx';
import ImperialSectionHeader, {
  type ImperialFactionOption,
} from './ImperialSectionHeader';
import '../atlas-game-mode.css';

type Row = Record<string, any>;
type HitArea = {id: string; path: string; outline?: string};
type ActId = 'act1' | 'act2' | 'act3';
type TheatreId = 'grand' | 'europe' | 'asia';

type TheatreConfig = {
  id: TheatreId;
  kicker: string;
  en: string;
  short: string;
  bounds: [number, number, number, number];
  width: number;
  height: number;
};

const CHRONICLE_ACTS: {
  id: ActId;
  roman: string;
  title: string;
  plateAct: 'act1' | 'act2';
  dataYear: '1715' | '1716';
  pendingReveal?: boolean;
}[] = [
  {id: 'act1', roman: 'I', title: 'Canticle of Chaos', plateAct: 'act1', dataYear: '1715'},
  {id: 'act2', roman: 'II', title: 'Shattered Symphony', plateAct: 'act2', dataYear: '1716'},
  {
    id: 'act3',
    roman: 'III',
    title: 'Draconic Apocalypse',
    plateAct: 'act2',
    dataYear: '1716',
    pendingReveal: true,
  },
];

const THEATRES: Record<TheatreId, TheatreConfig> = {
  grand: {
    id: 'grand',
    kicker: 'Grand Campaign',
    en: 'Grand Campaign · Known World',
    short: 'Grand Campaign',
    bounds: [-132, -52, 156, 73],
    width: 2400,
    height: 1042,
  },
  europe: {
    id: 'europe',
    kicker: 'Regional Theatre',
    en: 'Theatre of Europe & the Mediterranean',
    short: 'Europe & Mediterranean',
    bounds: [-24, 18, 58, 72],
    width: 1800,
    height: 1185,
  },
  asia: {
    id: 'asia',
    kicker: 'Regional Theatre',
    en: 'Theatre of Asia & the Orient',
    short: 'Asia & the Orient',
    bounds: [52, -14, 152, 58],
    width: 1800,
    height: 1296,
  },
};

const ASIAN_FACTIONS = new Set([
  'ming_celestial_empire',
  'annam_empire',
  'british_east_india_company',
  'nusantara_sultanate',
  'tokugawa_empire',
  'eternal_sky_khanate',
  'safavid_empire',
]);

const kindMeta: Record<ChartPlace['kind'], {label: string; badge: string}> = {
  capital: {label: 'Imperial Capital', badge: 'Capital'},
  city: {label: 'Chartered City', badge: 'City'},
  fortress: {label: 'Bastion Fortress', badge: 'Fortress'},
  port: {label: 'Naval Port', badge: 'Port'},
  landmark: {label: 'Historic Landmark', badge: 'Landmark'},
};

const labelPlacement: Record<string, string> = {
  madrid: 'pos-top-right',
  'ESP-5844': 'pos-bottom-left',
  toledo: 'pos-bottom-left',
  lisbon: 'pos-left',
  'gibraltar-fortress': 'pos-top-right',
  'ceuta-naval-works': 'pos-bottom-right',
};

const hitCache = new Map<string, HitArea[]>();
const revoltById = new Map(revoltSlots.map(slot => [slot.id, slot]));

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCoord(lon: number, lat: number) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

function paintedFlagPath(id: string, fallback?: string) {
  if (revoltById.has(id)) return revoltById.get(id)!.flag_asset;
  return `/heraldry/painted-v2/${id}.webp` || fallback || '';
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

function AtlasPlateStage({
  theatre,
  act,
  faction,
  factionsById,
  explorableIds,
  unlockCondition,
  data,
  showBorders,
  showRoutes,
  warTable3D,
  showHoldings,
  onFaction,
  onLandmark,
}: {
  theatre: TheatreConfig;
  act: (typeof CHRONICLE_ACTS)[number];
  faction: Row;
  factionsById: Map<string, Row>;
  explorableIds: Set<string>;
  unlockCondition?: (id: string) => string;
  data: Row;
  showBorders: boolean;
  showRoutes: boolean;
  warTable3D: boolean;
  showHoldings: boolean;
  onFaction?: (id: string) => void;
  onLandmark: (id: string) => void;
}) {
  const blockRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [plateReady, setPlateReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [placeId, setPlaceId] = useState('');
  const [inspectedRealmId, setInspectedRealmId] = useState<string | null>(null);
  const [hoveredRealmId, setHoveredRealmId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [isDragging, setIsDragging] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{lon: number; lat: number} | null>(null);
  const [hitAreas, setHitAreas] = useState<HitArea[]>([]);

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const [w, s, e, n] = theatre.bounds;
  const svgHeight = useMemo(
    () => Number(((1000 * (n - s)) / (e - w)).toFixed(3)),
    [w, s, e, n]
  );

  const plateKey = `${theatre.id}-${act.plateAct}`;

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === blockRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    setPlateReady(false);
    setError('');
    setPlaceId('');
    setInspectedRealmId(null);
    setHoveredRealmId(null);
    setZoom(1);
    setPan({x: 0, y: 0});
  }, [plateKey, faction.id, attempt]);

  useEffect(() => {
    if (hitCache.has(plateKey)) {
      setHitAreas(hitCache.get(plateKey)!);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/atlas-static/${plateKey}.json`, {signal: ctrl.signal})
      .then(r => (r.ok ? (r.json() as Promise<HitArea[]>) : []))
      .then(areas => {
        if (!Array.isArray(areas)) return;
        hitCache.set(plateKey, areas);
        setHitAreas(areas);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [plateKey]);

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
      else await blockRef.current?.requestFullscreen();
    } catch {}
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button,aside,a')) return;
    dragRef.current = {
      active: zoom > 1,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      origX: pan.x,
      origY: pan.y,
    };
    if (zoom > 1) {
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
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
    if (Math.hypot(dx, dy) > 5) dragRef.current.moved = true;
    setPan(clampPan({x: dragRef.current.origX + dx, y: dragRef.current.origY + dy}, zoom));
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

  const mapRegionObj: MapRegion = useMemo(
    () => ({id: theatre.id, vi: theatre.en, en: theatre.en, bounds: theatre.bounds}),
    [theatre]
  );

  const places = useMemo(
    () => (showHoldings ? chartPlaces(data, act.dataYear, faction.id, mapRegionObj) : []),
    [showHoldings, data, act.dataYear, faction.id, mapRegionObj]
  );
  const placesById = useMemo(() => new Map(places.map(p => [p.id, p])), [places]);
  const pins = useMemo(
    () => (showHoldings ? placeLabels(places, mapRegionObj, 1000) : []),
    [showHoldings, places, mapRegionObj]
  );
  const pinsById = useMemo(() => new Map(pins.map(p => [p.id, p])), [pins]);
  const selectedPlace = placesById.get(placeId);

  const supplyRoutes = useMemo(() => {
    if (!showHoldings) return [];
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
  }, [showHoldings, pins, svgHeight, placeId]);

  function resolveRealmMeta(id: string | null) {
    if (!id) return null;
    const found = factionsById.get(id);
    if (found) {
      return {
        id: found.id as string,
        name: (found.name_en || found.name_vi || id) as string,
        tagline:
          factionSelectionTagline({id, subtitle: found.subtitle_en}) ||
          'Sovereign Realm of the Frozen War',
        flag: paintedFlagPath(id, found.flag_asset),
      };
    }
    const revolt = revoltById.get(id);
    if (revolt) {
      return {
        id: revolt.id,
        name: revolt.name_en,
        tagline:
          factionSelectionTagline({id, subtitle: revolt.subtitle}) ||
          'The Unscored Revolt',
        flag: revolt.flag_asset,
      };
    }
    return {
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      tagline: 'Charted Realm',
      flag: '',
    };
  }

  const hoveredRealm = resolveRealmMeta(hoveredRealmId);
  const inspectedRealm = resolveRealmMeta(inspectedRealmId);
  const inspectedUnlocked = inspectedRealm ? explorableIds.has(inspectedRealm.id) : false;

  function selectHolding(id: string, fly = true) {
    playBrassClick();
    setInspectedRealmId(null);
    setPlaceId(id);
    if (fly) {
      const targetPin = pinsById.get(id);
      if (targetPin) flyToPin(targetPin.x, targetPin.y, 1.7);
    }
  }

  return (
    <div
      ref={blockRef}
      className={
        'atlas266-plate-block' +
        (isDragging ? ' is-dragging' : '') +
        (zoom >= 1.35 ? ' is-zoomed-detail' : '')
      }
    >
      <div className="atlas266-plate-bar">
        <div className="atlas266-plate-title">
          <span className="atlas266-plate-kicker">
            {theatre.kicker} · Act {act.roman}
          </span>
          <h3>{theatre.en}</h3>
        </div>
        <div className="atlas266-plate-meta">
          <span className="atlas266-coords-pill">
            <Compass size={13} aria-hidden="true" />
            {cursorCoords
              ? formatCoord(cursorCoords.lon, cursorCoords.lat)
              : 'Click any realm on the chart to inspect'}
          </span>
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
        </div>
      </div>

      <div
        ref={stageRef}
        className={'atlas241-stage atlas260-stage' + (plateReady ? ' is-ready' : '')}
        style={
          {
            '--atlas-plate-ratio': `${theatre.width} / ${theatre.height}`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'crosshair',
          } as React.CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          setHoveredRealmId(null);
          setCursorCoords(null);
        }}
        onDoubleClick={() => applyZoom(0.45)}
      >
        <div className="atlas260-perspective">
          <div
            className="atlas241-camera atlas260-camera"
            style={{
              transform: `translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})`,
            }}
          >
            <img
              key={plateKey + attempt}
              src={`/atlas-static/${plateKey}.webp`}
              alt={`${theatre.en} · Act ${act.roman}: ${act.title}`}
              className="atlas241-plate atlas260-plate"
              draggable={false}
              onLoad={() => setPlateReady(true)}
              onError={() => setError('Map image could not be loaded.')}
            />

            <svg
              className="atlas260-vector-layer"
              viewBox={`0 0 1000 ${svgHeight}`}
              preserveAspectRatio="none"
              aria-label={`${theatre.en} clickable realms`}
            >
              <defs>
                <filter
                  id={`tfam-border-glow-${theatre.id}`}
                  x="-15%"
                  y="-15%"
                  width="130%"
                  height="130%"
                >
                  <feGaussianBlur stdDeviation="2.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {hitAreas.map(area => {
                const isOwn = area.id === faction.id;
                const isHover = hoveredRealmId === area.id;
                const isInspected = inspectedRealmId === area.id;
                return (
                  <g
                    key={area.id}
                    data-realm-id={area.id}
                    className={
                      'atlas260-realm' +
                      (isOwn && showBorders ? ' is-own' : '') +
                      (isHover ? ' is-hover' : '') +
                      (isInspected ? ' is-inspected' : '')
                    }
                    onMouseEnter={() => setHoveredRealmId(area.id)}
                    onMouseLeave={() =>
                      setHoveredRealmId(curr => (curr === area.id ? null : curr))
                    }
                    onClick={ev => {
                      if (dragRef.current.moved) return;
                      ev.stopPropagation();
                      playBrassClick();
                      setPlaceId('');
                      setInspectedRealmId(area.id);
                    }}
                  >
                    <path d={area.path} className="atlas260-realm-fill" />
                    {showBorders && area.outline && (
                      <path
                        d={area.outline}
                        className="atlas260-realm-outline"
                        filter={
                          isOwn || isInspected
                            ? `url(#tfam-border-glow-${theatre.id})`
                            : undefined
                        }
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

            <div className="atlas241-vignette atlas260-vignette" aria-hidden="true" />

            {showHoldings && pins.length > 0 && (
              <div className="atlas241-pins" aria-label="Interactive map holdings">
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
            )}
          </div>
        </div>

        {/* TOP-LEFT HOVER REALM READOUT */}
        {hoveredRealm && (
          <div className="atlas260-realm-banner" role="status" aria-live="polite">
            {hoveredRealm.flag && (
              <img src={assetUrl(hoveredRealm.flag)} alt="" aria-hidden="true" />
            )}
            <div>
              <small>
                {explorableIds.has(hoveredRealm.id)
                  ? 'Unlocked Realm · Click to Inspect'
                  : 'Not Yet Unlocked · Click to Inspect'}
              </small>
              <strong>{hoveredRealm.name}</strong>
            </div>
          </div>
        )}

        {/* RIGHT ZOOM DOCK */}
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

        {/* REALM INSPECTION DRAWER (Unlocked vs Not Yet Unlocked!) */}
        {inspectedRealm && (
          <aside
            className="atlas241-card atlas250-card-tr atlas260-drawer"
            role="status"
            aria-label={inspectedRealm.name}
          >
            <header>
              <span className="atlas260-drawer-kicker">
                {inspectedUnlocked ? (
                  <Unlock size={12} aria-hidden="true" />
                ) : (
                  <Lock size={12} aria-hidden="true" />
                )}
                Realm Inspection · Act {act.roman}
              </span>
              <button
                type="button"
                aria-label="Close realm inspection"
                onClick={() => {
                  playBrassClick();
                  setInspectedRealmId(null);
                }}
              >
                <X size={16} />
              </button>
            </header>

            <div className="atlas260-drawer-head">
              {inspectedRealm.flag && (
                <img
                  src={assetUrl(inspectedRealm.flag)}
                  alt=""
                  className="atlas260-drawer-flag"
                />
              )}
              <div>
                <h3>{inspectedRealm.name}</h3>
                <p>{inspectedRealm.tagline}</p>
              </div>
            </div>

            {inspectedUnlocked ? (
              <>
                <div className="atlas266-status-pill is-unlocked">
                  <Unlock size={12} aria-hidden="true" />
                  {inspectedRealm.id === faction.id
                    ? 'Active Sovereign Realm'
                    : 'Unlocked · Archive Available'}
                </div>
                <div className="atlas241-card-actions">
                  {inspectedRealm.id !== faction.id && onFaction && (
                    <button
                      type="button"
                      className="is-primary"
                      onClick={() => {
                        playParchmentTurn();
                        onFaction(inspectedRealm.id);
                      }}
                    >
                      Enter Realm Dossier
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      playBrassClick();
                      setInspectedRealmId(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="atlas266-status-pill is-locked">
                  <Lock size={12} aria-hidden="true" /> Not Yet Unlocked
                </div>
                <p className="atlas266-lock-note">
                  {unlockCondition
                    ? unlockCondition(inspectedRealm.id)
                    : 'Continue reading the Chronicles to unlock this realm dossier.'}
                </p>
                <div className="atlas241-card-actions">
                  <a href="/chronicles" className="atlas266-link-btn">
                    <BookOpen size={14} aria-hidden="true" /> Read Chronicles
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      playBrassClick();
                      setInspectedRealmId(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </aside>
        )}

        {/* HOLDING PIN DOSSIER DRAWER */}
        {!inspectedRealm && selectedPlace && (
          <aside
            className="atlas241-card atlas250-card-tr atlas260-drawer"
            role="status"
            aria-label={selectedPlace.name}
          >
            <header>
              <span className="atlas260-drawer-kicker">
                <PinGlyph kind={selectedPlace.kind} />
                {kindMeta[selectedPlace.kind].label} · Act {act.roman}
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
                <p>
                  {faction.name_en} · {theatre.short}
                </p>
              </div>
            </div>
            <div className="atlas260-drawer-coords">
              <Navigation size={12} aria-hidden="true" />
              <span>
                {formatCoord(
                  selectedPlace.coordinates[0],
                  selectedPlace.coordinates[1]
                )}
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
                  Open Landmark Dossier
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
                Fly Closer
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

      {showHoldings && places.length > 0 && (
        <div className="atlas241-footer atlas260-footer">
          <span className="atlas260-footer-label">Quick Fly-To</span>
          <div
            className="atlas241-quick-pins atlas260-quick-pins"
            role="group"
            aria-label="Quick jump to holdings"
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
    </div>
  );
}

export default function FactionAtlas({
  faction,
  factions,
  onFaction,
  unlockCondition,
  data,
  year,
  onYear,
  onLandmark,
}: {
  faction: Row;
  factions?: ImperialFactionOption[];
  onFaction?: (id: string) => void;
  unlockCondition?: (id: string) => string;
  data: Row;
  year: string;
  onYear: (year: string) => void;
  onLandmark: (id: string) => void;
}) {
  const [actId, setActId] = useState<ActId>(() =>
    year === '1716' ? 'act2' : 'act1'
  );
  const [warTable3D, setWarTable3D] = useState(false);
  const [showBorders, setShowBorders] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  useEffect(() => {
    if (year === '1715' && actId === 'act2') setActId('act1');
    if (year === '1716' && actId === 'act1') setActId('act2');
  }, [year]);

  const activeAct =
    CHRONICLE_ACTS.find(a => a.id === actId) || CHRONICLE_ACTS[0];

  const factionsById = useMemo(() => {
    const m = new Map<string, Row>();
    for (const item of (data?.factions || []) as Row[]) m.set(item.id, item);
    return m;
  }, [data?.factions]);

  const explorableIds = useMemo(
    () => new Set((factions || []).map(f => f.id)),
    [factions]
  );

  // Order regional theatres so the active faction's home theatre appears first,
  // while BOTH regional charts + Grand Campaign are immediately visible with zero mode switching!
  const isAsianFaction = ASIAN_FACTIONS.has(faction.id);
  const regionalOrder: TheatreId[] = isAsianFaction
    ? ['asia', 'europe']
    : ['europe', 'asia'];

  const activeFactionColor = faction.ui_color_primary || '#c6465c';

  function chooseAct(next: ActId) {
    playParchmentTurn();
    setActId(next);
    const meta = CHRONICLE_ACTS.find(a => a.id === next);
    if (meta && meta.dataYear !== year) onYear(meta.dataYear);
  }

  return (
    <section
      className={
        'atlas-simple-v241 atlas-v250 atlas-v260' +
        (warTable3D ? ' is-wartable-3d' : '')
      }
      style={{'--atlas-faction-tint': activeFactionColor} as React.CSSProperties}
      aria-labelledby="atlas250-title"
    >
      <ImperialSectionHeader
        kicker={`Imperial Cartography · Act ${activeAct.roman} · ${activeAct.title}`}
        title="Imperial War Atlas"
        subtitle="Open Grand Campaign & Regional Theatre charts. Browse every frontier freely and click any realm on the map to inspect its status."
        titleId="atlas250-title"
        flagAsset={faction.flag_asset}
        factions={factions}
        activeFactionId={faction.id}
        onFaction={onFaction}
        countValue={activeAct.plateAct === 'act2' ? 28 : 24}
        countLabel="realms"
        rightControls={
          <div className="atlas266-act-bar" role="group" aria-label="Chronicle Acts">
            {CHRONICLE_ACTS.map(act => (
              <button
                key={act.id}
                type="button"
                className="atlas266-act-btn"
                aria-pressed={act.id === actId}
                onClick={() => chooseAct(act.id)}
              >
                <span className="atlas266-act-roman">ACT {act.roman}</span>
                <span>{act.title}</span>
              </button>
            ))}
          </div>
        }
        bottomBar={
          <>
            <div
              className="atlas260-layer-toggles"
              role="group"
              aria-label="Campaign map layers"
            >
              <button
                type="button"
                className={'imp-hero-pill-btn' + (showBorders ? ' is-active' : '')}
                aria-pressed={showBorders}
                onClick={() => {
                  playBrassClick();
                  setShowBorders(v => !v);
                }}
              >
                <Layers size={14} aria-hidden="true" /> Realm Highlights
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

            <div className="atlas260-legend" aria-label="Chart controls hint">
              <span>
                <Crown size={12} aria-hidden="true" /> Capital
              </span>
              <span>
                <Shield size={12} aria-hidden="true" /> Fortress
              </span>
              <span>
                <Anchor size={12} aria-hidden="true" /> Port
              </span>
              <span>
                <Landmark size={12} aria-hidden="true" /> Landmark
              </span>
            </div>
          </>
        }
      />

      {activeAct.pendingReveal && (
        <div className="atlas266-unfolding-note" role="status">
          <ScrollText size={16} aria-hidden="true" />
          <span>
            <strong>Act III · Draconic Apocalypse</strong> — Final continental
            frontiers are unfolding in the Chronicles. Charts remain freely open
            using the latest known Act II borders.
          </span>
        </div>
      )}

      {/* OPEN MULTI-THEATRE ATLAS: GRAND CAMPAIGN + REGIONAL THEATRES IMMEDIATELY VISIBLE */}
      <div className="atlas266-theatres">
        <AtlasPlateStage
          theatre={THEATRES.grand}
          act={activeAct}
          faction={faction}
          factionsById={factionsById}
          explorableIds={explorableIds}
          unlockCondition={unlockCondition}
          data={data}
          showBorders={showBorders}
          showRoutes={false}
          warTable3D={warTable3D}
          showHoldings={false}
          onFaction={onFaction}
          onLandmark={onLandmark}
        />

        <div className="atlas266-regional-grid">
          {regionalOrder.map(tid => (
            <AtlasPlateStage
              key={tid}
              theatre={THEATRES[tid]}
              act={activeAct}
              faction={faction}
              factionsById={factionsById}
              explorableIds={explorableIds}
              unlockCondition={unlockCondition}
              data={data}
              showBorders={showBorders}
              showRoutes={showRoutes}
              warTable3D={warTable3D}
              showHoldings={
                (tid === 'asia' && isAsianFaction) ||
                (tid === 'europe' && !isAsianFaction)
              }
              onFaction={onFaction}
              onLandmark={onLandmark}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
