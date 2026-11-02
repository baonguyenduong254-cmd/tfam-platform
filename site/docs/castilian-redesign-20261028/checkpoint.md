# TFAM presentation update — 28 October 2026

## Scope

1. Replace the public MapLibre atlas with static Natural Earth regional plates, preserving the existing faction-to-region assignments and 1715/1716 ownership. Visitors select countries through a lightweight SVG hit layer, pins or a flag legend. Public atlas no longer imports a map renderer, GIS workers, full physical geometry, tile pyramids or per-frame camera code. Province editing remains available through the editor's province selector; changed geographical artwork requires rebaking the static plates.
2. Replace 24 emblem tiles with original 3:2 textile flag designs. Common historical heraldic forms are drawn as local vectors; no franchise graphics. Voyage standards hang from a brass yard and preserve complete rectangular flags with a neatline and stitch border.
3. Rebuild Castilian-associated character presentation. Twenty new illustrations accompany twenty dossiers covering crown, council/staff, civil administration, army, navy/affiliations and royal guards. These are navigation groups, not invented ministry titles. Guard identifiers are separate from civil or military appointments. Edward, Timothy and José retain their existing primary factions and gain an explicit Castilian association.

## Canon and art boundaries

- Sources: Editor Choice Arcs I–IV, retrieved 28 October; exact document IDs, revisions and anchors in `canon-evidence.json`.
- Isabella (brown hair, amber eyes) and Testarossa/Uno (red hair) are distinct records. The latter's true nature is not exposed in the short public biography.
- Evelyne: IV, very long black hair, spectacles, gray-silver eyes with amber iris ring, silver key separate from lion pendant.
- Sigrid: XXXII, Winterthorn, 21 in Arc III. Silver-white hair follows the author's explicit new visual direction; the older text's ash-blond description is disclosed in the illustration note rather than silently rewritten.
- Liv is 14. Her illustration receives a separate modest, age-appropriate art brief, without adult styling.
- Newly inferred costume construction, poses and unspecified facial features are illustration choices, not new story canon. Exact prompts and masters are in `art/castilian-redesign-20261028/`.
- The Arc IV 21-seat representative council is a transitional proposal. It is presented in a labelled expandable panel, separate from the state at the opening of the story.

## Sources and build

- Natural Earth raster/vector data: Public Domain, https://www.naturalearthdata.com/about/terms-of-use/ . Existing bundled source metadata retained. No Google map imagery or franchise map assets.
- `python scripts/atlas/build-static-atlas.py` bakes 24 plates (12 regions × 2 dates), regional hit areas and national frontier outlines. National boundaries use existing precomputed topology; province polygons are used only as hit areas and never drawn as administrative borders.
- `python scripts/build-heraldry-20261028.py` reproduces the 24 vector flags.
- `lib/castilian-profiles-20261028.json` is the final authored dossier data. Presentation is idempotent at revision 28; edits saved later remain authoritative.
- Old map sources remain in Git for rollback; retired public tile/worker payloads are omitted from deployment.

## Validation

Final TypeScript check passed. All 36 tests passed, including four new regression checks covering primary affiliations, stable record identity, author-edit preservation, local flag contracts and both atlas dates. All 40 portrait WebPs (full + thumbnail) decode successfully. Production build explicitly reported `Build complete.` Live browser QA follows deployment.

Managed preview could not start: its infrastructure reported another Vinext server at `/site` (PID 14). No unrelated server was killed or alternate port started. Live verification follows deployment.

The portable Vinext CLI was observed exiting with code 0 during client gzip reporting, before the explicit completion marker. `run-framework.mjs` now retains a bounded process handle until `Build complete.`; timeout fails the build rather than packaging incomplete Worker output.

## Live verification of v172 and finishing fixes

Verified live: 20 associated dossiers, Evelyne/Sigrid/Edward navigation and loaded artwork; searching `32` returns Sigrid alone; original affiliations retained; static Europe plate loaded at 1600px with zero atlas canvases; France selection and 1716 plate switch work; no horizontal overflow at the tested desktop size.

Observed a cancelled native view transition swallowing a rapid tab change. Navigation now commits synchronously and uses the existing lightweight CSS/Web Animations reveal. Year labels are explicitly nonwrapping. Additional owner-authored Castilian dossiers without a predefined branch remain visible under an additional-records group.

Final responsive correction: regional plates keep their geographic aspect ratio at narrow widths. A minimum-height rule was removed to avoid stretching wide regions while SVG hit areas retained their original coordinates. All 24 flags were verified loaded on the voyage screen with no shield mask; East Asia selection loaded the expected 1716 image.

Rapid alternating navigation exposed a second stale-state guard: `goTab` skipped a request when its render closure still named the previous tab. Removing the redundant early return ensures every explicit tab request commits. Scroll/history snapshots now carry their matching URL fragment and restore only for that route, preventing stale map state from overriding a direct character link.
