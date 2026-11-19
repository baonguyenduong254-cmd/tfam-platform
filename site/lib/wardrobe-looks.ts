import legacy from './wardrobe-manifest.json';
import collections from './wardrobe-collections.json';

export type Look={id:string;label:string;src:string;thumbnail?:string;background?:string;scene?:string;size?:number;bottom?:number;warmth?:number};
const original=legacy as Record<string,Record<string,string>>;
const additions=collections as Record<string,Record<string,Look[]>>;
export function getLooks(characterId:string,category:string):Look[]{
 const next=additions[characterId]?.[category]||[];
 const source=original[characterId]?.[category];
 return [...next,...(source?[{id:'original',label:'Original',src:source,background:'/evelyne-stage/background-'+category+'.webp'}]:[])];
}
export function hasWardrobe(characterId:string){return !!(original[characterId]||additions[characterId]);}
