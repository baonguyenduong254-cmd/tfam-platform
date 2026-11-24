import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import ts from 'typescript';
function load(file){file=path.resolve(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(id=>load(path.resolve(path.dirname(file),id.endsWith('.json')?id:id+'.ts')),m,m.exports);return m.exports;}
const {factionThemes,factionTheme,royalThemeVariables}=load('lib/faction-theme.ts'),seed=load('lib/seed.json'),{withCastilianPresentation,belongsToFaction}=load('lib/castilian-presentation.ts'),{courtGroup}=load('lib/character-attributes.ts');
function luminance(hex,ground='#0d0914'){
 const channels=(color)=>color.slice(1).match(/../g).map(pair=>parseInt(pair,16)/255);
 const [r,g,b,alpha=1]=channels(hex);
 const background=channels(ground);
 return [r,g,b].map((value,index)=>value*alpha+background[index]*(1-alpha))
  .map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4)
  .reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
}
function contrast(a,b,ground){const x=luminance(a,ground),y=luminance(b,ground);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('all 24 factions have distinct light palettes and readable text and accents',()=>{assert.equal(Object.keys(factionThemes).length,seed.factions.length);const unique=new Set();for(const f of seed.factions){const p=factionThemes[f.id];assert.ok(p,f.id);unique.add(JSON.stringify(p));for(const bg of [p.paper,p.surface,p.wash]){assert.ok(luminance(bg)>.6,f.id+' light surface');assert.ok(contrast(p.ink,bg)>=4.5,f.id+' body ink');assert.ok(contrast(p.accent,bg)>=4.5,f.id+' interactive accent');}}assert.equal(unique.size,seed.factions.length);assert.deepEqual(factionTheme('unknown'),factionThemes.castilian_empire);});
test('night palettes keep readable foregrounds and faction-specific colors',()=>{
 const castile=royalThemeVariables('castilian_empire');
 const morocco=royalThemeVariables('sultanate_of_morocco');
 assert.notEqual(morocco['--royal-accent'],castile['--royal-accent']);
 assert.deepEqual(royalThemeVariables('unknown'),castile);
 for(const theme of [castile,morocco,royalThemeVariables('annam_empire'),royalThemeVariables('novgorod_union')]){
  for(const surface of ['paper','surface','wash']){
   for(const foreground of ['ink','accent']){
    assert.ok(contrast(theme['--royal-'+foreground],theme['--royal-'+surface],theme['--royal-paper'])>=4.5);
   }
  }
  assert.equal(theme['--world-ground'],theme['--royal-paper']);
  assert.equal(theme['--world-accent'],theme['--royal-accent']);
 }
});
test('Castilian expansion preserves Moor origins, actual guard numbers and a separate household',()=>{const data=withCastilianPresentation(seed);for(const [id,n] of [['nahla_al_fassi',44],['samira_al_fassi',55],['jesper',68],['barbossa',37],['leonardo_razen',100]]){const c=data.characters.find(c=>c.id===id);assert.ok(belongsToFaction(c,'castilian_empire'),id);assert.equal(c.guard_number,n);assert.equal(courtGroup(c),'guard');}for(const id of ['nahla_al_fassi','samira_al_fassi'])assert.equal(data.characters.find(c=>c.id===id).faction_id,'sultanate_of_morocco');for(const id of ['millennia_stones','remi_spencer','dante_stones'])assert.equal(courtGroup(data.characters.find(c=>c.id===id)),'household');assert.equal(data.characters.filter(c=>belongsToFaction(c,'castilian_empire')).length,28);});
test('revision 31 migration changes authorised art but preserves existing prose and later editor saves',()=>{const data={presentationRevision:31,characters:[{id:'juliet_spencer',faction_id:'england_ruins',lore_vi:'Authored text',portrait_asset:'old.webp'}],factions:[]};const next=withCastilianPresentation(data);const j=next.characters.find(c=>c.id==='juliet_spencer');assert.equal(j.lore_vi,'Authored text');assert.equal(j.faction_id,'england_ruins');assert.match(j.portrait_asset,/royal32/);j.portrait_asset='custom.webp';assert.strictEqual(withCastilianPresentation(next),next);assert.equal(j.portrait_asset,'custom.webp');});
test('all expansion portraits and thumbnails are real decodable WebP assets',()=>{for(const c of load('lib/castilian-expansion-20261029.json'))for(const key of ['portrait_asset','portrait_thumbnail']){const image=fs.readFileSync('public'+c[key]);assert.equal(image.toString('ascii',0,4),'RIFF',c.id);assert.equal(image.toString('ascii',8,12),'WEBP',c.id);assert.ok(image.length>1000);}});

test('revision 32 adds Lokoh as an independent guard without resetting existing editorial changes',()=>{const existing={id:'juliet_spencer',lore_vi:'Saved prose',portrait_asset:'saved.webp'};const next=withCastilianPresentation({presentationRevision:32,characters:[existing],factions:[]});assert.deepEqual(next.characters[0],existing);const lokoh=next.characters.find(c=>c.id==='lokoh');assert.equal(lokoh.guard_number,90);assert.equal(courtGroup(lokoh),'guard');assert.ok(belongsToFaction(lokoh,'castilian_empire'));assert.match(lokoh.portrait_asset,/royal33/);assert.strictEqual(withCastilianPresentation(next),next);});
