# Follow-up scene motion audit — 2026-11-05

Scope: source and deterministic lifecycle review of `SceneStage.tsx`, `ScenePlayback.tsx`, `lib/motion/preference.ts`, their page integration, the category ensemble and `stages-211.css`. This is independent of the parent's rendered QA and build. No UI files were edited by this audit. Local execution follows the owner's confirmed home-device override in `PRODUCT.md` and the current task. Impeccable animate/craft-floor references and project context were read directly; no launcher, downloaded binary, package install or browser automation was used.

## Finding and resolution

The initial implementation gated entry on only the first subject image. A collection ensemble's remaining images, or a character environment, could finish loading after the entrance had already settled. The parent changed the gate to all subject/environment images and attached load/error listeners to each. The final actual-source harness passed with three independently loading images: the first subject's load cannot begin entry, nor can the second subject's load; the environment's final readiness permits the sequence. Content remains visible while choreography waits. Failed images settle through the existing error/readiness path rather than hiding content.

## Verified behavior

- The visible Enable handler chooses explicit Full and dispatches `tfam-scene-replay`. The actual preference module reports Full even with a mocked OS reduced-motion preference. The stage media query excludes explicit Full. Reduce selects reduced motion and cancels the active entrance.
- A replay after settlement creates a fresh entrance. Repeated replay cancels the previous animations and invalidates their generation before starting the newest. A previously resolved but still queued completion cannot mark the newest run settled.
- Entry waits for image readiness and initial visibility. Offscreen and hidden-document states pause unfinished WAAPI animations and set the stage static; replay in either state does not launch another run. Visibility restoration resumes the pending run. Reduced → Full permits a fresh entrance.
- Cleanup invalidates completion, cancels animations, disconnects the observer and removes image, preference, replay and document listeners. Queued completion after cleanup cannot settle the removed run.
- CSS ambient loops require the active stage attribute; static stages pause descendant CSS animations. SceneStage itself creates no continuing JavaScript frame loop. These are source/lifecycle checks, not a measured zero-CPU or frame-rate claim.
- The category hero now wraps its ensemble in SceneStage with environment/subject planes and an identity derived from category and selected representative IDs. Replay reaches it through the same listener. The choreography targets authored art planes rather than collection headings or reading text.
- The Chronicles reading branch does not mount SceneStage. Scene controls are hidden in the reading view; the book handoff remains an isolated overlay. This review does not claim that every pre-existing page navigation transition was re-audited.

## Evidence and limits

An ephemeral Node harness transpiled the actual source using the existing TypeScript package and ran the actual effect/control handlers with mocked React hooks, IntersectionObserver, events, storage and WAAPI promises. Final run exited 0 after the all-image readiness change. It exercised OS reduction with explicit Full, visible Enable, staggered multi-image readiness, successful settling, settled replay, rapid latest-wins replay, offscreen/hidden pause and replay gating, reduced cancellation/reset, and cleanup/listener removal. The harness remains outside the repository in the temporary directory; no permanent test stack was introduced.

No additional blocking lifecycle defect was found in this scope. This verdict covers the reviewed source and mocked state transitions. Native image decoding, final browser composition, discoverability of the visible control, perceived motion, keyboard use and device performance require the parent's rendered checks. No browser appearance, smoothness, FPS, deployment, production data write or R2 write is claimed here. Regional map/Moor Arc IX, military image containment, footer and cutout quality are outside this motion audit.
