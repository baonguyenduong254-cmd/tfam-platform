# TFAM / Light Royal Faction Themes + Castilian Art Expansion
29 October 2026

## Requested and delivered scope
- Replace heavy navy page furniture with light, elegant royal surfaces across the website.
- 24 authored faction palettes, including paper/surface/wash, ink, accent and metal. The selection changes these tokens, persists across rooms and reloads and updates other open tabs through storage events.
- Palette owner is a persistent root component, independent of dossier mount and modal portals. Reader paper preferences remain controlled by the reader.
- Existing image-based banners are preserved. Arrival art is lit through a pale veil with dark title ink.
- Castilian dossier grows from 21 to 29 associated profiles. New: Nahla 44, Samira 55, Jesper 68, Barbossa 37, Leonardo Razen 100, Millennia, Remi, Dante. Juliet gets a newly generated portrait.
- Moor origins of Nahla/Samira retained, Castilian service expressed through affiliations. Household group is separate from appointments and from the two organisation branches. Barbossa retains historical guard service with disciplinary context.
- Presentation revision 32 applies the additions once, preserving existing Juliet prose and all later author saves.

## Sources and art
See canon-evidence.json for the Editor Choice III/IV/V IDs, revisions and exact source anchors. Portraits are decorative, living character dossier plates, not reenactments of their latest condition in the story. Details not fixed by the retrieved prose are design choices.

Nine built-in ImageGen portraits in public/portraits/castilian/royal32, each with a thumbnail. See art-manifest.json and art-prompts.md. Style reference is the existing Evelyne illustration. All figures fully clothed; children treated as children.

## Verification before first publish
- 14 relevant regression tests passed: palette coverage/uniqueness, WCAG 4.5:1 ink and accent contrast on all three surfaces for all 24 factions; roster affiliations and numbers; household classification; migration preservation/idempotence; all 18 WebP assets.
- All nine full portraits decoded and verified using Pillow.
- TypeScript noEmit passed.
- Local browser preview has repeatedly refused terminal.local in this environment; live browser QA follows publication.

## Live v184 QA and refinements
Verified 29 Castilian dossiers, Juliet's new art (1024 px source), no horizontal overflow, live faction changes to Moor (light green surfaces), Nahla's correct 44 dossier and new portrait, and selection persistence when visiting Chronicles and Vestigium. The live pass exposed pale old library heading text and old steel controls / Vestigium shelf surfaces. Updated these to the royal tokens. New reader default is cream paper; explicit saved dark remains intact. Gate palette persistence until initial faction routing has resolved, preventing a default Castilian flash from overwriting a restored faction. Relevant tests including reader preferences: 20/20 passed before final build.
