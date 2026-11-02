import test from 'node:test';
import assert from 'node:assert/strict';
import {pointerPose} from '../lib/motion/pointer.ts';
test('pointer tilt is centered and bounded outside a card',()=>{assert.deepEqual(pointerPose(50,50,100,100),{rotationX:-0,rotationY:0,spotX:50,spotY:50});const p=pointerPose(999,-999,100,100);assert.equal(p.rotationX,6);assert.equal(p.rotationY,6);assert.equal(p.spotX,100);assert.equal(p.spotY,0);});
test('empty geometry and malformed coordinates remain finite',()=>{for(const x of [NaN,Infinity,-Infinity,0])assert.ok(Object.values(pointerPose(x,x,0,0)).every(Number.isFinite));});
