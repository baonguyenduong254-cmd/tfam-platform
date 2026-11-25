---
name: tfam-web-design
description: >-
  TFAM v250+ web design, visual system, responsive discipline, and Vinext/React 19 frontend guidelines. Use when designing, reviewing, or upgrading any Through Frost and Myth page or UI component.
---

# TFAM Web Design & Engineering Skill (v250+)

Use this skill for all UI, styling, layout, motion, and page upgrades in `site/`.

## 1. Unified Imperial Palette & Direction
- **Theme:** Royal · Universe · Frozen · Elegant · Historical · Dark Fantasy · Adult.
- **Root Tokens (`body` / `main[data-tfam211]`):**
  - Ground: `#0d0914` (Obsidian Plum)
  - Smoked Surface: `#16101fed`
  - Raised Velvet Slate: `#20172bf0`
  - Primary Ink: `#f6ebd8` (Warm Ivory); Secondary Ink: `#c8bacd` (Muted Lavender)
  - Champagne Brass Accent: `#dfc28f` / Highlight `#f6dfb1`
  - Hairlines: `rgba(223, 194, 143, 0.22)`
- Never reintroduce legacy cold-navy hexes (`#0b202c`, `#0a202c`, `#142d3a`).
- Pair editorial typography (`Cinzel` display, `Spectral` body/prose) with `presentationPunctuation()` so no stray spaces appear around punctuation.

## 2. Page Architecture & Canonical Contracts
- **Landing / Realm Portal (`CinematicEntry.tsx`, `opening-moonfall.css`):** Full-viewport frozen cosmic entry (`realm-selection-hall.webp` on realm grid), ambient `--astral-tint` hover glow, three primary CTAs (`ENTER THE REALMS`, `The Chronicles`, `MAISON VESTIGIUM`), 28 realms in 5 constellations.
- **Faction Overview (`FactionOverview.tsx`, `overview-empire.css`):** Inverted locomotive/mechanical arch arrival (`faction-arrival-arch` + fasteners), `20px` consistent page gutters, 5-act scroll flow, Sovereign + top 3 entourage via `lib/canonical-characters.ts`, and bottom `faction-continuation` prev/next realm navigation.
- **Interactive Atlas (`FactionAtlas.tsx`, `atlas-game-mode.css`):** Static regional map plates (`/atlas-static/${regionId}-${year}.webp`), `1715` / `1716` year toggle, zoom/pan, and explicit `labelPlacement` offsets so Iberian cities (`Madrid`, `Toledo`, `Lisbon`, `Ceuta`, `Gibraltar`) never collide.
- **Chronicles & Reader (`ChroniclesHub.tsx`, `ReadingRoom.tsx`, `StoryLibrary.tsx`):** Six Arc hardcover shelf (`arc-1.webp`..`arc-6.webp`) with accessible native `<dialog>` details and direct deep links into published `/read/[id]` chapters.
- **Maison Vestigium (`VestigiumCollection.tsx`, `vestigium-boutique.css`):** Cosmic artifact boutique with `Exhibition`/`Catalogue` modes, 10 categories, and persistent `Imperial Vault` (`localStorage`).
- **Private Salon (`/evelyne-stage`):** `AtelierAtmosphere.tsx` + `LiveIllust25D.tsx` + `Silk Veil` toggle with `prefers-reduced-motion` and WebGL-loss `<img>` fallbacks.

## 3. Mandatory Quality & Responsive Checks
1. **Zero Horizontal Overflow (`390px` mobile):** Every root container, full-bleed canvas, and grid must stay within `100vw`/`100%` (`overflow-x: clip` where safe, never exceeding viewport width).
2. **Above-the-Fold Visibility:** Never leave `/chronicles` or `/vestigium` invisible at `scrollY = 0` waiting for IntersectionObserver reveal.
3. **Sticky Header Clearance:** Account for sticky header height (`scroll-padding-top` / top spacing) so headings and subtitles never collide during scroll.
4. **Vinext / RSC Hydration Safety:** Verify `<Link>` prefetching and client chunks (`DiscoveryProgress`, `ReaderAccount`) produce zero console `TypeError`s across `/`, `/chronicles`, `/vestigium`, `/achievements`, and `/read/[id]`.
5. **Language Consistency:** Keep public-facing UI copy consistent with the active edition language (translate remaining Vietnamese pages like `/legal` or provide clean language switching).
