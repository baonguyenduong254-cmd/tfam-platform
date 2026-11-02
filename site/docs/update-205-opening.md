# Opening correction after Update 201

Baseline: public Site version 204, source ad266bed507feb77ac06cdbed6510d5ada944503.

## User request and final direction

Restore the opening quote from version 200. Replace the generic citadel artwork with Evelyne versus Monodica Evelyne, Requiem Fortress, the Grand Chorus, stars and Moonfall. Redesign opening controls. Final steering: landscape 16:9, 4K delivery and epic environment scale; characters must be small within the world rather than close-up subjects.

## Grounding

Quote recovered from version 200 CinematicEntry: “Who are you in a world buried beneath snow, where history itself has been bent from its true course?”

Canon checked in the current Vol.V - TFAM - Editor Choice, Google Doc 1TzJrdgdMo15Q-GyEPBtqnGj6srOObIruPw827n9CUi4, read on 2026-11-02. The fortress is a layered stone/steel complex on Sahara rock with many bell towers, steam and copper/iron machinery. The Grand Chorus is its distributed resonant machinery, not a choir of singers. Monodica shares Evelyne's face and spectacles, has black hair streaked ash-silver, one grey-silver/amber eye and one wine-crimson eye, and black/ivory/crimson mechanical priestess vestments. Moonfall is a Zodiacum-created artificial celestial construct; the astronomical moon stays in its own orbit.

Visual references: existing approved Evelyne character artwork from art/castilian-redesign-20261028/evelyne_vesper.png; author-provided Monodica illustration titled “Monodica Evelyne: Nữ Tư Tế Cơ Giới Gothic.png”. The early close-character and portrait explorations were superseded by the final landscape instruction.

## Assets and animation

Built-in ImageGen created the final environment-led landscape master. The tool returned 1672×941 pixels despite the requested 3840×2160. Delivery files are explicitly upscaled using Lanczos export: public/art/evelyne-monodica-moonfall-205.webp is 3840×2160, and the responsive derivative is 1920×1080. These are not native-detail 4K generations.

The live background is an animated illustration, not a generated video: a lightweight Canvas 2D renderer applies local cloth movement and Moonfall illumination, star particles and travelling resonance among bell relays. No overlapping camera animation. Faces and architecture remain stable. A visible pause/play control persists the choice; reduced-motion uses the still poster. Animation stops when choosing factions, and skips hidden-tab rendering. Canvas failure falls back to the poster. Mobile retains the full landscape panorama, followed by the copy and controls, rather than cropping it into a character portrait.

The connected Runway workspace has no available video models. No paid generation, upgrade or purchase was performed. The requested scene was kept animated through site rendering.

## Buttons

Crimson/brass primary action, dark metallic secondary action, small descriptive overlines, circular icon medallions, double keyline borders, restrained hover shine, visible focus rings. Opening utilities and faction-card states use the same design language. Story/achievement behavior and access policy are preserved.

## Verification

TypeScript passed before packaging. The managed preview is blocked by an existing vinext dev process in /site; that other process was not killed. Production build and native deployment results are recorded through the Sites workflow; browser QA follows publication when available.

## Final image prompt

Generate a 4K UHD landscape illustration, exactly 3840×2160, 16:9. Epic environment-led establishing view from a high shattered stone gallery over the Requiem Fortress on Sahara rock: layered walls, enormous domes, steel bridges above mechanical chambers, copper conduits, more than thirty bronze bell towers connected by fine crimson resonance (the Grand Chorus). Vast star-filled sky merges with the open hall roof. A colossal silver cratered Zodiacum-created Moonfall construct bends orbital/constellation lines and levitates stone and iron; the real moon remains distant. Exactly two small adult figures on a cracked bridge in the lower right-middle third: Evelyne with long black hair, spectacles, black uniform, ivory/gold mantle and sabre; Monodica with the same face and spectacles, black/ash-silver hair, grey-silver/crimson heterochromia, full black/ivory/crimson mechanical priestess robes and paired brass halo. Each figure at most 15–20% of image height. No close-ups, fanservice, extra people, text, UI or watermark. Darker left band for HTML. Painterly anime semi-realism, overwhelming cosmic and architectural scale, silver/ivory versus wine-crimson, dark charcoal-plum and aged bronze.

Live review after version 205 exposed inherited column layout on the primary button, a daylight music-player override, and an unavailable WebGL surface. The follow-up explicitly sets horizontal action layout, dark-player contrast and a Canvas 2D renderer with DOM-backed readiness/frame-time markers for verification.
