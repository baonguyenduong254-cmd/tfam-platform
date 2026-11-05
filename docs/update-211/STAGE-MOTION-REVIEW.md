# Stage motion lifecycle review — 2026-11-04

Scope: `site/app/components/SceneStage.tsx` and `BookHandoff.tsx`. Reviewed against `STAGE-CONTRACT.md`, existing motion preference implementation, parent call sites and stage CSS. Impeccable animate/craft guidance was read directly; no launcher, dependency installation, browser automation or downloaded binary was used. Local execution follows the owner's home-device override recorded in `PRODUCT.md` and the current task.

## Findings and changes

- Scene cancellation previously converted rejected animation promises into successful completion. A cancelled run could consequently overwrite `reduced`, or a newer identity's phase, with `settled`. Completion now requires an uncancelled run, a matching generation, a live effect and a connected element. Cleanup invalidates callbacks before cancelling animations.
- A Full → Reduced → Full change previously left `played` true after cancelling the entrance. Reduction now cancels and clears that run; a subsequent Full setting can perform the authored entrance when visible. Reduced content stays in its normal static CSS state.
- Scenes previously assumed visibility before IntersectionObserver delivered its first result. They now wait for that result, so initially offscreen scenes do not begin their entrance or enable ambient loops. Image readiness, offscreen pause/resume and document visibility remain connected to the existing control path.
- Book handoff completion could be invoked by both animation completion and subsequent hidden/reduced events, and captured its original `onEnd` indefinitely. It now completes once using the latest committed callback. Cleanup invalidates queued completion, and a changed cover cancels the previous handoff. Initially hidden or reduced handoffs finish immediately. Both animation promises explicitly consume cancellation rejection; the mocked harness initially exposed an unhandled background cancellation before that handler was added.

The environment 900 ms, subject 650 ms after 100 ms and book opening 600 ms timings remain unchanged. The multi-plane transforms, aperture and cover opening remain; no fade-only replacement, artwork change, source asset mutation or CSS edit was made. Original character plates and alpha derivatives are still selected by the existing callers.

## Validation performed

- `node node_modules/typescript/bin/tsc --noEmit --incremental false` from `site/`: passed after final changes.
- Direct whitespace/conflict-marker check on the two components and this document: passed. These files are currently new/untracked, so `git diff --check` alone does not inspect them. The tracked-tree diff check also passed, with CRLF conversion warnings for other concurrently edited files.
- An ephemeral Node assertion harness transpiled the actual TSX components using the incumbent TypeScript package and ran their effect bodies with mocked React hooks, events, IntersectionObserver and WAAPI promises. Final run exited 0. It covered initial offscreen and image readiness, pause/resume, Full ↔ Reduced, identity cancellation, successful settling, cleanup, latest handoff callback, exactly-once completion, queued completion after unmount/cover replacement, and initially hidden/reduced handoffs.

The harness is a deterministic lifecycle check, not a rendered React or native-browser test. No new permanent test stack was introduced. Browser composition, actual animation appearance, effective explicit Full under OS reduction, image decode behavior, focus/navigation and device performance remain part of the parent task's rendered QA. No motion video or frame-rate measurement was produced by this review; no FPS or smoothness claim is made. No build, deployment, production data write, Git staging or commit was performed by this subtask.
