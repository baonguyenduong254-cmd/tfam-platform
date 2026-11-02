# Update 201

Baseline: production version 200, source 285eb182080640f7bfac9dee281f5010959ad3c2. Preserve public access. Version 200 remains the production rollback reference.

## Implementation

- Opening art: public/art/atlas-opening-201.webp, generated with built-in ImageGen. CSS owns only background drift and gradual colour cycling; reduced motion disables both. Stable heading. No new animation dependencies.
- Persistent audio remains in the root layout. Autoplay attempt at mount, trusted interaction retry, persistent playback preference, volume and track. All cannon synthesis and cannon event listeners removed. Explicit map fullscreen replaces automatic page fullscreen. Native browser zoom preserved.
- Four faction groups, exact source names, purple Revolt slots without invented flags or lore. Shared discovery guard covers the map, archive hash routes and modal access. Reading routes remain independent.
- Faction dossier order: introduction, chronicle, static map, characters, units, traits. Full image fitting, regional insets from existing territory paths, Fit territory and fullscreen controls.
- Reading completion requires full chapter text, a complete chapter, end sentinel visibility and explicit Mark as read. Browser history remains account-scoped; the existing account API synchronizes visits/checkpoints. Position autosaves after scrolling settles and can be restored through Continue reading.
- Achievements derive from explicit milestone manifests and completed, published chapters. Existing explicit read statuses are retained; mere visits are not promoted. Arc I–III source-edition manifests use the complete chapter catalog from version 200. Later arcs and the two required national side stories are unavailable and cannot be completed from an empty/subset list.
- English content equivalence is explicit: current Book I covers Vietnamese chapters 1–24 and extra_1_12, not the entirety of Arc I (which continues through 32). Split English chapters must all be completed before their Vietnamese content unit is covered. No need to read the same unit in both languages. Coverage uses scene boundaries compared in the two checked-in editions, not equal chapter numbering. Future English books require a new reviewed coverage manifest.
- UI translators use English. Story editions remain independent. Quintessential and higher Vestigium text effects are retained.

## Available tools

Existing GSAP and React Three Fiber dependencies retained for existing effects. The opening uses CSS rather than overlapping animation libraries. Motion, Taste Skill, Impeccable and Awwwards MCP are not available in this session; none was installed solely to satisfy a checklist.

## Validation

TypeScript, production build and discovery/reading-state/position unit tests run in Linux cloud. Managed preview started and reported http://terminal.local:4173/, but the cloud browser returned ERR_CONNECTION_REFUSED and the HTTP probe timed out. Preview stopped. Browser interaction, audible playback, visual responsive/zoom, live authenticated sync and end-to-end direct-route behavior remain unverified; code guards and pure-state tests do not substitute for browser QA.

## Image prompt

Use case: historical-scene. Website cinematic entrance background for Through Frost and Myth. Wide landscape composition suitable for mobile center cropping. Distant early eighteenth century stone citadel and harbor in a frost-covered valley; restrained crimson banners, ivory snow, muted bronze architecture, soft fog, delicate snow, luminous overcast horizon. Elegant painterly semi-realism and restrained warm ivory, wine crimson, tarnished metal palette. Central upper half quiet and dark enough for cream title typography. No text, logos, watermark, firing firearms, modern buildings or specific canon symbols.

## Live verification follow-up

Production browser access succeeded after deployment. Verified: faction grouping and default locks, direct entry into Castilian, music player entered Playing after first interaction and remained playing across faction navigation, direct French archive URL displayed the lock condition. Live inspection found dossier section links intercepted by the global room router and weak arrival-title contrast. The follow-up excludes local dossier anchors from room navigation and adds a warm cinematic vignette with ivory text. Audible output, mobile/zoom and authenticated multi-device sync remain unverified.

The live reader check also confirmed the initial Mark as read control is disabled and automatic checkpoint persistence runs while scrolling. End detection now handles large page-scroll jumps that move past the sentinel as well as direct sentinel visibility.

Final live checks confirmed: Mark as read enables after reaching the chapter end, explicit completion survives reload, the map anchor settles at the map section, and the complete primary map plate fits its viewport frame. The two unavailable national side stories are ordered before Arc VI in the achievement roadmap.
