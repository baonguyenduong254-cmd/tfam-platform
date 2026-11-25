# Motion & Micro-Interactions Reference (Motion.dev + Better Motion)

Synthesized from **Motion (`motion.dev`)** React 19 engineering docs and **Jakub Krehel (`better-motion`)**.

## 1. Core Principles
- **First ask if an element should move at all.** Restraint outperforms constant ambient looping. Removing a heavy/gratuitous animation is an upgrade.
- **One orchestrated moment per view transition:** Do not scatter stagger fade-ins across every scrolling card grid on initial paint.
- **Every animated state needs a static cue:** Color, border, label, or icon state still communicates change when `prefers-reduced-motion: reduce` is active.

## 2. Exact Timing, Easing & Spring Table
| Interaction | Duration / Config | Notes |
| --- | --- | --- |
| High-frequency hover / row / tab color | `<= 150ms` (`100ms–150ms`) `ease-out` | `opacity` or `background-color` only |
| Press tactile feedback (`:not(:disabled):active`) | `150ms ease-out`, `scale: 0.96–0.97` | Exclude `:disabled` / links cleanly |
| Tooltips / small popovers enter | `150ms` `cubic-bezier(0.2, 0, 0, 1)` | Exit shorter (`100ms–120ms`); scale from `0.97` |
| Dropdowns / context menus | `200ms–250ms` enter / `150ms` exit | Set `transform-origin` toward the trigger |
| Modals, drawers & route curtains | `350ms–450ms` enter / `180ms–220ms` exit | Modals enter from `scale: 0.98–0.99`, exit to `0.99` |
| Springs (`motion/react`) | `{ type: "spring", duration: 0.3..0.45, bounce: 0 }` | `bounce` is always `0` unless explicit playful physics |

## 3. Compositor-Only & React 19 Rules (`motion.dev`)
- **Animate only compositor properties:** `transform` (`translate`, `scale`, `rotate`), `opacity`, `clip-path`. Never animate `width`, `height`, `top`, `left`, `margin`, or `padding` inside scroll/drag frames.
- **Name explicit transition properties:** Never write `transition: all` or `will-change: all`.
- **Use `will-change` sparingly:** Only on elements verified to stutter/shift (`transform`, `opacity`), never globally on large card grids (excessive GPU memory on iOS/mobile).
- **Zero per-frame `useState`:** Never tie pointer-move parallax or scroll coordinates to React `useState`. Update a CSS custom property via `requestAnimationFrame` or use Motion `MotionValue`.
- **React 19 Concurrency:** Wrap expensive filter/search transitions in `startTransition` so animations stay fluid.
- **Transitions vs Keyframes:** Use CSS transitions (or Motion springs) for reversible UI state (drawers, menus, accordions) so mid-flight interruption reverses smoothly. Reserve `@keyframes` for one-shot entrances or subtle CSS ambient accents.

## 4. Background & Ambient Effects Policy in TFAM
- **Banned patterns:**
  - Global `MutationObserver(document.body, { subtree: true })` attached just to hook hover tilt or portal targets.
  - Continuous 60fps `<canvas>` 2D `arc()` particle loops or full-screen `WebGL` multi-octave `fbm` fragment shaders running behind static pages.
  - Heavy simultaneous `backdrop-filter: blur(...)` on 20+ grid cards on mobile.
- **Preferred alternative:** Layered CSS radial/linear gradients, subtle static grain/vignette overlays, clean `<picture>` high-res focal art, and pointer/hover polish gated strictly behind `@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`.

## 5. Reduced-Motion Compliance
- Always pair Motion components with `<MotionConfig reducedMotion="user">` or `useReducedMotion()` (essential when animating `filter` or continuous transforms).
- In CSS, isolate movement, scale, and ambient shimmer inside `@media (prefers-reduced-motion: no-preference)` and keep a fast opacity cross-fade (`150ms ease-out`) so content stays immediately legible.
