# Atlas and scroll follow-up QA

Date: 2026-11-05. Local home-device preview only, production 211 unchanged. No R2 or production database writes. This is a scoped follow-up, not acceptance of the entire cinematic release.

## Design contract and applied references

Impeccable is primary; the existing Taste/TFAM composition, typography and imagery records remain supporting authority. Impeccable craft-floor was read immediately before refinement. Project restrictions override binary launchers; none were run.

| Reference | Concrete decision | Surface |
| --- | --- | --- |
| Impeccable craft-floor, layout/adapt | One chart, grouped native controls, readable legend, mobile two-column toolbar | Atlas |
| Taste imagery/layout, existing stage contract | Preserve authored geographic plate, parchment treatment, restrained frame and cartouche | Atlas |
| Impeccable harden/motion | Last navigation intent wins; no duplicate smooth/instant scrolls or queued restoration | Shared navigation |

Castilian initially shows Europe, the Mediterranean and northern Africa. Fit territory changes only the viewport of the same chart. It does not add a second map. Year selection preserves the chosen framing. Capital diamonds and town dots use the existing verified city catalogue and year ownership; click or the native city selector opens name, allegiance and year below the chart. No new city/history facts were generated. Locked realms remain gated by reading progress. Simplified hit paths no longer clip the base raster, which previously produced gaps in the visible land.

Desktop presents the regional chart at available width with its legend below. Mobile retains the regional context and provides a readable native city selector; the tiny regional-map labels are not the sole way to discover a city. Text remains outside moving layers. No scroll interception or new animation framework was added.

## Actual rendered checks

Browser: Codex in-app Chromium browser, local production build, CSS viewports 390×844, 768×1024, 1440×900 and 1920×1080. Screenshots exclude the scrollbar gutter (375/752/1424/1904 raster widths). Real touch hardware and other browser engines were not tested.

- Exactly one `.atlas211-map`, initial viewBox `0 0 1000 658.5365853658536`; Europe and northern Africa visibly present. No horizontal document overflow at tested widths.
- Capital and city markers visible; Madrid click opens its capital/allegiance record. Mobile native selector also opens Madrid. Collision-aware regional labels use existing layout helper.
- Marrakech record and exploration action require Arc IX and remain on Castilian when attempted. Existing unavailable-arc fail-closed policy remains intact.
- Year 1716 loads matching plate/ownership and changes Ottoman capital from Bursa to Baghdad. Fit territory narrows the existing SVG viewBox; Regional view restores continental context. Native fullscreen enters and exits successfully.
- From deep Overview, Atlas → Characters → Military → Landmarks resolves to Landmarks with its content below shared navigation. Settled offset is stable; no late old-tab alignment observed.
- Alhambra dossier Escape dismissal restores the same page offset: 2351.199951171875 before/after, document client width 1265 before/after, body overflow restored from hidden to visible, focus returned to its collection trigger.
- Chronicles → World → Back returns to Chronicles; Forward returns to World rather than creating a new navigation loop.
- Reader native PageDown then Back/Forward restores near the prior reading anchor: 2167.199951171875 → 2178.39990234375, approximately 11.2 CSS px difference. This is not a pixel-identical assertion or a font/settings/mobile restoration certification. An earlier manual Save-progress click was not used as exact-position evidence because automation may scroll its button into view first.

Independent reviewer inspected the actual 1440 and 390 screenshots; see ATLAS-SCROLL-REVIEW.md. Optional hatch-swatch legend polish remains nonblocking.

## Checks and remaining limits

`node --test tests/navigation-scroll.test.mjs tests/castilian-presentation.test.mjs`: 9/9 passed. TypeScript passed. Production build passed. No dependencies changed.

Remaining broader QA: every Military/Vestigium/legacy dialog path, Reader World-panel and font-setting restoration at all sizes, actual touch, performance/FPS and the full motion-release acceptance. This record does not claim all-site scroll or visual acceptance.

Evidence: qa-atlas-scroll/atlas-regional-{390,768,1440,1920}.png. Live preview: http://127.0.0.1:8787/#atlas/castilian_empire/1715 . Changes are still local; no deployment was performed.
