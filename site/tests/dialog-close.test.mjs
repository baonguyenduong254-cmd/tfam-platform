import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {closeDialog} from '../lib/animation/dialog-close.ts';
class Dialog extends EventTarget{open=true;isConnected=true;dataset={};}
globalThis.document={documentElement:{dataset:{motion:'on'}}};
globalThis.matchMedia=()=>({matches:false});
test('repeated close requests commit history once after the dialog exit',()=>{const d=new Dialog();let count=0;closeDialog(d,()=>count++);closeDialog(d,()=>count++);assert.equal(count,0);assert.equal(d.dataset.motionClosing,'true');const event=new Event('animationend');Object.defineProperty(event,'animationName',{value:'tfam-dialog-leave'});d.dispatchEvent(event);assert.equal(count,1);assert.equal(d.dataset.motionClosing,undefined);});
test('motion-off closes synchronously',()=>{document.documentElement.dataset.motion='off';let count=0;closeDialog(new Dialog(),()=>count++);assert.equal(count,1);document.documentElement.dataset.motion='on';});
test('fallback closes when animation events are unavailable and ignores unmounted dialogs',async()=>{let count=0;const live=new Dialog(),gone=new Dialog();closeDialog(live,()=>count++);closeDialog(gone,()=>count++);gone.isConnected=false;await delay(300);assert.equal(count,1);assert.equal(live.dataset.motionClosing,undefined);});
