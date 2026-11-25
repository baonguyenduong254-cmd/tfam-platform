'use client';

import {AnimatePresence, MotionConfig, motion} from 'motion/react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Anchor,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flag,
  Flame,
  Link as LinkIcon,
  Scale,
  ScrollText,
  Search,
  Shield,
  Swords,
  Target,
  Users,
  X,
} from 'lucide-react';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import MediaImage from './MediaImage';
import {playBrassClick, playParchmentTurn} from '../../lib/tactile-sfx';
import {
  militaryBranches,
  militaryBranchNames,
  militarySearch,
  type MilitaryBranch,
  type MilitaryManifest,
  type MilitaryUnit,
} from '../../lib/military';
import {militaryCutout} from '../../lib/military-cutouts';
import ImperialSectionHeader from './ImperialSectionHeader';

type Faction = {
  id: string;
  name_vi?: string;
  name_en?: string;
  flag_asset?: string;
  ui_color_primary?: string;
};

type Props = {
  embedded?: boolean;
  factions: Faction[];
  factionId: string;
  lang: string;
  onFaction: (id: string) => void;
};

const icons: Record<MilitaryBranch, typeof Shield> = {
  infantry: Shield,
  cavalry: Flag,
  artillery: Target,
  special: Swords,
  naval: Anchor,
};

const echelonLabel: Record<MilitaryBranch, string> = {
  infantry: 'Vanguard Line',
  cavalry: 'Flank Wings',
  artillery: 'Rear Battery',
  special: 'Command Reserve',
  naval: 'Maritime Wing',
};

const cachedUnits = new Map<string, MilitaryUnit[]>();
const decodePart = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
};

export default function MilitaryRoster({
  factions,
  factionId,
  lang,
  onFaction,
}: Props) {
  const [manifest, setManifest] = useState<MilitaryManifest | null>(null);
  const [units, setUnits] = useState<MilitaryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  const [branch, setBranch] = useState<MilitaryBranch | 'all'>('all');
  const [search, setSearch] = useState('');
  const [spotlightId, setSpotlightId] = useState<string>('');
  const [opened, setOpened] = useState<string | null>(null);
  const [stageTab, setStageTab] = useState<'briefing' | 'chronicle' | 'traits'>('chronicle');
  const [shared, setShared] = useState<'idle' | 'copied' | 'manual'>('idle');
  const [doctrineOpen, setDoctrineOpen] = useState(false);

  // Side-by-side unit comparison (up to 2 units)
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  const faction = factions.find(f => f.id === factionId);
  const entry = manifest?.factions.find(f => f.id === factionId);
  const factionName = presentationPunctuation(
    faction?.name_en || faction?.name_vi || 'Imperial'
  );

  const local = (
    u: MilitaryUnit,
    key: 'name' | 'class' | 'role' | 'lore' | 'quote'
  ) =>
    presentationPunctuation(
      (key === 'name' ? u.name_native || u.name_vi : u[`${key}_en`]) || ''
    );

  useEffect(() => {
    const c = new AbortController();
    setError(false);
    setLoading(true);
    fetch('/military/manifest.json', {signal: c.signal, cache: 'no-cache'})
      .then(r => {
        if (!r.ok) throw Error();
        return r.json() as Promise<MilitaryManifest>;
      })
      .then(setManifest)
      .catch(e => {
        if (e.name !== 'AbortError') {
          setError(true);
          setLoading(false);
        }
      });
    return () => c.abort();
  }, [retry]);

  useEffect(() => {
    if (!manifest) return;
    const c = new AbortController();
    setLoading(true);
    setError(false);
    setUnits([]);
    setCompareIds([]);
    setCompareOpen(false);
    setDoctrineOpen(false);
    try {
      const saved = JSON.parse(
        sessionStorage.getItem('tfam-military:' + factionId) || '{}'
      );
      setBranch(saved.branch || 'all');
      setSearch(saved.search || '');
    } catch {
      setBranch('all');
      setSearch('');
    }
    setOpened(null);

    const f = manifest.factions.find(item => item.id === factionId);
    if (!f) {
      setLoading(false);
      return;
    }
    const key = manifest.version + ':' + factionId;
    const apply = (items: MilitaryUnit[]) => {
      setUnits(items);
      setLoading(false);
      const parts = window.location.hash.slice(1).split('/').map(decodePart);
      if (
        parts[0] === 'military' &&
        parts[1] === factionId &&
        items.some(u => u.id === parts[2])
      ) {
        setOpened(parts[2]);
        setSpotlightId(parts[2]);
      } else {
        // Default spotlight to an iconic special/elite unit if available, else first unit
        const signature =
          items.find(u => u.branch === 'special') ||
          items.find(u => u.branch === 'infantry') ||
          items[0];
        setSpotlightId(signature?.id || '');
      }
    };
    if (cachedUnits.has(key)) apply(cachedUnits.get(key)!);
    else {
      fetch(f.data_url + '?v=' + encodeURIComponent(manifest.version), {
        signal: c.signal,
      })
        .then(r => {
          if (!r.ok) throw Error();
          return r.json() as Promise<MilitaryUnit[]>;
        })
        .then((items: MilitaryUnit[]) => {
          cachedUnits.set(key, items);
          apply(items);
        })
        .catch(e => {
          if (e.name !== 'AbortError') {
            setError(true);
            setLoading(false);
          }
        });
    }
    return () => c.abort();
  }, [manifest, factionId]);

  useEffect(() => {
    const sync = () => {
      const p = window.location.hash.slice(1).split('/').map(decodePart);
      if (p[0] === 'military' && p[1] === factionId) {
        const hit = units.some(u => u.id === p[2]) ? p[2] : null;
        setOpened(hit);
        if (hit) setSpotlightId(hit);
      }
    };
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, [units, factionId]);

  useEffect(() => {
    if (loading) return;
    try {
      sessionStorage.setItem(
        'tfam-military:' + factionId,
        JSON.stringify({branch, search})
      );
    } catch {}
  }, [branch, search, factionId, loading]);

  const filtered = useMemo(() => {
    const q = militarySearch(search.trim());
    return units.filter(
      u =>
        (branch === 'all' || u.branch === branch) &&
        (!q ||
          militarySearch(
            [
              u.name_native,
              u.name_vi,
              u.class_en,
              u.class_vi,
              u.role_en,
              u.role_vi,
              ...u.traits_en,
              ...u.traits_vi,
            ].join(' ')
          ).includes(q))
    );
  }, [units, branch, search]);

  // Active spotlight unit always stays valid within the current filtered list
  const activeUnit = useMemo(() => {
    if (!filtered.length) return undefined;
    return filtered.find(u => u.id === spotlightId) || filtered[0];
  }, [filtered, spotlightId]);

  const activeIndex = activeUnit
    ? filtered.findIndex(u => u.id === activeUnit.id)
    : -1;

  const selected = units.find(u => u.id === opened);
  const selectedIndex = filtered.findIndex(u => u.id === opened);

  const comparedUnits = useMemo(
    () =>
      compareIds
        .map(id => units.find(u => u.id === id))
        .filter((u): u is MilitaryUnit => !!u),
    [compareIds, units]
  );

  useEffect(() => {
    if (!selected && !compareOpen && !doctrineOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (compareOpen) setCompareOpen(false);
        else if (doctrineOpen) setDoctrineOpen(false);
        else closeDossier();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [!!selected, compareOpen, doctrineOpen]);

  function selectSpotlight(u: MilitaryUnit, scrollUp = false) {
    playBrassClick();
    setSpotlightId(u.id);
    if (scrollUp && stageRef.current) {
      const reduced =
        typeof matchMedia === 'function' &&
        matchMedia('(prefers-reduced-motion: reduce)').matches;
      stageRef.current.scrollIntoView({
        behavior: reduced ? 'instant' : 'smooth',
        block: 'nearest',
      });
    }
  }

  function stepSpotlight(delta: number) {
    if (filtered.length < 2 || activeIndex < 0) return;
    playBrassClick();
    const next = filtered[(activeIndex + delta + filtered.length) % filtered.length];
    setSpotlightId(next.id);
  }

  function openDossier(u: MilitaryUnit) {
    playParchmentTurn();
    setSpotlightId(u.id);
    setOpened(u.id);
    setStageTab('chronicle');
    setShared('idle');
    history.replaceState({...history.state, tfamScroll: window.scrollY}, '');
    history.pushState(
      {tfamScroll: window.scrollY},
      '',
      '#military/' + encodeURIComponent(factionId) + '/' + encodeURIComponent(u.id)
    );
  }

  function closeDossier() {
    playBrassClick();
    setOpened(null);
    history.replaceState(null, '', '#military/' + encodeURIComponent(factionId));
  }

  function stepDossier(delta: number) {
    if (filtered.length < 2 || selectedIndex < 0) return;
    const nextIdx = (selectedIndex + delta + filtered.length) % filtered.length;
    openDossier(filtered[nextIdx]);
  }

  function toggleCompare(unitId: string) {
    playBrassClick();
    setCompareIds(prev => {
      if (prev.includes(unitId)) return prev.filter(id => id !== unitId);
      if (prev.length >= 2) return [prev[1], unitId];
      return [...prev, unitId];
    });
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared('copied');
    } catch {
      setShared('manual');
    }
  }

  const branchCounts = useMemo(() => {
    const counts: Record<MilitaryBranch, number> = {
      infantry: 0,
      cavalry: 0,
      artillery: 0,
      special: 0,
      naval: 0,
    };
    for (const u of units) counts[u.branch] = (counts[u.branch] || 0) + 1;
    return counts;
  }, [units]);

  return (
    <MotionConfig reducedMotion="user">
      <section
        className="military-roster military211 warfolio-v263"
        aria-labelledby="archive-title"
        style={
          {'--military-accent': faction?.ui_color_primary || '#b8a37a'} as React.CSSProperties
        }
      >
        <ImperialSectionHeader
          kicker="Codex Militaris · Order of Battle"
          title={`${factionName} Forces`}
          subtitle={
            entry?.quote_en
              ? `“${presentationPunctuation(entry.quote_en)}” — ${presentationPunctuation(entry.doctrine_en)}`
              : 'Imperial war folio, regimental inspection plates, and battlefield doctrine.'
          }
          titleId="archive-title"
          flagAsset={faction?.flag_asset}
          factions={factions}
          activeFactionId={factionId}
          onFaction={onFaction}
          countValue={loading ? '—' : filtered.length}
          countLabel={filtered.length === 1 ? 'regiment' : 'regiments'}
          rightControls={
            <>
              {entry && (
                <button
                  type="button"
                  className="imp-hero-pill-btn"
                  onClick={() => {
                    playParchmentTurn();
                    setDoctrineOpen(true);
                  }}
                >
                  <ScrollText size={14} aria-hidden="true" />
                  Army Doctrine
                </button>
              )}
              {compareIds.length > 0 && (
                <button
                  type="button"
                  className="imp-hero-pill-btn is-active"
                  onClick={() => {
                    playBrassClick();
                    setCompareOpen(true);
                  }}
                >
                  <Scale size={14} aria-hidden="true" />
                  Compare ({compareIds.length}/2)
                </button>
              )}
            </>
          }
          bottomBar={
            <>
              <nav className="imp-hero-tabs" role="tablist" aria-label="Filter military branches">
                <button
                  type="button"
                  role="tab"
                  aria-selected={branch === 'all'}
                  className={'imp-tab-btn' + (branch === 'all' ? ' is-active' : '')}
                  onClick={() => {
                    playBrassClick();
                    setBranch('all');
                  }}
                >
                  <Swords size={13} aria-hidden="true" />
                  <span>All Arms</span>
                  <small>{units.length}</small>
                  {branch === 'all' && (
                    <motion.span
                      layoutId="tfam-military-branch-rail"
                      className="imp-tab-rail"
                      transition={{type: 'spring', duration: 0.32, bounce: 0}}
                    />
                  )}
                </button>
                {militaryBranches.map(b => {
                  const Icon = icons[b];
                  const count = branchCounts[b];
                  const active = branch === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      disabled={!count}
                      className={'imp-tab-btn' + (active ? ' is-active' : '')}
                      onClick={() => {
                        playBrassClick();
                        setBranch(b);
                      }}
                    >
                      <Icon size={13} aria-hidden="true" />
                      <span>{militaryBranchNames[b][1]}</span>
                      <small>{count}</small>
                      {active && (
                        <motion.span
                          layoutId="tfam-military-branch-rail"
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
                <span className="sr-only">Search military units</span>
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search regiment, role, or trait…"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch('')}
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
          <div className="military-notice world-loading" role="status">
            <Compass className="military-loading" />
            Opening the imperial military folio…
          </div>
        ) : error ? (
          <div className="military-notice" role="alert">
            <p>The military archive could not be loaded. Please retry.</p>
            <button
              onClick={() => {
                setRetry(n => n + 1);
                setManifest(null);
              }}
            >
              Retry
            </button>
          </div>
        ) : !filtered.length ? (
          <div className="military-notice">
            <Search />
            <p>No matching units. Try another name or branch.</p>
            <button
              onClick={() => {
                setSearch('');
                setBranch('all');
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* ============================================================
                MONUMENTAL ILLUMINATED WAR FOLIO SPOTLIGHT (IMMEDIATELY ABOVE FOLD)
                ============================================================ */}
            {activeUnit && (
              <div className="warfolio-stage" ref={stageRef}>
                <div className="warfolio-stage-aura" aria-hidden="true" />

                {/* LEFT: FRAMELESS TRANSPARENT CUTOUT (WHEN AVAILABLE) OR MUSEUM-MATTED VELLUM PLATE */}
                <div className="warfolio-plate-showcase">
                  <AnimatePresence mode="wait" initial={false}>
                    {militaryCutout(activeUnit.id) ? (
                      <motion.div
                        key={activeUnit.id + '-cutout'}
                        className="warfolio-cutout-stage"
                        initial={{opacity: 0, scale: 0.96, y: 12}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 1.01, y: -6}}
                        transition={{duration: 0.36, ease: [0.22, 1, 0.36, 1]}}
                      >
                        <img
                          src={militaryCutout(activeUnit.id)}
                          alt={local(activeUnit, 'name')}
                          width={900}
                          height={1200}
                          loading="eager"
                          className="warfolio-cutout-img"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={activeUnit.id}
                        className="warfolio-vellum-frame"
                        initial={{opacity: 0, scale: 0.97, y: 10}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.98, y: -8}}
                        transition={{duration: 0.36, ease: [0.22, 1, 0.36, 1]}}
                      >
                        <span className="warfolio-plate-index">
                          PLATE {activeUnit.number.padStart(2, '0')}
                        </span>
                        <MediaImage
                          src={activeUnit.artwork || activeUnit.thumbnail}
                          alt={local(activeUnit, 'name')}
                          width={900}
                          height={1200}
                          loading="eager"
                          fetchPriority="high"
                          className="warfolio-vellum-img"
                        />
                        <span className="warfolio-vellum-vignette" aria-hidden="true" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* RIGHT: TACTICAL COMMAND BRIEF */}
                <div className="warfolio-brief">
                  <div className="warfolio-brief-top">
                    <span className="warfolio-kicker">
                      {(() => {
                        const Icon = icons[activeUnit.branch];
                        return <Icon size={13} aria-hidden="true" />;
                      })()}
                      {militaryBranchNames[activeUnit.branch][1]} · {echelonLabel[activeUnit.branch]}
                    </span>

                    {filtered.length > 1 && (
                      <div className="warfolio-pager" aria-label="Cycle highlighted regiment">
                        <button
                          type="button"
                          aria-label="Previous regiment"
                          onClick={() => stepSpotlight(-1)}
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <span>
                          {String(activeIndex + 1).padStart(2, '0')} /{' '}
                          {String(filtered.length).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          aria-label="Next regiment"
                          onClick={() => stepSpotlight(1)}
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeUnit.id + '-copy'}
                      className="warfolio-brief-body"
                      initial={{opacity: 0, y: 10}}
                      animate={{opacity: 1, y: 0}}
                      exit={{opacity: 0, y: -8}}
                      transition={{duration: 0.28, ease: [0.22, 1, 0.36, 1]}}
                    >
                      <h3>{local(activeUnit, 'name')}</h3>
                      <p className="warfolio-class">{local(activeUnit, 'class')}</p>

                      {local(activeUnit, 'quote') && (
                        <blockquote className="warfolio-quote">
                          “{local(activeUnit, 'quote')}”
                        </blockquote>
                      )}

                      <p className="warfolio-role">{local(activeUnit, 'role')}</p>

                      <div className="warfolio-traits-wrap" aria-label="Combat traits">
                        {activeUnit.traits_en.map((trait, i) => {
                          const Icon = [Shield, Target, Flame, Compass, Users, Anchor][i % 6];
                          return (
                            <span key={i} className="warfolio-trait-chip">
                              <Icon size={12} aria-hidden="true" />
                              {presentationPunctuation(trait)}
                            </span>
                          );
                        })}
                      </div>

                      <div className="warfolio-actions">
                        <button
                          type="button"
                          className="warfolio-cta-primary"
                          onClick={() => openDossier(activeUnit)}
                        >
                          <BookOpen size={15} aria-hidden="true" />
                          <span>Open Full Chronicle</span>
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          className={
                            'warfolio-cta-secondary' +
                            (compareIds.includes(activeUnit.id) ? ' is-pinned' : '')
                          }
                          onClick={() => toggleCompare(activeUnit.id)}
                        >
                          {compareIds.includes(activeUnit.id) ? (
                            <Check size={14} aria-hidden="true" />
                          ) : (
                            <Scale size={14} aria-hidden="true" />
                          )}
                          <span>
                            {compareIds.includes(activeUnit.id)
                              ? 'Pinned to Compare'
                              : 'Pin to Compare'}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ============================================================
                TOTAL WAR-STYLE FULL-BLEED REGIMENT DECK (ZERO WHITE STICKERS)
                ============================================================ */}
            <div className="warfolio-deck-section">
              <div className="warfolio-deck-header">
                <h4>
                  {branch === 'all'
                    ? 'Complete Order of Battle'
                    : `${militaryBranchNames[branch][1]} · ${echelonLabel[branch]}`}
                </h4>
                <small>Click a unit plate to inspect on stage · Double-click for full chronicle</small>
              </div>

              <div className="warfolio-deck-grid">
                {filtered.map(u => {
                  const Icon = icons[u.branch];
                  const isSpot = activeUnit?.id === u.id;
                  const isPinned = compareIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      data-branch={u.branch}
                      aria-pressed={isSpot}
                      className={
                        'warfolio-unit-tile' +
                        (isSpot ? ' is-active' : '') +
                        (isPinned ? ' is-pinned' : '')
                      }
                      onClick={() => selectSpotlight(u, true)}
                      onDoubleClick={() => openDossier(u)}
                    >
                      <span className="warfolio-tile-art" aria-hidden="true">
                        <MediaImage
                          src={u.thumbnail || u.artwork}
                          alt=""
                          width={500}
                          height={660}
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="warfolio-tile-vignette" />
                      </span>

                      <span className="warfolio-tile-top" aria-hidden="true">
                        <span className="warfolio-tile-num">{u.number.padStart(2, '0')}</span>
                        <span className="warfolio-tile-branch">
                          <Icon size={11} />
                          {militaryBranchNames[u.branch][1]}
                        </span>
                      </span>

                      <span className="warfolio-tile-copy">
                        <strong>{local(u, 'name')}</strong>
                        <small>{local(u, 'class')}</small>
                      </span>
                      <span className="warfolio-tile-beam" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {manifest && (
          <footer className="military-provenance">
            <ScrollText size={15} />
            <span>
              From the TFAM Military Encyclopedia ·{' '}
              {new Date(manifest.imported_at).toLocaleDateString('en-GB', {
                timeZone: 'UTC',
              })}
            </span>
          </footer>
        )}

        {/* ============================================================
            STAGE 2: FULL-VIEWPORT 100SVH REGIMENTAL CHRONICLE STAGE
            ============================================================ */}
        {selected && (
          <div
            className="warroom-stage-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby="military-unit-title"
          >
            <div className="warroom-stage-body">
              <section className="warroom-stage-visual" aria-label={local(selected, 'name')}>
                <header className="warroom-stage-topbar">
                  <button type="button" className="warroom-stage-pill" onClick={closeDossier}>
                    <ArrowLeft size={15} aria-hidden="true" />
                    <span>Order of Battle</span>
                  </button>

                  {filtered.length > 1 && selectedIndex >= 0 && (
                    <div className="warroom-stage-stepper" aria-label="Switch regiment">
                      <button
                        type="button"
                        aria-label="Previous regiment"
                        onClick={() => stepDossier(-1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span>
                        {String(selectedIndex + 1).padStart(2, '0')} /{' '}
                        {String(filtered.length).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        aria-label="Next regiment"
                        onClick={() => stepDossier(1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </header>

                <div className="warroom-stage-figure">
                  {militaryCutout(selected.id) ? (
                    <img
                      key={selected.id}
                      src={militaryCutout(selected.id)}
                      alt={local(selected, 'name')}
                      width={1000}
                      height={1500}
                      loading="eager"
                      className="warroom-stage-img is-cutout"
                    />
                  ) : (
                    <div className="warfolio-stage-frame">
                      <MediaImage
                        key={selected.id}
                        src={selected.artwork}
                        alt={local(selected, 'name')}
                        width={1000}
                        height={1500}
                        loading="eager"
                        fetchPriority="high"
                        className="warroom-stage-img"
                      />
                    </div>
                  )}
                </div>
              </section>

              <aside className="warroom-stage-panel">
                <div className="warroom-panel-header">
                  <span className="warroom-panel-kicker">
                    {militaryBranchNames[selected.branch][1]} · Plate{' '}
                    {selected.number.padStart(2, '0')} · {echelonLabel[selected.branch]}
                  </span>
                  <h1 id="military-unit-title">{local(selected, 'name')}</h1>
                  <p className="warroom-panel-class">{local(selected, 'class')}</p>
                </div>

                <nav className="warroom-panel-tabs" role="tablist" aria-label="Regiment dossier tabs">
                  {(
                    [
                      {id: 'chronicle', label: 'Chronicle'},
                      {id: 'briefing', label: 'Briefing'},
                      {id: 'traits', label: 'Traits'},
                    ] as const
                  ).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={stageTab === t.id}
                      className={stageTab === t.id ? 'is-active' : ''}
                      onClick={() => {
                        playBrassClick();
                        setStageTab(t.id);
                      }}
                    >
                      <span>{t.label}</span>
                      {t.id === 'traits' && <small>{selected.traits_en.length}</small>}
                      {stageTab === t.id && (
                        <motion.span
                          layoutId="tfam-warroom-tab-rail"
                          className="imp-tab-rail"
                          transition={{type: 'spring', duration: 0.32, bounce: 0}}
                        />
                      )}
                    </button>
                  ))}
                </nav>

                <div className="warroom-panel-scroll" role="tabpanel">
                  {stageTab === 'chronicle' && (
                    <div className="warroom-tab-stack">
                      {local(selected, 'quote') && (
                        <blockquote className="warroom-quote">
                          “{local(selected, 'quote')}”
                        </blockquote>
                      )}
                      <section className="warroom-block">
                        <h3>
                          <ScrollText size={15} aria-hidden="true" /> Regimental History
                        </h3>
                        {local(selected, 'lore')
                          .split(/\n\s*\n/)
                          .map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                      </section>
                    </div>
                  )}

                  {stageTab === 'briefing' && (
                    <div className="warroom-tab-stack">
                      <section className="warroom-block">
                        <h3>
                          <Target size={15} aria-hidden="true" /> Battlefield Role
                        </h3>
                        <p>{local(selected, 'role')}</p>
                      </section>
                      <section className="warroom-block">
                        <h3>
                          <Compass size={15} aria-hidden="true" /> Echelon Assignment
                        </h3>
                        <p>{echelonLabel[selected.branch]} · {militaryBranchNames[selected.branch][1]}</p>
                      </section>
                    </div>
                  )}

                  {stageTab === 'traits' && (
                    <div className="warroom-tab-stack">
                      <section className="warroom-block">
                        <h3>
                          <Shield size={15} aria-hidden="true" /> Combat Traits
                        </h3>
                        <ul className="warroom-trait-medals">
                          {selected.traits_en.map((trait, i) => {
                            const Icon = [Shield, Target, Flame, Compass, Users, Anchor][i % 6];
                            return (
                              <li key={i}>
                                <Icon size={15} aria-hidden="true" />
                                <span>{presentationPunctuation(trait)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    </div>
                  )}
                </div>

                <footer className="warroom-panel-footer">
                  <button
                    type="button"
                    className="imp-hero-pill-btn"
                    onClick={() => toggleCompare(selected.id)}
                  >
                    <Scale size={14} aria-hidden="true" />
                    {compareIds.includes(selected.id) ? 'Pinned' : 'Compare'}
                  </button>
                  <button type="button" className="imp-hero-pill-btn" onClick={share}>
                    <LinkIcon size={14} aria-hidden="true" />
                    {shared === 'copied' ? 'Copied' : 'Share'}
                  </button>
                </footer>
              </aside>
            </div>
          </div>
        )}

        {/* ARMY DOCTRINE MODAL */}
        {doctrineOpen && entry && (
          <div
            className="warroom-compare-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Imperial Army Doctrine"
            onClick={e => {
              if (e.target === e.currentTarget) setDoctrineOpen(false);
            }}
          >
            <div className="warroom-compare-sheet warfolio-doctrine-sheet">
              <header className="warroom-compare-head">
                <div>
                  <span className="warfolio-kicker">Imperial War Doctrine</span>
                  <h3>{presentationPunctuation(entry.name_en)}</h3>
                </div>
                <button
                  type="button"
                  className="warroom-close-x"
                  aria-label="Close doctrine"
                  onClick={() => setDoctrineOpen(false)}
                >
                  <X size={18} />
                </button>
              </header>
              <div className="warfolio-doctrine-body">
                <p className="warfolio-doctrine-pillars">
                  {presentationPunctuation(entry.doctrine_en)}
                </p>
                {entry.quote_en && (
                  <blockquote className="warroom-quote">
                    “{presentationPunctuation(entry.quote_en)}”
                  </blockquote>
                )}
                <p className="warfolio-doctrine-prose">
                  {presentationPunctuation(entry.lore_en)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SIDE-BY-SIDE UNIT COMPARISON MODAL */}
        {compareOpen && comparedUnits.length > 0 && (
          <div
            className="warroom-compare-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Compare military regiments"
            onClick={e => {
              if (e.target === e.currentTarget) setCompareOpen(false);
            }}
          >
            <div className="warroom-compare-sheet">
              <header className="warroom-compare-head">
                <div>
                  <span className="warfolio-kicker">Tactical Comparison Table</span>
                  <h3>Regimental Side-by-Side Assessment</h3>
                </div>
                <div className="warroom-compare-actions">
                  <button
                    type="button"
                    className="imp-hero-pill-btn"
                    onClick={() => {
                      setCompareIds([]);
                      setCompareOpen(false);
                    }}
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    className="warroom-close-x"
                    aria-label="Close comparison"
                    onClick={() => setCompareOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              <div className="warroom-compare-cols">
                {comparedUnits.map(u => {
                  const Icon = icons[u.branch];
                  return (
                    <div key={u.id} className="warroom-compare-col">
                      <div className="warroom-compare-art">
                        <MediaImage
                          src={u.artwork || u.thumbnail}
                          alt={local(u, 'name')}
                          width={600}
                          height={900}
                        />
                      </div>
                      <span className="warfolio-kicker">
                        <Icon size={12} /> {militaryBranchNames[u.branch][1]} ·{' '}
                        {echelonLabel[u.branch]}
                      </span>
                      <h4>{local(u, 'name')}</h4>
                      <p className="warfolio-class">{local(u, 'class')}</p>
                      <p className="warroom-compare-role">{local(u, 'role')}</p>
                      <ul className="warroom-compare-traits">
                        {u.traits_en.map((tr, i) => (
                          <li key={i}>{presentationPunctuation(tr)}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                {comparedUnits.length === 1 && (
                  <div className="warroom-compare-empty">
                    <Scale size={28} />
                    <p>Pin a second regiment from the spotlight stage to compare them side by side.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </MotionConfig>
  );
}
