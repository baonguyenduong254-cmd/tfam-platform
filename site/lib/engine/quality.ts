export type Quality='low'|'medium'|'high';
export const qualitySettings={low:{dpr:1,particles:360,samples:2,transmissionResolution:64},medium:{dpr:1.35,particles:1100,samples:3,transmissionResolution:128},high:{dpr:1.65,particles:2200,samples:5,transmissionResolution:256}} as const;
/** Reproducible staging avoids hydration randomness and per-frame allocations. */
export function seeded(index:number){const x=Math.sin(index*127.1+311.7)*43758.5453;return x-Math.floor(x);}
export function clampProgress(value:number){return Math.max(0,Math.min(1,Number.isFinite(value)?value:0));}
