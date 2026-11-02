# Vestigium illustration direction

Each category JSON contains the exact per-exhibit prompt brief in `art.description`. Production uses the built-in image generator, one distinct asset per exhibit. These briefs are stripped from public data.

Objects: tactile dimensional museum specimen, antique craftsmanship, natural material colours, full subject centred square with margin, true transparent background. No labels, UI, pedestal, floor, people or unrelated props. Rarity is conveyed by interface name colour.

Creatures and entities: dimensional painterly natural-history or supernatural individual, clear coherent silhouette. Any human figure fully clothed. Phenomena may have an atmospheric scene. Canon appearance takes priority; undocumented details are artistic interpretation. Royal Guard pendants: simple lion face bearing its number, no gemstone/crown/elaborate surround.

Web exports: `public/vestigium/art/<id>.webp` at up to512px, quality64; `public/vestigium/thumbs/<id>.webp` at up to240px, quality60. Preserve generated alpha. Masters remain separate from web exports; progress files record completed assets. Resume by checking actual per-ID files, never regenerate completed assets merely to rerun a batch.

Rebuild public data with `node scripts/build-vestigium.mjs`. Verify complete illustration coverage with `node scripts/check-vestigium.mjs --require-art`. Source anchor audit optionally accepts `--sources-dir <directory containing vol-1.txt through vol-4.txt>`.


## Quyết định tác giả, 19/10/2026, lượt tinh giản

Mọi nhóm, gồm Sinh vật và Thực thể, dùng hình cắt nền trong suốt. Chỉ Hiện tượng được giữ cảnh nền. Giữ hình dáng và màu của chủ thể, bỏ phong cảnh, sàn, trời và khung ảnh. Ảnh tách nền mới tối đa 1024 px, thumbnail tối đa 300 px; không ép xuống 200–300 px để đạt ngân sách byte cố định.
