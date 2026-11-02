import {mediaExists} from '../scripts/media-assets.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const manifest=read('public/military/manifest.json'),featured=read('lib/featured-military.json');
test('every faction has exactly three distinct representatives from its encyclopedia',()=>{
 assert.equal(Object.keys(featured).length,manifest.factions.length);
 for(const faction of manifest.factions){const source=read('public'+faction.data_url),picks=featured[faction.id];assert.equal(picks.length,3,faction.id);assert.equal(new Set(picks.map(u=>u.id)).size,3,faction.id);
 for(const pick of picks){const original=source.find(u=>u.id===pick.id);assert.ok(original,`${faction.id}/${pick.id}`);assert.equal(pick.faction_id,faction.id);for(const field of Object.keys(pick))assert.deepEqual(pick[field],original[field],`${pick.id}/${field}`);for(const field of ['artwork','thumbnail'])assert.ok(mediaExists(pick[field]),pick[field]);assert.ok(pick.name_vi&&pick.name_native&&pick.role_vi&&pick.role_en);}
 }
});
