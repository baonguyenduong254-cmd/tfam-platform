# Character command folio — 29 October 2026

## Delivery scope
Character dossiers are redesigned across the atlas. The military dossier is unchanged. Castilian has an interactive court tree, collapsed by default to keep the character portrait and aptitude panel immediately accessible.

## Three TFAM attributes
- **Chiến lực / Battlecraft**: practical action in battle, endurance, reflexes, technique, weapons and Vestigium.
- **Trí lược / Insight**: observation, specialist knowledge, judgement and problem-solving.
- **Uy thế / Presence**: trust, persuasion, leadership and bringing others together.

Scores are editorial assessments from existing dossiers on a common 0–100 scale. An attribute at 80 or above is an affinity. All 86 existing dossiers have one, two or three affinities. The scheme is separate from guard numbers and contains no derived damage or hidden game mechanics. Each bar opens its definition and assessment note. Future unassessed characters display a pending state; valid author-supplied `profile_attributes` take precedence.

Examples: Liv 56/87/54; Evelyne 93/99/68; Edward 88/98/92. The canonical biographies and skill text remain available in the new tabs.

## Castilian court
The Crown (Isabella) leads two broad display branches: Royal Guard and Royal Officials. Guard members retain concurrent offices on their cards: Victoria remains Siete and governor; Marco remains Ocho and army commander. The officials branch encompasses existing civil, counsel and officer dossiers. José's foreign diplomatic affiliation is displayed separately, outside the Crown's reporting tree. The design adds no ministries, new legal powers or numeric reporting hierarchy.

## Interface
- Left: searchable register, affinity filter, small three-color aptitude indicators.
- Centre: large existing character illustration and original faction affiliation.
- Right: identity, three expandable attribute meters, keyboard-accessible biography/traits/abilities tabs.
- Smaller layouts: compact register and native character picker; the portrait and reading panel stack.
- Tree members open their existing dossiers directly.

## References and grounding
- Total War: Three Kingdoms character panel: https://totalwar.fandom.com/wiki/Characters_%28Total_War%3A_Three_Kingdoms%29
- Official manual (characters, court and attributes): https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/779340/manuals/TW3K_PC_MAN_UK.pdf?t=1699976365
- TFAM: existing curated Castilian dossiers and their source register, plus current Vol IV Editor Choice paragraphs recorded in `canon-evidence.json`. The current text distinguishes guard number, responsibility and military appointment; the proposed representative council remains a transition proposal.

## Verification
45 regression tests passed and TypeScript passed. The complete production build reported `Build complete.`. Portable build now awaits Vite's builder API with a bounded live watchdog, preventing native bundler work from ending the process during chunk rendering. Local preview reported ready but its browser route refused the connection; live browser QA follows publication.

Live QA of v179 verified the three attribute values, content tabs, and the 14-guard / 4-official branches with José outside the reporting tree. It also exposed legacy character-profile padding overriding the new layout; the final CSS increases selector specificity so the new portrait/detail grid owns its spacing and subdued backdrop.

Live interaction checks passed: opening Victoria from the tree gives 72/96/91, End/Home changes the active detail tab, searching Liv under the Battlecraft filter correctly reports no matches, and Moor profiles display the same three-attribute interface. Faction changes reset search and affinity filters. The final spacing fix is ready for release.

## Investiture continuity correction
A direct read of the current Arc III investiture confirms Timothy's acceptance of Nueve and Juliet's civil Lady Protector honour. Presentation revision 31 restores Timothy's guard number 9 and adds Juliet's Castilian affiliation without changing either character's English origin, existing portraits or biography text. The associated Castilian register therefore contains 21 people: the Crown, 15 guards, 4 royal officials/honours, and one separate foreign diplomatic affiliation. The display tree summarises roles across arcs; appointment timing is recorded on the relevant cards. The ceremony anchors and document revision are saved in `investiture-canon.json`.
