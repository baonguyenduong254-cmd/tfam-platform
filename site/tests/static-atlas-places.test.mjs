import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(id=>load(path.resolve(path.dirname(file),id.endsWith('.json')?id:id+'.ts')),module,module.exports);return module.exports;}
const {atlasPlaces,placeLabels}=load('lib/static-atlas-places.ts');
const {mapRegion}=load('lib/map-regions.ts');
const seed=load('lib/seed.json');
test('regional atlas shows national capitals and several named Castilian towns',()=>{const places=atlasPlaces(seed,'1715','castilian_empire',mapRegion('castilian_empire'));assert.equal(new Set(places.map(c=>c.id)).size,places.length);const own=places.filter(p=>p.selected);assert.equal(own.length,5);assert.ok(own.some(p=>p.name==='Madrid'&&p.capital));assert.ok(places.some(p=>p.name==='Paris'&&p.capital&&p.owner==='holy_french_kingdom'));assert.ok(own.every(p=>p.name!=='Placeholder'&&p.flag));assert.ok(places.some(p=>p.name==='Copenhagen'&&p.capital&&p.owner==='danes_kingdom'));assert.ok(!places.some(p=>p.name==='Stockholm'&&p.capital));});
test('Ottoman capital changes with map year and secondary cities follow their controllers',()=>{const p15=atlasPlaces(seed,'1715','ottoman_empire',mapRegion('ottoman_empire'));const p16=atlasPlaces(seed,'1716','ottoman_empire',mapRegion('ottoman_empire'));assert.ok(p15.some(c=>c.name==='Bursa'&&c.owner==='ottoman_empire'&&c.capital));assert.ok(p16.some(c=>c.name==='Baghdad'&&c.owner==='ottoman_empire'&&c.capital));assert.ok(!p16.some(c=>c.name==='Bursa'&&c.owner==='ottoman_empire'));});
test('label layout stays within narrow and wide regional maps',()=>{for(const width of [320,1000]){const region=mapRegion('castilian_empire'),places=placeLabels(atlasPlaces(seed,'1715','castilian_empire',region),region,width),height=width*(region.bounds[3]-region.bounds[1])/(region.bounds[2]-region.bounds[0]);for(const p of places){const x=p.x/100*width+p.dx,y=p.y/100*height+p.dy;assert.ok(x>=0&&x+p.labelWidth<=width);assert.ok(y>=0&&y+23<=height);assert.ok(Number.isFinite(p.dx)&&Number.isFinite(p.dy));}}});
test('all national capitals resolve to existing atlas records',()=>{const catalog=load('lib/static-atlas-cities.json');for(const f of seed.factions)assert.ok(catalog.cities.some(c=>c.id===catalog.capitals[f.id]),f.id);});
