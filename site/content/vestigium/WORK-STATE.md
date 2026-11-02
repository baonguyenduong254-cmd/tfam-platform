# Latest checkpoint: written dossiers complete, 19 October 2026

453 retained records now contain Vietnamese and English lore. Completed 85 blank profiles, refined 12 utility origins, revealed 17 populated canonical profiles previously hidden by visual status, and corrected Robert from the live Extra 1 manuscript. Absolución follows live Chapter 140. No additional images or records were created. Full bounded changes and evidence: content/vestigium/editorial/lore-20261019/. Run scripts/check-vestigium-lore-20261019.py for the current prose invariants. Historical counts and the old deferred-Guard-prose note below are superseded.

# Current checkpoint: collection completion, 19 October 2026

602 unique dossiers have artwork and thumbnails. All 100 Guard numbers have approved named visual dossiers. Royal Guard prose remains deferred. The following notes are historical checkpoints and their missing-art counts are superseded.

The current UI pass fixes accent-insensitive Vietnamese search, filtered pagination, Academy filtering, visible complex constituents and uses, missing dossier recovery, image retries and shared thumbnail resolution. No lore or item mechanics were edited. Browser GUI QA is unavailable in this environment; TypeScript, build and offline data/image checks are used.

# Vestigium Collection checkpoint — 18 October 2026

The author requested continuous work until completion or quota exhaustion. Imagegen returned HTTP 429 `usage_limit_reached` (Plus, 1,440-minute window), with reset at 07:10 on 19 October 2026 in Vietnam. All generation workers stopped. Completed exports and progress logs are preserved. Do not switch providers or use the CLI without explicit authorization.

## Inventory and canon

There are 520 bilingual records, 340 artwork/thumbnail pairs, 180 missing images and one required replacement: `device-065` (Cuatro). `illustration-status.json` contains the exact missing IDs. Every available pair passes decoding, transparency and 512/240 dimension checks. Never regenerate valid existing art merely to resume a batch. PNG masters remain separate; progress logs retain known mappings. Some mineral/material master mappings are unknown; the originals remain untouched.

Royal Guard pendants numbered 1–100 are Wondrous: a simple lion face bearing its number. Their creations randomly rank from Wondrous to Unique. Probabilities, creation counts and reroll mechanics remain unspecified. Uno's record and image are updated. Cuatro's record is updated, but its old ornate image still requires replacement. Testarossa's entity rank is separate. No Google Docs manuscript edits were made.

One original Legendary device was added to fill the slot left when Uno moved from Legendary to Wondrous, maintaining at least eight records per tier.

## Implementation and verification

The website has a fourth main navigation entry, eight category tabs, ascending rarity shelves, coloured names, bilingual dossiers, rank jumps, keyboard navigation, a native dialog, previous/next controls and deep links. Repeated property descriptions are displayed once. Main navigation specificity is corrected. Only the active category's cards render; fixed image areas and lazy image loading preserve stable rank navigation.

Browser GUI QA was unavailable under the Sites skill. TypeScript, production builds and data/image checks passed. Existing military data validation also passed.

Collection was published as author-approved partial GPT version 75 on 18 October 2026. All 520 dossiers are readable; 340 have illustrations and 180 use category-specific archive placeholders. Do not change Cloudflare or create another Site. Project: `appgprj_6abf3718495481919a2cd6954776f57e`. Public URL: https://throughfrostandmyth.baonguyenduong254.chatgpt.site .

## Resume

Generate only the missing IDs and the Cuatro replacement, using each record's `art.description`. Parse the last actual whitespace-free `/workspace/...png` token in imagegen's output hint. Botanical exports were repaired after an overly greedy path expression. Poll `exec_command` sessions to completion; undefined `exit_code` during a running process is not failure. Export art and thumbnails atomically, then checkpoint complete pairs.

Run:

- `node scripts/build-vestigium.mjs`
- `node scripts/check-vestigium.mjs --require-art` when all images are complete
- `python scripts/check-vestigium-art.py --require-all` when all images are complete
- `node node_modules/typescript/bin/tsc --noEmit`
- The Sites build helper

The initial manuscript audit verified 39 anchors for 25 canonical records. Those local manuscript snapshots were subsequently pruned. Without the snapshots, the data check verifies provenance structure rather than freshly reading manuscript text.

## Asset budget and publishing

Existing military WebP images were already compressed once to quality 76 at their original dimensions and alpha, saving about 21 MiB. Do not blindly recompress them again. New artwork uses up to 512 px at quality 64; thumbnails use up to 240 px at quality 60. Exact prompts and the shared direction remain in category JSON and `ART-DIRECTION.md`. Private anchors and art briefs are excluded from public JSON.

The current checkout is `/workspace/sites/tfam-lore-pass`, restored from pushed GPT version 75. Earlier checkout paths may have been pruned. Use the Sites source helper in the current checkout for final build, commit, push and packaging. A helper run directly against active image writers failed with “source changed while committing”; copy complete art/thumbnail pairs into an isolated snapshot first.

The author approved publishing partial illustrations. Preserve all completed art and placeholders while updating lore/layout. Full illustration completion is not a publishing prerequisite for this approved partial release. Continue only the missing images and Cuatro replacement when image quota permits.

## Lore and layout pass, 18 October 2026

Reviewed all 520 current website records. Individually revised 495 collection-original dossiers in Vietnamese and English, including full rewrites of 127 original Mythic/Unique lore entries. The 25 manuscript-derived records are retained exactly; this pass does not assert a fresh manuscript audit. Item IDs, categories, rarity, source anchors, names, artwork references, uses, skills, traits, behaviour, limits and owners remain unchanged. New narrative provenance for collection-original items is expansion material, not an assertion that these objects occur in published chapters. Local traditions/testimonies remain qualified in the prose.

Removed repeated specimen boilerplate and verbatim copies of use/limits/behaviour from lore, leaving those sections accessible separately. `editorial/lore-review-2026-10-18.json` records every reviewed ID and the source-field invariants.

UI changes reserve a non-shrinking clipped image stage on shelf cards and an explicit minmax(0,1fr) art row above the rarity caption in the dossier. Tier 3–6 each have distinct animated gradient text, tier 7 has seven rainbow hues. Reduced-motion and forced-colour fallbacks are included. No new images generated or Cloudflare deployment performed in this pass.


## Latest checkpoint: 19 October 2026, curated cull and transparent creatures/entities

Current checkout: /workspace/sites/tfam-resume. 602 records reduced to 453, removing 149 of 495 outside the Royal Guard theme (30.10%). All 39 canon-tagged dossiers and 107 Guard records preserved exactly at source level. No manuscript edits or fresh manuscript verification were performed. Frozen before-data, selected IDs, reproducible seeded selection, report, and restored-source safeguards: editorial/pruning-20261019/. Removed art is archived outside public.

All 26 retained scene illustrations outside Phenomena were edited using built-in imagegen, exported with true alpha at up to 1024 px and 300 px thumbnails, and visually reviewed on the site color. Only Phenomena may retain backgrounds. Five Guard summoned entities/swarms had their artwork cut out without changing their dossiers. Guard artwork uses guard-v9 aliases: always resolve published artwork/thumbnail paths, never infer paths from dossier IDs. New helper scripts/export-vestigium-cutout.py uses a lock and checkpoints completed pairs. Do not re-run legacy byte-budget shrinking scripts.

The generic artwork checker now validates all non-Phenomena categories. Manifest cache version includes actual artwork hashes; gallery images use that version to refresh changed images. Empty rarity tiers are hidden. Data checks, full Guard number coverage, unchanged retained-record check, TypeScript and 9 existing tests passed. Browser QA was unavailable. No Cloudflare deployment or R2 migration was performed.
