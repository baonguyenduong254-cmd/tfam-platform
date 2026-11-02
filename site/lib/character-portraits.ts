import retiredPortraits from './retired-portraits.json';
import profiles from './castilian-profiles-20261028.json';
import expansion from './castilian-expansion-20261029.json';
import lokoh from './castilian-lokoh-20261029.json';
import {withCastilianPresentation} from './castilian-presentation';
import {withHorizonPresentation} from './horizon-presentation';
const retired=new Set<string>(retiredPortraits);
const anime=new Map<string,Record<string,any>>([...profiles,...expansion,lokoh].map(p=>[p.id,p]));
function isRetired(value:unknown){if(typeof value!=='string')return false;let path=value.split(/[?#]/)[0];try{if(/^https?:/.test(path)){const u=new URL(path);if(u.hostname==='pub-a2e7030237c14362985465386fcae671.r2.dev')path=u.pathname.replace(/^\/images\/portraits\//,'/portraits/');else path=u.pathname;}}catch{}return retired.has(path.startsWith('/')?path:'/'+path);}
/** Retire only the exact 72 oil portraits; keep custom images and authored anime. */
export function withCharacterPortraits<T extends {characters?:Array<Record<string,any>>;factions?:Array<Record<string,any>>}>(data:T):T{
 const prepared=withHorizonPresentation(withCastilianPresentation(data));
 return {...prepared,characters:prepared.characters?.map(character=>{
  const next={...character};if(isRetired(next.portrait_asset))next.portrait_asset=null;
  if(isRetired(next.portrait_thumbnail))next.portrait_thumbnail=null;
  const bundled=anime.get(character.id);
  if(!next.portrait_asset&&bundled?.portrait_asset){next.portrait_asset=bundled.portrait_asset;next.portrait_thumbnail=bundled.portrait_thumbnail;}
  return next;
 })};
}
