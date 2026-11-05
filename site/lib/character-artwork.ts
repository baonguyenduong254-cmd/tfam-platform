import cutouts from './character-cutouts.json';
type PortraitRecord=Readonly<Record<string,any>>;
const derivatives=cutouts as Record<string,{source:string;full:string;thumbnail:string}>;
function sourcePath(value:string){try{return /^https?:/.test(value)?new URL(value).pathname:value.split(/[?#]/)[0];}catch{return value;}}
/** Preserve a later author's custom portrait instead of forcing an obsolete derivative. */
export function characterCutout(character:PortraitRecord,thumbnail=false){
 const record=derivatives[character.id];
 return record&&typeof character.portrait_asset==='string'&&sourcePath(character.portrait_asset)===record.source?(thumbnail?record.thumbnail:record.full):undefined;
}
export function characterArtwork(character:PortraitRecord,thumbnail=false){return characterCutout(character,thumbnail)||(thumbnail?character.portrait_thumbnail||character.portrait_asset:character.portrait_asset);}
