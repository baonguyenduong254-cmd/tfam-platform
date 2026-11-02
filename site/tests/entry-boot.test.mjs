import test from 'node:test';
import assert from 'node:assert/strict';
import {canStartOpening,firstEntryScene,BOOT_HOLD_MS,BOOT_EXIT_MS,SCENE_COVER_MS,SCENE_REVEAL_MS} from '../lib/entry/boot.ts';
test('opening waits for each actual prerequisite and a visible document',()=>{const ready={preferences:true,content:true,fonts:true,graphics:true,visible:true};assert.equal(canStartOpening(ready),true);for(const key of Object.keys(ready))assert.equal(canStartOpening({...ready,[key]:false}),false,key);});
test('root entry starts at the welcome; internal return opens the voyage',()=>{assert.equal(firstEntryScene(false),'question');assert.equal(firstEntryScene(true),'voyage');});

test('entry no longer waits for film buffering and separates cover from reveal',()=>{assert.ok(BOOT_HOLD_MS>=0&&BOOT_HOLD_MS<=1000);assert.ok(BOOT_EXIT_MS>=1500);assert.ok(SCENE_COVER_MS>0&&SCENE_REVEAL_MS>SCENE_COVER_MS);});
