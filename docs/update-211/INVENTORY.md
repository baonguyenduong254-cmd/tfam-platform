#211 baseline and function inventory

Baseline2026-11-03: latest saved Sites210, source7ebfd779b0445b35ff5b527c8d0b1aed6e0a8bab, deployment appgdep_6ae9248a291c8191a63c76e06d9f8e79. GitHub main c3c091157ea2330ea63d93568d7cebd56a7e2eff contains newer skills/process records; site/ tree4911754ec5bc53d406a281d8e6bc4113a2561d5c matches210. No open PRs at initial inspection. Tracking issue21, task/update-211.

## Current surfaces and retained owners

| Function/data | Existing owner | Preservation / redesign |
| --- | --- | --- |
| Routes, global navigation, faction/archive state, author access | site/app/page.tsx | Replace duplicate headings/two-step archive nav with five destinations; preserve route parsing, history and authentication |
| Faction scene and history | FactionArrival, FactionPanorama, campaign-art, chronicle-art | Actual distinct faction scenes; one arrival; history immediately accessible |
| Static plates, territorial overlays, insets and years | FactionOverview, TerrainMap, atlas-static/manifest, faction-plate-coverage | Keep static rendering and plate bounds; separate Atlas workspace; no new map engine |
| Grouped organizational roster, search/affinity | CastilianCourt, character-attributes, castilian-presentation | Preserve groups and verified fields; mobile drawer; no fabricated values |
| Biography/traits/abilities/attributes/connections | CharacterDossier, character-connections, character-dossiers/sources | Keep existing record data; revelation audit before disclosure |
| Doctrine/branches/search/detail/share/adjacent | MilitaryRoster, military manifests and public records | Reuse records/functions; gallery/index presentation |
| Categories/location/lore/traits/benefit/cost/sources | MonumentShowcase, monuments manifests and public records | Reuse data; continuity and filtered-return behavior |
| Nine categories + Royal Guard, eight rarity tiers, abundance, inspect relationships | VestigiumCollection, vestigium.ts, vestigium-browser, public/vestigium | One filter model for exhibition/catalogue; inspect same records; production-prompt metadata cleaned only in reader presentation |
| Editions, chapter metadata/text, editorial revision | story/index, english-index, story-server and /api/story | Live DB authoritative; fallback/reference JSON not live export |
| Reader preferences/checkpoints/history/discussion | StoryLibrary, ReaderSettings, ReadingProgress, ChapterDiscussion, ReaderAccount | Consolidate existing controls; preserve all persistence keys/API semantics |
| Discoveries/achievements | DiscoveryProgress, discovery.ts, discovery-milestones.json | Verify coverage before semantic changes; reduce unavailable0/0 clutter |

## Sources and assets

- Existing large military, monument and Vestigium images/audio are resolved through the established public R2 mapping. R2 objects are not deleted or moved in211.
- Existing faction city scenes live in public/imperial with campaign-art IDs and explicit per-faction backdrop overrides. Castilian/Moor scene selection is already distinct.
- Anime Castilian portraits are present in source/public and retained by character-portraits. The72 retired oil paths remain a sanitization denylist; do not resurrect them.
- Header210 art/flags/locks are source-bundled. Preserve210's opening/selector implementation unless integration requires an explicit small change.
- Current artwork is raster2D. No evidence establishes layered scene plates or rotatable3D artifact models.
- D1 editable content may differ from seed/migration JSON. API content read currently contains a legacy revision-upgrade path; preview uses isolated local DB. Do not seed/replace production.
- Character-source record states a pre-opening scope, but newer/live overlays and roles require separate verification. Do not infer all fields are spoiler-free from that earlier source note.

## Observed rendered baseline

Fresh reload confirmed210 homepage. Castilian contains repeated arrival h1, introduction h1 and chronicle h2, followed by every character preview. Character archives preserve existing five organizational groups and search/affinity, but appear after a large repeated hero. Vestigium has nine categories plus Guard, tier navigation and several utility layers. Before screenshots are in review/211/before (local evidence, not a production asset).

## Retirement policy for this release

Owner requests removal of old unused patches/update/content. For every candidate, record: path, imports/entrypoints/runtime consumers, replacement, check and decision. Retain active backward-compatible migration inputs until their use is replaced. Git history is the recovery mechanism for deleted source. Do not delete D1 content, reader data or R2 objects. A dated filename alone is not evidence of being unused.

## Pending preparation checks

Complete baseline inspection of military/landmarks/reader/achievements, detailed asset inventory, current English-equivalence content verification, and dependency audit. This inventory is a working record, not a claim that those checks passed.

## Implemented211 ownership and function changes

- FactionOverview now owns the existing chronicle illustration, traits and curated featured units; sceneArt moved to lib/faction-scene.ts. Arrival owns the faction-specific full scene and carried banner. Castilian and Moor retain distinct existing plates and palette roles.
- FactionAtlas replaces retired TerrainMap/CampaignMap consumers with static image/SVG overlays, verified capitals, keyboard selection, locked feedback, loading/retry, year/inset/Fit/fullscreen and browser-session view restoration.
- CastilianCourt retains organizational groups, search and affinity and adds a focus-managed mobile/tablet roster drawer; CharacterDossier keeps three actual attributes, sections and verified connections, with curated spoiler-safe presentation. Missing portraits stay missing.
- MilitaryRoster keeps all24 Castilian records/doctrine/filter/share/direct/adjacent functions and adds Gallery/Index plus subject-dependent image ratios. MonumentShowcase keeps all134 records and fields, art-led inspection, category/search and filtered return.
- VestigiumCollection retains453 unique records, nine categories plus Royal Guard, ranks/abundance/number filters, details/related/sources/direct/adjacent. Exhibition/Catalogue share filters; inspect carries artwork and reserves rarity space. No 3D pedestal remains. All entry paths apply the shared reveal policy, including academy and cross-category links. Production negatives and epigraph emphasis are normalized only for display, never rewritten in source canon.
- ChroniclesHub owns visual library and cover/Continue/contents/recent/edition/progress. Existing StoryLibrary/ReaderSettings/ReadingProgress/ReaderAccount/ChapterDiscussion keep reading/settings/account/discussion persistence and API ownership. Existing saved keys are reused; URL chapter selection now tracks navigation, Back is restored, and author tools are hidden from ordinary unauthenticated settings.
- DiscoveryProgress owns shared covered-chapter sets and achievement display. lib/revelation.ts uses active migration inputs to generate pre-opening presentation and published source-index gates. No authored records are overwritten. English Juliet side-story mapping now requires21–23 based on actual scene boundaries; English BookI does not complete Vietnamese ArcI. All210 faction requirements remain unchanged.
- Motion uses incumbent GSAP/WAAPI/CSS and native View Transitions: first arrival1050ms, repeat280ms; shared art440ms; book600ms; tabs280ms. Latest input cancels prior work. Offscreen/hidden/reduced cases have static fallbacks. Full/Reduced/Followdevice is browser-local and follows OS by default.

## Data boundaries and retired code

All test DB/account/signing configuration is disposable local-only, ignored by Git; production D1 and R2 have not been written. Existing migrations and source/reference patches remain when active consumers require them. Nine unused source/one-time installer/obsolete string-check files are removed locally for build validation; their deletion belongs to a dedicated stacked retirement PR per AGENTS. CSS selector retirement manifests describe superseded presentation rules and replacements. No image object is deleted.

## Evidence and actual limits

Before captures: review/211/before. Representative after captures: .impeccable/review/{arrival,character,inspect}-{390,768,1440,1920}.jpg. Additional states are named by surface/width there. Independent review: FINISH-REVIEW.md, followed by a scoped verdict pass. TypeScript, domain checks and production build have passed locally. Physical touch, Safari, authenticated production synchronization, real account discussion posting and production network performance are not certified by these tests. A separate TEST-RESULTS.md records final behavioral coverage and measurements; screenshots alone are not treated as motion/performance proof.
