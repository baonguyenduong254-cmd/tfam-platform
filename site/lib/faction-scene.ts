import {assetUrl} from './media/asset-url';
import {factionArt} from './campaign-art';
/** Preserve explicit authored backdrops; otherwise use the established faction scene. */
export function sceneArt(faction:Record<string,any>){const asset=faction.backdrop_asset;return assetUrl(asset&&!/^\/campaign\/[^/]+-backdrop\.webp$/.test(asset)?asset:factionArt(faction.id));}
