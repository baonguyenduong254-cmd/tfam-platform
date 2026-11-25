---
name: tfam-web-design
description: >-
  TFAM v250+ studio-grade web design, UX/UI Pro intelligence, motion engineering (Motion & CSS), responsive 390px discipline, and Vinext/React 19 frontend guidelines. Use whenever designing, auditing, or upgrading any Through Frost and Myth page or UI component.
---

# TFAM Web Design & Motion Engineering Skill (v251+)

Synthesized for *Through Frost and Myth* from **UI/UX Pro Max** (priority UX/accessibility/touch rules), **Anthropic Frontend Design** (anti-slop subject-driven art direction), **Jakub Krehel Better Motion & Layout**, **Motion (`motion.dev`) React 19 performance**, **Vercel Web Interface Guidelines**, and **Impeccable** / **Design Taste Frontend**.

## 1. Studio POV & Subject-First Direction (Anti-Slop)
- **Theme:** Imperial Dark Fantasy · Frost & Blood Velvet · Archival Typography · Adult Chiaroscuro.
- **Root Palette (`body` / `main[data-tfam211]`):**
  - Ground: `#0d0914` (Obsidian Plum)
  - Smoked Surface: `#16101fed`
  - Raised Velvet Slate: `#20172bf0`
  - Primary Ink: `#f6ebd8` (Warm Ivory, >= 4.5:1 body contrast); Secondary Ink: `#c8bacd` (Muted Lavender)
  - Brass Accent: `#dfc28f` / Highlight `#f6dfb1`; Crimson Accent `#872641` -> `#471426`
  - Hairlines: `rgba(223, 194, 143, 0.22)`
- Never reintroduce legacy cold-navy hexes (`#0b202c`, `#0a202c`, `#142d3a`).
- **Editorial restraint (anti-AI-tells):**
  - Use **two distinct font families maximum**: `Cinzel` / `Cormorant Garamond` (display) + `Spectral` (body/prose).
  - Prose width `< 80ch`; always run `presentationPunctuation()` on editorial copy.
  - Structural borders/rules/indices carry real taxonomy — avoid decorative `01 / 02 / 03` badges, emoji icons, boxed header pills/metadata badges (e.g., timeline/arc tags in the landing toolbar), gradient-pill bloat, or scattered fade-up card grids.
  - Keep public header toolbars uncluttered: ambient soundtrack plays invisibly in the background unless controlled cleanly from Settings.

## 2. Priority Rules (Fix P0 First)
1. **Accessibility & Keyboard (CRITICAL):** >= 4.5:1 text contrast, visible `:focus-visible` outline (`2px solid #d5c399`), explicit `aria-label` on icon buttons, native `<dialog>`/`aria-modal="true"` focus traps.
2. **Touch Targets & Mobile `390px` (CRITICAL):** Min `44×44px` tap target, `12px` bordered control gap (`24px` borderless glyph gap), `env(safe-area-inset-*)` padding, `100svh`/`100dvh` (never raw `100vh` or `100vw` overflow breakouts), `minmax(0, 1fr)` / `min-width: 0` on flex/grid children, and `overflow-x: clip` on root shell.
3. **Zero Idle CPU/GPU Waste (HIGH):**
   - Never run continuous 60fps JS `requestAnimationFrame` canvas particle loops or full-bleed WebGL fragment shaders behind static editorial content.
   - Never attach a `MutationObserver` on `document.body` (`subtree: true`) for decorative tilt/slots.
   - Avoid stacking `backdrop-filter: blur(...)` across 10+ scrolling cards simultaneously on mobile.
4. **Vinext / React 19 Hydration & Routing Safety (HIGH):**
   - Avoid unguarded `next/link` RSC prefetching on standalone sections when Vinext client manifests lack routes (`use <a href="...">` with delegated click interception where appropriate).
   - Never gate above-the-fold sections (`/chronicles`, `/vestigium`) on `opacity: 0` waiting for `IntersectionObserver` or `ssr: false` without immediate fallback UI.

## 3. Canonical Page Contracts
- **Landing & Realm Portal (`CinematicEntry.tsx`, `opening-moonfall.css`):** Full-viewport hero with clear focal framing on desktop and `390px` mobile (all CTAs fit cleanly above/near fold without crowding), subtle ambient scrim (no blurred polygonal blob), hidden background music playback, explicit return control from `#horizons`, and snap-scrollable constellation chips + lightweight faction cards on mobile.
- **Faction Overview (`FactionOverview.tsx`, `overview-empire.css`):** Inverted arch arrival + consistent gutters (`20px`), 5-act scroll flow, Sovereign + top 3 entourage (`lib/canonical-characters.ts`), pure CSS atmospheric gradients, and `faction-continuation` footer navigation.
- **Interactive Atlas (`FactionAtlas.tsx`):** Regional static plates + 1715/1716 toggle + non-colliding city labels.
- **Chronicles & Reader (`ChroniclesHub.tsx`, `ReadingRoom.tsx`):** Six Arc shelf + Arc I clickable `38`-chapter list (`lib/story/english-index.json`).
- **Maison Vestigium (`VestigiumCollection.tsx`):** Static relative filter bar (never overlapping fixed headers) + `Imperial Vault`.

## 4. Detailed References (Load on Demand)
- [Motion & Micro-Interactions](references/motion-and-microinteractions.md) — Exact durations, springs (`bounce: 0`), `motion/react` `LazyMotion`, compositor-only rules, and reduced-motion fallbacks.
- [UI/UX Pro Pre-Delivery Checklist](references/ui-ux-pro-checklist.md) — Complete desktop + `390px` mobile audit checklist before any build/PR.
