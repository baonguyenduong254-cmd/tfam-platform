import {assetUrl} from './media/asset-url';
import legacy from './wardrobe-manifest.json';
import collections from './wardrobe-collections.json';

export type Look={
 id:string;
 label:string;
 src:string;
 thumbnail?:string;
 background?:string;
 scene?:string;
 size?:number;
 bottom?:number;
 warmth?:number;
};

const original=legacy as Record<string,Record<string,string>>;
const additions=collections as Record<string,Record<string,Look[]>>;

function normalizeAssetKey(src?:string):string{
 if(!src)return '';
 const clean=src.split(/[?#]/)[0].trim().toLowerCase();
 return clean.replace(/^https?:\/\/[^/]+/,'').replace(/\/+/g,'/');
}

export function getLooks(characterId:string,category:string):Look[]{
 const authored=additions[characterId]?.[category]||[];
 const legacySrc=original[characterId]?.[category];
 const raw:Look[]=[...authored];
 if(legacySrc){
  raw.push({id:'original',label:category==='uniform'||category==='office'?'Official Collection':'Atelier Classic',src:legacySrc,background:'/evelyne-stage/background-'+category+'.webp'});
 }

 const seenSrc=new Set<string>();
 const seenId=new Set<string>();
 const unique:Look[]=[];
 for(const item of raw){
  const srcKey=normalizeAssetKey(item.src);
  if(!srcKey||seenSrc.has(srcKey)||seenId.has(item.id))continue;
  seenSrc.add(srcKey);
  seenId.add(item.id);
  unique.push(item);
 }
 return unique.map(item=>({
  ...item,
  src:assetUrl(item.src),
  ...(item.thumbnail?{thumbnail:assetUrl(item.thumbnail)}:{}),
 }));
}

export function hasWardrobe(characterId:string){
 return !!(original[characterId]||additions[characterId]);
}
