# TFAM 211 — design and execution contract

Status: preparation and local implementation; not approved for merge or production. Owner confirmed this is the authorized home device on 2026-11-03. That task-specific instruction overrides the earlier cloud-only default. Never transfer execution to the company workstation.

## Direction contract

THESIS: the selected banner becomes the doorway into an imperial world. Exploration is led by the actual artwork; controls remain recognizable and lore stays readable. Repeated faction hero/introduction/archive titles are replaced by one identity and five destinations.

OWN-WORLD: ink #111018, elevated wine #241926, ivory #f2eadc, readable secondary #c6beca, crimson #bc5369, aged metal #bba276. Castilian uses wine/crimson and the snowy imperial city; Moor uses deep green, bronze and its own existing scene. Keep existing project display/book faces after checking loaded assets; no new font network dependency. Borders describe groups and frames, never white plaques beneath every label.

STORY: arrive → understand the faction → choose Overview, Atlas, Characters, Military or Landmarks → inspect a record → return to the same collection and position. Global World / Vestigium / Chronicles remain available. Reader progress, rather than the atlas year, governs revelations.

FIRST VIEWPORT: overview gives artwork approximately two thirds of a 1440×900 viewport, flag and faction name docked lower left, concise verified introduction and immediate five-item navigation. Other faction tabs replace the large arrival with a compact flag/name identity. Characters use a 260–300px grouped/searchable roster, large portrait and readable dossier; mobile uses a roster drawer and one principal panel. Vestigium puts one real exhibit at exhibition scale beside its identity, with category and Catalogue navigation immediately available. The library leads with the actual book cover and Continue reading; the reader opens with chapter text and one compact utility row.

FORM: constrained extension of the owner's cinematic fantasy identity, built directly in the incumbent React/vinext components. Primary authority: Impeccable; Taste supplies composition, scale, crop and motion discipline. No random aesthetic selection or launcher execution. seed: none (unavailable; launchers prohibited by project instructions).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Surface contracts

| Surface | Composition and action | Signature / timing | Responsive and state rules |
| --- | --- | --- | --- |
| Faction arrival | Existing faction-specific city scene, clear architecture focal subject, full flag at identity; navigation visible at first paint | Selected flag carries to identity; image settles from 1.045 to1 over950ms, flag travels to its slot, name resolves within700ms. Repeat arrival250ms. No input delay | At390 crop to the principal architecture, use portrait-height scene and title below its calm area;768 retains wider city crop. Failed art keeps identity/nav and a retry state. No invented separated image layers |
| Overview | Concise introduction/facts then history; traits as editorial rows; featured people and units at useful scale, links to Atlas/Landmarks | One framed scene; restrained section-specific transitions, no blanket fade-up | Limit only featured previews, preserve complete roster elsewhere. No false region values. Missing lore/portraits are explicitly pending; no substitute flags for portraits |
| Atlas | Static map fills its working frame; year and regional/inset selection, fit/fullscreen together | Year replacement crossfade450ms; overlays settle with the same year, stale requests cancelled | All plate bounds preserved; local selected region/year restored. Visible loading, retryable plate/outline error. No markers without coordinates |
| Characters | Existing grouped organizational roster, search and affinity; full artwork; name/role/Guard number, three verified attributes and dossier sections | Artwork and identity change in one420ms sequence; rapid changes cancel/finish previous sequence | Desktop three work areas;768 roster drawer plus portrait/copy;390 drawer, identity, art, content. Focus return, Back, direct links and long dossiers preserved |
| Military | Doctrine, branch filters, search, image-led gallery and efficient index | Image travels from trigger to dossier in420ms; ships get landscape framing, people portrait | Previous/Next use filtered results; direct/share preserved. Zero/one/many counts; no fabricated comparison values |
| Landmarks | Large landscape artwork, real location/category, chronicle/traits/advantage/price/source | Card artwork expands into dossier in450ms, returns to filtered collection | Escape, Back and focus return. Atlas link only if actual coordinates/region are supplied |
| Vestigium | Exhibition / Catalogue / Inspect share the same records/filters; nine categories plus Royal Guard, rarity/abundance preserved | Selected2D art carries to inspection in420ms. Optional first-discovery seal only for special records; routine reopen immediate | Number-led Guard browsing plus search, not100-option dropdown. Rarity label has its own reserved space. No fake full3D rotation; expensive stage lazy and visibility-bound |
| Chronicles library | Actual cover, Continue reading, edition/volume, contents search, recent and progress | Cover-to-reader600ms; cancelled on repeat navigation | Library and reading are distinct modes; edition availability honest, guest progress browser-local |
| Reader | Stable text column45–75ch, existing themes/settings/progress/comments/account | Utility feedback140–220ms; no atmospheric movement behind prose | Font/typeface/line/paragraph/width/focus/music consolidated. World panel only verified spoiler-safe records, preserve paragraph position |
| Achievements | Readable milestone progress, available achievements first, forthcoming arcs summarized | Earned milestone acknowledgment350ms | No repetitive0/0 blocks. Coverage explanation derived from verified mapping, never inferred solely from chapter totals |

## Motion grammar

Existing motion/GSAP/WAAPI and CSS only; do not add another animation framework. Press140ms, hover180ms, tabs280ms, character420ms, inspect420–450ms, atlas450ms, book600ms. Entrances end within1200ms and never withhold navigation. Latest input wins; no animation queues. Each running effect has cleanup, reduced-motion/static fallback and hidden-tab/offscreen suspension. Text is outside moving image layers. Native scroll remains native. Audio remains user-controllable and follows browser gesture rules.

## Content, discovery and safety

D1 is authoritative for editable content and reader/account/comment/reaction state. Git seed files are fallback/reference/migration input, not permission to overwrite live records. R2 is read-only during211. Do not delete media. Only delete source/content assets after verifying imports, generation entrypoints and runtime consumers; log each retirement and its replacement. Preserve active migration inputs until their compatibility purpose is explicitly replaced.

Use source-backed revelation metadata consistently in dossiers, relationships, abilities, previews, searches and direct links. Unknown revelation requirements must remain undisclosed rather than guessed. Keep historical year independent of reading milestones. Verify English/Vietnamese content-equivalence mapping against chapter material before any semantic change. Never manufacture relationships, attributes, equipment, abilities or locations.

## Verification and release boundary

Capture baseline and final390/768/1440/1920. Test keyboard/focus/Escape/Back/refresh/direct routes; zero/one/many search; interrupted transitions; failed media and network; isolated unlock states; reader position restoration; reduced motion. Measure layout stability, interaction and frame timings. Emulated Chromium layout and synthetic input do not certify physical touch, Safari or midrange mobile60FPS. Report those gaps.

Deliver a task/update-211 PR with contract, skill matrix, changed-function inventory, before/after evidence, motion recordings where available, test results, outstanding assets and release/rollback instructions. No merge or production deployment before owner approval of the concrete result. Sites latest saved version was210 at preparation;211 remains an intended label, not a reserved version.
