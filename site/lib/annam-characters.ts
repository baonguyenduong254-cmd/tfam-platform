import replacements from './annam-characters-v25.json';
type Row=Record<string,any>;
/** Keep existing IDs and custom portrait URLs so shared links and saved avatars survive. */
export function replaceAnNamCharacters(data:Row){
 for(const replacement of replacements){
  const row=data.characters?.find((c:Row)=>c.id===replacement.id&&c.faction_id==='annam_empire');
  if(row){const portrait=row.portrait_asset;Object.assign(row,structuredClone(replacement));row.portrait_asset=portrait??null;}
 }
 return data;
}
