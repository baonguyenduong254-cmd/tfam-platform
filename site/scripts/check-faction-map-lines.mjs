import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const native=createRequire(import.meta.url),ts=native('typescript'),cache=new Map();
function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file));if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);const require=s=>s.startsWith('.')?load(path.resolve(path.dirname(file),s)+(path.extname(s)?'':'.ts')):native(s);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports:m.exports,require,console,structuredClone});return m.exports;}
const {frontiersFromTopology,factionMapColor}=load('lib/faction-map-lines.ts');
const topology={version:2,provinceIds:['a','b'],arcs:[[0,-1,[[[0,0],[1,0],[1,1]]]],[0,1,[[[1,0],[1,1]]]],[1,-1,[[[1,0],[2,0],[2,1]]]]]};
const factions=[{id:'blue',ui_color_primary:'#214a8a'},{id:'red',ui_color_primary:'#a62925'}];
const together=frontiersFromTopology(topology,{a:'blue',b:'blue'},factions);assert.equal(together.features.length,1);assert.equal(together.features[0].geometry.coordinates.length,2,'Shared internal arc must disappear');
const apart=frontiersFromTopology(topology,{a:'blue',b:'red'},factions),shared=apart.features.filter(f=>f.properties.offset!==0);assert.equal(shared.length,2);assert.equal(new Set(shared.map(f=>f.properties.edgeColor)).size,2);assert.equal(JSON.stringify(shared.map(f=>f.properties.offset).sort()),'[-1,1]');
assert.equal(frontiersFromTopology(topology,{},factions).features.length,0);assert.notEqual(factionMapColor('#214a8a'),factionMapColor('#a62925'));
const {upgradeAtlas}=load('lib/atlas-upgrade.ts'),{provinceCollection}=load('lib/terrain-map.ts'),data=upgradeAtlas(JSON.parse(fs.readFileSync('lib/seed.json'))),provinces=JSON.parse(fs.readFileSync('public/provinces.json')).features;
const rows=Array.isArray(provinces)?provinces:JSON.parse(fs.readFileSync('public/provinces.json')).provinces;
const baked=JSON.parse(fs.readFileSync('public/map-art/faction-topology-v2.json'));assert.equal(baked.provinceIds.length,4598);assert.ok(baked.arcs.every(([a,b,paths])=>a>=0&&a<4598&&b<4598&&paths.every(line=>line.length>=2)));
// Regression from the actual user screenshot: landlocked Spanish provinces must
// never be classified as open coastline just because neighbour vertices differ.
for(const id of ['ESP-5837','ESP-5825','ESP-5831','ESP-5807','ESP-5811','ESP-5841','ESP-5852']){const index=baked.provinceIds.indexOf(id);assert.ok(index>=0);assert.ok(!baked.arcs.some(([a,b])=>a===index&&b===-1),'False province outline survives at '+id);}
assert.equal(baked.version,2);
if(process.argv.includes('--proof'))fs.writeFileSync('/workspace/scratch/frontier-proof.json',JSON.stringify(frontiersFromTopology(baked,data.territories['1715'],data.factions)));
const reports=[];
for(const year of ['1715','1716']){const start=performance.now(),borders=frontiersFromTopology(baked,data.territories[year],data.factions),ms=performance.now()-start;assert.ok(borders.features.length>20&&borders.features.length<100);const owners=new Set(Object.values(data.territories[year]));assert.ok(borders.features.every(f=>owners.has(f.properties.owner)));reports.push({year,groups:borders.features.length,paths:borders.features.reduce((s,f)=>s+f.geometry.coordinates.length,0),runtime_ms:Math.round(ms),payload_KiB:Math.round(JSON.stringify(borders).length/1024)});}
const component=fs.readFileSync('app/components/TerrainMap.tsx','utf8');assert.ok(component.includes('button.dataset.factionId===f.id'));assert.ok(!component.includes('factionFrontiers(collection)'));assert.ok(component.includes('if(!loaded)return;let disposed=false;'));assert.ok(!component.includes("a.ui_color_secondary||'#d4c08d'"));assert.ok(!component.includes("setPaintProperty('selected-aura','line-color'"));
console.log(JSON.stringify({passed:true,internal_edges_removed:true,shared_border_two_colors:true,colors:data.factions.length,years:reports}));
