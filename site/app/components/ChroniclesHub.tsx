'use client';
import {useEffect,useRef,useState} from 'react';
import {BookOpen,ArrowUpRight,X} from 'lucide-react';
import englishIndex from '../../lib/story/english-index.json';
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

  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selectedArc) dialog.current?.showModal();
  }, [selectedArc]);

  const arcChapters = selectedArc
    ? publishedChapters.filter(ch => ch.arc === selectedArc.arc)
    : [];

  return (
    <section className="chronicle211 chronicles-v250-shelf" aria-labelledby="library250-title">
      <header className="v250-chronicles-hero">
        <h1 id="library250-title">The Chronicles</h1>
      </header>

      <div className="v250-arcs-grid" role="group" aria-label="Chronicles volumes">
        {sixArcs.map(arc => {
          const count = publishedChapters.filter(ch => ch.arc === arc.arc).length;
          return (
            <button
              key={arc.cover}
              type="button"
              className="v250-arc-volume"
              onClick={() => setSelectedArc(arc)}
              aria-label={`${arc.roman}: ${arc.title}`}
            >
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
                <div className="v250-arc-spine" aria-hidden="true"/>
              </div>
              <span className="v250-arc-caption">{arc.title}</span>
              {count > 0 && <small className="v250-arc-count">{count} chapters available</small>}
            </button>
          );
        })}
      </div>

      {selectedArc && (
        <dialog ref={dialog} className="v250-arc-modal" aria-labelledby="arc-modal-title" onClose={() => setSelectedArc(null)}
          onClick={event => {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) event.currentTarget.close();
          }}>
            <button type="button" className="v250-arc-close" aria-label="Close volume" onClick={() => dialog.current?.close()}><X size={20}/></button>
            <div className="v250-arc-modal-art">
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
            <div className="v250-arc-modal-copy">
              <span className="v250-shelf-eyebrow"><BookOpen size={14} aria-hidden="true"/> {selectedArc.roman}</span>
              <h2 id="arc-modal-title">{selectedArc.title}</h2>
              {arcChapters.length > 0 ? (
                <>
                  <p className="v250-arc-meta">{arcChapters.length} English chapters ready to read.</p>
                  <div className="v250-arc-modal-actions">
                    <a className="v250-arc-btn v250-arc-btn-link" href={`/read/${arcChapters[0].id}`}>
                      <span>Begin {selectedArc.roman}</span>
                      <ArrowUpRight size={15} aria-hidden="true"/>
                    </a>
                    <button type="button" className="v250-arc-btn v250-arc-btn-ghost" onClick={() => dialog.current?.close()}>Return to The Chronicles</button>
                  </div>
                  <ul className="v250-arc-chapters" aria-label={`${selectedArc.roman} chapters`}>
                    {arcChapters.map(ch => (
                      <li key={ch.id}>
                        <a href={`/read/${ch.id}`}>
                          <span>{ch.title_en}</span>
                          <ArrowUpRight size={14} aria-hidden="true"/>
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="v250-arc-meta">English edition in preparation.</p>
                  <button type="button" className="v250-arc-btn" onClick={() => dialog.current?.close()}>Return to The Chronicles</button>
                </>
              )}
            </div>
        </dialog>
      )}
    </section>
  );
}
