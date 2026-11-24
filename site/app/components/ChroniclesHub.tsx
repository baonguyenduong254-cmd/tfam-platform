'use client';
import {useState} from 'react';
import {BookOpen,Lock,X} from 'lucide-react';
import '../chronicles-211.css';

type ArcEdition = {
  id: string;
  roman: string;
  title: string;
  subtitle: string;
  cover: string;
  fallbackCover: string;
  status: string;
  note: string;
};

const fallbackArtwork = '/art/evelyne-monodica-moonfall-205-1920.webp';

/**
 * TFAM v250 Six-Arc Collector's Hardcover Shelf:
 * Drop your 6 Arc cover images into `site/public/art/arcs/arc-1.webp` .. `arc-6.webp`
 * (automatic fallback keeps every volume rich until uploaded).
 * Chapter prose stays cleanly in Forthcoming placeholder state per v250 direction.
 */
const sixArcs: ArcEdition[] = [
  {id: 'arc-1', roman: 'ARC I', title: 'The Pathmaker', subtitle: 'Marrakesh & The Closing Sky', cover: '/art/arcs/arc-1.webp', fallbackCover: fallbackArtwork, status: 'Forthcoming', note: 'Manuscript edition in preparation. English volume opening soon.'},
  {id: 'arc-2', roman: 'ARC II', title: 'The Iron Meridian', subtitle: 'Court of Castile & Aragon', cover: '/art/arcs/arc-2.webp', fallbackCover: fallbackArtwork, status: 'Forthcoming', note: 'Manuscript edition in preparation.'},
  {id: 'arc-3', roman: 'ARC III', title: 'The Great Chorus', subtitle: 'Sahara & The Bell Towers', cover: '/art/arcs/arc-3.webp', fallbackCover: fallbackArtwork, status: 'Forthcoming', note: 'Manuscript edition in preparation.'},
  {id: 'arc-4', roman: 'ARC IV', title: 'Wardenholf Passage', subtitle: 'The Frozen Sea Route', cover: '/art/arcs/arc-4.webp', fallbackCover: fallbackArtwork, status: 'Forthcoming', note: 'Manuscript edition in preparation.'},
  {id: 'arc-5', roman: 'ARC V', title: 'Speculum & Ash', subtitle: 'The Fractured Alliances', cover: '/art/arcs/arc-5.webp', fallbackCover: fallbackArtwork, status: 'Forthcoming', note: 'Manuscript edition in preparation.'},
  {id: 'arc-6', roman: 'ARC VI', title: 'Crown of Winter', subtitle: 'The Final Reckoning', cover: '/art/arcs/arc-6.webp', fallbackCover: fallbackArtwork, status: 'Forthcoming', note: 'Manuscript edition in preparation.'},
];

export default function ChroniclesHub(){
  const [selectedArc, setSelectedArc] = useState<ArcEdition | null>(null);

  return (
    <section className="chronicle211 chronicles-v250-shelf" aria-labelledby="library250-title">
      <header className="v250-chronicles-hero">
        <h1 id="library250-title">The Chronicles</h1>
        <p>Six bound arcs of Through Frost and Myth. English manuscript editions are currently being prepared for release.</p>
      </header>

      <div className="v250-arcs-grid" role="list" aria-label="Six Story Arcs">
        {sixArcs.map(arc => (
          <button
            key={arc.id}
            type="button"
            className="v250-arc-volume"
            onClick={() => setSelectedArc(arc)}
            aria-label={`${arc.roman}: ${arc.title} (${arc.status})`}
          >
            <div className="v250-arc-book">
              <img
                src={arc.cover}
                alt={`${arc.roman}: ${arc.title}`}
                loading="eager"
                onError={e => {
                  if (e.currentTarget.getAttribute('src') !== arc.fallbackCover) {
                    e.currentTarget.src = arc.fallbackCover;
                  }
                }}
              />
              <div className="v250-arc-spine" aria-hidden="true"/>
              <div className="v250-arc-vignette" aria-hidden="true"/>
              <span className="v250-arc-pill"><Lock size={11} aria-hidden="true"/> {arc.status}</span>
              <div className="v250-arc-cover-copy">
                <small>{arc.roman}</small>
                <strong>{arc.title}</strong>
                <span>{arc.subtitle}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedArc && (
        <div className="v250-arc-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="arc-modal-title" onClick={e => { if (e.target === e.currentTarget) setSelectedArc(null); }}>
          <article className="v250-arc-modal">
            <button type="button" className="v250-arc-close" aria-label="Close" onClick={() => setSelectedArc(null)}><X size={20}/></button>
            <div className="v250-arc-modal-art">
              <img
                src={selectedArc.cover}
                alt={selectedArc.title}
                onError={e => {
                  if (e.currentTarget.getAttribute('src') !== selectedArc.fallbackCover) {
                    e.currentTarget.src = selectedArc.fallbackCover;
                  }
                }}
              />
            </div>
            <div className="v250-arc-modal-copy">
              <span className="v250-shelf-eyebrow"><BookOpen size={14} aria-hidden="true"/> {selectedArc.roman} · {selectedArc.status}</span>
              <h2 id="arc-modal-title">{selectedArc.title}</h2>
              <p className="v250-arc-sub">{selectedArc.subtitle}</p>
              <p>{selectedArc.note}</p>
              <p className="v250-arc-hint">Chapter content is intentionally left unpopulated for this edition while the English release is finalized.</p>
              <button type="button" className="v250-arc-btn" onClick={() => setSelectedArc(null)}>Return to The Chronicles</button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
