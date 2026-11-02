# Atlas cities and Liv anime correction — 29 October 2026

- Liv was regenerated from the sister illustration as the sole style reference. The rejected intermediate that combined the old realistic Liv with the sister was not published. The final master is `art/castilian-redesign-20261028/liv-anime-v3.png`; the built-in Imagegen prompt/reference is retained in the adjacent provenance JSON.
- All territory hit paths receive their national color before selection. Selected and hovered territories have stronger contrast while retaining underlying terrain.
- The existing atlas and real named province towns supply the city catalogue. Additional reference towns cover the remaining regions; placeholder settlements are omitted. Geographic ownership is baked for 1715 and 1716, with existing province control and city overrides respected at runtime. Explicit coastal fallbacks cover small islands/coast points omitted by simplified polygons.
- National capitals display a flag and a city name. The selected country's additional towns are chosen with geographic spacing. Label layout uses actual element width, clamps labels inside the plate, and minimizes overlap while leader lines retain true map coordinates.
- Ottoman capital uses Bursa in 1715 and Baghdad in 1716, consistent with the existing year-specific atlas marker.
- Revision 30 changes Liv art while preserving revision-29 authored flags and dossier text.
- Validation: TypeScript and 41 tests passed. Production build reported `Build complete.`. Local preview reported ready but its browser route refused the connection; production browser QA follows publication.

Production QA of v177 confirmed all political fills, city markers and flag images. It exposed narrow capital-label widths and a coastal Copenhagen point outside the simplified country polygon. The final correction increases label width budgeting to include the flag, star, padding and text, and explicitly retains Copenhagen's existing national assignment. The regression suite now checks Copenhagen rather than a fallback Stockholm capital.
