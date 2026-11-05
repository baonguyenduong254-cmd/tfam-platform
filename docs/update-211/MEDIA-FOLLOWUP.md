# Castilian media and presentation punctuation follow-up

Inventory dated 2026-11-05, on the owner's authorized local home-device checkout. No image generation, raster editing, R2 writes, D1 writes, publication or Git commit was performed in this intake.

## Exact active roster

### Completed cutout integration

The parent completed all 30 original-scope cutouts and supplied `site/lib/character-artwork.ts` and `character-cutouts.json`, including full exports and 320-pixel alpha thumbnails. The shared helper now selects derivatives at the other actual image boundaries: CastilianCourt thumbnails, CharacterDossier bond thumbnails, FactionOverview people, FactionGallery people, QuickPreview characters and ReaderWorldContext character records. Faction flag selection, portrait-absent conditions, alt text, loading attributes and existing image fallback behavior are retained. No component layout changed. Stage integration remains owned by CharacterStage.

The helper checks both the actual character ID and selected source path before using a derivative. An author's later custom portrait at a different path remains selected, with its authored thumbnail fallback. A missing portrait does not fabricate a derivative. Jose and Dame Elizabeth reuse their completed assets under Habsburg-Polish through the same source-path check; no directory rename or original-image replacement is needed.

Validation: `character-artwork.test.mjs` passes 4/4, including matching full/thumbnail paths, custom authored URL preservation, missing portraits, all 30 original mappings and all 60 unique WebP exports with alpha metadata and 320px thumbnail widths. Available Sharp was resolved from the existing pnpm dependency tree and independently decoded alpha metadata for all 60 exports. TypeScript `--noEmit` passes. Existing display punctuation changes were preserved. These tests establish asset selection and stored metadata; the parent still owns final rendered browser acceptance.

### Owner correction: presentation revision 34

The owner subsequently moved Don Jose (`jose`) and Dame Elizabeth (`dame_elizabeth`) from Castilian to Habsburg-Polish (`habsburg_poland`). The v34 presentation migration updates primary membership, removes the Castilian affiliation and adds Habsburg-Polish while preserving other affiliations, portrait paths, biography, traits and canon links. Historical prose mentioning Castilian service is unchanged. Revision 34 and higher return unchanged, preserving later author edits; a revision 33 response receives only the new membership correction. D1 is not written.

The current derived Castilian roster is therefore **28 characters**. Overview representatives already filter with `belongsToFaction`, so they follow the correction without a parallel featured-character list. Habsburg-Polish retains its actual shared discovery gate, completion of Arc II; the relocation does not grant an unlock or alter character revelation policy. The two existing portrait/cutout assets remain reusable under Habsburg-Polish. Their physical `/portraits/castilian/` directory is provenance, not runtime faction ownership. The queue retains the original 30-asset extraction inventory and annotates these two as `activeCastilian:false` with their destination; do not retire or regenerate them because of the move.

Validation covers revision 33 inputs, only membership fields changing, input immutability, unchanged unrelated records/factions, v34 idempotence, later revision preservation, 28-member derived Castilian roster and the existing Habsburg Arc II gate. `check211-domain.cjs`, Castilian presentation tests, punctuation tests and TypeScript pass. The combined royal-theme suite has an unrelated existing Moor palette assertion mismatch (`#9bd3bc` actual versus `#8d1538` expected); palette implementation was not changed by this correction.

The following original inventory notes describe the pre-relocation 30-character extraction scope.

`CASTILIAN-MEDIA-QUEUE.json` contains the executable file inventory: actual character ID, selected input path, dimensions, checksum, existing cutout and required derivative filename. Selection was evaluated using `withCharacterPortraits(seed)`, including `withCastilianPresentation`, rather than inferring characters from directory filenames. The faction filter includes primary Castilian membership and authored Castilian affiliations.

There are 30 active characters and 30 unique selected portraits. Isabella and Edward have existing reviewed derivatives; 28 remain: 27 white plates and Lokoh's scenic plate. The earlier audit's three opaque tinted/scenic variants included the two inactive Liv portraits, so 32 files do not mean 32 active characters. `liv.webp` and `liv-v2.webp` are excluded. The actual Liv input is `liv-anime-v3.webp`. Timothy's actual character ID is `england_ruins_representative`, with input `timothy_beaumont.webp`; register the derivative against the ID, not the filename stem.

This establishes the bundled authored fallback roster. The live D1 content was not read. Later live custom portrait edits remain authoritative and must not be overwritten by a seed migration or a derivative selected solely from an old ID.

For extraction, preserve identity, pose, face, costume, silhouette and every visible hand, foot and accessory. Remove only background/floor/shadow. Lokoh also needs scene removal. Inspect the source individually before editing, then verify genuine alpha, dimensions and visible edges on light and dark backgrounds. Retain every original. Record tool, exact prompt, output checksum, native dimensions and fidelity limitations; an AI extraction may reinterpret detail. Do not claim a pending queue entry is complete.

`CharacterStage.tsx` owns the current ID-to-cutout map and original fallback. Parent integration must add approved outputs to that map, retain `fallbackSrc`, and consider comparing the selected portrait against the queue's original path before choosing a derivative so an author's later custom portrait is respected. Character cards and other portrait consumers need an intentional decision about whether to use the transparent stage derivative or retain the original plate.

## Landmarks

Six verified public R2 originals were downloaded read-only into ignored `site/.sites-runtime/media-followup/`. Ceuta, Gibraltar, Toledo, Santiago, El Escorial and Alhambra all return HTTP 200 `image/webp`, decode as RGB WebP and measure 960 × 640. The queue records full URLs and SHA-256 values. These are the current served full images, not thumbnails.

Crucially, retained `site/art/monuments/castilian-*.png` masters already measure 1536 × 1024. Their dimensions and hashes are also in the queue. Prefer those masters as enhancement references to preserve existing detail. If merely re-exporting a master resolves the blurred display, measure and review that improvement before introducing synthetic detail. A generated larger canvas is not proof of native UHD detail.

Madrid already has `site/public/artwork211/castilian-madrid-enhanced-v1.webp`, 1536 × 1024. Keep it and do not regenerate. The remaining six suggested output names are `site/public/artwork211/castilian-{ceuta,gibraltar,toledo,santiago,escorial,alhambra}-enhanced-v1.webp`.

Parent owns generation, export and display integration. Register all seven landmark enhancements through the existing monument presentation mechanism, preserving the original R2 path as a reversible fallback. Do not modify R2 or replace canon monument JSON merely to change presentation. Inspect both the dedicated full-size landmark and smaller collection render to catch thumbnail-only integration.

## Reader-facing em dashes

`site/lib/presentation-punctuation.ts` exports `presentationPunctuation(value, missing?)`. It changes U+2014 only at display time: paired punctuation becomes parentheses, a single internal break becomes a comma, punctuation next to an existing stop is collapsed, and an isolated missing-value mark becomes `Not recorded` by default. A localized missing-value label can be supplied. Leading dialogue markers are removed while the dialogue words and line boundaries remain. URLs, Markdown links and inline/fenced code are protected; hyphens, minus signs and U+2013 remain unchanged.

Do not pass normalized results to editor drafts, content save APIs, DB updates, downloads of author originals or seed records. Use the utility where text is rendered, including alt/aria labels, to preserve the author's source and reversible canon. Do not blindly traverse every string property: IDs, URLs, asset paths and serialized code are not prose.

Parent integration touchpoints:

- `app/page.tsx`: `Lore` paragraph text and `localized` text selector; inspect direct display fields bypassing those helpers.
- `app/components/StoryLibrary.tsx`: normalize `displayText` around line 61 and reader title/summary output. Preserve `draft`, editor textarea values, recovery data and the author's download output.
- `CharacterDossier.tsx` and `FactionOverview.tsx`: text-only `local` selectors and lore output.
- Other direct display selectors, collection names, tooltip text, accessible labels and dynamic live-content text: apply the same pure formatter at the final presentation boundary.
- Existing literal U+2014 occurs in `CinematicEntry.tsx`'s opening aria label and the missing-value displays in `WorldLedgerWidget.tsx`, `WeatherWidget.tsx`, `lib/faction-content.ts` and `lib/horizon-presentation.ts`. Replace those UI labels with ordinary punctuation or explicit localized missing text. Retain authored `lib/story/english-book1.json` intact; the reader formatter handles its prose.

### Implemented display integration

The formatter is now wired into the authorized text boundaries above: page `Lore` and `localized`; CharacterDossier scalar selectors, trait/skill entry copy and connection names; FactionOverview text/lore; MonumentShowcase text; MilitaryRoster scalar/trait copy; VestigiumCollection scalar copy; StoryLibrary reader text/title and chapter list titles; ChroniclesHub titles and recent names; ReaderWorldContext scalar copy and lore; FactionArrival name/quote. The opening aria label uses a comma. WeatherWidget and WorldLedgerWidget display explicit missing labels, and `factionCapital` formats its returned presentation string, including raw horizon placeholders. `CharacterDossier.local` retains array/object return values unchanged. No editor draft, save body, download payload, authored JSON or migration record was normalized.

Markdown headings and visible link labels are formatted while URL destinations and inline/fenced code remain exact. The authored English Book I JSON was used as a real prose regression fixture: every em dash in its string values disappears from the formatted result while the on-disk source bytes remain unchanged. A static TypeScript/TSX scan leaves only the deliberately retained raw `horizon-presentation.ts` migration placeholder; its display passes through `factionCapital` or a localized selector. This is source-level verification; the parent still owns the rendered browser acceptance check.

Validation: `node --test tests/presentation-punctuation.test.mjs` from `site/` passes 4/4, covering title punctuation, parenthetical asides, dialogue/newline boundaries, adjacent punctuation, missing labels, Markdown heading/link copy, protected tokens, unchanged non-em dashes, idempotence, actual authored prose without source mutation and the actual dossier selector preserving array/object identity. TypeScript `--noEmit` passed after these integrations; rerun after the final combined branch changes.

## Skill provenance

Read local `tfam-update-workflow`. `tfam-media-production` was absent locally and was read through the GitHub connector from `baonguyenduong254-cmd/tfam-platform`, `.agents/skills/tfam-media-production/SKILL.md`, main blob `e110cc7c8996c0bcc49c33f998810e00bd8d276c`. No provider skill or media generation tool was invoked by this intake.
