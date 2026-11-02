# Vestigium image refresh checkpoint

Live site remains v170, with the game and intro removed. R2 cleanup has not been performed. Cloudflare Dashboard remains on its loading screen after one reload; authentication status is unknown. No account credentials were read or stored.

## Audit

All 450 images now downloaded and decoded successfully; all 450 SHA256 values match the site manifest. 74 are below 512px, 340 are 512px, and 36 are at least 1024px.

Audited the 450 full-size object keys in the site's R2 manifest, excluding thumbnails. Downloaded bytes are compared against manifest SHA256 values. Rows with failed downloads/decoding remain explicitly marked as errors rather than treated as low resolution. Dimensions and provenance are in r2-audit.json.

Priority bands: below 512 px on the longest edge is very-small; 512–1023 is standard-512 and still limited for large/retina presentation; 1024+ is large-1024. This is a resolution audit, not a claim that every artwork has passed a visual/canon review.

## Prepared replacements

Four new transparent 1254×1254 masters plus lossless full WebP and 300px thumbnails are under art/vestigium-refresh-20261028. None have been uploaded or made live.

- Fuego Negro: Vol II Editor Choice, chapter 41, tab t.nkced193dq6n. Depict a steel artillery shell with two-layer red-black incendiary, preserving the distinction from a free-floating magical orb. Forging details are artistic interpretation.
- Bala de Fuego: Vol I Editor Choice, chapter 29, tab t.43a8mpvqyjnw. Depict steel ordnance delivering adhering incendiary. No recipe, cutaway or operational diagram added.
- Oncebearing Gauntlet: Collection record armament-collection-6-06; white gauntlet with a black crack. This is Collection expansion, not novel canon.
- The Empty Place: Collection record armament-collection-7-02; silver shield with a literal human-shaped empty opening. This is Collection expansion, not novel canon.

Method: built-in ImageGen, one generation per asset, transparent background; image subject/material briefs above. Final master dimensions were measured, not assumed from requested output size. PNGs are copied unchanged; WebP conversions retain alpha. Existing site image references and manifest entries remain unchanged until R2 upload verification.

## Remaining

Visually review other low-resolution entries and their current source records, regenerate remaining approved candidates, authenticate R2, upload and verify new objects before changing site references, and delete only confirmed game/intro objects. Never delete the entire media bucket, which also serves the Atlas and archives.

## Batch 2: five Collection assets regenerated

- Sen Hạt Thứ Không (`botanical-the-unnumbered-lotus`)
- Cây Thư Không Mực (`botanical-the-inkless-letter-tree`)
- Địa Y Đường Chân Trời (`botanical-horizon-lichen`)
- La bàn người trở về (`device-044`)
- Hộp nhạc giữ tang (`device-045`)

Five new RGBA masters (four 1254×1254; compass 1312×1199), lossless WebP full images and 300px thumbnails. All decoded and alpha checked. Prompts retained in batch-2-prompts.json. Visual review checked defining shapes and materials. Total prepared: 9 images; 65 of the original 74 below-512px objects remain. R2 authentication remains unresolved; these images have not been uploaded or activated on the live site. Existing live references and manifest hashes unchanged.

## Completed: all 74 priority replacements

65 remaining images regenerated. All 74 sets decoded and verified, 376 larger originals visually triaged and retained. See FINAL-CHECKPOINT.md and art catalog. R2 and live site unchanged.
