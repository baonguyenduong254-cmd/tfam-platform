'use client';
/** Crisp full-bleed backdrop image without continuous 60fps 2D particle/meteor canvas loops. */
export default function OpeningLivingScene({scene='opening'}:{scene?:'opening'|'court'}){
 return <div className={'opening-living-scene '+(scene==='court'?'court-living-scene':'')} aria-hidden="true">
  <picture key={scene}>
   <img src={scene==='court'?'/art/update210/realm-selection-hall.webp':'/art/moonfall-duel-209-6688.jpg'} alt="" fetchPriority="high" decoding="async"/>
  </picture>
 </div>;
}
