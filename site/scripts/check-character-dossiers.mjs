import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import ts from 'typescript';import {createRequire} from 'node:module';
const nativeRequire=createRequire(import.meta.url),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const box={exports:{}};cache.set(file,box);const require=specifier=>{if(!specifier.startsWith('.'))return nativeRequire(specifier);let target=path.resolve(path.dirname(file),specifier);if(fs.existsSync(target)&&target.endsWith('.json'))return JSON.parse(fs.readFileSync(target,'utf8'));if(!path.extname(target))target+=fs.existsSync(target+'.ts')?'.ts':'.tsx';return load(target);};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInNewContext(js,{exports:box.exports,require,structuredClone,console},{filename:file});return box.exports;}
const patch=JSON.parse(fs.readFileSync('lib/character-dossiers-v24.json','utf8'));
const {upgradeAtlas}=load('lib/atlas-upgrade.ts'),{upgradeCharacterDossiers}=load('lib/character-dossiers.ts');
assert.equal(patch.updates.length,72);assert.equal(new Set(patch.updates.map(u=>u.id)).size,72);
const base={atlasRevision:23,characters:patch.updates.map(u=>({id:u.id,name:u.id,portrait_asset:'/portraits/'+u.id+'.webp',...structuredClone(u.before)})),factions:[{id:'sentinel'}],units:[{id:'unit'}],territories:{'1715':{a:'b'}},chapters:[{id:'chapter'}],timeline:[{id:'1715'}]};
const result=structuredClone(base);upgradeCharacterDossiers(result);result.atlasRevision=24;assert.equal(result.atlasRevision,24);assert.equal(base.atlasRevision,23);
for(const [i,u] of patch.updates.entries()){
 const c=result.characters[i];for(const [key,value]of Object.entries(u.after))assert.equal(JSON.stringify(c[key]),JSON.stringify(value),u.id+':'+key);
 assert.equal(c.portrait_asset,base.characters[i].portrait_asset);assert.equal(c.name,base.characters[i].name);
 for(const lang of ['vi','en']){
  assert.equal(c['lore_'+lang].split(/\n\s*\n/).length,2,u.id+' needs two biography paragraphs');
  assert.ok(c['lore_'+lang].length>350,u.id+' biography too short');
  assert.doesNotMatch(c['lore_'+lang],/1716|1717|Palermo|Starfall|Octava|Nueve|placeholder|\bArc\s*[IVX]+\b/i,u.id+' contains later-event or draft vocabulary');
  for(const group of ['traits','skills']){const values=c[group+'_'+lang];assert.equal(values.length,3);for(const text of values){assert.ok(text.includes(': '));assert.ok(text.length>35);}}
 }
}
for(const key of ['factions','units','territories','chapters','timeline'])assert.equal(JSON.stringify(result[key]),JSON.stringify(base[key]));
assert.equal(JSON.stringify(upgradeCharacterDossiers(structuredClone(result))),JSON.stringify(result));
const edited=structuredClone(base);edited.characters[0].lore_vi='Author changed this source';edited.characters[1].skills_en=['Author ability'];edited.characters.push({id:'author_new',lore_vi:'Keep',portrait_asset:'/custom.png'});upgradeCharacterDossiers(edited);assert.equal(edited.characters[0].lore_vi,'Author changed this source');assert.equal(edited.characters[0].lore_en,base.characters[0].lore_en);assert.deepEqual(edited.characters[1].skills_en,['Author ability']);assert.equal(edited.characters.at(-1).portrait_asset,'/custom.png');
const React=nativeRequire('react'),{renderToStaticMarkup}=nativeRequire('react-dom/server');const Component=load('app/components/CharacterDossier.tsx').default;
for(const lang of ['vi','en']){const html=renderToStaticMarkup(React.createElement(Component,{character:{...result.characters[0],status:{'1715':'STATUS_SENTINEL'},role_vi:'ROLE_SENTINEL'},lang}));assert.equal((html.match(/<section /g)||[]).length,3);assert.equal((html.match(/<li /g)||[]).length,6);assert.ok(!html.includes('STATUS_SENTINEL')&&!html.includes('ROLE_SENTINEL'));assert.ok(html.includes(lang==='vi'?'Tiểu sử':'Lore'));}
console.log('72 bilingual dossiers: migration, prelude vocabulary, three-section rendering, portraits, editor changes and unrelated content checks passed.');
