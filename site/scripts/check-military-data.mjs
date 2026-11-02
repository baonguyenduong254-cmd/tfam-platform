import {mediaExists,mediaSize,mediaFiles} from './media-assets.mjs';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
const root='public/military',manifest=JSON.parse(readFileSync(root+'/manifest.json','utf8'));
const ids=new Set(),branches=new Set(['infantry','cavalry','artillery','special','naval']);let count=0,bytes=0;
assert.equal(manifest.factions.length,24);
for(const f of manifest.factions){const units=JSON.parse(readFileSync('public'+f.data_url,'utf8'));assert.equal(units.length,f.count);const totals={};
 for(const u of units){assert(!ids.has(u.id),'Duplicate '+u.id);ids.add(u.id);assert.equal(u.faction_id,f.id);assert(branches.has(u.branch));
  for(const k of ['name_native','name_vi','class_en','class_vi','role_en','role_vi','lore_en','lore_vi','quote_en','quote_vi'])assert.equal(typeof u[k],'string',u.id+' '+k),assert(u[k].trim(),u.id+' '+k);
  assert.equal(u.traits_en.length,u.traits_vi.length,u.id);assert(u.traits_en.length>0);assert(u.traits_vi.every(t=>typeof t==='string'&&t.trim()));
  assert(mediaExists(u.artwork),'Artwork missing '+u.id);assert(mediaExists(u.thumbnail),'Thumbnail missing '+u.id);bytes+=mediaSize(u.artwork);
  assert.equal(u.source_slide,u.id);assert.equal(typeof u.source_index,'number');totals[u.branch]=(totals[u.branch]||0)+1;count++;
 }
 assert.deepEqual(totals,f.branches);assert.equal(units.reduce((n,u)=>n+u.traits_vi.length,0),units.reduce((n,u)=>n+u.traits_en.length,0));
}
assert.equal(count,manifest.unit_count);assert.equal(mediaFiles('/military/art').filter(x=>x.endsWith('.webp')&&!x.endsWith('.thumb.webp')).length,count);
console.log(JSON.stringify({validated:true,factions:manifest.factions.length,units:count,artwork_bytes:bytes}));
