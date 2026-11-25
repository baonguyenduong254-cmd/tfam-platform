import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

function load(file){
 file=path.resolve(file);
 if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(id=>load(path.resolve(path.dirname(file),id.endsWith('.json')?id:id+'.ts')),module,module.exports);
 return module.exports;
}

const {RATING_AXES,characterRating,gradeForScore}=load('lib/character-rating.ts');
const {withCastilianPresentation}=load('lib/castilian-presentation.ts');
const seed=load('lib/seed.json');

test('6-pillar character rating produces bounded scores, grades, and distinct silhouettes',()=>{
 const data=withCastilianPresentation(seed);
 const isabella=data.characters.find(c=>c.id==='isabella_testarossa_de_aragon');
 const testarossa=data.characters.find(c=>c.id==='testarossa_uno');
 assert.ok(isabella&&testarossa,'Expected canonical Castilian characters');

 const rIsa=characterRating(isabella);
 const rTes=characterRating(testarossa);
 assert.ok(rIsa&&rTes);

 for(const axis of RATING_AXES){
  assert.ok(rIsa.scores[axis.key]>=40&&rIsa.scores[axis.key]<=99);
  assert.ok(rTes.scores[axis.key]>=40&&rTes.scores[axis.key]<=99);
  assert.equal(rIsa.grades[axis.key],gradeForScore(rIsa.scores[axis.key]));
 }
 assert.equal(rIsa.archetype,'Sovereign Architect');
 assert.ok(rIsa.scores.presence>rIsa.scores.martial,'Sovereign should favor Presence over Martial');
 assert.ok(rTes.scores.martial>rTes.scores.statecraft,'Royal Guard vanguard should favor Martial over Statecraft');
});

test('authored rating_axes overrides take precedence over derived axes',()=>{
 const data=withCastilianPresentation(seed);
 const isabella=data.characters.find(c=>c.id==='isabella_testarossa_de_aragon');
 const custom=characterRating({...isabella,rating_axes:{martial:99,vestigium:60}});
 assert.ok(custom);
 assert.equal(custom.scores.martial,99);
 assert.equal(custom.grades.martial,'EX');
 assert.equal(custom.scores.vestigium,60);
 assert.equal(custom.grades.vestigium,'C');
});
