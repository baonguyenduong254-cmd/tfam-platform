import patch from './character-dossiers-v24.json';
type Row=Record<string,any>;
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
/** One-time, field-family migration; edits made after the captured baseline win. */
export function upgradeCharacterDossiers(data:Row){
 for(const update of patch.updates){
  const row=data.characters?.find((c:Row)=>c.id===update.id);
  if(!row)continue;
  const before=update.before as Row,after=update.after as Row;
  for(const family of [['lore_vi','lore_en'],['traits','traits_vi','traits_en'],['skills','skills_vi','skills_en']]){
   if(!family.every(key=>same(row[key]??null,before[key]??null)))continue;
   for(const key of family)row[key]=structuredClone(after[key]);
  }
 }
 return data;
}
