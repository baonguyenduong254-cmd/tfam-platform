# Character selection simplification and transition

Owner approved implementation and publishing. Baseline Sites220.

Identity contains membership (Royal Guard - Uno), name and Select character only. Lore, repeated role and Uniform collection removed. Desktop: dominant stage plus right roster, three portrait columns, independent roster scroll. Stats are a compact horizontal line. Mobile: a stacked stage and expandable roster. Existing spoiler-filtered characters and dossier entry remain.

Impeccable interaction/motion authority: one short arrival, no queued transitions. Taste composition authority: artwork is dominant, identity is concise, portraits readable. Existing imperial palette and supplied artwork preserved.

Images decode before plate replacement; the previous plate remains until ready, then two plates crossfade/translate. Next/previous neighbors warmed, cache bounded to8 promises, stale requests ignored. Removed repeated 3D/brightness rasterization. GLSL shader:22 subtle drifting lights and550ms selection sweep at65percent canvas resolution, no added dependency. CSS atmospheric motion remains when WebGL cannot initialize. Hidden/offscreen rendering pauses; reduced motion retains slow ambient feedback, reduces transition travel and omits shader sweep.

Source review found arrow navigation must use focused portrait rather than selected index. Fixed; focus does not scroll the document, and only roster scroll adjusts. Browser:1440px desktop composition,390px mobile with no horizontal overflow, correct Uno/Testarossa copy, keyboard Testarossa to Evelyne, loaded final artwork after rapid selections. No measured FPS/physical device claim. No D1/R2 writes.

Local TypeScript/domain/build checks passed before final keyboard refinement; packaging performs final build and trim. Rollback Sites220.
