import type {Map as GLMap} from 'maplibre-gl';
export async function installTerrainTextures(map:GLMap,isDisposed:()=>boolean){
 const response=await fetch('/map-art/terrain-atlas.webp');if(!response.ok)throw Error('Terrain texture unavailable');const bitmap=await createImageBitmap(await response.blob());if(isDisposed()){bitmap.close();return;}
 const half=bitmap.width/2,images=['snow','rock','forest','water'];
 for(let i=0;i<4;i++){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,(i%2)*half,Math.floor(i/2)*half,half,half,0,0,256,256);map.addImage('terrain-'+images[i],ctx.getImageData(0,0,256,256));}
 bitmap.close();
 map.addLayer({id:'water-texture',type:'background',paint:{'background-pattern':'terrain-water','background-opacity':.22}},'land');
 map.addLayer({id:'snow-texture',type:'fill',source:'land',paint:{'fill-pattern':'terrain-snow','fill-opacity':['interpolate',['linear'],['zoom'],2,.08,5,.25,10,.37]}},'ownership');
 for(const biome of ['forest','rock'])map.addLayer({id:biome+'-texture',type:'fill',source:'provinces',filter:['==',['get','biome'],biome],paint:{'fill-pattern':'terrain-'+biome,'fill-opacity':['interpolate',['linear'],['zoom'],3,0,5,.25,9,.4]}},'ownership');
 map.triggerRepaint();
}
