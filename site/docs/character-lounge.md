# Character lounge

Replaces the wardrobe panel layout following the owner's approval of a character-led lobby. Publishing explicitly authorized in chat. Baseline Sites 219, source 6f8cc3a5ff55602bb9321c2914448c0302bdcd7b.

## Direction and applied references

Existing imperial palette and artwork remain. Impeccable is primary for interaction and motion; Taste supports dominant imagery and asymmetric composition. Focal content is one artwork in a scene, with restrained edge controls. Stats have no table container. Uniform/Afterwork use right-hand art; Office/Beach place the art left and identity right. Each has its own existing background. Mobile has a separate stacked composition.

Panel entry shifts the art to maintain visual continuity. Wardrobe and character selection close into the scene; history tracks selected character and skin. Repeat input replaces animation rather than queuing. Offscreen/hidden loops pause; reduced motion keeps short feedback. Full figure/close-up use authored crop scales. Art focus hides identity and navigation while retaining the exit control.

Profile, Abilities and Bonds reuse the spoiler-safe dossier. Characters are filtered by existing revelation and faction membership. No attributes, relationships or lore invented. Favorite stored browser-locally, not account synced. Skin artwork gaps remain explicit. No R2 or production DB mutations.

## Scope and asset boundary

No character assets copied from reference games. Uses existing supplied wardrobe images and existing four scene plates. The mesh-rig experiment is excluded from the release; its source was preserved outside this checkout and in local Git history. This release does not claim Live2D or a 3D character model.

## Checks

TypeScript, domain checks and framework build completed; final release build must match packaging inputs. Rendered checks at 1440x900 and390x844: scene layout, close-up, Wardrobe to Office, Abilities default tab, Bonds locked state, Escape and focus return, roster search and Meredith selection, favorite toggle. Local preview uses archive fallback because live content API is unavailable locally.

Independent source review identified focus-trap gaps and stale media errors. Fixed by selecting actual tabbables including summary and tracking failure by artwork source. No physical touch device or measured FPS certification.

Rollback: redeploy Sites219; no data rollback required for this code-only change.
