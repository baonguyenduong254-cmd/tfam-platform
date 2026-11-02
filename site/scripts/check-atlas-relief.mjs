import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire}from'node:module';
const requireNative=createRequire(import.meta.url),ts=requireNative('typescript'),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const box={exports:{}};cache.set(file,box);const require=s=>s.startsWith('.')?load(path.resolve(path.dirname(file),s)+'.ts'):requireNative(s);const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(js,{exports:box.exports,require,console});return box.exports;}
const {regionalTerrainStyle}=load('lib/map-modes.ts'),style=regionalTerrainStyle('https://example.test');
const pnpm=path.resolve('node_modules/.pnpm'),styleSpec=fs.readdirSync(pnpm).find(x=>x.startsWith('@maplibre+maplibre-gl-style-spec@'));const {validateStyleMin}=requireNative(pnpm+'/'+styleSpec+'/node_modules/@maplibre/maplibre-gl-style-spec');
const errors=validateStyleMin(style);assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
assert.ok(!style.terrain&&!style.sources.elevation&&!style.sources.relief);
assert.ok(!style.layers.some(l=>['hillshade','color-relief','fill-extrusion'].includes(l.type)));
assert.equal(style.sources['natural-earth-terrain'].type,'raster');
assert.ok(style.layers.findIndex(l=>l.id==='natural-earth-terrain')<style.layers.findIndex(l=>l.id==='ownership'));
for(let z=0;z<=4;z++)for(let y=0;y<2**z;y++)for(let x=0;x<2**z;x++){
 const bytes=fs.readFileSync(`public/map-art/natural-earth/tiles/${z}/${x}/${y}.webp`);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
}
for(const file of ['land','lakes','rivers_lake_centerlines','tfam_1715','tfam_1716'])assert.ok(fs.statSync('public/map-art/natural-earth/'+file+'.json.gz').size>0);
console.log('PASS: current regional Natural Earth style, MapLibre validation, vector sources and raster tiles through zoom 4; no runtime DEM.');
