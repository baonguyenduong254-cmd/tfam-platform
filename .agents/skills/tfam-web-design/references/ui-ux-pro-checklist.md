# UI/UX Pro Pre-Delivery Checklist (Web + Mobile 390px)

Synthesized from **UI/UX Pro Max (`pro-rules` & `quick-reference`)**, **Anthropic `frontend-design`**, **Vercel `web-design-guidelines`**, and **Better Layout (`spacing-and-adaptivity`)**.

## A. Layout & Mobile `390px` Integrity
- Viewport meta includes `width=device-width, initial-scale=1, viewport-fit=cover`; zoom is **never** disabled.
- Root shells use `overflow-x: clip` (never `overflow-x: hidden` where `position: sticky` is needed below) and avoid `100vw` negative-margin hacks.
- Use `100svh` / `100dvh` for full-height landing sections so mobile browser address bars do not cut off primary CTAs.
- Flex & Grid children use `min-width: 0` / `minmax(0, 1fr)` so long names never stretch containers horizontally.
- Sticky bars/headers have non-overlapping scroll clearance (`scroll-padding-top` >= bar height + margin); secondary filter toolbars use `position: relative` below fixed global navs.
- Respect `env(safe-area-inset-top|bottom|left|right)` for fixed or edge-hugging controls.

## B. Typography, Copy & Hierarchy
- Body/prose copy >= `16px` (`15px–18px` ideal, `1.5–1.8` line-height); secondary metadata never drops below `12px` on mobile (`0.75rem`).
- Headlines balance cleanly (`text-wrap: balance`) without `white-space: nowrap` forcing horizontal overflow at `390px`.
- Superscripts (`©`, footnotes) sit inline (`vertical-align: super`), never `position: absolute; left: 100%` near the viewport edge.
- Tabular figures (`font-variant-numeric: tabular-nums`) for stats, chapters, years, and counts.

## C. Touch, Controls & Accessibility
- Minimum `44×44px` hit target on every button, tab, link, and close control on desktop and mobile.
- Minimum `12px` gap between bordered buttons/inputs; `24px` clearance between borderless icon glyphs.
- Visible `:focus-visible` indicator with clear contrast (`#d5c399` / `#ffe8ba`), never suppressed (`outline: none`).
- Decorative icons (`lucide-react`) beside text carry `aria-hidden="true"`; icon-only buttons carry explicit `aria-label` (never emoji placeholders).
- Color contrast >= `4.5:1` for text (`#f6ebd8` / `#c8bacd` on `#0d0914`), >= `3:1` for interactive outlines and meaningful icons.

## D. Performance, Hydration & Assets
- Images use `.webp` or properly sized `.jpg` with explicit `width`/`height` or `aspect-ratio` (`CLS < 0.1`), `fetchPriority="high"` only for true above-the-fold hero focal art, `loading="lazy"` below the fold.
- No audio player UI cluttering the landing header or overflowing corner toast slots (`<audio hidden>` runs cleanly with user-gesture unlock and Settings preference sync).
- Zero uncaught runtime errors in console (`0` `[vinext]` RSC prefetch TypeErrors, `0` failed image/route requests).
- Verify `tsc --noEmit`, `pnpm run build`, and `node --test tests/*.test.mjs` after every UI batch.
