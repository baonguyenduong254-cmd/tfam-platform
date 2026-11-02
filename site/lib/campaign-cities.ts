export type Architecture='european'|'iberian'|'moorish'|'eastern'|'northern'|'ruins'|'colonial';
export type CampaignCity={id:string;name:string;coordinates:[number,number];province:string;rank:number;port:boolean;placeholder:boolean;name_vi?:string;name_en?:string;lore_vi?:string;lore_en?:string;architecture?:Architecture;owner?:string};
export const architectureNames={european:['Châu Âu','European'],iberian:['Iberia','Iberian'],moorish:['Moorish','Moorish'],eastern:['Đông Âu','Eastern'],northern:['Bắc Âu','Northern'],ruins:['Tàn tích','Ruins'],colonial:['Thuộc địa','Colonial']} as const;
export function resolveCities(cities:CampaignCity[],data:Record<string,any>,year:string):CampaignCity[]{
 return cities.map(city=>{const o=data.city_overrides?.[city.id]||{},owner=data.territories[year]?.[city.id]||'';const architecture:Architecture=owner==='england_ruins'?'ruins':owner==='castilian_empire'?'iberian':owner==='sultanate_of_morocco'||owner==='ottoman_empire'?'moorish':owner==='novgorod_union'||owner==='habsburg_poland'?'eastern':owner==='danes_kingdom'||owner==='scotland_ireland_union'?'northern':owner==='new_portuguese_empire'||owner==='british_east_india_company'?'colonial':'european';return {...city,...o,owner,architecture:o.architecture||architecture};});
}
export function cityName(c:CampaignCity,lang:string){return (lang==='vi'?c.name_vi:c.name_en)||c.name||'Placeholder';}
export function cityRank(c:CampaignCity){return Math.max(1,Math.min(3,Number(c.rank)||1));}
export function cityVisibleAtZoom(c:CampaignCity,zoom:number){return zoom>=(cityRank(c)===3?3.4:cityRank(c)===2?5.1:6.2);}
export function cityLOD(zoom:number,quality:string){return quality==='low'||zoom<6.4?0:zoom<8.2?1:2;}
// Filter first, cap models second. Provinces always keep their lightweight point.
export function limitVisibleCities(cities:CampaignCity[],zoom:number,quality:string){return cities.filter(c=>cityVisibleAtZoom(c,zoom)).sort((a,b)=>cityRank(b)-cityRank(a)||a.id.localeCompare(b.id)).slice(0,quality==='low'?28:96);}
