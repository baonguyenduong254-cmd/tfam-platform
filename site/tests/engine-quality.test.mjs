import test from 'node:test';
import assert from 'node:assert/strict';
import {qualitySettings,seeded,clampProgress} from '../lib/engine/quality.ts';
test('quality tiers cap GPU work and particle allocation',()=>{const q=Object.values(qualitySettings);assert.ok(q.every(s=>s.particles<=2200&&s.dpr<=1.65&&s.transmissionResolution<=256));for(let i=1;i<q.length;i++){assert.ok(q[i].particles>q[i-1].particles);assert.ok(q[i].dpr>q[i-1].dpr);}});
test('deterministic staging and fracture values remain finite and bounded',()=>{for(let i=0;i<1000;i++){assert.equal(seeded(i),seeded(i));assert.ok(seeded(i)>=0&&seeded(i)<1);}assert.deepEqual([-1,0,.5,1,2,NaN,Infinity].map(clampProgress),[0,0,.5,1,1,0,0]);});
