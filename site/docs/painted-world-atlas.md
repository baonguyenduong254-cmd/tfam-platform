# World terrain painting trial (v66)

User rejected the regional view. TacticalMap, the mode switch, regional tiles,
river/route sources and city sprites have been removed from the runtime. One map
now shows a full-world Imagegen terrain painting beneath existing province
ownership, selection glow and faction banners. Year selection remains unchanged.

Source artwork: `art/world-painted-v1/terrain-painting.png`. The geographic
reference is an exact Mercator crop of the Mapzen/Tilezen-derived world relief
(83°N…60°S, rounded to integer rows in the 2048px reference). The original relief
fills the polar caps beyond the artwork. The full prompt is in provenance.json.
Generated mountains, forests, coasts and snow are illustrative, not survey data.
Interactive ownership uses the original province geometry independently of art.

Rebuild tiles using `python scripts/build-painted-world.py` (Pillow). There are
1365 256px WebPs at z0…5, loaded only as needed from the same origin. No DEM,
mesh terrain, cities or per-frame React movement work runs in the browser.
The frozen climate is TFAM art direction rather than historical reconstruction.

Verification: TypeScript, MapLibre style spec, complete global tile pyramid,
resource budget and removed regional UI/resources, production build. Browser
control is unavailable; no browser visual QA or FPS measurements claimed.

## Faction line contrast (v67)

`factionFrontiers()` cancels shared province edges with the same owner. It retains
coasts and borders to unclaimed land, and paints both owners' colors on shared
international borders using opposite line offsets. Province borders remain a
separate optional layer. The selected aura and outline now use frontier geometry,
so selection no longer lights up every internal province boundary.

Line pigments preserve each faction's primary hue with lifted brightness and
saturation. Flag rings, outposts and label underlines use the same pigment, and
retain it when selected. Dark line casing separates colors from snow and sea.
Faction selection uses IDs for all flags/outposts, rather than label matching.
Frontiers are calculated on ownership/data changes, never pan/zoom frames.

## v68 freeze mitigation

The original v67 raw shared-edge calculation allocated a large edge Map during
React rendering (~0.5 seconds in the local Node check, potentially worse on mobile).
The resulting ~190,000 independent segments also prevented useful polyline
simplification. Production Worker error logs did not identify a server exception;
this is a diagnosed blocking/allocation risk matching the reported freeze symptom.

`node scripts/build-faction-topology.mjs` now joins and simplifies shared edges
OFFLINE, emitting a static province-indexed topology. The client fetches this only
after the base map's load event, and only assigns owners/colors to prebuilt arcs
(6–7 ms in local Node checks). Joined polylines let the map simplify at low zoom.
A failed topology request leaves the base map and flags usable. Frontier updates
no longer resend the entire province source. This changes display geometry only;
territory ownership and interactive province hit testing remain unchanged.

## v69 national boundaries only

The province-border layer and its UI toggle are removed from the world map and
SVG fallback. Country frontier geometry supplies every visible political outline,
including the selected faction outline. Province ownership fills disable antialias
seams, and fallback polygon hover cannot reintroduce province strokes. Province
IDs remain internally for ownership/year changes and editing; no data is removed.

## v70 false province seams (screenshot regression)

The user screenshot proved the v69 frontier dataset still contained internal
province edges. Identical-endpoint matching was insufficient: adjacent Natural
Earth province paths are independently simplified, leaving different segmentation
and kilometre-scale slivers. Treating every unmatched piece as coastline was wrong.

The offline builder now uses Shapely STRtree neighbour lookup. A dissolved world
land mask distinguishes pieces with land on both sides from coastal edges; only
interior pieces use the wider rounding/simplification tolerance. Output follows
the original province coordinates; ownership and hit testing are unchanged.
Dependencies for this offline preprocessing: Python Shapely 2 and numpy. No new
runtime dependency or browser geometry work was added.

Versioned topology URL is now `faction-topology-v2.json`; v1 is removed. Regression
checks explicitly reject open coastlines on Navarra, Huesca, Lérida, Badajoz,
Cáceres, Salamanca and Zamora. An offline Iberia overlay was visually checked:
internal province grid removed, faction perimeter retained. This is geometry QA,
not a browser screenshot or on-device performance measurement.
