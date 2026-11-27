'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,BookOpen,Search,Sparkles,X} from 'lucide-react';
import englishIndex from '../../lib/story/english-arc1-final-index.json';
import ImperialSectionHeader from './ImperialSectionHeader';
import '../chronicles-211.css';

const fallbackArtwork = '/art/evelyne-monodica-moonfall-205-1920.webp';

type EnglishChapter = {
  id: string;
  arc: number;
  number: number;
  order: number;
  title_en: string;
};

const sixArcs = [
  {arc: 1, roman: 'Arc I', title: 'Return of the Legendary Admiral', cover: '/art/arcs/arc-1.webp'},
  {arc: 2, roman: 'Arc II', title: 'War of Crimson', cover: '/art/arcs/arc-2.webp'},
  {arc: 3, roman: 'Arc III', title: 'Valhalla Call', cover: '/art/arcs/arc-3.webp'},
  {arc: 4, roman: 'Arc IV', title: 'The Roads That Remain', cover: '/art/arcs/arc-4.webp'},
  {arc: 5, roman: 'Arc V', title: 'Rise of the Requiem', cover: '/art/arcs/arc-5.webp'},
  {arc: 6, roman: 'Arc VI', title: 'Before the Bells Toll', cover: '/art/arcs/arc-6.webp'},
];

type ArcEdition = (typeof sixArcs)[number];
const publishedChapters = englishIndex as EnglishChapter[];

export default function ChroniclesHub(){
  const [selectedArc, setSelectedArc] = useState<ArcEdition | null>(null);
  const [chapterQuery, setChapterQuery] = useState('');

  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selectedArc) dialog.current?.showModal();
  }, [selectedArc]);

  const arcChapters = useMemo(
    () => (selectedArc ? publishedChapters.filter(ch => ch.arc === selectedArc.arc) : []),
    [selectedArc]
  );

  const filteredChapters = useMemo(() => {
    const q = chapterQuery.trim().toLowerCase();
    if (!q) return arcChapters;
    return arcChapters.filter(ch => {
      const numStr = String(ch.number);
      const padded = numStr.padStart(2, '0');
      return (
        ch.title_en.toLowerCase().includes(q) ||
        numStr.includes(q) ||
        padded.includes(q) ||
        `chapter ${numStr}`.includes(q) ||
        `chapter ${padded}`.includes(q)
      );
    });
  }, [arcChapters, chapterQuery]);

  function openArc(arc: ArcEdition){
    setChapterQuery('');
    setSelectedArc(arc);
  }

  function closeArc(){
    setSelectedArc(null);
    setChapterQuery('');
  }

  const firstPublishedHref = publishedChapters.length > 0 ? `/read/${publishedChapters[0].id}` : null;

  return (
    <section className="chronicle211 chronicles-v250-shelf chronicles-v265" aria-labelledby="library250-title">
      <ImperialSectionHeader
        kicker="Through Frost and Myth · Six-Arc Canon"
        title="The Chronicles"
        subtitle="Six collector volumes tracing the frozen war of 1715–1716."
        titleId="library250-title"
        countValue={publishedChapters.length}
        countLabel="published chapters"
        rightControls={
          firstPublishedHref ? (
            <a className="chr265-hero-cta" href={firstPublishedHref}>
              <span>Begin Arc I</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          ) : undefined
        }
      />

      <div className="v250-arcs-grid" role="group" aria-label="Chronicles volumes">
        {sixArcs.map(arc => {
          const count = publishedChapters.filter(ch => ch.arc === arc.arc).length;
          const isPublished = count > 0;
          return (
            <button
              key={arc.cover}
              type="button"
              className={'v250-arc-volume ' + (isPublished ? 'is-published' : 'is-forthcoming')}
              onClick={() => openArc(arc)}
              aria-label={`${arc.roman}: ${arc.title}${isPublished ? ` (${count} chapters available)` : ' (In preparation)'}`}
            >
              <div className="chr265-book-stage">
                <span className="chr265-book-aura" aria-hidden="true" />
                <div className="v250-arc-book">
                  <img
                    src={arc.cover}
                    alt={`${arc.roman}: ${arc.title}`}
                    loading="eager"
                    onError={e => {
                      if (e.currentTarget.getAttribute('src') !== fallbackArtwork) {
                        e.currentTarget.src = fallbackArtwork;
                      }
                    }}
                  />
                  <div className="v250-arc-spine" aria-hidden="true" />
                  {!isPublished && <div className="chr265-archival-sheen" aria-hidden="true" />}
                </div>
              </div>

              <div className="chr265-volume-meta">
                <div className="chr265-volume-top">
                  <span className="chr265-roman">{arc.roman}</span>
                  {isPublished ? (
                    <span className="chr265-status-pill is-live">
                      <Sparkles size={11} aria-hidden="true" />
                      <span>{count} Chapters Available</span>
                    </span>
                  ) : (
                    <span className="chr265-status-pill is-quiet">In Preparation</span>
                  )}
                </div>
                <span className="v250-arc-caption">{arc.title}</span>
                <span className="chr265-volume-cta">
                  <span>{isPublished ? 'Open volume index' : 'Inspect volume dossier'}</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedArc && (
        <dialog
          ref={dialog}
          className={'v250-arc-modal' + (arcChapters.length > 0 ? ' is-published' : ' is-forthcoming')}
          aria-labelledby="arc-modal-title"
          onClose={closeArc}
          onClick={event => {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.target === event.currentTarget &&
              (event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom)
            ) {
              event.currentTarget.close();
            }
          }}
        >
          <button
            type="button"
            className="v250-arc-close"
            aria-label="Close volume"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>

          <div className="v250-arc-modal-art">
            <div className="chr265-modal-cover-frame">
              <img
                src={selectedArc.cover}
                alt={selectedArc.title}
                onError={e => {
                  if (e.currentTarget.getAttribute('src') !== fallbackArtwork) {
                    e.currentTarget.src = fallbackArtwork;
                  }
                }}
              />
            </div>
          </div>

          <div className="v250-arc-modal-copy">
            <div className="chr265-modal-sticky-head">
              <span className="v250-shelf-eyebrow">
                <BookOpen size={13} aria-hidden="true" /> {selectedArc.roman}
              </span>
              <h2 id="arc-modal-title">{selectedArc.title}</h2>
              {arcChapters.length > 0 ? (
                <>
                  <p className="v250-arc-meta">
                    {arcChapters.length} English chapters ready to read.
                  </p>
                  <div className="v250-arc-modal-actions">
                    <a className="v250-arc-btn v250-arc-btn-link" href={`/read/${arcChapters[0].id}`}>
                      <span>Begin {selectedArc.roman}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      className="v250-arc-btn v250-arc-btn-ghost"
                      onClick={() => dialog.current?.close()}
                    >
                      Return to The Chronicles
                    </button>
                  </div>

                  <div className="chr265-chapter-filter-wrap">
                    <label className="chr265-chapter-filter">
                      <Search size={15} aria-hidden="true" />
                      <span className="sr-only">Filter {selectedArc.roman} chapters</span>
                      <input
                        type="text"
                        value={chapterQuery}
                        onChange={e => setChapterQuery(e.target.value)}
                        placeholder={`Filter ${arcChapters.length} chapters by title or number...`}
                      />
                      {chapterQuery && (
                        <button
                          type="button"
                          className="chr265-filter-clear"
                          aria-label="Clear chapter filter"
                          onClick={() => setChapterQuery('')}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                    {chapterQuery.trim() && (
                      <small className="chr265-filter-count" role="status" aria-live="polite">
                        Showing {filteredChapters.length} of {arcChapters.length} chapters
                      </small>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="v250-arc-meta">English edition in preparation.</p>
                  <div className="v250-arc-modal-actions">
                    <button
                      type="button"
                      className="v250-arc-btn"
                      onClick={() => dialog.current?.close()}
                    >
                      Return to The Chronicles
                    </button>
                  </div>
                </>
              )}
            </div>

            {arcChapters.length > 0 && (
              filteredChapters.length > 0 ? (
                <ul className="v250-arc-chapters" aria-label={`${selectedArc.roman} chapters`}>
                  {filteredChapters.map(ch => (
                    <li key={ch.id}>
                      <a href={`/read/${ch.id}`}>
                        <span className="chr265-chapter-num" aria-hidden="true">{String(ch.number).padStart(2, '0')}</span>
                        <span className="chr265-chapter-title">{ch.title_en}</span>
                        <ArrowUpRight size={15} className="chr265-chapter-arrow" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="chr265-chapter-empty" role="status">
                  <p>No chapters match &ldquo;{chapterQuery.trim()}&rdquo;.</p>
                  <button
                    type="button"
                    className="v250-arc-btn v250-arc-btn-ghost"
                    onClick={() => setChapterQuery('')}
                  >
                    Clear filter
                  </button>
                </div>
              )
            )}
          </div>
        </dialog>
      )}
    </section>
  );
}
