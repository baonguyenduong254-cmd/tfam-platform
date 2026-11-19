import catalogue from './static-atlas-cities.json';
import {inMapRegion,type MapRegion} from './map-regions';
import type {CampaignCity} from './campaign-cities';
type Row=Record<string,any>;
export type AtlasPlace={id:string;name:string;coordinates:number[];owner:string;capital:boolean;selected:boolean;index:number;flag:string};
/** Reuse the existing atlas and named towns; year-specific control supplies flags. */
export function atlasPlaces(data:Row,year:string,selected:string,region:MapRegion,editedCities:CampaignCity[]=[],lang='vi'):AtlasPlace[]{
 const candidates=catalogue.cities.map(c=>{
  const edit=editedCities.find(x=>x.id===(('province_id' in c&&c.province_id)||c.id));
  const o=data.city_overrides?.[(('province_id' in c&&c.province_id)||c.id)]||{};
  const province=('province_id' in c&&c.province_id)||'';
  return {...c,...o,...(edit&&!edit.placeholder?{name_vi:edit.name_vi||edit.name,name_en:edit.name_en||edit.name,coordinates:edit.coordinates}:{}),owner:(province&&data.territories?.[year]?.[province])||c.owners[year as '1715'|'1716']||''};
 }).filter(c=>c.owner&&inMapRegion(c.coordinates,region));
 const capitals=new Map<string,string>();
 for(const f of data.factions as Row[]){
  const desired=f.id==='ottoman_empire'&&year==='1716'?'baghdad':(catalogue.capitals as Record<string,string>)[f.id];
  const cap=candidates.find(c=>c.id===desired&&c.owner===f.id)||candidates.filter(c=>c.owner===f.id).sort((a,b)=>a.priority-b.priority)[0];
  if(cap)capitals.set(f.id,cap.id);
 }
 const capIds=new Set(capitals.values());
 const chosen=candidates.filter(c=>capIds.has(c.id));
 const own=candidates.filter(c=>c.owner===selected&&!capIds.has(c.id));
 // Spread secondary towns geographically, rather than crowding the capital.
 while(own.length&&chosen.filter(c=>c.owner===selected).length<7){
  const anchors=chosen.filter(c=>c.owner===selected);
  own.sort((a,b)=>{
   const distance=(c:typeof a)=>anchors.length?Math.min(...anchors.map(p=>(p.coordinates[0]-c.coordinates[0])**2+(p.coordinates[1]-c.coordinates[1])**2)):1;
   return distance(b)-distance(a)||a.id.localeCompare(b.id);
  });chosen.push(own.shift()!);
 }
 return chosen.map(c=>{const index=data.factions.findIndex((f:Row)=>f.id===c.owner);return {id:c.id,name:lang==='en'?c.name_en:c.name_vi,coordinates:c.coordinates,owner:c.owner,capital:capIds.has(c.id),selected:c.owner===selected,index,flag:data.factions[index]?.flag_asset||''};}).filter(c=>c.index>=0).sort((a,b)=>Number(b.selected)-Number(a.selected)||Number(b.capital)-Number(a.capital)||a.id.localeCompare(b.id));
}
export function placeLabels(places:AtlasPlace[],region:MapRegion,width:number){
 const [w,s,e,n]=region.bounds,height=width*(n-s)/(e-w),occupied:{x:number;y:number;w:number;h:number}[]=[];
 return places.map(place=>{
  const x=(place.coordinates[0]-w)/(e-w)*width,y=(n-place.coordinates[1])/(n-s)*height;
  const labelWidth=Math.min(180,Math.max(place.capital?86:62,place.name.length*6.4+(place.capital?58:18))),h=23;
  const options=[[12,-12],[12,10],[-labelWidth-12,-12],[-labelWidth-12,10],[12,-36],[-labelWidth-12,-36],[12,34],[-labelWidth-12,34],[12,-60],[-labelWidth-12,58]];
  let best={x:0,y:0,score:Infinity};
  for(const [dx,dy] of options){const bx=Math.max(3,Math.min(width-labelWidth-3,x+dx)),by=Math.max(3,Math.min(height-h-3,y+dy));let score=Math.abs(bx-x-dx)+Math.abs(by-y-dy);
   for(const r of occupied){const overlap=Math.max(0,Math.min(bx+labelWidth+4,r.x+r.w)-Math.max(bx-4,r.x))*Math.max(0,Math.min(by+h+3,r.y+r.h)-Math.max(by-3,r.y));score+=overlap*10;}
   if(score<best.score)best={x:bx,y:by,score};
  }
  occupied.push({x:best.x,y:best.y,w:labelWidth,h});
  return {...place,x:x/width*100,y:y/height*100,dx:best.x-x,dy:best.y-y,labelWidth};
 });
}
