> Superseded UI: v66 removes Tactical mode and applies a world terrain painting. See `painted-world-atlas.md`. The relief pipeline below remains as geographic reference; its runtime city markers are no longer used.

# Frozen world atlas — 2D relief

The world terrain is baked offline from real Mapzen/Tilezen Terrarium elevations.
The runtime fetches same-origin WebP tiles only; it does not fetch the source DEM,
compute terrain lighting, create 3D meshes, or add SVG mountain/tree elements.

- Full Mercator world: 8192 × 8192 pixels, EPSG:3857.
- 256 px tiles, zoom 0–5; higher UI zooms reuse those tiles.
- Northwest relief light, soft valley shading and a frozen pigment palette.
- The world land mask uses the same `public/world.geojson` as the interactive atlas.
- Latitude/elevation snow is artistic TFAM climate, not a reconstruction of historical weather.
- Faction ownership remains a separate transparent province layer, keyed to 1715/1716.
- No dependency on an external terrain host while reading the published map.

## Reproduce

Python dependencies: numpy, scipy, Pillow. Run from the repository root:

```sh
python scripts/fetch-atlas-dem.py --dem-cache /path/to/dem-cache
python scripts/build-atlas-relief.py --dem-cache /path/to/dem-cache
```

Source downloads are cached outside the source repository. The generated WebP tiles and
manifest are committed under `public/map-art/frozen-relief-v1`. Routine site builds do
not run this data pipeline. Provenance and aggregate asset sizes are in `manifest.json`.

## Cities

`lib/atlas-cities.ts` contains a deliberately small selection of historic / TFAM cities,
not a modern population ranking. It ignores all placeholder cities in the provincial data.
At zoom <3.15, no city art is created. Secondary cities require zoom ≥4.15.
At most 7 city markers on small viewports and 12 on large viewports are allowed;
screen-space separation prevents overlapping vignettes. Candidate selection runs on
`moveend` / resize, never every animation frame. Markers outside the viewport are removed.

Eight small transparent WebP architectural vignettes share a fixed camera, lighting and
snow palette. They represent cultural architecture, not exact historical reconstructions.
Source art and brief: `art/atlas-city-sheet-v1.png`, `art/atlas-city-art-v1.json`.
City markers are clickable and keyboard reachable. Political ownership is queried from
the actual map province at the geographic coordinate, rather than assigned by modern country.

Data credits: `/legal#terrain`, Mapzen / Tilezen, AWS Open Data, and the contributing
agencies listed at https://github.com/tilezen/joerd/blob/master/docs/attribution.md .
