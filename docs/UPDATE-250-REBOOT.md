# TFAM Platform v250 Complete Commercial Reboot

**Theme Direction:** Royal · Universe · Frozen · Elegant · Historical · Dark Fantasy · Adult
**Baseline:** Built cleanly on your live `v241` GitHub repository (`commit d233347ac9ec137cd3fd26e0cdb97d1e9bb4cbe2`). Zero destructive changes to D1 tables or R2 `tfam-assets`.

## 1. Imperial Astral Frozen Realm Portal (`CinematicEntry.tsx`, `opening-moonfall.css`)
- Reworked Faction Selection into a full-viewport frozen cosmic threshold with ambient nebula glow that shifts color smoothly as you hover across realms (`--astral-tint`).
- Direct entry links to **Enter the Realms**, **The Six Arcs**, and **Maison Vestigium** from the opening threshold.

## 2. Headerless Full-Viewport 5-Act Faction Experience (`app/page.tsx`, `FactionOverview.tsx`, `overview-empire.css`)
- Removed bulky top and secondary headers when inside a Faction stage (`v250-headerless-stage`). Replaced them with a minimal floating corner navigation bar (`Realms`, `6 Arcs`, `Vestigium`) and a right-edge whisper Act Dot Rail (`I. Arrival` through `V. Military`).
- Each Act fills the viewport (`min-height: 100svh`) with WebGL GLSL atmosphere and dedicated deep-dive buttons leading into Characters, Interactive Atlas, Landmarks, and Military.
- Fixed the v241 live regression where 31 characters were dumped into Overview: Overview now displays the **Sovereign + top 3 entourage** using the shared `lib/canonical-characters.ts` helper for 100% parity with Character Showcase.

## 3. Simplified Interactive Image Map Atlas (`FactionAtlas.tsx`, `atlas-game-mode.css`)
- Instant static regional map plate (`/atlas-static/${regionId}-${year}.webp`) with smooth zoom/pan and Year switcher (`1715 / 1716`) preserved exclusively on Atlas.
- Staggered pin label placement (`pos-top-right`, `pos-bottom-left`, `pos-left`, `pos-bottom-right`) so Madrid and Toledo never collide, and top-right floating dossier card so Ceuta and Gibraltar are never covered.

## 4. Six-Arc Hardcover Chronicles Shelf (`ChroniclesHub.tsx`, `chronicles-211.css`)
- Displays all **6 Arcs** (`Arc I` through `Arc VI`) as luxury collector hardcover books with clean `Forthcoming` placeholder content (100% English, zero Vietnamese text).
- **How to add your 6 Arc cover images:** Drop your 6 cover images into `site/public/art/arcs/` named `arc-1.webp`, `arc-2.webp`, `arc-3.webp`, `arc-4.webp`, `arc-5.webp`, and `arc-6.webp` (until added, an automatic royal fallback cover renders cleanly).

## 5. Maison Vestigium Cosmic Boutique (`VestigiumCollection.tsx`, `vestigium-boutique.css`)
- Reimagined `/vestigium` as a luxury cosmic artifact storefront with persistent **Imperial Vault** collector's bag (`localStorage`), **Reserve in Vault** controls on inspected artifacts, and a slide-over Vault drawer.

## 6. Punctuation & Live QA Fixes
- Fixed `lib/presentation-punctuation.ts` to eliminate stray spaces before punctuation (`war .` -> `war.`) and broken possessives (`desert ' s` -> `desert's`) across the entire site.
- Fixed music player overlap on `/evelyne-stage` and `/achievements`, kept `Reader profile` dialog at `z-index: 9999`, and applied dark-velvet archival framing to Military unit illustrations.

## Deploying Cleanly (Zero OpenAI Rewriting)
1. Extract `tfam-platform-v250-reboot.zip` directly into your `tfam-platform-main/` root folder (it maps cleanly to `site/...` and `docs/...`).
2. Run `cd site && npx tsc --noEmit && pnpm run build` locally (or push to `main` on GitHub).
3. Instruct ChatGPT Sites: *"Pull `site/` from `main` verbatim, run build, and deploy as v250 without modifying any UI code."*
