## verdict

This is a scoring pass for the four material fixes in FINISH-REVIEW.md, not a new whole-surface or release review. Reopened the same character-{390,768,1440,1920}.jpg and inspect-{390,768,1440,1920}.jpg paths, plus landmark-1440.png. All nine recaptures are valid evidence for the named states; old inspect PNG alternatives were excluded.

1. **Resolved — compact Characters composition.** At 768px, selected identity now starts around y410 and the portrait around y453, versus approximately y778 for the former portrait start. A meaningful full-figure image now occupies the first viewport. At 390px, selected identity begins around y387 and art around y456. The duplicate register headings are removed; the organization wrapper no longer precedes the closed mobile/tablet roster. Desktop retains one register heading and its three-area composition. Faction selection remains visible; the five destinations remain in the navigation, which uses horizontal overflow at narrow widths. Evidence: all four overwritten character JPGs and the narrow-navigation rules in world-211.css. The stills do not establish drawer keyboard or navigation behavior.
2. **Resolved — exposed epigraph formatting.** All four overwritten inspect JPGs show the quote without literal asterisks, preserving the sentence and italic treatment. VestigiumCollection.tsx now routes the selected localized epigraph through exhibitEpigraph rather than rendering the stored value directly. The observed English rendering is clean; this score does not certify a full bilingual content audit.
3. **Resolved — category/status eyebrows.** All four inspect JPGs put the record title before “Minerals.” landmark-1440.png puts “Royal Palace of Madrid” before “Sovereignty · Operational,” retaining the metadata and subtitle. The original above-heading treatments are removed without losing the facts.
4. **Resolved — durable product/design and evidence records.** PRODUCT.md now records product purpose, navigation, canon/spoiler rules, data ownership and release boundaries. DESIGN.md contains named actual tokens and typography, and .impeccable/design.json exists with schemaVersion 2 and corresponding token data. INVENTORY.md and SKILL-APPLICATION.md now contain implementation ownership, actual checks, capture references and explicit limitations. Earlier preparation paragraphs remain historical context rather than the only account of the work. This score verifies the requested documentation is concrete; it does not independently rerun the checks those files report.

No material regression introduced by this fix batch is visible in the supplied recaptures.

## remaining

Clear for these four scored fixes. Ship applies only to this fix list. Wider runtime QA, outstanding cold-interaction/performance hardening, motion quality, physical touch/Safari/mobile GPU behavior and release approval remain outside this verdict. The supplied local build and load measurements do not establish a 60FPS or whole-release performance pass.

disposition: ship
