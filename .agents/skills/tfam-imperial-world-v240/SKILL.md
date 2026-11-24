---
name: tfam-imperial-world-v240
description: Unified art direction, faction-adaptive gradient system, 3D product-launch motion, WebGL 2.5D Live-Illust, and Velvet Chiaroscuro 18+ styling for Through Frost and Myth (PC and Mobile 390px).
---

# TFAM Imperial World v240 Design & Engineering Skill

## 1. One Imperial World Palette (Zero Legacy Cold-Navy Seams)
Every page (Overview, Atlas, Military, Landmarks, Character Showcase, Private Salon, Vestigium, Chronicles, Achievements, Account Dialogs, Floating Music Bar) MUST share one unified CSS variable palette rooted on `body` / `main[data-tfam211]`:
- Ground: `#0d0914` (Obsidian Plum)
- Surface: `#16101fed` (Smoked Plum Glass)
- Raised Surface: `#20172bf0` (Velvet Slate)
- Primary Ink: `#f6ebd8` (Warm Ivory)
- Secondary Ink: `#c8bacd` (Muted Lavender, never flat gray)
- Gilded Accent: `#dfc28f` / Highlight `#f6dfb1` (Champagne Brass)
- Primary Hairline: `rgba(223, 194, 143, 0.22)`
- Faction-Adaptive Multi-Stop Gradients:
  - Castilian Empire (default): Crimson `#872641` -> Deep Wine `#471426`, top ambient glow `rgba(109, 27, 52, 0.22)`, bottom warm brass glow `rgba(185, 148, 90, 0.12)`.
  - Annam: Deep Jade `#266b5c` -> `#133830`, Burnished Bronze `#dfb97a`.
  - Russian Empire: Frost Slate `#386182` -> `#1a3147`, Silver Ice `#d5dee8`.
- Strictly retire all legacy `#0b202c`, `#0a202c`, `#0d202c`, `#142d3a`, `#16303b` cold-navy surfaces.

## 2. Archival Plate Framing for Light-Ground Illustrations
Whenever historical military or unit illustrations have light cream/parchment backgrounds (`military.css`, `FactionOverview.tsx` Order of Battle):
- Never display them as harsh bright rectangles pasted onto dark cards.
- Wrap them inside a museum archival mat (`aspect-ratio: 4/3`, dark radial velvet backing, subtle gilded inner hairline, and soft radial edge vignette `mask-image: radial-gradient(ellipse 96% 96% at 50% 50%, #000 84%, transparent 100%)`).

## 3. Velvet Chiaroscuro 18+ Aesthetic & WebGL 2.5D Live-Illust
For Private Salon (`/evelyne-stage`) mature editions (`naughty_office`, `afterwork`, `beach`):
- Shift ambient shader (`AtelierAtmosphere.tsx`) to warm candlelight bokeh + burgundy-crimson rim silhouette glow.
- Render character cutouts via `LiveIllust25D.tsx` (procedural anatomical depth parallax, face-safe organic breathing, outer hair/veil breeze, specular rim sheen, `Live 2.5D / Static art` toggle, automatic `<img>` fallback on reduced-motion or WebGL loss).
- Include the translucent frosted-crimson **Silk Veil** reveal toggle (`Silk veil / Unveil`).

## 4. 3D Product-Launch Motion & Mobile 390px Discipline
- Page switches use 3D perspective camera dolly (`perspective(1600px) translate3d(0, 34px, -110px) rotateX(4.2deg) scale(0.965)` -> `none`, 560ms `cubic-bezier(.16,1,.3,1)`) with a gilded obsidian prism shutter veil.
- Cards use delegated GSAP 3D pointer tilt + cursor-tracking champagne specular glare (`KineticSurfaces.tsx`) on desktop `(hover: hover) and (pointer: fine)`.
- On mobile (`<= 767px`): disable heavy `backdrop-filter` blur where needed for 60FPS, convert multi-button toolbars (Atlas Lenses/Layers, Overview Chapter Rail, Lounge Quick Attire) into single-row horizontal `scroll-snap-type: x proximity` ribbons with `min-height: 44px` tap targets, and reserve `min-height: 75svh` on page containers so footers never jump during route transitions.
