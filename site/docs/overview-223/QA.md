# Castilian Overview local handoff

## Result
Implemented on local task branch `task/castilian-overview-223`, based on Sites222/source5661a3dbcf53f9bea8b1d1be1a60c0dc93f25fc0. Not merged or deployed. `223` is a working asset/task identifier; next available Sites version must be rechecked before release.

## Changed surfaces
- Castilian arrival: new cinematic environment, visible year/capital/verified region count, camera/flag arrival, winter weather canvas. Continuous gentle light remains under reduced motion; offscreen/hidden scenes pause. Repeat arrivals are shorter.
- Overview body: all authored traits; three featured landmarks opening existing dossiers; discovery-filtered Crown/Guard in shared roster order; keyboard military tabs; complete historical prose via native disclosure.
- Madrid, Ceuta and Gibraltar gallery/dossier art use three new realistic interpretations through the existing presentation resolver. No editorial facts changed.
- Other factions retain their capital/year/territory facts and chronicle artwork; new Castilian backdrop is scoped to Castilian only.
- Removed51 superseded Overview CSS rules. No R2 objects, DB content, reader data or other assets were deleted.

## Verification
- TypeScript: `tsc --noEmit --incremental false` passed.
- Domain checks: `node tools/check211-domain.cjs` passed.
- Gazetteer checks: `node scripts/check-monuments.mjs` passed,24 factions/134 records.
- Production framework build passed. Existing framework deprecation/chunk advisories remain; no dependency upgraded.
- Rendered at CSS390×844,768×1024,1440×900,1920×1080; document width does not exceed viewport at these sizes.
- Clicked Madrid from Overview, verified correct dossier/new artwork; Escape returned to collection, browser Back restored Overview position.
- Military click and ArrowRight changed selected tab/content correctly. Image bounding box now matches its320px mobile/460px desktop stage and uses contain, preserving full figure.
- Full history disclosure reveals all remaining paragraphs.
- Preview's reduced-motion CSS path was active: confirmed `imperial-light` with running state while arrival onscreen; paused state when offscreen. Spatial camera motion remains for normal-motion environments. No claim of measuredFPS.
- Independent fresh-agent review: **ship at visual/source-review scope**, no blocking findings. Minor variance: palace focal subject left/center rather than contract's literal right; composition accepted. Mobile Guard strip and military tabs deliberately require native horizontal scrolling.

## Evidence
Workspace sibling `outputs/overview223/`: after-390.png,after-768.png,after-1440.png,after-1920.png,hero-390.png,hero-1440.png,hero-1920.png,landmarks-1440.png. The baseline named before-1440.png was actually captured at1280px viewport; not a pixel-matched comparison. Browser screenshots exclude the scrollbar, so pixel widths differ slightly from CSS viewport widths.

## Limits
- Local D1/auth are not configured; preview clearly reports archived-content fallback. Account synchronization, admin editing and live DB were not tested or changed.
- Physical touch hardware, Safari/Firefox and constrained mobile performance were not tested. Screenshots establish layout, not touch/FPS performance.
- Loading/error/retry and reduced-motion cleanup inspected in source; no network-failure injection or hidden-tab performance recording.
- Four new assets are native1672×941 (no upscale), not4K. Military and anime character artwork are retained.
- GitHub main source/status remain behind verified production. This checkout is preserved separately; do not publish the stale GitHub subtree or overwrite unrelated local edits during future reconciliation. No GitHub PR/merge or production write was performed for this local review.

## Release and rollback
After owner approval of the concrete preview, recheck actual Sites version/source, run supported source sync/package workflow against this exact tested tree, save/deploy and record returned IDs. Preserve D1/R2 bindings. Existing successful version222 is rollback target. Code rollback does not alter reader data or R2.
