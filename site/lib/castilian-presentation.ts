import profiles from './castilian-profiles-20261028.json';
import expansion from './castilian-expansion-20261029.json';
import lokoh from './castilian-lokoh-20261029.json';
import standards from '../public/heraldry/manifest.json';
type Row=Record<string,any>;
export function belongsToFaction(character:Row|undefined,id:string){return !!character&&(character.faction_id===id||character.affiliations?.includes(id));}
/** Versioned presentation migrations preserve later author edits. */
export function withCastilianPresentation<T extends {characters?:Row[];factions?:Row[];presentationRevision?:number}>(data:T):T{
 const revision=data.presentationRevision||0;
 if(revision>=33)return data;
 const characters=(data.characters||[]).map(c=>({...c}));
 if(revision<28)for(const p of profiles){
  const index=characters.findIndex(c=>c.id===p.id),current=characters[index];
  const faction=current?.faction_id||p.faction_id;
  const updated={...current,...p,faction_id:faction,affiliations:[...new Set([...(current?.affiliations||[]),'castilian_empire'])],traits_vi:current?.traits_vi?.length?current.traits_vi:p.traits_vi,traits_en:current?.traits_en?.length?current.traits_en:p.traits_en};
  if(index<0)characters.push(updated);else characters[index]=updated;
 }
 const migrated=characters.map(c=>{
  let next=c;
  if(revision<30&&c.id==='liv')next={...next,portrait_asset:'/portraits/castilian/liv-anime-v3.webp',portrait_thumbnail:'/portraits/castilian/liv-anime-v3-thumb.webp'};
  // Arc III's investiture: Nueve is a guard oath; Lady Protector is a civil honour.
  if(revision<31&&c.id==='england_ruins_representative')next={...next,guard_number:9,castilian_branch:'guard',role_vi:'Chuẩn Đô đốc · Cận vệ Hoàng gia Nueve',role_en:'Rear Admiral · Royal Guard Nueve',office_vi:'Hải quân · Cận vệ Nueve từ cuối 1716',office_en:'Navy · Royal Guard Nueve from late 1716',affiliations:[...new Set([...(c.affiliations||[]),'castilian_empire'])]};
  if(revision<31&&c.id==='juliet_spencer')next={...next,castilian_branch:'civil',office_vi:'Nữ Hộ Quốc · Tước hiệu dân sự từ cuối 1716',office_en:'Lady Protector · Civil honour from late 1716',affiliations:[...new Set([...(c.affiliations||[]),'castilian_empire'])]};
  return next;
 });
 if(revision<32)for(const patch of expansion){const index=migrated.findIndex(c=>c.id===patch.id),current=migrated[index];const next={...current,...patch,affiliations:[...new Set([...(current?.affiliations||[]),...('affiliations' in patch?patch.affiliations||[]:[])])]};if(index<0)migrated.push(next);else migrated[index]=next;}
 if(!migrated.some(c=>c.id===lokoh.id))migrated.push({...lokoh});
 return {...data,presentationRevision:33,characters:migrated,factions:revision>=29?data.factions:data.factions?.map(f=>({...f,flag_asset:(standards.flags as Record<string,string>)[f.id]||f.flag_asset}))};
}
