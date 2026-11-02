export const DISCOVERY_EVENT='tfam-reading-changed';
export const factionGroups=[
 {name:'The Free Empires',ids:['castilian_empire','holy_french_kingdom','habsburg_poland','danes_kingdom','new_portuguese_empire','british_east_india_company','scotland_ireland_union','england_ruins','ottoman_empire','safavid_empire','annam_empire','tokugawa_empire','nusantara_sultanate','eternal_sky_khanate']},
 {name:'The Crimson Coalition',ids:['western_roman_empire','novgorod_union','ming_celestial_empire']},
 {name:'The Unscored Revolt',ids:['veldraine','nhemora','khorvait']},
 {name:'The Free African Nations',ids:['sultanate_of_morocco','aksumite_empire','songhai_empire','kongo_confederation','swahili_league','cape_republic','merina_empire']}
];
export const revoltSlots=[{id:'veldraine',name_en:'Veldraine',subtitle:'The Living Dominion'},{id:'nhemora',name_en:'Nhemora',subtitle:'The Choral Commonwealth'},{id:'khorvait',name_en:'Khorvait',subtitle:'The Sovereign Directorate'}];
export const unlockRequirements:Record<string,string>={
 holy_french_kingdom:'arc-1',new_portuguese_empire:'arc-1',habsburg_poland:'arc-2',danes_kingdom:'arc-3',western_roman_empire:'arc-3',novgorod_union:'arc-4',ottoman_empire:'arc-4',british_east_india_company:'arc-5',scotland_ireland_union:'side-scotland',england_ruins:'side-england',veldraine:'arc-6',nhemora:'arc-6',khorvait:'arc-6',safavid_empire:'arc-7',annam_empire:'arc-8',tokugawa_empire:'arc-10',nusantara_sultanate:'arc-12',ming_celestial_empire:'arc-14',eternal_sky_khanate:'arc-15',aksumite_empire:'arc-3',songhai_empire:'arc-3',kongo_confederation:'arc-4',swahili_league:'arc-4',cape_republic:'arc-5',merina_empire:'arc-5'};
export type Milestone={id:string;title:string;closed:boolean;required:string[];englishCoverage:Record<string,string[]>;contentEquivalents?:Record<string,string[]>};
export type CatalogEntry={id:string;complete?:boolean};
export function milestoneState(m:Milestone,readIds:Set<string>,catalog:CatalogEntry[]){
 const published=new Set(catalog.filter(c=>c.complete).map(c=>c.id));
 const covered=new Set([...readIds].filter(id=>published.has(id)));
 for(const [english,units] of Object.entries(m.englishCoverage))if(covered.has(english))for(const unit of units)covered.add(unit);
 for(const [unit,chapters] of Object.entries(m.contentEquivalents||{}))if(chapters.length&&chapters.every(id=>covered.has(id)))covered.add(unit);
 const count=m.required.filter(id=>covered.has(id)).length;
 const available=m.closed&&m.required.length>0&&m.required.every(id=>published.has(id)||Object.entries(m.englishCoverage).some(([english,units])=>published.has(english)&&units.includes(id))||(m.contentEquivalents?.[id]?.length&&m.contentEquivalents[id].every(english=>published.has(english))));
 return {count,total:m.required.length,available,earned:available&&count===m.required.length};
}
export function canExplore(id:string,earned:ReadonlySet<string>){return ['castilian_empire','sultanate_of_morocco'].includes(id)||!!unlockRequirements[id]&&earned.has(unlockRequirements[id]);}
export function requirementText(id:string,earned:ReadonlySet<string>,milestones:Milestone[]){if(canExplore(id,earned))return 'Available';const key=unlockRequirements[id];if(key?.startsWith('side-'))return 'Required side story not yet available';const m=milestones.find(m=>m.id===key);return m?'Complete '+m.title+(m.closed?'':' · Required arc not yet fully available'):'Not yet available';}
