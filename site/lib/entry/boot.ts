export type BootReadiness={preferences:boolean;content:boolean;fonts:boolean;graphics:boolean;visible:boolean};
export function canStartOpening(state:BootReadiness){return Object.values(state).every(Boolean);}
/** The frozen plain leads to two welcome scenes; internal return opens the voyage. */
export function firstEntryScene(replay:boolean):'question'|'voyage'{return replay?'voyage':'question';}
export const BOOT_GRAPHICS_TIMEOUT=12000;

export const BOOT_HOLD_MS=800;
export const BOOT_EXIT_MS=1800;
export const SCENE_COVER_MS=650;
export const SCENE_REVEAL_MS=1200;
