import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(id=>load(path.resolve(path.dirname(file),id+'.ts')),module,module.exports);cache.set(file,module.exports);return module.exports;}
const {mapRegion,mapRegionLimits,inMapRegion}=load('lib/map-regions.ts');
const {regionalTerrainStyle}=load('lib/map-modes.ts');
const seed=JSON.parse(fs.readFileSync('lib/seed.json','utf8'));
test('every published faction has a finite regional camera within Mercator limits',()=>{for(const faction of seed.factions){const r=mapRegion(faction.id),[w,s,e,n]=r.bounds;assert.ok(w<e&&s<n&&e-w<180&&n-s<120,faction.id);const [[lw,ls],[le,ln]]=mapRegionLimits(r);assert.ok(lw<=w&&ls<=s&&le>=e&&ln>=n);assert.ok(lw>=-180&&le<=180&&ls>=-85&&ln<=85);if(faction.map_position)assert.ok(inMapRegion(faction.map_position,r),faction.id);}});
test('European selection preserves a shared frame containing Europe, North Africa and the Near East',()=>{const r=mapRegion('castilian_empire');assert.equal(mapRegion('holy_french_kingdom').id,r.id);assert.equal(mapRegion('western_roman_empire').id,r.id);for(const p of [[-9.14,38.72],[2.35,48.86],[12.5,41.9],[31.2,30],[28.98,41],[44.36,33.31]])assert.ok(inMapRegion(p,r));assert.ok(!inMapRegion([139.7,35.7],r));assert.notEqual(mapRegion('annam_empire').id,r.id);});
test('regional map style contains physical relief and national boundaries without administrative rendering',()=>{const style=regionalTerrainStyle('https://example.test');assert.equal(style.projection.type,'mercator');assert.ok(!style.terrain);assert.ok(!style.sources.provinces);assert.ok(style.sources['natural-earth-terrain'].tiles[0].includes('/frost-terrain/'));assert.equal(new Set(style.layers.map(l=>l.id)).size,style.layers.length);for(const layer of style.layers){assert.ok(!/province|transferred/.test(layer.id),layer.id);if(layer.source)assert.ok(style.sources[layer.source],layer.id);}assert.ok(style.layers.some(l=>l.id==='faction-frontier-color'));});
