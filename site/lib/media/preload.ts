import {assetUrl} from './asset-url';
const loaded=new Map<string,Promise<void>>();
/** Small, explicit next-destination budget; never walk an entire collection. */
export function preloadImages(paths:(string|undefined)[],limit=3){
 if(typeof window==='undefined')return;
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 if(connection?.saveData||connection?.effectiveType==='2g')return;
 for(const path of [...new Set(paths.filter((p):p is string=>!!p))].slice(0,Math.min(3,limit))){
  const url=assetUrl(path);if(loaded.has(url))continue;
  if(loaded.size>=24)loaded.delete(loaded.keys().next().value!);
  loaded.set(url,new Promise<void>(resolve=>{const image=new Image();image.decoding='async';image.onload=()=>resolve();image.onerror=()=>{loaded.delete(url);resolve();};image.src=url;}));
 }
}
