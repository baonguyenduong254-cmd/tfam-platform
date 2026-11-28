'use client';
import {ImperialReveal} from './ImperialMotion';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import {
  Anchor,
  Crown,
  Landmark,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  ScrollText,
  Shield,
  X,
} from 'lucide-react';
import {placeLabels} from '../../lib/static-atlas-places';
import {chartPlaces, type ChartPlace} from '../../lib/faction-atlas-detail';
import {type MapRegion} from '../../lib/map-regions';
import {assetUrl} from '../../lib/media/asset-url';
import {playBrassClick, playParchmentTurn} from '../../lib/tactile-sfx';
import ImperialSectionHeader, {
  type ImperialFactionOption,
} from './ImperialSectionHeader';
import '../atlas-game-mode.css';

type Row = Record<string, any>;
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

function AtlasPlateStage({
  theatre,
  act,
  faction,
  data,
  showHoldings,
  onLandmark,
}: {
  theatre: TheatreConfig;
  act: (typeof CHRONICLE_ACTS)[number];
  faction: Row;
  data: Row;
  showHoldings: boolean;
  onLandmark: (id: string) => void;
}) {
  const blockRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [plateReady, setPlateReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [placeId, setPlaceId] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

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
    setZoom(1);
    setPan({x: 0, y: 0});
  }, [plateKey, faction.id, attempt]);

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
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
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

  function selectHolding(id: string, fly = true) {
    playBrassClick();
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
        'atlas266-plate-block atlas-clean-map' +
        (isDragging ? ' is-dragging' : '')
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
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          } as React.CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={() => applyZoom(0.45)}
      >
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

          {showHoldings && pins.length > 0 && (
            <div className="atlas241-pins" aria-label="Interactive map locations">
              {pins.map(pin => {
                const place = placesById.get(pin.id);
                if (!place) return null;
                const isSelected = placeId === place.id;
                const edgeClass =
                  (pin.y < 22 ? ' is-top-edge' : '') +
                  (pin.x < 18 ? ' is-left-edge' : pin.x > 82 ? ' is-right-edge' : '');
                return (
                  <button
                    key={place.id}
                    type="button"
                    className={
                      `atlas-glow-pin kind-${place.kind}` +
                      edgeClass +
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
                    <span className="atlas-glow-halo" aria-hidden="true" />
                    <span className="atlas-glow-dot" aria-hidden="true" />
                    <span className="atlas-glow-tooltip" role="tooltip">
                      <span className="atlas-glow-tooltip-head">
                        {place.capital && faction.flag_asset && (
                          <img
                            src={assetUrl(faction.flag_asset)}
                            alt=""
                            className="atlas260-pin-flag"
                          />
                        )}
                        <PinGlyph kind={place.kind} />
                        <strong>{place.name}</strong>
                      </span>
                      <small>
                        {kindMeta[place.kind].label} · {formatCoord(place.coordinates[0], place.coordinates[1])}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* COMPACT RIGHT ZOOM DOCK */}
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

        {/* SELECTED LOCATION DOSSIER DRAWER */}
        {selectedPlace && (
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
  unlockCondition: _unlockCondition,
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

  useEffect(() => {
    if (year === '1715' && actId === 'act2') setActId('act1');
    if (year === '1716' && actId === 'act1') setActId('act2');
  }, [year]);

  const activeAct =
    CHRONICLE_ACTS.find(a => a.id === actId) || CHRONICLE_ACTS[0];

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
      className="atlas-simple-v241 atlas-v250 atlas-v260 atlas-clean-map"
      style={{'--atlas-faction-tint': activeFactionColor} as React.CSSProperties}
      aria-labelledby="atlas250-title"
    >
      <ImperialSectionHeader
        kicker={`Imperial Cartography · Act ${activeAct.roman} · ${activeAct.title}`}
        title="Imperial War Atlas"
        subtitle="Pure painted campaign charts. Hover any glowing beacon dot on the regional chart to reveal its location card."
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

      <div className="atlas266-theatres">
        <ImperialReveal direction="up" distance={28} duration={0.62}>
          <AtlasPlateStage
            theatre={THEATRES.grand}
            act={activeAct}
            faction={faction}
            data={data}
            showHoldings={false}
            onLandmark={onLandmark}
          />
        </ImperialReveal>

        <div className="atlas266-regional-grid">
          {regionalOrder.map((tid, idx) => (
            <ImperialReveal key={tid} direction="up" distance={34} delay={idx * 0.1} duration={0.66}>
              <AtlasPlateStage
                theatre={THEATRES[tid]}
                act={activeAct}
                faction={faction}
                data={data}
                showHoldings={
                  (tid === 'asia' && isAsianFaction) ||
                  (tid === 'europe' && !isAsianFaction)
                }
                onLandmark={onLandmark}
              />
            </ImperialReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
