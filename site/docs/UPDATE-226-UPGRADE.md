# TFAM Platform Update 226 Upgrade Notes

Baseline: `siteVersion: 225` (commit `a28b1eaa2ed11072729f3033a566e8eca5e5a831`, verified `2026-11-19`).
Aesthetic Direction: Alternative History, Elegant Dark Fantasy, Adult Editorial (obsidian plum, burnt crimson, champagne brass, stable prose).

## 1. Imperial Overview Redesign
- `site/app/components/OverviewAtmosphere.tsx`: Added bounded low-power WebGL GLSL atmospheric shader with faction-aware crimson, brass, and frost veil lighting plus pointer glow.
- `site/app/components/FactionOverview.tsx` and `site/app/overview-empire.css`:
  - Added Sovereign Dossier Ribbon with Capital, Era, Charted Holdings, Recorded Figures, inline Chronicle Year switcher, and Chapter Jump Rail.
  - Upgraded Doctrine traits into spotlight-reactive gilded folios with Roman numeral indices.
  - Upgraded Landmarks into a framed cinematic bento layout with frosted-obsidian location tags.
  - Upgraded The Crown and Entourage into chiaroscuro portrait staging with specular hover framing.
  - Upgraded Military Forces into a War-Table showcase with indexed brass tabs.
  - Preserved `The Stable Prose Rule` inside the Imperial Chronicle folio.

## 2. Character Showcase & Imperial Couture Atelier (Wardrobe)
- `site/lib/wardrobe-looks.ts`: Replaced seven duplicate legacy compositions with their Collection 2026 editions. Distinct legacy art for Isabella, Meredith, Mirelle, and Serene remains selectable, alongside both Liv Afterwork variations.
- `site/app/components/CharacterShowcase.tsx` and `site/app/components/character-showcase.css`: Added canonical ID and artwork-path deduplication for roster tiles, removed em-dashes, and styled the Private Salon entry bar.
- `site/app/evelyne-stage/page.tsx` and `site/app/evelyne-stage/lounge.css`: Redesigned Wardrobe into the Imperial Couture Atelier with smoked obsidian-velvet glass drawer, tall 3:4 lookbook plates, understated `18+` wax-seal badges, inline Quick-Attire Ribbon, and roster/artworkOnly deduplication.

## 3. Grand Strategy War-Table Atlas
- `site/app/components/FactionAtlas.tsx` and `site/app/atlas-game-mode.css`:
  - Added 4 interactive cartographic lenses: `War Room`, `Imperial Chart`, `Frost Front`, and `Sea & Trade`.
  - Added live layer toggles: `Borders`, `Terrain`, `Rhumb Grid`, `Labels`, and `2.5D Table` tilt.
  - Added camera zoom/pan controls (wheel zoom, drag pan when zoomed, `+`/`-`/Reset dock) and live Latitude/Longitude telemetry bar.
  - Added pulsing strategic beacons on capitals/selected holdings and an in-map floating dossier card.
  - Preserved all verified Natural Earth geography and authored TFAM border coordinates.

## 4. TFAM Studio Platform Integration (Additive on v225)
- `site/drizzle/0005_tfam_studio_platform.sql`: 10 additive D1 tables (`studio_volumes` through `studio_audit_logs`), zero mutations to existing 9 live tables.
- `site/app/api/studio/route.ts` and `site/app/api/studio/import/route.ts`: Authenticated Studio CRUD and Google Docs/Markdown/JSON importer endpoints reusing `site/lib/admin-auth.ts`.
- `tools/google-docs-sync/Code.gs`: Google Apps Script webhook bridge for live Volumes I to VI synchronization.
- `studio/`: Complete standalone TFAM Studio application, SQLite/D1 schema, QA engine, importer, and automated E2E test suite.

## Applying Locally
1. Extract `tfam-platform-v226-upgrade.zip` into the root of your local `tfam-platform-main` (v225) repository (it only updates/adds source files and never touches `site/public/` media or R2).
2. Run `cd site && pnpm run build` to verify compilation locally.
3. Apply Studio D1 migration when ready: `npx wrangler d1 migrations apply DB --local`.
