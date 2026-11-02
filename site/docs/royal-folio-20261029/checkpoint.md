# TFAM / Royal Folio — 29 October 2026

User rejected the v181 character UI as generic and lacking TFAM identity. This revision replaces the dark dashboard treatment with an illustrated archive folio: ivory paper, charcoal ink, cold slate cloth, restrained brass rules and red Castilian accents. Shared character UI and its archive header are in scope; military dossiers retain their previous layout. Existing character data, canon appointments and three attribute scores are unchanged.

## Changes
- Rebuilt stylesheet instead of layering a second skin over the earlier character commands.
- Portrait integrated into the paper with a numbered illustration plate and faction flag.
- Editorial name/role hierarchy, compact three-column aptitude seals, inked tabs, readable body copy and signature annotations.
- Dark register with a strong paper-colored selected state; native searchable/filterable compact picker on narrow screens.
- Court tree follows the same paper-and-ink vocabulary; narrow screens stack the two branches, retaining an explicit Crown root.
- New original background engraving generated with built-in ImageGen, exported as 309 KB WebP at public/art/interface/frozen-archive-engraving.webp.

## Image generation prompt
Use case: historical-scene. Asset type: subtle landscape background illustration for Through Frost and Myth royal character archive website, not a UI mockup. An original eighteenth-century Iberian royal citadel and coastal port gripped by a deep winter, distant domes and crenellated walls, galleons faintly visible on an icy bay, blowing snow, intricate copperplate etching and fine ink hatching on pale warm ivory cotton paper. Very restrained antique ink washes in cold blue slate. Wide panoramic composition, architecture clustered on far left and far right edges and lower third; large open nearly blank light ivory center and upper center for readable UI overlay. Atmospheric historical fantasy, severe and elegant, exceptionally fine engraved detail, no characters. Absolutely no text, no letters, no logos, no border or UI. Landscape 3:2.

## Verification
- TypeScript noEmit passed.
- Existing attributes and Castilian presentation regression suites: 10/10 passed.
- Local browser preview unavailable: CLI reports terminal.local:4173 running, browser connection refused. No infrastructure modifications; production browser QA follows publication.

## Live QA correction
The first live pass exposed the legacy .character-profile::before dark vignette and old Castilian portrait specificity. Removed the inherited vignette and strengthened all folio layout rules under .is-character-archive. Observed three meters, dark body ink and no document horizontal overflow.
