'use client';

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Grid,
  Landmark,
  MapPin,
  Navigation,
  Pause,
  Play,
  Search,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import MediaImage from './MediaImage';
import {landmarkArtwork} from '../../lib/artwork-presentation';
import {carryArtwork} from '../../lib/motion/artwork-transition';
import {closeDialog} from '../../lib/animation/dialog-close';
import {playBrassClick, playParchmentTurn} from '../../lib/tactile-sfx';
import ImperialSectionHeader, {
  type ImperialFactionOption,
} from './ImperialSectionHeader';

type R = Record<string, any>;

const categories: Record<string, [string, string]> = {
  seat: ['Vương quyền', 'Sovereignty'],
  sacred: ['Tín ngưỡng', 'Sacred'],
  industry: ['Công nghiệp', 'Industry'],
  fortress: ['Thành lũy', 'Strongholds'],
  landscape: ['Cảnh quan', 'Landscapes'],
  ruin: ['Tàn tích', 'Ruins'],
  knowledge: ['Tri thức', 'Knowledge'],
  harbour: ['Giao thương', 'Trade & Harbours'],
};

const cache = new Map<string, R[]>();
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return '';
  }
};

export default function MonumentShowcase({
  factionId,
  faction,
  factions,
  onFaction,
  lang,
  factionName,
  initialPlace,
}: {
  factionId: string;
  faction?: ImperialFactionOption;
  factions?: ImperialFactionOption[];
  onFaction?: (id: string) => void;
  lang: string;
  factionName: string;
  initialPlace?: R;
}) {
  const local = (m: R, k: string) =>
    presentationPunctuation(m[k + '_en'] || m[k + '_vi'] || '');

  const [items, setItems] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [opened, setOpened] = useState<string | null>(() => initialPlace?.id ?? null);

  // Automated Guided Voyage state
  const [viewMode, setViewMode] = useState<'voyage' | 'grid'>('voyage');
  const [tourIndex, setTourIndex] = useState(0);
  const [tourDir, setTourDir] = useState(1);
  const [autoPlay, setAutoPlay] = useState(true);
  const [paceMs, setPaceMs] = useState<7500 | 12000>(7500);
  const [hoverPaused, setHoverPaused] = useState(false);

  const initial = useRef(initialPlace);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  // Multi-axis pointer parallax (Z / X / Y depth layers, zero React re-renders)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, {stiffness: 110, damping: 22, mass: 0.6});
  const springY = useSpring(rawY, {stiffness: 110, damping: 22, mass: 0.6});

  const bgShiftX = useTransform(springX, [-0.5, 0.5], [18, -18]);
  const bgShiftY = useTransform(springY, [-0.5, 0.5], [12, -12]);
  const midShiftX = useTransform(springX, [-0.5, 0.5], [-22, 22]);
  const midShiftY = useTransform(springY, [-0.5, 0.5], [-14, 14]);
  const fgShiftX = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const fgShiftY = useTransform(springY, [-0.5, 0.5], [-8, 8]);
  const stageTiltY = useTransform(springX, [-0.5, 0.5], [-2.2, 2.2]);
  const stageTiltX = useTransform(springY, [-0.5, 0.5], [1.8, -1.8]);

  // Respect prefers-reduced-motion on initial autoplay
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setAutoPlay(false);
    }
  }, []);

  useEffect(() => {
    const c = new AbortController();
    let alive = true;
    setLoading(true);
    setError(false);
    setItems([]);
    setTourIndex(0);
    setOpened(initial.current?.id ?? null);
    try {
      const saved = JSON.parse(
        sessionStorage.getItem('tfam-landmarks:' + factionId) || '{}'
      );
      setQuery(saved.query || '');
      setCategory(saved.category || 'all');
      if (saved.viewMode === 'grid' || saved.viewMode === 'voyage') {
        setViewMode(saved.viewMode);
      }
    } catch {
      setQuery('');
      setCategory('all');
    }

    (async () => {
      const r = await fetch('/monuments/manifest.json', {
        signal: c.signal,
        cache: 'no-cache',
      });
      if (!r.ok) throw Error();
      const manifest = (await r.json()) as R;
      const entry = manifest.factions.find((f: R) => f.id === factionId);
      if (!entry) throw Error();
      const key = manifest.version + factionId;
      let records = cache.get(key);
      if (!records) {
        const res = await fetch(entry.url + '?v=' + manifest.version, {
          signal: c.signal,
        });
        if (!res.ok) throw Error();
        records = (await res.json()) as R[];
        cache.set(key, records);
      }
      if (!alive) return;
      setItems(records);
      setLoading(false);
      const p = location.hash.slice(1).split('/').map(decode);
      if (p[2] === 'monuments' && records.some(m => m.id === p[3])) {
        setOpened(p[3]);
      }
    })().catch(e => {
      if (alive && e.name !== 'AbortError') {
        setLoading(false);
        setError(true);
      }
    });

    return () => {
      alive = false;
      c.abort();
    };
  }, [factionId, retry]);

  useEffect(() => {
    const sync = () => {
      const p = location.hash.slice(1).split('/').map(decode);
      setOpened(
        p[0] === 'archive' &&
          p[1] === factionId &&
          p[2] === 'monuments' &&
          items.some(m => m.id === p[3])
          ? p[3]
          : null
      );
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, [factionId, items]);

  useEffect(() => {
    if (loading) return;
    try {
      sessionStorage.setItem(
        'tfam-landmarks:' + factionId,
        JSON.stringify({query, category, viewMode})
      );
    } catch {}
  }, [query, category, viewMode, loading, factionId]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return items.filter(
      m =>
        (category === 'all' || category === m.category) &&
        (!q ||
          norm(
            [
              m.name_vi,
              m.name_en,
              m.location_vi,
              m.location_en,
              m.epithet_vi,
              m.epithet_en,
              ...(m.traits || []).map((a: R) => a.label_vi + ' ' + a.label_en),
            ].join(' ')
          ).includes(q))
    );
  }, [items, category, query]);

  // Keep tourIndex inside filtered bounds
  const safeTourIndex = filtered.length > 0 ? tourIndex % filtered.length : 0;
  const activeStop = filtered[safeTourIndex];

  // Auto-pilot timer (pauses cleanly when dialog is open, hovered, in grid mode, or <=1 stop)
  useEffect(() => {
    if (!autoPlay || hoverPaused || !!opened || viewMode !== 'voyage' || filtered.length < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setTourDir(1);
      setTourIndex(prev => (prev + 1) % filtered.length);
    }, paceMs);
    return () => window.clearInterval(timer);
  }, [autoPlay, hoverPaused, opened, viewMode, filtered.length, paceMs]);

  const activeId = opened;
  const selected =
    items.find(m => m.id === activeId) ||
    (initial.current?.id === activeId ? initial.current : undefined);
  const selectedIndex = filtered.findIndex(m => m.id === opened);

  useLayoutEffect(() => {
    const el = dialog.current;
    if (!selected || !el) return;
    const old = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      el.close();
      document.body.style.overflow = old;
      trigger.current?.focus({preventScroll: true});
    };
  }, [!!selected]);

  useEffect(() => {
    if (selected) dialog.current?.scrollTo({top: 0, behavior: 'instant'});
  }, [selected?.id]);

  function open(m: R, button?: HTMLButtonElement) {
    playParchmentTurn();
    if (button) trigger.current = button;
    carryArtwork(button, () => setOpened(m.id));
    history.replaceState({...history.state, tfamScroll: scrollY}, '');
    history.pushState(
      {tfamScroll: scrollY},
      '',
      '#archive/' + factionId + '/monuments/' + m.id
    );
  }

  function close() {
    closeDialog(dialog.current, () => {
      setOpened(null);
      history.replaceState(
        {tfamScroll: scrollY},
        '',
        '#archive/' + factionId + '/monuments'
      );
    });
  }

  function jumpStop(nextIdx: number) {
    if (filtered.length === 0) return;
    playBrassClick();
    const wrapped = (nextIdx + filtered.length) % filtered.length;
    setTourDir(wrapped >= safeTourIndex ? 1 : -1);
    setTourIndex(wrapped);
  }

  function handleStagePointer(ev: MouseEvent<HTMLDivElement>) {
    const rect = ev.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    rawX.set((ev.clientX - rect.left) / rect.width - 0.5);
    rawY.set((ev.clientY - rect.top) / rect.height - 0.5);
  }

  function resetStagePointer() {
    rawX.set(0);
    rawY.set(0);
  }

  const availableCategories = useMemo(
    () => Object.entries(categories).filter(([key]) => items.some(m => m.category === key)),
    [items]
  );

  // Simulated compass bearing per stop so compass visibly rotates as you travel across the realm
  const bearingDeg = (safeTourIndex * 47 + 25) % 360;
  const firstExcerpt = activeStop
    ? local(activeStop, 'lore').split(/\n\s*\n/)[0] || ''
    : '';

  return (
    <MotionConfig reducedMotion="never">
      <section className="monuments landmarks211 voyage-v261" aria-label="Landmark collection">
        <ImperialSectionHeader
          kicker="Grand Imperial Voyage · Gazetteer"
          title={`Landmarks of ${presentationPunctuation(factionName)}`}
          subtitle="Automated expedition through the palaces, citadels, sanctuaries, and frontiers of the realm."
          titleId="archive-title"
          flagAsset={faction?.flag_asset}
          factions={factions}
          activeFactionId={factionId}
          onFaction={onFaction}
          countValue={loading ? '—' : filtered.length}
          countLabel={filtered.length === 1 ? 'destination' : 'destinations'}
          rightControls={
            <div className="imp-hero-seg" role="group" aria-label="Presentation mode">
              <button
                type="button"
                aria-pressed={viewMode === 'voyage'}
                onClick={() => {
                  playBrassClick();
                  setViewMode('voyage');
                }}
              >
                <Compass size={13} aria-hidden="true" /> Guided Voyage
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'grid'}
                onClick={() => {
                  playBrassClick();
                  setViewMode('grid');
                }}
              >
                <Grid size={13} aria-hidden="true" /> Gazetteer Grid
              </button>
            </div>
          }
          bottomBar={
            <>
              <nav className="imp-hero-tabs" role="tablist" aria-label="Landmark categories">
                <button
                  type="button"
                  role="tab"
                  aria-selected={category === 'all'}
                  className={'imp-tab-btn' + (category === 'all' ? ' is-active' : '')}
                  onClick={() => {
                    playBrassClick();
                    setCategory('all');
                    setTourIndex(0);
                  }}
                >
                  <Landmark size={13} aria-hidden="true" />
                  <span>All Destinations</span>
                  <small>{items.length}</small>
                  {category === 'all' && (
                    <motion.span
                      layoutId="tfam-landmark-tab-rail"
                      className="imp-tab-rail"
                      transition={{type: 'spring', duration: 0.32, bounce: 0}}
                    />
                  )}
                </button>
                {availableCategories.map(([key, names]) => {
                  const active = category === key;
                  const count = items.filter(m => m.category === key).length;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={'imp-tab-btn' + (active ? ' is-active' : '')}
                      onClick={() => {
                        playBrassClick();
                        setCategory(key);
                        setTourIndex(0);
                      }}
                    >
                      <span>{names[1]}</span>
                      <small>{count}</small>
                      {active && (
                        <motion.span
                          layoutId="tfam-landmark-tab-rail"
                          className="imp-tab-rail"
                          transition={{type: 'spring', duration: 0.32, bounce: 0}}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              <label className="imp-hero-search">
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">Search landmarks</span>
                <input
                  type="search"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setTourIndex(0);
                  }}
                  placeholder="Search destinations, regions, traits…"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    style={{background: 'none', border: 0, color: 'inherit', cursor: 'pointer'}}
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
            </>
          }
        />

        {loading ? (
          <p className="monument-notice world-loading" role="status">
            Opening the imperial gazetteer…
          </p>
        ) : error ? (
          <div className="monument-notice" role="alert">
            <p>The gazetteer could not be loaded.</p>
            <button onClick={() => setRetry(n => n + 1)}>Retry</button>
          </div>
        ) : !filtered.length ? (
          <div className="monument-notice">
            <p>No matching landmarks.</p>
            <button
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* MODE 1: AUTOMATED MULTI-DIMENSIONAL GUIDED VOYAGE */}
            {viewMode === 'voyage' && activeStop && (
              <div
                className="voyage-cinema-shell"
                onMouseEnter={() => setHoverPaused(true)}
                onMouseLeave={() => {
                  setHoverPaused(false);
                  resetStagePointer();
                }}
                onMouseMove={handleStagePointer}
              >
                <motion.div
                  className="voyage-stage"
                  style={{
                    rotateX: stageTiltX,
                    rotateY: stageTiltY,
                    transformPerspective: 1400,
                  }}
                >
                  {/* LAYER 1 (DEEP BACKDROP): Spatial X/Y Slide + Ken Burns + Z Parallax */}
                  <AnimatePresence mode="wait" initial={false} custom={tourDir}>
                    <motion.div
                      key={activeStop.id}
                      custom={tourDir}
                      className="voyage-backdrop-layer"
                      initial={{opacity: 0, x: tourDir * 72, scale: 1.07}}
                      animate={{opacity: 1, x: 0, scale: 1.02}}
                      exit={{opacity: 0, x: tourDir * -64, scale: 0.98}}
                      transition={{duration: 0.72, ease: [0.22, 1, 0.36, 1]}}
                      style={{x: bgShiftX, y: bgShiftY}}
                    >
                      <MediaImage
                        src={landmarkArtwork(activeStop, true)}
                        alt={local(activeStop, 'name')}
                        width={1536}
                        height={1024}
                        loading="eager"
                        fetchPriority="high"
                        className="voyage-kenburns-img"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* LAYER 2 (ATMOSPHERIC MIDGROUND): Light Rays, Frost Dust & Compass Arc */}
                  <motion.div
                    className="voyage-atmosphere-layer"
                    style={{x: midShiftX, y: midShiftY}}
                    aria-hidden="true"
                  >
                    <div className="voyage-aurora-veil" />
                    <div className="voyage-reticle-ring" />
                  </motion.div>

                  {/* TOP EXPEDITION TELEMETRY BAR */}
                  <div className="voyage-topbar">
                    <div className="voyage-stop-badge">
                      <Sparkles size={13} aria-hidden="true" />
                      <span>
                        Stop {String(safeTourIndex + 1).padStart(2, '0')} /{' '}
                        {String(filtered.length).padStart(2, '0')}
                      </span>
                      <small>{categories[activeStop.category]?.[1] || 'Landmark'}</small>
                    </div>

                    <div className="voyage-bearing-pill" aria-hidden="true">
                      <Navigation
                        size={13}
                        style={{
                          transform: `rotate(${bearingDeg}deg)`,
                          transition: 'transform .6s cubic-bezier(.16,1,.3,1)',
                        }}
                      />
                      <span>Bearing {String(bearingDeg).padStart(3, '0')}°</span>
                    </div>
                  </div>

                  {/* LAYER 3 (FOREGROUND CURATOR CARD): Counter-Parallax Depth Card */}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeStop.id + '-card'}
                      className="voyage-foreground-card"
                      initial={{opacity: 0, y: 26}}
                      animate={{opacity: 1, y: 0}}
                      exit={{opacity: 0, y: -18}}
                      transition={{duration: 0.55, ease: [0.22, 1, 0.36, 1]}}
                      style={{x: fgShiftX, y: fgShiftY}}
                    >
                      <div className="voyage-card-meta">
                        <span>
                          <MapPin size={13} aria-hidden="true" />
                          {local(activeStop, 'location')}
                        </span>
                        <em>{local(activeStop, 'status')}</em>
                      </div>

                      <h3>{local(activeStop, 'name')}</h3>
                      <p className="voyage-epithet">{local(activeStop, 'epithet')}</p>
                      {firstExcerpt && (
                        <p className="voyage-excerpt">{firstExcerpt}</p>
                      )}

                      {Array.isArray(activeStop.traits) && activeStop.traits.length > 0 && (
                        <div className="voyage-trait-chips">
                          {activeStop.traits.slice(0, 3).map((tr: R, idx: number) => (
                            <span key={idx}>{local(tr, 'label')}</span>
                          ))}
                        </div>
                      )}

                      <div className="voyage-card-actions">
                        <button
                          type="button"
                          className="voyage-cta-primary"
                          onClick={e => open(activeStop, e.currentTarget)}
                        >
                          <BookOpen size={15} aria-hidden="true" />
                          <span>Inspect Full Chronicle</span>
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="voyage-cta-secondary"
                          onClick={() => jumpStop(safeTourIndex + 1)}
                        >
                          <span>Next Destination</span>
                          <ChevronRight size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* AUTO-PILOT CONTROL BAR & ROUTE RAIL */}
                  <div className="voyage-control-deck">
                    <div className="voyage-pilot-controls">
                      <button
                        type="button"
                        className={'voyage-pilot-btn' + (autoPlay ? ' is-playing' : '')}
                        onClick={() => {
                          playBrassClick();
                          setAutoPlay(v => !v);
                        }}
                        aria-label={autoPlay ? 'Pause automated tour' : 'Resume automated tour'}
                      >
                        {autoPlay ? <Pause size={14} /> : <Play size={14} />}
                        <span>{autoPlay ? (hoverPaused ? 'Paused on Hover' : 'Auto-Tour On') : 'Tour Paused'}</span>
                      </button>

                      <button
                        type="button"
                        className="voyage-pace-btn"
                        onClick={() => {
                          playBrassClick();
                          setPaceMs(p => (p === 7500 ? 12000 : 7500));
                        }}
                      >
                        {paceMs === 7500 ? 'Pace · 7.5s' : 'Pace · 12s'}
                      </button>

                      <div className="voyage-step-btns">
                        <button
                          type="button"
                          aria-label="Previous destination"
                          onClick={() => jumpStop(safeTourIndex - 1)}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Next destination"
                          onClick={() => jumpStop(safeTourIndex + 1)}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* HORIZONTAL ITINERARY ROUTE STOPS */}
                    <div className="voyage-itinerary-rail" role="tablist" aria-label="Expedition stops">
                      {filtered.map((stop, idx) => {
                        const isCurr = idx === safeTourIndex;
                        return (
                          <button
                            key={stop.id}
                            type="button"
                            role="tab"
                            aria-selected={isCurr}
                            className={'voyage-stop-node' + (isCurr ? ' is-active' : '')}
                            onClick={() => jumpStop(idx)}
                          >
                            <span className="voyage-stop-num">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="voyage-stop-name">{local(stop, 'name')}</span>
                            {isCurr && autoPlay && !hoverPaused && !opened && (
                              <motion.span
                                key={`${stop.id}-${paceMs}`}
                                className="voyage-stop-progress"
                                initial={{scaleX: 0}}
                                animate={{scaleX: 1}}
                                transition={{duration: paceMs / 1000, ease: 'linear'}}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* CURATED GAZETTEER GRID (always visible in Grid mode, and as quick-browse itinerary below Voyage) */}
            <div className="monument-grid-section">
              {viewMode === 'voyage' && (
                <div className="voyage-section-divider">
                  <span>Full Realm Itinerary</span>
                  <small>Click any landmark to open its architectural chronicle</small>
                </div>
              )}
              <div className="monument-grid">
                {filtered.map((m, i) => (
                  <button
                    className={
                      'monument-card' +
                      (viewMode === 'voyage' && i === safeTourIndex ? ' is-voyage-active' : '')
                    }
                    key={m.id}
                    onClick={e => open(m, e.currentTarget)}
                  >
                    <div className="monument-art">
                      <MediaImage
                        src={landmarkArtwork(m, i === 0)}
                        alt={local(m, 'name')}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        fetchPriority={i === 0 ? 'high' : undefined}
                        decoding="async"
                        width={600}
                        height={400}
                      />
                      <span className="monument-art-index">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="monument-art-cat">
                        {categories[m.category]?.[1] || m.category}
                      </span>
                    </div>
                    <div className="monument-card-copy">
                      <small>
                        <MapPin size={14} />
                        {local(m, 'location')}
                      </small>
                      <h3>{local(m, 'name')}</h3>
                      <p>{local(m, 'epithet')}</p>
                      <em>{local(m, 'status')}</em>
                      <b>
                        Explore landmark
                        <ArrowUpRight size={16} />
                      </b>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* DEEP ARCHITECTURAL DOSSIER DIALOG */}
        {selected && (
          <dialog
            className="monument-dialog"
            ref={dialog}
            aria-labelledby="monument-title"
            onCancel={e => {
              e.preventDefault();
              close();
            }}
            onClick={e => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <article>
              <button
                className="monument-close"
                onClick={close}
                aria-label="Close dossier"
              >
                <X />
              </button>
              <div className="monument-hero">
                <MediaImage
                  key={selected.id}
                  className="spatial-dossier-enter"
                  style={{viewTransitionName: 'tfam-carried-art'}}
                  src={landmarkArtwork(selected, true)}
                  alt={local(selected, 'name')}
                  width={1536}
                  height={1024}
                />
                <div>
                  <h2 id="monument-title">{local(selected, 'name')}</h2>
                  <span>
                    {categories[selected.category]?.[1]} · {local(selected, 'status')}
                  </span>
                  <p>{local(selected, 'epithet')}</p>
                </div>
              </div>
              <div className="monument-body">
                <p className="monument-location">
                  <MapPin size={16} />
                  {local(selected, 'location')}
                </p>
                <section>
                  <h3>
                    <BookOpen size={20} />
                    Chronicle
                  </h3>
                  {local(selected, 'lore')
                    .split(/\n\s*\n/)
                    .map((p: string, i: number) => (
                      <p key={i}>{p}</p>
                    ))}
                </section>
                <section>
                  <h3>
                    <Shield size={20} />
                    Architectural &amp; Strategic Traits
                  </h3>
                  <div className="monument-traits">
                    {(selected.traits || []).map((a: R, i: number) => (
                      <div key={i}>
                        <h4>{local(a, 'label')}</h4>
                        <p>{local(a, 'description')}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h3>
                    <Landmark size={20} />
                    Influence upon the faction
                  </h3>
                  <div className="monument-effects">
                    <div>
                      <h4>
                        <ArrowUpRight size={20} />
                        Advantage
                      </h4>
                      <p>{local(selected, 'benefit')}</p>
                    </div>
                    <div>
                      <h4>
                        <ArrowDownRight size={20} />
                        The price
                      </h4>
                      <p>{local(selected, 'cost')}</p>
                    </div>
                  </div>
                </section>
                <details>
                  <summary>Historical foundations &amp; editorial sources</summary>
                  <p>{local(selected, 'historical_anchor')}</p>
                  <small>
                    An expanded TFAM gazetteer: new roles and influences are authored
                    for its alternate-history world.
                  </small>
                  <ul>
                    {(selected.source_refs || []).map((url: string, i: number) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          Reference {i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
                <nav className="monument-adjacent" aria-label="Adjacent landmarks">
                  <button
                    disabled={selectedIndex <= 0}
                    onClick={() => open(filtered[selectedIndex - 1])}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button onClick={close}>Back to voyage</button>
                  <button
                    disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1}
                    onClick={() => open(filtered[selectedIndex + 1])}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            </article>
          </dialog>
        )}
      </section>
    </MotionConfig>
  );
}
