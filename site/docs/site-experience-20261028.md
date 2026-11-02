# Site experience checkpoint, 28 October 2026

## Implemented

- Verified every uploaded Vestigium replacement: 148/148 remote files exactly match prepared hashes. Updated media records and regenerated artwork cache version 6033976a846b28c1.
- Removed browser narration player, pronunciation logic, listening styles and tests, and soundtrack narration hooks. Reader clears obsolete local listening preferences and positions on entry. No story text or reading bookmarks removed.
- Reading-room introduction, DOM chapter heading and approximate reading time, calm night/ivory palettes, readable line widths and spacing, optional serif/sans typeface persisted compatibly, focus mode with Escape exit, immediate silence button.
- Soundtrack opt-in by default, explicit persisted volume slider. Existing saved music choices retained.
- Shared layout/material system for faction arrival, lore, character dossiers, military/monument cards and Vestigium.
- Procedural R3F ice/crystal and brass orbital sculpture, book base in reading-room header; GSAP ScrollTrigger header parallax and subtle pointer response. DOM text remains independent. Lazy, fine-pointer only; offscreen/hidden/reduced-motion/disabled-motion pause; static fallback and WebGL error boundary; bounded DPR, no external models or HDR downloads.
- Vestigium search now hides empty tiers and offers a clear zero-results state. Failed thumbnails fall back to full artwork without poisoning the dossier image; resource-specific retry.

## Validation before deployment

32 tests passed (narration tests removed with feature; regression checks for image failure isolation and persisted typeface included). TypeScript passed. Production build explicitly reached Build complete. All 453 dossiers have artwork mappings; 148 remote image checks passed. Existing reading-room ivory palette was checked in the browser for dark text/light background and no horizontal overflow at 1363px.

Managed preview reports running but browser connection is refused; preview stopped. Post-deployment visual and interaction checks pending. Physical phone testing not performed; mobile breakpoints, touch-sized controls and reduced-motion fallback implemented.
