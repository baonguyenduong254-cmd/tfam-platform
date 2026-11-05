> Version 212 is live. The final release has one fixed regional framing. The earlier Fit territory and Regional view buttons were removed. See `ops/release-212.json`.

# Regional atlas and Moor discovery policy

Date: 2026-11-05. Branch: task/211-stage-motion. Local work is authorized by the owner's current home-device instruction; production remains 211. No D1/R2 writes, generated media, renderer additions, commits or deployment were performed for this scope.

## Observable decisions

- Exactly one regional chart is mounted and fetched: the existing primary assignment from `mapRegion(faction.id)`. Removed the coverage-driven inset list, inset navigation and inset session-storage preference. `Regional view` changes the view of this same plate; it does not mount another map.
- Owner clarification: initial view shows the full assigned region. Castilian opens Europe, the Mediterranean and northern Africa. `Fit territory` is an optional closer view of the same plate; `Regional view` returns to the regional context. Year changes preserve the chosen framing.
- Existing Natural Earth relief and authored TFAM borders are preserved. A restrained warm treatment makes the existing full relief plate parchment. The full original raster is retained, avoiding gaps caused by clipping geography through simplified hit polygons. No invented coastline, mountain, town or decorative geography was introduced. Selected territory uses crimson ink. The chart furniture is a double restrained frame, faction cartouche, regional heading and authored SVG compass; none is passed off as geography.
- The map uses the same SVG/static-plate approach already in the component. Original source assets remain intact. The component owns its scoped CSS import; no global stylesheet/layout was edited.
- Capitals and selected-faction towns come from the existing verified atlas catalogue and year-specific ownership policy. Keyboard activation, locked-territory notices, year selection, fullscreen, retry/error states and reduced-motion entrance remain. Image identity includes faction so switching between factions on the same regional plate refreshes its readiness state correctly.
- Distant holdings are explicitly outside this regional chart. The note says so; the map no longer claims insets preserve all scattered territories.

## Moor rule

`unlockRequirements.sultanate_of_morocco = 'arc-9'`. Only Castilian remains available without an earned milestone. All other requirements remain unchanged. Cinematic selection, faction selection, reader world references, regional map activation and direct faction/archive/map routes already consume the shared discovery policy; no extra per-surface exceptions were added.

Arc IX's existing milestone is deliberately unchanged: `closed: false`, `required: []`. `milestoneState` already requires a closed, nonempty, fully published set before awarding anything. Consequently no current chapter history can earn Arc IX as a zero-of-zero achievement. The locked condition reads `Complete Arc IX · Required arc not yet fully available`. No reader progress was deleted, migrated or rewritten.

## References applied

Primary: project-local Impeccable SKILL, new-work, layout, adapt and craft-floor text; supporting Taste imagery/layout text. Existing PRODUCT.md/DESIGN.md and STAGE-CONTRACT.md own the visual direction. The project registry records Impeccable pin e89e3ada3e875a89ac2c5d33d11e65ebef6fe285 and Taste pin 12af471f627f866411b4bd785b19646d3672784c. Adopted: existing artwork leads, useful task grouping, one primary visual, native responsive controls, readable geography/labels and limited surrounding ornament. Launchers, hooks, downloaded binaries and asset-fetch scripts were not run. Original reference code was not copied.

## Checks

- `npx tsc --noEmit`: passed after the map changes.
- `node tools/check211-domain.cjs`: passed, including new assertions for initial Moor lock, insufficient earlier arcs, Arc IX unlock, existing unpublished Arc IX fail-closed state, and the displayed requirement.
- Source traced CinematicEntry, page selection and direct-route locked guard, ReaderWorldContext, and FactionAtlas to the shared canExplore/condition policy.
- Rendered 390/768/1440/1920 review, fullscreen rendering and actual pointer/keyboard map review remain with the parent browser owner. This record does not claim visual acceptance before those checks.
