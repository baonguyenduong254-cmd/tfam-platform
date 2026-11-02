import patch from './lore-patch-v17.json';
import rewrite from './lore-patch-v18.json';
import western from './lore-patch-v19.json';
import moor from './moor-patch-v20.json';
import roman from './rome-patch-v21.json';
type R=Record<string,any>;
const unwritten=(value:any)=>value==null||value===''||(typeof value==='string'&&/^Placeholder/i.test(value));
export function applyEasternLore(data:R){
 for(const update of patch.factions){const faction=data.factions.find((f:R)=>f.id===update.id);if(!faction)continue;for(const [key,value] of Object.entries(update)){if(key==='id')continue;if(key==='traits'){if(!faction.traits?.some((t:R)=>!unwritten(t.label_vi)))faction.traits=structuredClone(value);}else if(unwritten(faction[key]))faction[key]=structuredClone(value);}}
 const targets=new Set(patch.factions.map(f=>f.id));
 for(const collection of ['characters','units'] as const){data[collection]??=[];data[collection]=data[collection].filter((r:R)=>!(targets.has(r.faction_id)&&unwritten(r.name)));const ids=new Set(data[collection].map((r:R)=>r.id));data[collection].push(...structuredClone(patch[collection].filter(r=>!ids.has(r.id))));}
 return data;
}

// Replace the generated draft while preserving later edits made in the editor.
export function rewriteEasternLore(data:R){
 for(const collection of ['factions','characters'] as const){
  for(const update of rewrite[collection]){
   const record=data[collection]?.find((r:R)=>r.id===update.id);
   if(!record)continue;
   const prior=patch[collection].find((r:R)=>r.id===update.id) as R|undefined;
   for(const [key,value] of Object.entries(update)){
    if(key==='id'||key==='faction_id')continue;
    if(unwritten(record[key])||JSON.stringify(record[key])===JSON.stringify(prior?.[key]))record[key]=structuredClone(value);
   }
   if(collection==='factions')for(const key of Object.keys(record)){
    if(key.startsWith('historical_')||key.startsWith('story_hook_'))delete record[key];
   }
  }
 }
 return data;
}

export function completeWesternLore(data:R){
 const pending=(value:any)=>unwritten(value)||(typeof value==='string'&&value.includes('Placeholder'));
 for(const update of western.factions){
  const faction=data.factions.find((f:R)=>f.id===update.id);
  if(!faction)continue;
  for(const [key,value] of Object.entries(update)){
   if(key==='id')continue;
   if(key==='traits'){
    if(!faction.traits?.some((t:R)=>!pending(t.label_vi)))faction.traits=structuredClone(value);
   }else if(pending(faction[key]))faction[key]=structuredClone(value);
  }
 }
 const targets=new Set(western.factions.map(f=>f.id));
 for(const collection of ['characters','units'] as const){
  data[collection]??=[];
  data[collection]=data[collection].filter((r:R)=>!(targets.has(r.faction_id)&&pending(r.name)));
  const ids=new Set(data[collection].map((r:R)=>r.id));
  data[collection].push(...structuredClone(western[collection].filter(r=>!ids.has(r.id))));
 }
 return data;
}

export function applyMoorCanon(data:R){
 for(const collection of ['factions','characters','units'] as const){
  data[collection]??=[];
  for(const update of moor[collection]){
   const record=data[collection].find((r:R)=>r.id===update.id);
   if(record)Object.assign(record,structuredClone(update));
   else data[collection].push({...(collection==='characters'?{portrait_asset:null}:collection==='units'?{image_asset:null}:{}),...structuredClone(update)});
  }
 }
 const faction=data.factions.find((f:R)=>f.id==='sultanate_of_morocco');
 if(faction){delete faction.color_status;delete faction.legacy_status;}
 return data;
}

export function applyRomanLore(data:R){
 for(const collection of ['factions','characters','units'] as const){
  data[collection]??=[];
  for(const update of roman[collection]){
   const record=data[collection].find((r:R)=>r.id===update.id);
   if(record)Object.assign(record,structuredClone(update));
   else data[collection].push({...(collection==='characters'?{portrait_asset:null}:collection==='units'?{image_asset:null}:{}),...structuredClone(update)});
  }
 }
 const faction=data.factions.find((f:R)=>f.id==='western_roman_empire');
 if(faction){delete faction.color_status;delete faction.legacy_status;}
 return data;
}
