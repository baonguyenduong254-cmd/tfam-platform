# Stage asset audit — 2026-11-04

Scope: local source and image-byte audit for the post-211 stage correction, under the owner's confirmed home-device authorization in `PRODUCT.md`. No browser, release, D1 or R2 validation/writes were performed. No source artwork was edited or deleted. UI and motion acceptance belong to the separate browser QA record.

## Character derivatives

Both derivatives decode as WebP, sRGB, four 8-bit channels, **1024 × 1536** with genuine alpha. Sharp metadata/raw decoding and Pillow 13 independently agree on dimensions and alpha counts. This is their stored/native pixel grid; it does not establish new detail beyond the original or prove a particular generation engine's internal resolution. Both original source plates are retained and decode as RGB WebP at the same dimensions, with no alpha.

| File under `site/public/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `portraits/castilian/isabella_testarossa_de_aragon.webp` | 369134 | `fdff42f569f640f9d88e56601837a99c900fe11dd74119c831ca35f38ec42951` |
| `artwork211/isabella-cutout-v1.webp` | 442816 | `c86f44d8113c43d5b992a5befd5655e96eaa1e25de06eefd2413b2349722c0e1` |
| `portraits/castilian/edward_spencer.webp` | 282766 | `307aa72d4944e6b0f8328e8922519e256e721250b3f0ceb7a73c7eb9af7072b9` |
| `artwork211/edward-cutout-v1.webp` | 318504 | `b6aea4dad840449883311ffcc635cc6d95a52da4caedd4bcfc652cd638dcf9b7` |

Alpha histogram counts (each image has 1,572,864 pixels):

| Derivative | α = 0 | α 1–15 | α 16–239 | α 240–254 | α = 255 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Isabella | 583282 | 40070 | 30473 | 919039 | 0 |
| Edward | 795441 | 21443 | 13132 | 742848 | 0 |

The images have real transparent background regions and soft edge samples; they are not opaque white rectangles disguised by CSS. Their interiors are near opaque, predominantly α253, rather than exactly opaque: Isabella has 777553 pixels at α253; Edward has 628637. Maximum alpha is 254 in both. This small global transparency should be assessed in the actual faction scene; this audit does not silently normalize it. Nonzero RGB stored beneath α0 is invisible in correct compositing and is not by itself a visible background or halo.

At `(0,768)`, `(20,400)`, `(1023,300)` and `(100,200)`, alpha is exactly 0 in both derivatives. At `(512,10)`, Isabella is α0 but Edward is α3 near his top hair; therefore the five Isabella samples in `STAGE-MEDIA.json` must not be claimed as five exactly transparent Edward samples. All four corners are α0 in both. Nonzero-alpha bounds, with exclusive right/bottom, are Isabella `[0,0,1024,1512]` and Edward `[25,0,990,1524]`; faint edge pixels extend higher than the clearly visible silhouette.

Visual inspection used the four individual original/derivative files with `view_image`. Isabella retains the recognizable face, leftward gaze, hand by chin, long brown hair, white/burgundy imperial coat, crown, black trousers and both boots. Her cloak already meets the left/right source boundaries; the derivative preserves that composition rather than restoring material beyond the source canvas. Edward retains the recognizable face, brown hair, navy/black-and-gold uniform, pale cloak lining, hat, sword, stance and both boots. Neither derivative introduces an obvious new full-body crop. The white floor and cast shadow are removed.

These are **synthetic extractions**, not pixel-exact masks. Fine hair strands, gold ornaments, fabric patterning and facial linework show sharpening/reinterpretation compared with the originals. The identity, major pose and costume are visually consistent at illustration level; exact unchanged face/clothing detail cannot be certified. Further fidelity approval and visible edge/halo judgment at display size remain part of owner/browser review. Exact extraction prompts remain preserved in `STAGE-MEDIA.json`.

## Source mapping and fallback

`site/app/components/CharacterStage.tsx` keys the derivatives by the actual data IDs `isabella_testarossa_de_aragon` and `edward_spencer`. The same IDs and original portrait paths occur in `site/lib/castilian-profiles-20261028.json`, applied by `withCastilianPresentation`. The derivative is selected only when a portrait exists; other IDs continue to use `character.portrait_asset` and receive `has-original`. This is two mapped derivatives, not a roster-wide extraction.

`MediaImage` receives `fallbackSrc={character.portrait_asset}`. On the derivative's image error it changes to the original resolved portrait; the originals are still present with the hashes above. The relevant derivative and original paths have no overrides in `site/lib/media/external-paths.json`. This establishes the source-level fallback path, not a browser-tested load-failure result. D1 content has not been read or changed, so later live author edits are outside this local data check.

## Remaining Castilian source plates

The recursive inventory of `site/public/portraits/castilian/` contains **32 non-thumbnail WebP source files**, including older Liv variants. All 32 are fully opaque. Of these, 29 have near-white corner/background regions; Isabella and Edward now have separate stage derivatives, leaving **27 other white source plates without a CharacterStage cutout mapping**:

- Root directory: `astrid`, `cassandra`, `dame_elizabeth`, `evelyne_vesper`, `franco`, `fredo`, `freya`, `jose`, `liv-anime-v3`, `marco_stones`, `martinez`, `raine`, `romeo_harkon`, `scarlet`, `sigrid`, `testarossa_uno`, `timothy_beaumont`, `victoria_valdes`.
- `royal32/`: `barbossa`, `dante_stones`, `jesper`, `juliet_spencer`, `leonardo_razen`, `millennia_stones`, `nahla_al_fassi`, `remi_spencer`, `samira_al_fassi`.

The other three opaque source files are `liv.webp`, `liv-v2.webp` and `royal33/lokoh.webp`, whose backgrounds are tinted/scenic rather than white. `liv-anime-v3.webp` was visually checked as a white plate; `royal33/lokoh.webp` was visually checked as an authored scene. Near-white classification for the rest is measured (four opaque near-white corners and extensive RGB ≥245 pixels), not a fresh detailed visual review of every illustration. Nonstandard dimensions remain in several sources: Evelyne/Romeo/Victoria 1122 × 1402; Freya/Marco/Scarlet 1086 × 1448; older `liv.webp` 1254 × 1254. No resolution repair is claimed. Thumbnails and dormant variants were not retired.

Each additional staged character needs an individually reviewed extraction if genuine alpha layering is desired. Retain original plates until that work is authorized and reviewed; CSS blend modes or geometric masks do not constitute extraction.

## Library and Vestigium truthfulness

The Library uses existing scenic artwork `/art/evelyne-monodica-moonfall-205-1920.webp` plus live HTML lettering in `ChroniclesHub.tsx`. The inspected image is a landscape moon/city scene with no baked book title. It is **a UI cover composition, not an author-supplied publication jacket**. The file is RGB WebP, 1920 × 1080, 741174 bytes, SHA-256 `617a9a4e83cd96e45849908842301a6dc9ab3b3d1439b56898ca63bbc6bfc6d9`. Existing provenance in `site/docs/update-205-opening.md` records an original 1672 × 941 generation and an upscaled responsive export; the 1920 file must not be represented as native UHD artwork.

Vestigium remains existing **2D artwork** staged with geometry, light and finite motion. No 3D model asset, additional view or rotatable object was created or verified in this audit. A CSS dimensional presentation must not be described as a newly supplied 3D original. Inventory-wide Vestigium alpha/fidelity and runtime behavior are outside this audit.

Outstanding assets: the 27 other white plates above; deliberate handling of the three opaque tinted/scenic variants if surfaced in the same character stage; owner-level fine-detail approval of the two synthetic derivatives; an actual publication jacket only if the author later supplies/approves one. Nothing in this report claims these outstanding assets are fixed.
