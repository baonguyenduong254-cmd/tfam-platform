import patch from './character-patch-v23.json';
type R=Record<string,any>;
const empty=(v:any)=>v==null||v===''||(Array.isArray(v)&&v.length===0)||(typeof v==='string'&&/^(placeholder|place holder|tbd)(\b|$)/i.test(v));
const same=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);

// Patch authored defaults only. Later edits in the content editor remain authoritative.
export function completeCharacterDossiers(data:R){
 for(const raw of patch.updates){
  const update=raw as R,record=data[update.collection]?.find((r:R)=>r.id===update.id);
  if(!record)continue;
  const original=structuredClone(record),baseline=update.baseline;
  for(const [key,value] of Object.entries(update.after)){
   if(!empty(original[key])&&!same(original[key],update.before[key]))continue;
   const family=key.replace(/_(vi|en)$/,'');
   if(['name','role','skills','traits','status'].includes(family)&&baseline[family]!==undefined&&!same(original[family],baseline[family]))continue;
   // A translation must not describe an older version of a user-edited source.
   if(key.endsWith('_en')&&baseline[family+'_vi']!==undefined&&!same(original[family+'_vi'],baseline[family+'_vi']))continue;
   record[key]=structuredClone(value);
  }
 }
 data.characters??=[];
 const ids=new Set(data.characters.map((c:R)=>c.id));
 for(const character of patch.characters){
  if(!ids.has(character.id)){data.characters.push(structuredClone(character));ids.add(character.id);}
 }
 return data;
}
