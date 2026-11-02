# Opening 208

- New ImageGen panorama from the supplied Evelyne/Monodica identity references: diagonal ghosted combat portraits, simplified fortress masses, Grand Chorus links and Moonfall. Original title and quote retained.
- Adobe adjustments: highlights -18, shadows +6, contrast -6, saturation -5; PNG export. Source 1672x941. Requested 7680x4320, but Adobe capped resize to 3344x1882 (2x). Production variants 1920x1081 and 3344x1882. Neither is native 8K. No claim of super-resolution.
- Removed the low-resolution Canvas redraw of the entire panorama. The image is now rendered directly with srcset; Canvas is transparent and contains stardust only. Removed 25fps rendering gate and automatic DPR cap. CSS owns slow camera drift and color cycle.
- Motion remains enabled by default on desktop and mobile. Opening/selection have explicit exit and entry through AnimatePresence. Existing user pause preference remains available; no OS-derived automatic suppression in the opening. Background work pauses only when the document is hidden.
- Mobile panel transition duration is 520ms. Buttons preserve hover/focus/press transitions. No browser zoom manipulation.

Validation: TypeScript and Impeccable source detector. Live browser checks recorded in completion message; mobile device and 8K monitor testing are not implied by source checks.
