import fs from 'node:fs';
const chapters=JSON.parse(fs.readFileSync('lib/story/index.json','utf8'));
const categories=['mineral','botanical','creature','material','device','armament','phenomenon','entity','complex'];
const records=categories.flatMap(category=>JSON.parse(fs.readFileSync('public/vestigium/'+category+'.json','utf8')));
const requirements=Object.fromEntries(records.map(item=>[item.id,item.sources.length?item.sources.map(source=>{
 const n=typeof source.chapter==='number'?source.chapter:/^\d+$/.test(source.chapter)?Number(source.chapter):null;
 return chapters.find(c=>c.arc===source.volume&&c.number===n)?.id||null;
}):item.origin==='collection'?[]:[null]]));
fs.writeFileSync('lib/exhibit-revelations.json',JSON.stringify(requirements)+'\n');
console.log('Indexed chapter revelation requirements for '+records.length+' exhibits.');

const patches=JSON.parse(fs.readFileSync('lib/character-dossiers-v24.json','utf8'));
const preludes=Object.fromEntries(patches.updates.map(p=>[p.id,p.after]));
const fingerprint=value=>{const text=JSON.stringify(value);let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0).toString(16);};
fs.writeFileSync('lib/prelude-records.json',JSON.stringify(preludes)+'\n');
fs.writeFileSync('lib/prelude-field-fingerprints.json',JSON.stringify(Object.fromEntries(patches.updates.map(p=>[p.id,Object.fromEntries(Object.entries(p.after).map(([key,value])=>[key,fingerprint(value)]))])))+'\n');

const sceneCredits=JSON.parse(fs.readFileSync('lib/chronicle-art.json','utf8'));
fs.writeFileSync('lib/chronicle-art-display.json',JSON.stringify(Object.fromEntries(Object.entries(sceneCredits).map(([id,{prompt,...record}])=>[id,record])))+'\n');
