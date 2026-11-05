import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const module={exports:{}};
const code=ts.transpileModule(fs.readFileSync('lib/presentation-punctuation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{module,exports:module.exports});
const {presentationPunctuation:format}=module.exports;
test('reader prose receives context-sensitive punctuation without changing words',()=>{
 assert.equal(format('El Escorial — The Dynastic Repository'),'El Escorial, The Dynastic Repository');
 assert.equal(format('The guard — already wounded — returned.'),'The guard (already wounded) returned.');
 assert.equal(format('Wait—then listen.'),'Wait, then listen.');
 assert.equal(format('— Speak.\n— Listen.'),'Speak.\nListen.');
 assert.equal(format('No.—Enough.'),'No. Enough.');
 assert.equal(format('He stopped—'),'He stopped.');
 assert.equal(format('—'),'Not recorded');
 assert.equal(format('—','Chưa ghi nhận'),'Chưa ghi nhận');
});
test('protected tokens and other dash characters remain exact; formatting is idempotent',()=>{
 const text='fleet-id -12 1715–1716 https://example.test/a—b `x—y` [link](https://example.test/a—b)';
 assert.equal(format(text),text);
 assert.equal(format('```\nconst x="a—b";\n```'),'```\nconst x="a—b";\n```');
 assert.equal(format('## Court — a guide\n[Realm — court](https://example.test/a—b)'), '## Court, a guide\n[Realm, court](https://example.test/a—b)');
 const result=format('Name — the captain — spoke—quietly.');
 assert.equal(format(result),result);
});
test('bundled reader prose is formatted without altering its source records',()=>{
 const source=fs.readFileSync('lib/story/english-book1.json','utf8'),chapters=JSON.parse(source);
 const values=[];
 function collect(value){if(typeof value==='string'&&value.includes('\u2014'))values.push(value);else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')Object.values(value).forEach(collect);}
 collect(chapters);
 assert.ok(values.length,'real authored prose fixture contains em dashes');
 for(const value of values)assert.ok(!format(value).includes('\u2014'));
 assert.equal(fs.readFileSync('lib/story/english-book1.json','utf8'),source);
});
test('the actual dossier display selector preserves arrays and objects',()=>{
 const source=fs.readFileSync('app/components/CharacterDossier.tsx','utf8');
 const selector=source.match(/const local=\(key:string\)=>\{[^\n]+?\};/)?.[0];
 assert.ok(selector,'dossier has a scalar-only presentation selector');
 const traits=['Guard — sworn'],office={title:'Author office'},character={traits_en:traits,office_en:office,name_en:'Name — court'};
 const snippet=ts.transpileModule(selector+'globalThis.result=[local("traits"),local("office"),local("name")];',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const context={character,lang:'en',presentationPunctuation:format};
 vm.runInNewContext(snippet,context);
 assert.strictEqual(context.result[0],traits);
 assert.strictEqual(context.result[1],office);
 assert.equal(context.result[2],'Name, court');
 assert.deepEqual(traits,['Guard — sworn']);
});
