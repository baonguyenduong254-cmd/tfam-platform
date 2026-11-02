type Position=number[];
type MultiPolygon={type:'MultiPolygon';coordinates:Position[][][]};
type Feature<T>={type:'Feature';id:string;properties:Record<string,any>;geometry:T};
type FeatureCollection<T>={type:'FeatureCollection';features:Feature<T>[]};
import type {StyleSpecification} from 'maplibre-gl';
type R=Record<string,any>;
// Natural Earth province paths use the same affine projection as the former SVG atlas.
// Recover each ring, including interior holes, without changing province IDs or ownership.
export function provinceGeometry(p:R):Feature<MultiPolygon>{
 const rings:Position[][]=[];
 for(const part of p.path.split(/Z\s*/i)){const values=part.match(/-?\d+(?:\.\d+)?/g);if(!values||values.length<6)continue;const ring:Position[]=[];for(let i=0;i+1<values.length;i+=2)ring.push([+values[i]/12-25,73-+values[i+1]/12]);if(ring[0][0]!==ring.at(-1)![0]||ring[0][1]!==ring.at(-1)![1])ring.push([...ring[0]]);rings.push(ring);}
 const area=(r:Position[])=>r.reduce((a,p,i)=>i?a+r[i-1][0]*p[1]-p[0]*r[i-1][1]:a,0);
 const outerSign=Math.sign(area(rings[0]||[]));const polygons:Position[][][]=[];
 for(const ring of rings){if(!polygons.length||Math.sign(area(ring))===outerSign)polygons.push([ring]);else polygons.at(-1)!.push(ring);}
 return {type:'Feature',id:p.id,properties:{id:p.id,name:p.name},geometry:{type:'MultiPolygon',coordinates:polygons}};
}
export function provinceCollection(provinces:R[],data:R,year:string):FeatureCollection<MultiPolygon>{const factions=new Map<string,R>(data.factions.map((f:R)=>[f.id,f]));const owners=data.territories[year]||{};return {type:'FeatureCollection',features:provinces.map(p=>{const feature=provinceGeometry(p);const owner=owners[p.id]||'';const coords=feature.geometry.coordinates.flat(2);const lat=coords.reduce((a,p)=>a+p[1],0)/Math.max(1,coords.length);const lon=coords.reduce((a,p)=>a+p[0],0)/Math.max(1,coords.length);const biome=lat>44&&lat<68?'forest':lat>15&&lat<36&&lon>-20&&lon<65?'rock':'snow';feature.properties={...feature.properties,owner,biome,color:factions.get(owner)?.ui_color_primary||'#8babb0'};return feature;})};}
export const terrainViews=[
 {id:'alps',vi:'Dãy Alps',en:'Alps',center:[10.2,46.65],zoom:9.2,bearing:-25},
 {id:'pyrenees',vi:'Pyrenees',en:'Pyrenees',center:[.5,42.7],zoom:9.1,bearing:18},
 {id:'atlas',vi:'Dãy Atlas',en:'Atlas',center:[-7.9,31.08],zoom:9.3,bearing:25},
 {id:'caucasus',vi:'Caucasus',en:'Caucasus',center:[43.1,42.7],zoom:8.9,bearing:-30},
 {id:'himalaya',vi:'Himalaya',en:'Himalayas',center:[86.85,27.95],zoom:9,bearing:-12},
 {id:'andes',vi:'Dãy Andes',en:'Andes',center:[-70.05,-32.5],zoom:9.1,bearing:20}
];
export function terrainStyle(origin:string):StyleSpecification{
 const dem={type:'raster-dem' as const,tiles:[origin+'/api/terrain/{z}/{x}/{y}.png'],tileSize:256,maxzoom:14,encoding:'terrarium' as const};
 return {version:8,sources:{elevation:dem,relief:{...dem},land:{type:'geojson',data:{type:'FeatureCollection',features:[]}},provinces:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},terrain:{source:'elevation',exaggeration:2},sky:{'sky-color':'#071925','horizon-color':'#acc5cc','fog-color':'#7899a7','fog-ground-blend':.35,'horizon-fog-blend':.6},layers:[
 {id:'ocean',type:'background',paint:{'background-color':'#112c3c'}},
 {id:'land',type:'fill',source:'land',paint:{'fill-color':'#91aaa9'}},
 {id:'elevation-colors',type:'color-relief',source:'relief',paint:{'color-relief-opacity':.9,'color-relief-color':['interpolate',['linear'],['elevation'],-11000,'#061927',-200,'#183b4c',0,'#8a9f99',300,'#97aaa2',900,'#aab6ae',1800,'#c2cdc5',2800,'#e3ece7',4400,'#f5faf7']}},
 {id:'hills',type:'hillshade',source:'relief',paint:{'hillshade-exaggeration':.7,'hillshade-shadow-color':'#1c303c','hillshade-highlight-color':'#e8f4eb','hillshade-accent-color':'#647e86','hillshade-illumination-direction':315}},
 {id:'coast',type:'line',source:'land',paint:{'line-color':'#c2dde0','line-width':['interpolate',['linear'],['zoom'],2,.5,9,1.5],'line-opacity':.65}},
 {id:'ownership',type:'fill',source:'provinces',paint:{'fill-color':['get','color'],'fill-opacity':['case',['==',['get','owner'],''],0,.2]}},
 {id:'province-borders',type:'line',source:'provinces',paint:{'line-color':'#183846','line-width':['interpolate',['linear'],['zoom'],2,.2,8,.8],'line-opacity':.4}},
 {id:'selected-fill',type:'fill',source:'provinces',filter:['==',['get','owner'],'__none'],paint:{'fill-color':['get','color'],'fill-opacity':.13}},
 {id:'selected-aura',type:'line',source:'provinces',filter:['==',['get','owner'],'__none'],paint:{'line-color':'#afe5f6','line-width':6,'line-blur':5,'line-opacity':.65}},
 {id:'selected-border',type:'line',source:'provinces',filter:['==',['get','owner'],'__none'],paint:{'line-color':'#d2f3fb','line-width':1.4,'line-opacity':.9}},
 {id:'transferred',type:'fill',source:'provinces',filter:['in',['get','id'],['literal',[]]],paint:{'fill-color':'#e2f6ff','fill-opacity':.65,'fill-opacity-transition':{duration:1000}}}
 ]};
}
