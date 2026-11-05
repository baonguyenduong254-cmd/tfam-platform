# Scroll stability follow-up

Scope: local follow-up to Update 211. Source audit and focused regression checks, not a claim of device/browser certification.

## Corrected

- Module navigation now aligns the new content once, immediately after its DOM commit. Removed competing smooth/instant scroll calls from destination handlers, including the Atlas exception.
- Navigation promises identify superseded intents. An earlier tab change cannot scroll a newer destination when its delayed callback completes.
- Global-room navigation cancels pending module alignment, stores the outgoing view/position and guards its own deferred top reset.
- The faction history listener ignores non-World paths. Before this correction, Back from World to `/chronicles#reader/...` or `/vestigium#...` could call `openRoom` and push a replacement history entry during traversal.
- Faction history restoration cancels pending animation frames on replacement/unmount and checks the current route before applying the saved offset.
- Legacy unit/editor dialogs return focus with `preventScroll`, consistent with the newer Military, Landmark and Vestigium dialogs.
- Native document scrolling defaults to `auto`; individual intentional in-page controls may still request smooth scrolling. A stable scrollbar gutter avoids a horizontal layout shift when a modal hides body overflow.

Reader paragraph checkpoint calculations, font-ready restoration, chapter content and account synchronization were left unchanged. Native wheel/touch scrolling is retained; no scroll interception framework was added.

## Validation

`node --test tests/navigation-scroll.test.mjs`: 4 tests pass. These transpile and execute the actual navigation functions and history effect extracted from `app/page.tsx`, covering latest-intent behavior, single alignment, non-World Back traversal, canceled restoration and normal saved offset restoration.

Type checking was run alongside these tests. Browser evidence belongs to the parent task's rendered QA, not this source audit.

## Rendered QA still required

1. From deep in Overview, switch rapidly among Atlas, Characters, Military and Landmarks. Confirm the last selected module wins and its heading sits below the shared navigation without a second jump.
2. Enter Chronicles or Vestigium, return to World, then use browser Back/Forward. Confirm traversal remains on the requested history entry and the collection/reader position restores.
3. Open and dismiss each dossier at a scrolled collection position. Confirm the underlying page position and horizontal width stay fixed, and wheel scrolling resumes after dismissal.
4. Verify Reader checkpoint restoration and the World-at-this-chapter panel at desktop/mobile widths. Check real touch hardware separately; screenshots and mocked source tests do not verify touch or FPS.

Files: `site/app/page.tsx`, `site/app/scroll-stability.css`, `site/tests/navigation-scroll.test.mjs`.
