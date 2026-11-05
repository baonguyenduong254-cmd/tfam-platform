# Post-211 stage validation

Local production build on the owner-confirmed home device. Latest pass: 2026-11-05. Production remains Sites 211; this correction is not deployed. GitHub main rechecked at `e03af839c356cbc5b75fa55e732c5d784f2e91f9`.

## Executed

- TypeScript `--noEmit --incremental false`, existing `tools/check211-domain.cjs` and production build passed after the final intrinsic-grid sizing correction. No dependencies or lockfiles changed.
- Character: both alpha derivatives loaded in the actual stage. Rapid Edward / Isabella / Edward input ended at Edward's actual ID, URL and artwork. Updated mobile identity includes the real role. Full / Reduced / Full produced reduced then settled phases without stale completion overwriting reduction. Final observed stage wall times 934 and 943 ms. Offscreen stages pause rather than consume their entrance before being seen.
- Vestigium: Exhibition/Catalogue, zero-result and `1 exhibit` filtering exercised. Minerals, Botanicals, Devices and Phenomena opened real available records. Escape restored the original feature button's focus (`aria-label="Inspect Fracture's Reprieve"`). Tablet Inspect stacks art and readable copy. The desktop featured image's intrinsic grid minimum previously exceeded its 431px display: explicit zero-minimum tracks now constrain the image and reserve caption space. Final evidence is named `exhibition-fixed-*` and `inspect-fixed-*`.
- Library: English and Vietnamese editions expose their actual volumes. Choosing Vietnamese Arc II changes the cover control to Open Arc II and the first contents URL to `/read/chapter_033`; opening ends at `#reader/chapter_033`. Native cover-opening transform observed during its run; the handoff disappears and the Reader stays present. Reduced mode creates no handoff. Back restores the library/Arc II.
- Reader: existing Sans/Compact settings retained. Investigation reproduced automatic-checkpoint paragraph drift: restoration measured the sticky bar before it reached its resting inset. `readingViewportAnchor` now uses the same sticky/fixed inset plus bar height for saving and restoration, retaining the original fallback for non-sticky bars and the existing checkpoint schema. Domain regression assertions cover the pre-stick/sticky round trip and Focus inset. On the final build, automatic save confirmation followed by refresh/restoration confirmation returned the same paragraph beginning `Khắp các đại lộ trung tâm...` (scroll788→819.2px as the shell reflowed). This verifies paragraph continuity, not pixel-identical layout across font/shell changes. Explicit Save progress also retains its original path.
- Independent motion engineer reviewed cancellation, identity replacement, initially hidden/offscreen scenes, image readiness, latest callbacks and exactly-once book completion. Deterministic mocked lifecycle assertions and TypeScript passed; see STAGE-MOTION-REVIEW.md.

## Captures and review

Requested CSS viewports: 390×844, 768×1024, 1440×900, 1920×1080. The browser's viewport screenshot API sometimes returned stale modal content or physically cropped pixels. Invalid captures are excluded from the final packet. Corrected Exhibition/Inspect/category evidence uses native full-page screenshots, then an unscaled crop of the top viewport height; raw captures stay local. Captured widths exclude the browser's scrollbar (375/752/1424/1904px). This is disclosed rather than describing the raster as an exact full-width screenshot.

Final artifact families have separate actual feature/Inspect evidence: `living-*`, `crafted-*`, `domain-*`. These preserve 2D artwork, not fabricated 3D models. Static composition review and motion execution evidence are separate. No supported browser video-recording capability was available.

## Measurements and limitations

One unthrottled local document reported LCP 2604ms, CLS 0.005, nine long tasks, longest 194ms. This is one run, not a loading distribution, input-latency benchmark or 60 FPS certification. Physical mobile touch, Safari/iOS, screen-reader hardware, authenticated sync and failed-image runtime fallback were not tested. Local account requests lack production signing configuration; real account backend behavior is outside this UI pass.

Only Isabella and Edward have reviewed alpha derivatives. The asset audit lists 27 other white Castilian source plates without stage cutouts. The library jacket is an existing-art UI composition. Native resolution remains 1024×1536 for the two derivatives. No production account, progress, comment, reaction, D1 content or R2 object was changed. Local guest reading tests use loopback browser storage only.

## Release boundary

Review this task branch and the concrete preview first. Do not merge or deploy this correction without owner approval. At release, recheck current Sites version/source and preserve newer work; do not assume the next saved version number. Retain Sites 211 as rollback target. No data migration, secret replacement, R2 deletion or asset overwrite is required.
