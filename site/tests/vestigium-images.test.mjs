import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Match the app bundler's resolution for this extensionless TypeScript import.
const browserModule = new URL('../lib/vestigium-browser.ts', import.meta.url).href;
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === browserModule && specifier === './exhibit-presentation') {
      return nextResolve(specifier + '.ts', context);
    }
    return nextResolve(specifier, context);
  },
});
const { exhibitArtwork } = await import(browserModule).finally(() => hook.deregister());
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
