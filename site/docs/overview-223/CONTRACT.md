# Castilian Overview: imperial winter

Owner approved the proposed faction overview on 2026-11-13. Local home-device implementation; production remains version 222 until concrete review. This is a surface redesign, not a new global identity.

## Design contract
- First viewport: a realistic Castilian environment fills the arrival below global navigation. Flag and faction name sit at lower left over a local neutral scrim; verified year, capital and territory count sit at its foot. Five working faction destinations remain immediately below. No duplicated introduction or map.
- Desktop: near-full-width landscape, palace focal subject to the right, text on left. Tablet: same scene with shorter text width. Mobile390: deliberately cropped central palace, flag above name, three facts in a compact row; navigation uses native horizontal scrolling.
- Body: trait manifesto, asymmetric landmark gallery, Crown/Guard portrait ensemble, switchable military briefing, complete historical text. No invented statistics or canon. Available art and discovery-filtered characters only.
- Landmarks: Madrid/Ceuta/Gibraltar use new realistic conceptual views based on existing gazetteer descriptions. These are fictional visual interpretations, not documentary photographs. Existing dossier facts remain unchanged.
- Motion: a 900ms camera settle and 650ms flag arrival, reduced to280/220ms on repeat. Bounded snow and mist loop while visible; camera drifts at most1.5%. Text does not move with atmosphere. Hidden-tab/offscreen rendering pauses. Reduced motion keeps gentle light feedback but removes spatial travel. No wheel interception, artificial loading delay or new dependency.
- Media failure: MediaImage fallback retains names and actions. Gazetteer loading/error and retry remain explicit. Incomplete characters use existing placeholder; no fabricated portrait or late-story disclosure.
- Acceptance:390/768/1440/1920 layouts, working destination and landmark links, keyboard interactions, rapid military switching, full lore accessible, no document horizontal overflow; type/domain/build checks and rendered review. FPS is unclaimed unless measured.

## Application matrix
| Reference | Adopted decision | Surface |
| --- | --- | --- |
| Impeccable new-work/craft-floor | Artifact-first experience; distinct section compositions; visible initial content; preserve truth | Entire Overview |
| Impeccable animate | One rehearsed arrival, bounded atmospheric effects, interruption cleanup | Arrival and military selection |
| Taste layout/type/colour | Symmetric outer margins, asymmetry inside; strong scale; ivory text on ink; no white text boxes | Responsive composition |
| Taste imagery/motion | Authored realistic environments, deliberate crops, native scroll and offscreen pause | Arrival and landmarks |
| Total War PHARAOH official leaders/Dynasties references | Differentiate faction through identity, places and characteristic forces; do not copy game statistics | Content hierarchy |

## Sources and boundaries
- Baseline Sites222, source5661a3dbcf53f9bea8b1d1be1a60c0dc93f25fc0.
- GitHub main status is stale at211; local ops status at220. Sites is current release authority. Open issues3/5 contain older retirement/layout requests superseded where this owner-approved surface specifies a new order. No overlapping open PR returned by issue search.
- Existing D1 content, progress/accounts and R2 objects are read-only for this task.
- Existing character anime artwork, home opening and single regional Atlas remain intact.
- Repository binary launchers are prohibited by AGENTS; existing project context and text references are read directly. Code-led implementation of owner-selected composition.
