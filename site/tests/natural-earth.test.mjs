import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
const base=new URL('../',import.meta.url);
test('published Natural Earth decoder restores geographic coordinates in a worker',async()=>{
 let complete;
 const done=new Promise((resolve,reject)=>complete={resolve,reject});
 const context={self:{postMessage:result=>result.error?complete.reject(Error(result.error)):complete.resolve(result)},fetch:async url=>new Response(await fs.readFile(new URL('public'+url,base))),Response,DecompressionStream,Blob,URL,JSON,Error};
 vm.runInNewContext(await fs.readFile(new URL('public/map-runtime/natural-earth-loader.mjs',base),'utf8'),context);
 await context.self.onmessage({data:{id:1,url:'/map-art/natural-earth/land.json.gz'}});
 const result=await done;assert.equal(result.id,1);const decoded=await (await fetch(result.url)).json();URL.revokeObjectURL(result.url);
 const original=JSON.parse(await fs.readFile(new URL('data/atlas/natural-earth/land.geojson',base),'utf8'));
 assert.equal(decoded.features.length,original.features.length);assert.equal(decoded.features[0].geometry.type,original.features[0].geometry.type);
 const points=v=>typeof v[0]==='number'?[v]:v.flatMap(points);
 const a=points(decoded.features[0].geometry.coordinates),b=points(original.features[0].geometry.coordinates);assert.equal(a.length,b.length);
 for(let i=0;i<a.length;i+=97)for(let j=0;j<2;j++)assert.ok(Math.abs(a[i][j]-b[i][j])<=.0000051);
});
test('1715 and 1716 packed factions preserve validated geometry and every canon owner',async()=>{
 for(const year of ['1715','1716']){
  const source=JSON.parse(await fs.readFile(new URL('data/atlas/natural-earth/tfam_'+year+'.geojson',base),'utf8'));
  const packed=JSON.parse(gunzipSync(await fs.readFile(new URL('public/map-art/natural-earth/tfam_'+year+'.json.gz',base))));
  assert.deepEqual(packed,source);assert.equal(packed.features.length,24);
  assert.equal(new Set(packed.features.map(f=>f.properties.owner)).size,24);
 }
});
