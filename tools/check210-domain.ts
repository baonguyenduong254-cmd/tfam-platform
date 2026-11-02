import assert from 'node:assert/strict';
import {withCharacterPortraits} from '../site/lib/character-portraits';
import {factionGroups,canExplore,unlockRequirements} from '../site/lib/discovery';
import retired from '../site/lib/retired-portraits.json';
import seed from '../site/lib/seed.json';
const custom='https://example.com/author-anime.webp';
const data=withCharacterPortraits({...seed,presentationRevision:33,characters:[
{id:'isabella_testarossa_de_aragon',faction_id:'castilian_empire',portrait_asset:'/portraits/isabella_testarossa_de_aragon.webp'},
{id:'foreign-oil',faction_id:'holy_french_kingdom',portrait_asset:'https://pub-a2e7030237c14362985465386fcae671.r2.dev/images/portraits/napoleon.webp'},
{id:'custom',faction_id:'holy_french_kingdom',portrait_asset:custom},
...retired.map((portrait_asset,i)=>({id:'old-'+i,faction_id:'holy_french_kingdom',portrait_asset}))
]});
assert.equal(data.characters[0].portrait_asset,'/portraits/castilian/isabella_testarossa_de_aragon.webp');
assert.equal(data.characters[1].portrait_asset,null);
assert.equal(data.characters[2].portrait_asset,custom);
assert.ok(data.characters.slice(3).every(c=>c.portrait_asset===null));
assert.equal(new Set(factionGroups.flatMap(g=>g.ids)).size,28);
assert.equal(factionGroups.flatMap(g=>g.ids).length,28);
assert.equal(factionGroups.flatMap(g=>g.ids).filter(id=>canExplore(id,new Set())).length,2);
assert.equal(unlockRequirements.wardenholf,'arc-6');
assert.ok(canExplore('wardenholf',new Set(['arc-6'])));
assert.ok(data.factions.some(f=>f.id==='wardenholf'));
console.log('28 unique factions, fresh locks, Wardenholf milestone, all 72 legacy portrait removals and custom/anime preservation verified.');
