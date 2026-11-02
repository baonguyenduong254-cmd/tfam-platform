# TFAM — Wonders & Monuments

A third collection in Archives accompanies character and military dossiers. Each faction has5–9 landmarks with complete Vietnamese and English names, locations, epithets, lore, two traits, advantages, costs, status and historical foundations.

## Editorial basis

Castilian and Moor selections were grounded in the Editor Choice Volumes I–III read through Google Docs. Castilian anchors: Madrid palace (II.33; III.92,98), Ceuta's integrated shipbuilding network and Toledo steel (I.9), Gibraltar's supply and repair role (I.2,9; III.95), Santiago and Berenguela (I.25; II.57). Moor anchors: publicly funded market lamps (I.1), Ziyad's opened granaries and the two communal kitchens (I.7), the frozen Atlas (I.1,5), Taza/Fes routes (I.2–3; III.85,88). New roles, names and effects extend these anchors with authorisation. El Escorial, Alhambra and additional Moor sites use historical foundations identified in individual records.

Other factions extend their existing website lore with real historical places reinterpreted for the TFAM alternate timeline. Source URLs establish the historic monuments; fictional events and influences remain authored worldbuilding. Historical-anchor text distinguishes extensions from narrative evidence. Private Google Docs references are retained in the authoring data and omitted from public reference links.

## Implementation

- `#archive/<faction_id>/monuments` opens the collection; an additional `/<id>` opens a shareable dossier.
- Search ignores Vietnamese accents; category filtering only lists categories present in that faction.
- Native dialogs contain keyboard focus and support Escape/backdrop dismissal. Previous/next follows the filtered set.
- Per-faction JSON is loaded on demand; requests for a previous faction are aborted. Thumbnail images load lazily; full artwork loads in the dossier.
- Map, military, character, story and authentication data are preserved. No markers or terrain effects are added to the global map.
- Authored JSON lives in `content/monuments/`. Master images/provenance are in `art/monuments/`; compressed runtime art and thumbnails live in `public/monuments/`.

`node scripts/build-monuments.mjs` validates records and art then emits a manifest and per-faction JSON. The `--allow-partial` flag is solely for work in progress. A release requires all24 factions,5–9 entries each and all illustrations. Production build and TypeScript validation are required. Existing map regression scripts must continue to pass.

Architectural paintings are artistic TFAM interpretations rather than measured reconstructions. Browser/device visual QA is unavailable in this managed environment; implementation verification uses types, production builds, data/asset checks and direct illustration inspection.
