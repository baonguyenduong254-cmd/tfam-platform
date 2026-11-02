import test from 'node:test';
import assert from 'node:assert/strict';
import {canExplore,milestoneState,unlockRequirements,factionGroups} from '../lib/discovery.ts';
const milestone={id:'arc-1',title:'Arc I',closed:true,required:['vi-1','vi-2','extra'],englishCoverage:{'en-a':['vi-1'],'en-b':['vi-2','extra']}};
const catalog=['vi-1','vi-2','extra','en-a','en-b'].map(id=>({id,complete:true}));
test('only Castilian and Moor start unlocked, unknown factions stay locked',()=>{
 for(const group of factionGroups)for(const id of group.ids)assert.equal(canExplore(id,new Set()),['castilian_empire','sultanate_of_morocco'].includes(id));
 assert.equal(canExplore('unknown',new Set()),false);
});
test('every chapter and side chapter is required; merely visiting is not read',()=>{
 assert.equal(milestoneState(milestone,new Set(['vi-1','vi-2']),catalog).earned,false);
 assert.equal(milestoneState(milestone,new Set(milestone.required),catalog).earned,true);
});
test('verified content coverage permits either language and mixed editions',()=>{
 assert.equal(milestoneState(milestone,new Set(['en-a','en-b']),catalog).earned,true);
 assert.equal(milestoneState(milestone,new Set(['vi-1','en-b']),catalog).earned,true);
 assert.equal(milestoneState({...milestone,englishCoverage:{}},new Set(['en-a','en-b']),catalog).earned,false);
});
test('open arcs, unavailable chapters and empty side stories cannot grant achievements',()=>{
 assert.equal(milestoneState({...milestone,closed:false},new Set(milestone.required),catalog).earned,false);
 assert.equal(milestoneState(milestone,new Set(milestone.required),catalog.filter(c=>c.id!=='extra'&&c.id!=='en-b')).earned,false);
 assert.equal(milestoneState({...milestone,required:[]},new Set(),catalog).earned,false);
});
test('Arc VI unlocks exactly three Revolt slots; later milestones remain independent',()=>{
 for(const id of ['veldraine','nhemora','khorvait']){assert.equal(unlockRequirements[id],'arc-6');assert.equal(canExplore(id,new Set(['arc-5'])),false);assert.equal(canExplore(id,new Set(['arc-6'])),true);}
 assert.equal(unlockRequirements.aksumite_empire,'arc-3');assert.equal(unlockRequirements.merina_empire,'arc-5');assert.equal(unlockRequirements.ming_celestial_empire,'arc-14');
});
test('split English chapters require every segment before covering a Vietnamese chapter',()=>{
 const m={...milestone,required:['vi-1'],englishCoverage:{},contentEquivalents:{'vi-1':['en-a','en-b']}};
 assert.equal(milestoneState(m,new Set(['en-a']),catalog).earned,false);
 assert.equal(milestoneState(m,new Set(['en-a','en-b']),catalog).earned,true);
 assert.equal(milestoneState(m,new Set(['en-a','en-b']),catalog.filter(c=>c.id!=='en-b')).earned,false);
});
