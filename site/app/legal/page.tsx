import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal & Attributions | Through Frost and Myth',
  description:
    'Copyright notice, editorial rights, typography licenses, and historical cartography and heraldry attributions for Through Frost and Myth.',
};

export default function Legal() {
  return (
    <main className="legal-page">
      <nav className="legal-nav" aria-label="Legal navigation">
        <a className="legal-back" href="/">
          Return to Through Frost and Myth
        </a>
      </nav>

      <header className="legal-header">
        <p className="legal-kicker">Through Frost and Myth · Archival Notice</p>
        <h1>Legal Information &amp; Attributions</h1>
        <p>
          © 2026 Leonardo Ravenna. All rights reserved for the original literary work, lore,
          worldbuilding, and authored assets. Rights to third-party resources remain with their
          respective owners under their applicable licenses.
        </p>
      </header>

      <section>
        <h2>Rights &amp; Use of Story Content</h2>
        <p>
          The narrative, chronicles, and lore created by Leonardo Ravenna are provided for personal
          reading and exploration on this website. Full-text republication, redistribution, or
          commercial use requires the author&apos;s prior written consent. Interface copy-deterrence
          measures exist to protect the original work; third-party resources remain governed by
          their respective open licenses.
        </p>
      </section>

      <section>
        <h2>TFAM Standards, Portraits &amp; Illustrations</h2>
        <p>
          The current set of 24 faction standards and environmental scenes was created specifically
          for <em>Through Frost and Myth</em>. The national standards use a 3:2 woven-cloth format
          with bespoke vector heraldry and stitched borders drawn in a historical heraldic idiom,
          without assets from any external game franchise. Costumes in the Castilian portrait
          series are artistic interpretations grounded in canon and authorial direction.
        </p>
      </section>

      <section>
        <h2>Faction Panoramas &amp; Audio</h2>
        <p>
          The 24 faction panoramas featured across dossiers were created specifically for TFAM.
          Architecture, urban layouts, and landscapes are artistic interpretations of the fictional
          setting rather than historical reconstructions or separate canon assertions. Ambient
          soundscapes are played only in accordance with reader audio preferences.
        </p>
      </section>

      <section>
        <h2>Historical Flag References from Earlier Editions</h2>
        <p>
          France:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Flag_of_medieval_France.svg"
            target="_blank"
            rel="noreferrer"
          >
            ZooFari · Public domain
          </a>
          . Castilian:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Royal_Banner_of_the_Crown_of_Castille_(Early_Style).svg"
            target="_blank"
            rel="noreferrer"
          >
            Heralder
          </a>{' '}
          ·{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 3.0
          </a>
          . Rome:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Flag_of_the_Roman_Empire_with_Eagle_(3-2).svg"
            target="_blank"
            rel="noreferrer"
          >
            OttavianoUrsu
          </a>{' '}
          ·{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 4.0
          </a>
          . Morocco: TFAM orange-field adaptation; crescent adjusted from{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Flag_of_the_Kingdom_of_Tlemcen_(Book_of_All_Kingdoms).svg"
            target="_blank"
            rel="noreferrer"
          >
            Fvasconcellos · Public domain
          </a>
          . Habsburg-Poland:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Banner_of_the_Holy_Roman_Emperor_without_haloes_(1400-1806).svg"
            target="_blank"
            rel="noreferrer"
          >
            David Liuzzo / N3MO
          </a>{' '}
          ·{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 3.0
          </a>
          . Novgorod:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Banner_of_the_Novgorod_Republic_(c._1385).svg"
            target="_blank"
            rel="noreferrer"
          >
            Dekodrak
          </a>{' '}
          ·{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 4.0
          </a>
          . Danes:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Royal_Banner_of_Denmark_(14th_Century).svg"
            target="_blank"
            rel="noreferrer"
          >
            Sodacan · Royal Banner c.1300 · Public domain
          </a>
          . Scotland-Ireland:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Royal_Banner_of_Scotland.svg"
            target="_blank"
            rel="noreferrer"
          >
            Eyrian / Alkari / Fry1989 · Royal Banner of Scotland
          </a>{' '}
          ·{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 3.0
          </a>
          . Ottoman:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Green_Ottoman_flag_with_three_crescents.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Gollik · Green three-crescent reference
          </a>{' '}
          ·{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 4.0
          </a>
          . New Portugal:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Flag_of_Portugal_(1707).svg"
            target="_blank"
            rel="noreferrer"
          >
            Tonyjeff · Public domain
          </a>
          . British East India Company:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Flag_of_the_British_East_India_Company_(1707).svg"
            target="_blank"
            rel="noreferrer"
          >
            Yaddah · Public domain
          </a>
          . English Remnant: weathered and torn red-cross banner adapted from{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Flag_of_England.svg"
            target="_blank"
            rel="noreferrer"
          >
            Nicholas Shanks · Public domain
          </a>
          . Historical flags served as heraldic visual references for TFAM and do not assert strict
          1715 chronological uniformity.
        </p>
      </section>

      <section>
        <h2>Typography</h2>
        <p>
          Spectral by Production Type; Cinzel by Natanael Gama. Distributed under the SIL Open Font
          License 1.1.{' '}
          <a href="/fonts/Spectral-OFL.txt">Spectral License</a> ·{' '}
          <a href="/fonts/Cinzel-OFL.txt">Cinzel License</a>.
        </p>
      </section>

      <section>
        <h2 id="terrain">Regional Atlas &amp; Static Cartography</h2>
        <p>
          The current regional atlas uses Natural Earth raster and vector geographic data, which is
          in the public domain. Maps are pre-rendered as static WebP plates; territorial overlays,
          borders, and the 1715–1716 campaign timeline belong to the fictional world of{' '}
          <em>Through Frost and Myth</em>. Color palettes, map framing, and faction standards are
          original TFAM designs.{' '}
          <a
            href="https://www.naturalearthdata.com/about/terms-of-use/"
            target="_blank"
            rel="noreferrer"
          >
            Natural Earth Terms of Use
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Prior Terrain Relief Reference Data</h2>
        <p>
          Earlier atlas editions referenced Mapzen/Tilezen terrain tiles and MapLibre GL JS; these
          credits are retained in the source record for provenance.{' '}
          <a
            href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md"
            target="_blank"
            rel="noreferrer"
          >
            Mapzen / Tilezen Attribution &amp; Licenses
          </a>
          . The live atlas displays pre-rendered Natural Earth plates.
        </p>
      </section>

      <section>
        <h2>British East India Company in Africa</h2>
        <p>
          Saint Helena was administered by the British East India Company from 1659 to 1834 and is
          marked across both the 1715 and 1716 atlas states.{' '}
          <a
            href="https://www.sainthelena.gov.sh/st-helena/history-and-heritage/"
            target="_blank"
            rel="noreferrer"
          >
            Source: St Helena Government
          </a>
          . All other territories and frontiers on the atlas belong to the fictional TFAM setting.
        </p>
      </section>

      <section>
        <h2 id="atlas">Atlas Sources &amp; Credits</h2>
        <p>
          Natural Earth · TFAM illustrated atlas. Natural Earth physical geography data is public
          domain. TFAM territory outlines, historical scenario labels, and illustrated plates belong
          to the fictional setting of <em>Through Frost and Myth</em>. The map key distinguishes
          capitals, the selected territory, and faction borders.
        </p>
      </section>
    </main>
  );
}

