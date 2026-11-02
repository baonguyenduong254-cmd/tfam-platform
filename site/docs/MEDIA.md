# TFAM media and cinematic architecture

## Audit and current systems

The retained application is React 19 + Vinext 1 beta on Vite 8, deployed as a Cloudflare Worker through Sites. D1 holds editable Atlas and reader/account data. Heavy images previously lived in `public/`; they were deployment assets, not D1 binary blobs. MapLibre 6 already supplies the globe, terrain, borders and map interaction. The CSS/DOM ice introduction and its two-scene transition compositor, faction data, reader, account settings and existing translations are retained.

`BackgroundMusic.tsx` owns the one persistent soundtrack audio element, preference, track state, narration suspension and voyage handoff. `voyage-cannons.ts` owns the ten-second procedural SFX bus. The first track alone is prefetched during that sequence; the playlist is never downloaded as a batch. Speech remains a separate voice channel. There is no second hidden music player.

Military loads its manifest then only the selected faction JSON. Monuments load only the selected faction; Vestigium loads only the selected category. Their galleries request thumbnails lazily and attach full artwork only inside the opened dossier. Character/account avatars and all ordinary images now pass through `MediaImage`.

## Central media layer

- `lib/media/config.json`: default public CDN origin, with no credentials.
- `NEXT_PUBLIC_MEDIA_BASE_URL`: optional **build-time** public CDN override; Vite substitutes the same value in server and client bundles. Rebuild to change it.
- `lib/media/asset-url.ts`: `assetUrl()` and logical soundtrack/video/model helpers.
- `lib/media/external-paths.json`: exact verified legacy path -> R2 object key mappings. Thumbnail names are explicit, including `.thumb.webp` military names.
- `lib/media/manifest.json`: byte counts, SHA-256 and R2 ETags verified before local deletion. This is build metadata; image bytes are not embedded.
- `scripts/media-assets.mjs`: lets catalogue generation validate registered external assets without requiring their local binary copies. Vestigium catalogue versions still use the original artwork hashes.
- `MediaImage.tsx`: keeps a native `img`, resolves URLs, defaults to lazy/async image loading, and uses a small local fallback if an image fails.
- `middleware.ts`: old direct media URLs redirect to R2. JSON metadata URLs remain on the site.

D1 data keys, portrait paths and existing catalogue keys intentionally remain editable in their current format. The resolver maps those legacy strings at display time. An author's custom HTTP(S), data or blob image URLs pass through unchanged.

## R2 layout

```
audio/soundtrack/
audio/sfx/
audio/voice/
images/military/full/
images/military/thumbs/
images/monuments/full/
images/monuments/thumbs/
images/portraits/
images/vestigium/full/
images/vestigium/thumbs/
video/cinematic/
video/backgrounds/
video/trailers/
3d/models/
3d/textures/
3d/hdr/
3d/animations/
```

`assetUrl('images/portraits/example.webp')` or `media.model('ice.glb')` creates a public URL. New catalogue entries may use a logical path directly. Upload the binary to R2 first, then add only its metadata. For an old path, register the verified mapping and integrity record. Never add keys/tokens to source or ship the original file in `public/` again. Use distinct full/thumbnail records, not filename guessing. Prefer a new versioned object key when replacing artwork, so browser/CDN caches do not keep an older illustration.

## Loading budget

The main Atlas is hidden while the entry scene is active; its arrival artwork and highlights are not mounted. The map is still dynamically loaded only when prepared, and galleries retain their existing dynamic imports. The voyage's naval background is prefetched near the end of the text sequence. Hover/focus on a faction prefetches at most one background and two portraits; `preloadImages()` skips save-data/2G connections, deduplicates requests and limits each request to three images. No effect scans the whole media archive.

`R2Video.tsx` is ready for a future actual video: source attached near viewport, metadata/none preload, inline playback, muted autoplay, off-screen pause and image fallback. It is not mounted anywhere until a real cinematic asset is supplied, so it makes no current video downloads.

## Animation / 3D next

`app/motion.css` owns UI feedback, gallery entrances, content snapshots and reduced-motion handling. `CinematicEntry` retains the existing working stage controller and CSS compositor. No GSAP dependency is required for the current timeline.

The next visual upgrade can introduce a dynamically imported Three.js ice scene behind the existing DOM controls. Keep one renderer, capped pixel ratio, reduced quality after measured slow frames, visibility pause, resize handling and deterministic resource disposal. Reuse the existing fracture progress, snow intensity and stage events. Keep the CSS ice as the fallback. MapLibre remains the Atlas engine; do not replace it or render ordinary reader/account UI in WebGL. Models, textures and HDRs must use the central R2 resolver. Three.js and GSAP have not been installed speculatively during the media migration.

## Verification

Run `scripts/audit-r2-media.py` when migrating a local batch. It performs public HEAD requests and requires matching length and ETag/MD5 before recording SHA-256 and mapping; uncertain files stay local. Run the media tests, existing catalogue/reader checks, TypeScript and production build after metadata changes. Browser visual/audio QA requires the supported browser tool; it was unavailable during this migration.

The previous v120 publication was still reported as `publishing` during this audit, following a Sites internal error. The migration retains that source commit and publishes its changes as a new saved version; publication status must be checked independently from source/build success.

## Migration result

Verified and externalized **2,341 images / 171,500,724 bytes**. No R2 file failed the exact-match check. `public/` fell from 219,631,963 to 48,131,239 bytes before the final build. Group totals:

| Group | Files | Bytes |
|---|---:|---:|
| military | 1100 | 101546998 |
| monuments | 268 | 20582694 |
| vestigium | 901 | 33965092 |
| portraits | 72 | 15405940 |

All seven organized soundtrack URLs return 200 and match the source ETag; the first track also returns 206 for a byte-range request. Twenty-one media, catalogue, map, speech and reading-state tests pass. TypeScript, portrait integrity and 72-character dossier checks pass. The old `check-reader-engagement.mjs` integration script fails on its guest-comment assertion (expects 200, current unchanged route requires sign-in and returns 401); running its unmodified HEAD version reproduces that failure. No authentication or comment-route behavior was changed in this migration.

## Cinematic engine upgrade (v122)

Entry now lazy-loads Three.js/R3F with a procedural refractive ice seal, progressive GPU snow, deterministic fracture shards, a modeled ship deck, water shader, and cannon light flashes dispatched by the actual ten-second audio schedule. GSAP camera timelines and SplitText choreograph the opening; the question and title retain their combined ten seconds. Faction banners use metallic heater shields, GSAP Flip search rearrangement, and an Embla mobile rail. Faction arrivals derive lighting colors from their existing records.

Only one entry Three canvas is mounted; it disappears on entering the atlas/reader. Vault dossiers mount a separate procedural display ring/base only while open and unsealed, preserving the actual 2D artwork and all Royal Guard hierarchy. These procedural objects are not newly supplied GLB ship/artifact assets. Howler plays a generated short unseal cue, while existing Web Audio cannon scheduling and native soundtrack/narration remain intact. No additional binary media is bundled or assumed to exist on R2.

Entry caps DPR at 1.65, uses 360/1100/2200 particle tiers, lowers transmission sampling on slower devices, enables restrained postprocessing only at high quality, and stops frames while the document is hidden. Reduced-motion and failed-WebGL paths retain DOM/CSS controls. Desktop reader references now allow reading and reference browsing together; mobile retains a modal drawer. Paragraph position is anchored while the desktop pane opens/closes.

Validation: TypeScript, production build, and regression tests including bounded quality settings/deterministic staging. Browser visual/GPU QA is unavailable in this managed session because the supported control-browser capability is not installed. Actual mobile GPU performance and final appearance require device review; no universal 60 FPS claim is made.

### Interaction and cursor pass

Expanded shared CSS motion to input focus, active navigation, archive lists, reading theme changes, and progressively enhanced native details expansion. Vestigium, military, and monument dialogs retain their DOM during a 200 ms CSS exit before their normal close/history update. Reduced-motion and the existing motion-off preference bypass exits immediately; a bounded fallback handles missing animation events.

Native 32×32 SVG frost/bronze compass cursors provide default, actionable and ice-hold states. Hotspots are explicit. Fine-pointer/hover devices only; forced-colors retains platform pointers. Text fields keep the text cursor; the atlas keeps grab/grabbing and inline interactive map cursors. There is no hidden system pointer, follower loop, click trail or extra cursor library.

References: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/cursor and https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion .

## Opening readiness gate (v124)

Root visits now always show page I after a black TFAM crystal/compass splash; the old seen-intro preference no longer sends returning visitors to page II. Explicit internal “return to voyage” retains its destination, and existing reader/archive/map deep links retain direct access.

The splash is server-renderable, has its own lightweight native SVG mark and system-serif typography, and is also the route loading fallback. It waits for preferences, content fetch settlement (12-second abort with seed-data fallback), Spectral/Cinzel loading (bounded four seconds), GPU shader preparation via compileAsync plus three rendered frames, and a visible document. A 700 ms minimum avoids flashing the splash on cached loads. WebGL failure/timeouts select the existing CSS experience; a light-interface action appears after 6.5 seconds and can use existing seed data while the fetch completes.

The fracture clock starts only after the splash exits; intro clocks pause when the tab is hidden. The splash warms the opening scene, not the entire atlas or every R2 asset. No fake percentage or guaranteed frame-rate claim is used. The curved shield correction from saved v123 is included: native artwork and a thin SVG rim share a Bézier silhouette, replacing the mismatched polygon/padding frames.

## Cinematic pacing and transition handoff (v125)

Default splash hold is now 15 seconds (with an explicit Continue action once ready). The logo breathes subtly, then the still-mounted splash fades over 1.8 seconds while its emblem expands and dissolves. Fracture starts after this exit completes. The ready message distinguishes intentional pacing from actual preparation.

Scene transitions now cover the viewport over 650 ms before changing the 3D mode, retain outgoing DOM with stable scene keys, and reveal the next scene over 1.2 seconds using a GSAP timeline. Old competing layer/veil CSS animations are disabled. Text dwell clocks wait for the transition to finish. Globe reveal waits for the map-ready signal with a bounded 12-second escape path. Reduced-motion retains immediate stage changes.

Verification remains source/type/build/regression checks; supported browser/GPU visual QA is unavailable in this session. Durations are choreography targets, not a claim of measured device frame rate.

## Pointer depth and typography (v126)

Artwork surfaces now tilt in CSS perspective using delegated GSAP quickTo motion (up to seven degrees on cards, three on profile portraits), with a moving light spot and an 850 ms return. No per-pointer React render or permanent animation loop is used. Text and click targets stay still. Touch/coarse-pointer devices and reduced-motion preferences keep the normal interface. Only the currently hovered surface uses transform will-change.

Typography now resolves through two language tokens across entry, archive, faction screens and the standalone reader: EB Garamond for Vietnamese, Libre Caslon Text for English. Complete local variable fonts include regular/italic and explicit supported weight ranges; all font licenses ship beside the fonts. Old hardcoded heading families now refer to these tokens. Boot font preparation requests the new families. The English choice is a modern interpretation of the Caslon printing tradition, not a claim that a digital font file is an original historical type or handwriting face.

Sources: https://github.com/google/fonts/tree/main/ofl/ebgaramond and https://github.com/google/fonts/tree/main/ofl/librecaslontext . Validate Vietnamese coverage using both full font cmap tables. Browser QA was attempted via the managed preview, but the browser security gate blocked observation; no visual smoothness/frame-rate verification is claimed.
