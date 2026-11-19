import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync('app/page.tsx','utf8');
const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const functions=new Map();let restoreEffect='';
function visit(node){
 if(ts.isFunctionDeclaration(node)&&node.name)functions.set(node.name.text,node.getText(ast));
 if(ts.isCallExpression(node)&&node.expression.getText(ast)==='useEffect'&&node.arguments[0]?.getText(ast).includes("history.scrollRestoration='manual'"))restoreEffect=node.arguments[0].getText(ast);
 ts.forEachChild(node,visit);
}
visit(ast);
function compile(code,context){const js=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;return vm.runInNewContext(js,context);}
function frames(){let count=0;const queued=new Map();return {request:fn=>{queued.set(++count,fn);return count;},cancel:id=>queued.delete(id),flush(){const batch=[...queued.values()];queued.clear();batch.forEach(fn=>fn());},get size(){return queued.size;}};}

test('rapid route changes align only the newest module, with one scroll per destination',async()=>{
 const pending=[],scrolls=[],context={f:{id:'castilian_empire'},year:'1715',archiveSection:'characters',atlasRef:{current:{offsetHeight:80}},contentRef:{current:{getBoundingClientRect:()=>({top:300})}},window:{scrollY:400,scrollTo:value=>scrolls.push(value)},setTab:()=>{},setProvince:()=>{},setArchiveSection:()=>{},openRoom:()=>{},navigate:(hash,update)=>{update();return new Promise(resolve=>pending.push({hash,resolve}));}};
 compile(['alignModule','goTab','openDestination'].map(name=>functions.get(name)).join('\n')+'\nglobalThis.open=openDestination;',context);
 context.open('military');context.open('atlas');
 assert.deepEqual(pending.map(p=>p.hash),['#military/castilian_empire','#atlas/castilian_empire/1715']);
 pending[0].resolve(false);pending[1].resolve(true);await Promise.resolve();
 assert.equal(scrolls.length,1);assert.equal(scrolls[0].top,620);assert.equal(scrolls[0].behavior,'instant');
});

test('the real transition reports superseded navigation without swallowing either update',async()=>{
 const raf=frames(),committed=[],context={transitionId:{current:0},contentRef:{current:null},activeAnimation:{current:null},activeView:{current:null},curtainRef:{current:null},atlasRef:{current:null},motion:false,flushSync:fn=>fn(),requestAnimationFrame:raf.request};
 compile(functions.get('transition')+'\nglobalThis.run=transition;',context);
 const first=context.run(()=>committed.push('first')),second=context.run(()=>committed.push('second'));
 raf.flush();
 assert.equal(await first,false);assert.equal(await second,true);assert.deepEqual(committed,['first','second']);
});

function restoreHarness(pathname='/',hash='#archive/castilian_empire/characters'){
 const raf=frames(),calls=[],listeners={},location={pathname,hash};
 const history={scrollRestoration:'auto',state:{tfamRoute:hash,tfamScroll:550}};
 const context={section:'faction',location,history,transitionId:{current:0},requestAnimationFrame:raf.request,cancelAnimationFrame:raf.cancel,window:{addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:name=>delete listeners[name],scrollTo:value=>calls.push(value)},data:{factions:[{id:'castilian_empire'}],characters:[]},reopenVoyage:()=>calls.push('entry'),openRoom:()=>calls.push('push-room'),setSelected:()=>{},setTab:()=>{},setYear:()=>{},setArchiveSection:()=>{},setRequestedCharacter:()=>{},setChar:()=>{},setFactionThemeReady:()=>{},belongsToFaction:()=>false,localStorage:{getItem:()=>null}};
 const cleanup=compile('('+restoreEffect+')()',context);
 return {raf,calls,listeners,location,history,cleanup};
}
test('Back into another global room never pushes a new history entry from the faction listener',()=>{
 const harness=restoreHarness('/chronicles','#reader/book1_ch1');
 assert.deepEqual(harness.calls,[]);assert.equal(harness.raf.size,0);
 harness.location.pathname='/vestigium';harness.location.hash='#vestigium/mineral';harness.listeners.popstate();
 assert.deepEqual(harness.calls,[]);harness.cleanup();
});
test('route restoration is canceled if another route or unmount wins before its second frame',()=>{
 const first=restoreHarness();first.raf.flush();first.location.hash='#atlas/castilian_empire/1715';first.raf.flush();assert.deepEqual(first.calls,[]);first.cleanup();
 const second=restoreHarness();second.raf.flush();second.cleanup();second.raf.flush();assert.deepEqual(second.calls,[]);assert.equal(second.history.scrollRestoration,'auto');
 const current=restoreHarness();current.raf.flush();current.raf.flush();assert.equal(current.calls.length,1);assert.equal(current.calls[0].top,550);current.cleanup();
});
