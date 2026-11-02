import type {StyleSpecification} from 'maplibre-gl';
import {terrainStyle} from './terrain-map';
// Global view deliberately contains neither terrain imagery nor city sources.
export function globalPoliticalStyle():StyleSpecification{
 const style=terrainStyle('');delete style.terrain;delete style.sky;delete style.sources.elevation;delete style.sources.relief;
 style.layers=style.layers.filter(l=>!['elevation-colors','hills'].includes(l.id));
 style.layers.find(l=>l.id==='land')!.paint={'fill-color':'#80989b'};
 style.layers.find(l=>l.id==='ownership')!.paint={'fill-color':['get','color'],'fill-opacity':['case',['==',['get','owner'],''],0,.72]};
 style.layers.find(l=>l.id==='province-borders')!.layout={visibility:'none'};
 return style;
}

// Natural Earth 1:10m physical vectors + Natural Earth II terrain. TFAM owns the political layer.
export function naturalEarthWorldStyle(origin=''):StyleSpecification{
 const style=globalPoliticalStyle();
 style.projection={type:'globe'};
 style.sources.land={type:'geojson',data:{type:'FeatureCollection',features:[]},tolerance:.2};
 style.sources['natural-earth-terrain']={type:'raster',tiles:[origin+'/map-art/natural-earth/tiles/{z}/{x}/{y}.webp'],tileSize:256,minzoom:0,maxzoom:4};
 style.layers.splice(2,0,{id:'natural-earth-terrain',type:'raster',source:'natural-earth-terrain',paint:{'raster-opacity':1,'raster-fade-duration':120,'raster-resampling':'linear'}});
 style.layers.find(l=>l.id==='ownership')!.paint={'fill-color':['get','color'],'fill-opacity':['case',['==',['get','owner'],''],0,.27],'fill-antialias':false};
 style.layers.find(l=>l.id==='selected-fill')!.paint={'fill-color':['get','color'],'fill-opacity':.1,'fill-antialias':false};
 style.sources['tfam-polar-cover']={type:'geojson',data:{type:'FeatureCollection',features:Array.from({length:6},(_,i)=>({type:'Feature' as const,properties:{},geometry:{type:'Polygon' as const,coordinates:[[[i*60-180,62],[i*60-120,62],[i*60-120,89],[i*60-180,89],[i*60-180,62]]]}}))}};
 style.layers.splice(style.layers.findIndex(l=>l.id==='ownership'),0,{id:'tfam-polar-cover',type:'fill',source:'tfam-polar-cover',paint:{'fill-color':'#e2f1f4','fill-opacity':.18,'fill-antialias':false}});
 style.sources['natural-earth-lakes']={type:'geojson',data:{type:'FeatureCollection',features:[]},tolerance:.2};
 style.sources['natural-earth-rivers']={type:'geojson',data:{type:'FeatureCollection',features:[]},tolerance:.25};
 const coast=style.layers.find(l=>l.id==='coast')!;if('source'in coast)coast.source='land';
 coast.paint={'line-color':'#e5d5ad','line-width':['interpolate',['linear'],['zoom'],0,.35,4,.8,7,1.2],'line-opacity':.7};
 style.layers.splice(style.layers.findIndex(l=>l.id==='ownership'),0,
 {id:'natural-earth-lakes',type:'fill',source:'natural-earth-lakes',paint:{'fill-color':'#214252','fill-opacity':.9}},
 {id:'natural-earth-rivers',type:'line',source:'natural-earth-rivers',minzoom:2,paint:{'line-color':'#8bb4bf','line-width':['interpolate',['linear'],['zoom'],2,.3,6,.9],'line-opacity':.6}});
 style.layers.splice(style.layers.findIndex(l=>l.id==='selected-fill'),0,{id:'province-hit',type:'fill',source:'provinces',paint:{'fill-color':'#ffffff','fill-opacity':.001}});
 style.sources['faction-areas']={type:'geojson',data:{type:'FeatureCollection',features:[]}};
 for(const id of ['ownership','selected-fill']){const layer=style.layers.find(l=>l.id===id)!;if('source'in layer)layer.source='faction-areas';}
 style.layers.splice(style.layers.findIndex(l=>l.id==='selected-fill'),0,{id:'hover-fill',type:'fill',source:'faction-areas',filter:['==',['get','owner'],'__none'],paint:{'fill-color':'#f1dfac','fill-opacity':.18}});
 style.sources['faction-frontiers']={type:'geojson',data:{type:'FeatureCollection',features:[]}};
 const offset:any=['interpolate',['linear'],['zoom'],0,['*',['get','offset'],.55],3,['*',['get','offset'],.8],6,['*',['get','offset'],1.1]];
 const index=style.layers.findIndex(l=>l.id==='selected-fill');
 style.layers.splice(index,0,
  {id:'faction-frontier-casing',type:'line',source:'faction-frontiers',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#061723','line-width':['interpolate',['linear'],['zoom'],0,3.4,2,4.3,6,5.5],'line-offset':offset,'line-opacity':.9}},
  {id:'faction-frontier-color',type:'line',source:'faction-frontiers',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['get','edgeColor'],'line-width':['interpolate',['linear'],['zoom'],0,1.4,2,1.9,6,2.6],'line-offset':offset,'line-opacity':.98}}
 );
 for(const id of ['selected-aura','selected-border']){const layer=style.layers.find(l=>l.id===id)!;if('source' in layer)layer.source='faction-frontiers';}
 style.layers.find(l=>l.id==='selected-aura')!.paint={'line-color':['get','edgeColor'],'line-width':9,'line-blur':3,'line-opacity':.7,'line-offset':offset};
 style.layers.find(l=>l.id==='selected-border')!.paint={'line-color':['get','edgeColor'],'line-width':['interpolate',['linear'],['zoom'],0,2.5,3,3.3,6,4.2],'line-opacity':1,'line-offset':offset};
 style.layers=style.layers.filter(l=>l.id!=='province-borders');

 return style;
}

// Retained export for older integrations.
export const paintedWorldStyle=naturalEarthWorldStyle;

/** Baked physical relief with only national ownership and frontier layers. */
export function regionalTerrainStyle(origin=''):StyleSpecification{
 const style=naturalEarthWorldStyle(origin);style.projection={type:'mercator'};
 delete style.sources.provinces;
 style.layers=style.layers.filter(layer=>!['province-hit','province-borders','transferred'].includes(layer.id));
 style.sources['natural-earth-terrain']={type:'raster',tiles:[origin+'/map-art/frost-terrain/{z}/{x}/{y}.webp'],tileSize:256,minzoom:0,maxzoom:4};
 style.layers.find(l=>l.id==='ocean')!.paint={'background-color':'#142d3b'};
 style.layers.find(l=>l.id==='natural-earth-terrain')!.paint={'raster-opacity':1,'raster-fade-duration':100,'raster-resampling':'linear','raster-contrast':.12};
 style.layers.find(l=>l.id==='tfam-polar-cover')!.paint={'fill-color':'#d9e9e9','fill-opacity':.08,'fill-antialias':false};
 return style;
}
