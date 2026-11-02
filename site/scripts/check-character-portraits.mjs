import {mediaExists,mediaRecord,mediaSize} from './media-assets.mjs';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const portraits=JSON.parse(await readFile(new URL('../lib/character-portraits.json',import.meta.url),'utf8'));
const entries=Object.entries(portraits);
assert.equal(entries.length,72,'Expected portraits for all 72 existing character dossiers');
assert.equal(new Set(entries.map(([,asset])=>asset)).size,72,'Each character must have a distinct asset');
let total=0;
for(const [id,asset] of entries){
 assert.match(asset,/^\/portraits\/[a-z0-9_]+\.webp$/);
 const file=path.resolve('public',asset.slice(1));
 assert.ok(mediaExists(asset),id+' must have local or verified external media');
 const external=mediaRecord(asset);
 if(external){assert.match(external.sha256,/^[0-9a-f]{64}$/);assert.ok(external.bytes>10000&&external.bytes<1500000);total+=external.bytes;continue;}
 const bytes=await readFile(file);
 assert.equal(bytes.subarray(0,4).toString(),'RIFF',id+' must be valid WebP');
 assert.equal(bytes.subarray(8,12).toString(),'WEBP',id+' must be valid WebP');
 assert.ok(bytes.length>10000,id+' is suspiciously small');
 assert.ok(bytes.length<1500000,id+' is too large for a portrait');
 total+=(await stat(file)).size;
}
console.log(`All ${entries.length} unique character portraits have local or byte-verified R2 WebP assets; ${(total/1048576).toFixed(2)} MiB total.`);
