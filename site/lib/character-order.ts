import {courtGroup} from './character-attributes';
type Row=Record<string,any>;
const groupOrder={crown:0,guard:1,official:2,affiliate:3,household:4};
const names=new Intl.Collator('en',{sensitivity:'base',numeric:true});
/** Presentation order only: never alters canon, rank or reader visibility. */
export function orderCharacters<T extends Row>(characters:T[]):T[]{
 return characters.map((character,index)=>({character,index})).sort((a,b)=>{
  const ga=courtGroup(a.character),gb=courtGroup(b.character);
  const group=groupOrder[ga]-groupOrder[gb];if(group)return group;
  if(ga==='guard'){
   const number=(c:Row)=>Number.isFinite(Number(c.guard_number))&&Number(c.guard_number)>0?Number(c.guard_number):Infinity;
   const difference=number(a.character)-number(b.character);if(difference&&!Number.isNaN(difference))return difference;
  }
  if(ga==='guard'||ga==='official')return names.compare(String(a.character.name_en||a.character.name_vi||a.character.name||''),String(b.character.name_en||b.character.name_vi||b.character.name||''))||a.index-b.index;
  return a.index-b.index;
 }).map(entry=>entry.character);
}
