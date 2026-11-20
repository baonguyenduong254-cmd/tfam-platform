import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
const cutouts=JSON.parse(fs.readFileSync('lib/character-cutouts.json','utf8'));
const module={exports:{}};
const code=ts.transpileModule(fs.readFileSync('lib/character-artwork.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{module,exports:module.exports,URL,require:id=>{assert.equal(id,'./character-cutouts.json');return cutouts;}});
const {characterCutout,characterArtwork}=module.exports;
test('approved portrait source paths select full and thumbnail derivatives',()=>{
 for(const [id,record] of Object.entries(cutouts)){
  for(const source of [record.source,record.source+'?version=34#portrait','https://example.test'+record.source]){
   const character={id,portrait_asset:source};
   assert.equal(characterCutout(character),record.full);
   assert.equal(characterArtwork(character),record.full);
   assert.equal(characterArtwork(character,true),record.thumbnail);
  }
 }
});
test('later custom portraits and missing portraits retain their authored behavior',()=>{
 const id=Object.keys(cutouts)[0],custom={id,portrait_asset:'https://author.example/custom-approved.webp',portrait_thumbnail:'https://author.example/custom-thumb.webp'};
 assert.equal(characterCutout(custom),undefined);
 assert.equal(characterArtwork(custom),custom.portrait_asset);
 assert.equal(characterArtwork(custom,true),custom.portrait_thumbnail);
 assert.equal(characterArtwork({...custom,portrait_thumbnail:undefined},true),custom.portrait_asset);
 assert.equal(characterCutout({id}),undefined);
 assert.equal(characterArtwork({id}),undefined);
 assert.equal(characterArtwork({id},true),undefined);
 assert.equal(characterArtwork({id,portrait_asset:null}),null);
});
test('all 30 mappings retain originals and have full/320px alpha WebP exports',()=>{
 assert.equal(Object.keys(cutouts).length,30);
 const outputs=new Set();
 for(const record of Object.values(cutouts)){
  assert.ok(fs.existsSync(path.join('public',record.source)),record.source);
  for(const key of ['full','thumbnail']){
   assert.ok(!outputs.has(record[key]),'each derivative has its own output');outputs.add(record[key]);
   const bytes=fs.readFileSync(path.join('public',record[key]));
   assert.equal(bytes.toString('ascii',0,4),'RIFF',record[key]);
   assert.equal(bytes.toString('ascii',8,12),'WEBP',record[key]);
   assert.equal(bytes.toString('ascii',12,16),'VP8X',record[key]+' has extended alpha metadata');
   assert.ok(bytes[20]&0x10,record[key]+' declares an alpha channel');
   const width=bytes.readUIntLE(24,3)+1,height=bytes.readUIntLE(27,3)+1;
   assert.ok(width>0&&height>0,record[key]);
   if(key==='thumbnail')assert.equal(width,320,record[key]);
  }
 }
});
let sharp;
try{sharp=(await import('sharp')).default;}catch{}
if(!sharp&&fs.existsSync('node_modules/.pnpm')){
 const installed=fs.readdirSync('node_modules/.pnpm').find(name=>name.startsWith('sharp@'));
 if(installed)try{
  const directory=path.resolve('node_modules/.pnpm',installed,'node_modules/sharp');
  const entry=JSON.parse(fs.readFileSync(path.join(directory,'package.json'),'utf8')).main;
  sharp=(await import(pathToFileURL(path.resolve(directory,entry)).href)).default;
 }catch{}
}
test('Sharp independently decodes every alpha derivative when installed',{skip:!sharp&&'Sharp is not installed in the current dependency tree'},async()=>{
 for(const record of Object.values(cutouts))for(const key of ['full','thumbnail']){
  const metadata=await sharp(path.join('public',record[key])).metadata();
  assert.equal(metadata.format,'webp');assert.equal(metadata.hasAlpha,true,record[key]);
  if(key==='thumbnail')assert.equal(metadata.width,320);
 }
});
