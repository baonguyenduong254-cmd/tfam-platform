# TFAM spatial scenes

Baseline: Sites 212 and the released source in ops/release-212.json. Scope: motion after the opening page, beginning with the existing faction and collection routes. Production publication is a separate action.

| Reference | Decision | Surface |
| --- | --- | --- |
| Impeccable Animate and Craft Floor | Separate arrival transforms from user-controlled angles. Preserve readable resting states and reduced motion. | Character cabinet, Vestigium cradle, book hinge |
| Taste Motion | Stage one authored focal motion and use bounded, decelerating movement with no pinned document scroll. | Faction banners and dossier art |
| [Motion](https://www.motionin.design/) | Use the continuity principle from Aperture and Boutique. Keep the selected banner tied to its destination. | Faction handoff |
| [Tactile UI](https://tactileui.dev/) | Use physical press, bevels, material edges and detents as references. | Plaques and viewing controls |
| [MOVO](https://movo.video/) | Video production reference for a later trailer. | No runtime role |
| [Overflow Design](https://www.overflow.design/mcp/) | Asset discovery reference. The prototype uses TFAM's existing icon system. | Controls |

CSS perspective supplies actual geometry for the plaque edges, book spine and Vestigium display furniture. Portrait and exhibit artwork remain two-dimensional assets. Castilian's regional chart stays in one view and the active city pin briefly seats into the map. The Reader prose has no moving stage.

The prototype uses original code, existing assets and existing dependencies. No paid source or asset was imported.

## Preview checks

Production build and TypeScript passed. Eight targeted artwork and scroll tests passed, along with the domain checks. In the Codex browser, the character stage switched angles and returned to its front state when motion was reduced. Vestigium changed angles by mouse and keyboard, and the ring animation was active in the open exhibit. The 390 px layout had no horizontal document overflow. The faction screen rendered all 28 plaques with four edges each, kept Moor gated by Arc IX, and opened Castilian. Chronicles mounted the hinge and spine, then completed the handoff into the chapter.

The rendered checks cover the named interactions. They do not establish performance on physical phones, complete reduced-motion coverage, or a production deployment.
