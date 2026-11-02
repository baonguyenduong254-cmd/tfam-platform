import test from 'node:test';
import assert from 'node:assert/strict';
import {exhibitArtwork} from '../lib/vestigium-browser.ts';
const item={artwork:'/full.webp',thumbnail:'/thumb.webp'};
test('broken thumbnail falls back to full artwork and does not hide the dossier image',()=>{
 const failed=new Set(['/thumb.webp']);
 assert.equal(exhibitArtwork(item,false,failed),'/full.webp');
 assert.equal(exhibitArtwork(item,true,failed),'/full.webp');
 failed.add('/full.webp');assert.equal(exhibitArtwork(item,false,failed),undefined);
});
test('full-image failure leaves the healthy thumbnail available, and retry clears the failed resource',()=>{
 const failed=new Set(['/full.webp']);
 assert.equal(exhibitArtwork(item,false,failed),'/thumb.webp');
 assert.equal(exhibitArtwork(item,true,failed),undefined);
 failed.delete('/full.webp');assert.equal(exhibitArtwork(item,true,failed),'/full.webp');
});
