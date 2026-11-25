'use client';
/** Pure CSS faction-tinted atmosphere plane — replaces continuous WebGL FBM shader loop. */
export default function OverviewAtmosphere({factionId}:{factionId:string}){
 return <div className="empire-glsl-atmosphere overview-atmosphere-css" data-faction={factionId} aria-hidden="true"/>;
}
