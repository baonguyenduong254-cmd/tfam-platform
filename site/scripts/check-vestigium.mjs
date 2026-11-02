import {mediaExists,mediaSize} from './media-assets.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const groups=['mineral','botanical','creature','material','device','armament','phenomenon','entity','complex'];
const records=groups.flatMap(g=>JSON.parse(fs.readFileSync(`content/vestigium/${g}.json`,'utf8')));
const manifest=JSON.parse(fs.readFileSync('public/vestigium/manifest.json','utf8'));
const sourceFlag=process.argv.indexOf('--sources-dir'),sourceDir=sourceFlag<0?null:process.argv[sourceFlag+1];
const norm=s=>s.normalize('NFC').replace(/\s+/gu,' ').trim().toLocaleLowerCase();
const volumes=sourceDir?Object.fromEntries([1,2,3,4].map(n=>[n,norm(fs.readFileSync(path.join(sourceDir,`vol-${n}.txt`),'utf8'))])):{};
const byId=new Map(records.map(m=>[m.id,m]));
assert.equal(byId.size,records.length,'Duplicate IDs');assert.equal(manifest.count,records.length,'Stale manifest');
let illustrated=0,canonical=0,anchors=0;
for(const group of groups){
 const source=records.filter(m=>m.category===group),output=JSON.parse(fs.readFileSync(`public/vestigium/${group}.json`,'utf8'));
 assert.equal(output.length,source.length);assert.equal(JSON.stringify(output).includes('docs.google.com'),false,'Private manuscript URL exposed');
 assert.ok(source.length>0,`${group}: empty category`);
 for(const published of output){
  const m=byId.get(published.id);assert.ok(m);assert.equal(published.art,undefined,'Art brief leaked');
  assert.deepEqual(published.sources,m.sources.map(({volume,chapter})=>({volume,chapter})),'Source detail leakage');
  for(const key of ['name','form','lore','use','limits','rarity_note'])for(const lang of ['vi','en'])assert.equal(published[`${key}_${lang}`],m[`${key}_${lang}`],`${m.id}: stale translation`);
  if(published.artwork){illustrated++;for(const file of [published.artwork,published.thumbnail]){assert.ok(file?.startsWith('/vestigium/'));assert.ok(mediaExists(file)&&mediaSize(file)>1000,`${m.id}: empty art`);}}
  if(m.origin==='canon'){canonical++;assert.ok(m.sources.length);for(const s of m.sources){assert.ok(s.tab_id&&s.anchor);if(sourceDir)assert.ok(volumes[s.volume].includes(norm(s.anchor)),`${m.id}: unmatched anchor`);anchors++;}}
  else assert.equal(m.sources.length,0,`${m.id}: invented source`);
 }
}
assert.equal(manifest.illustrated,illustrated);assert.equal(manifest.canon,canonical);
assert.equal(byId.get('entity-testarossa').rarity,5);assert.equal(byId.get('device-004').rarity,7);
for(const id of ['device-003']){assert.equal(byId.get(id).rarity,4,'Royal Guard pendants are Wondrous');assert.ok(/lion-face/i.test(byId.get(id).art.description),'Royal Guard pendant must show a numbered lion face');}
assert.ok(/rapier/i.test(byId.get('armament-winterthorn').art.description));
const guard=JSON.parse(fs.readFileSync('public/vestigium/royal-guard.json','utf8'));assert.equal(guard.filter(m=>m.royal_guard.relation==='representative').length,1);assert.equal(byId.has('device-065'),false,'Duplicate pendant dossier');assert.equal(byId.get('device-003').quantity.count,100);for(const m of records){assert.ok(m.skills.length<=m.rarity+1,m.id+': core skill cap');assert.ok(m.quantity,m.id+': abundance');if(m.royal_guard?.relation==='deployment'){assert.ok(m.name_vi.startsWith(m.royal_guard.label+'. '));assert.ok(m.rarity>=4);assert.equal(m.royal_guard.parent_id,'device-003');}}
if(process.argv.includes('--require-guard-100')){const numbers=new Set(guard.filter(m=>m.royal_guard.relation==='deployment').map(m=>m.royal_guard.number));for(let n=1;n<=100;n++)assert.ok(numbers.has(n),'Missing Guard number '+n);}
if(process.argv.includes('--require-art'))assert.equal(illustrated,records.length,'Artwork incomplete');
console.log(JSON.stringify({records:records.length,categories:groups.length,canonical,anchors,sourceAnchorsVerified:!!sourceDir,illustrated}));
