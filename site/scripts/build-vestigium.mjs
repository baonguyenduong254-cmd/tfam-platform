import {mediaExists,mediaHash} from './media-assets.mjs';
import fs from 'node:fs';import crypto from 'node:crypto';
const groups=['mineral','botanical','creature','material','device','armament','phenomenon','entity','complex'];
const artMap=fs.existsSync('content/vestigium/art-map.json')?JSON.parse(fs.readFileSync('content/vestigium/art-map.json','utf8')):{};
const all=[],ids=new Set(),manifest={version:'',count:0,illustrated:0,canon:0,categories:[]};
fs.mkdirSync('public/vestigium',{recursive:true});
for(const category of groups){const items=JSON.parse(fs.readFileSync('content/vestigium/'+category+'.json','utf8'));const counts=Array(8).fill(0);
 for(const m of items){if(!/^[a-z0-9_-]+$/.test(m.id)||ids.has(m.id)||m.category!==category||!Number.isInteger(m.rarity)||m.rarity<0||m.rarity>7)throw Error('Invalid/duplicate Vestigium '+m.id);ids.add(m.id);counts[m.rarity]++;
 for(const f of (m.profile_status==='visual'?['name','form','rarity_note']:['name','form','rarity_note','lore','use','limits']))for(const lang of ['vi','en'])if(typeof m[f+'_'+lang]!=='string'||!m[f+'_'+lang].trim()||/placeholder|\bTBD\b/i.test(m[f+'_'+lang]))throw Error('Missing '+m.id+' '+f+'_'+lang);
 if(!['canon','collection'].includes(m.origin)||!Array.isArray(m.sources)||m.origin==='canon'&&!m.sources.length||m.origin==='collection'&&m.sources.length)throw Error('Invalid provenance '+m.id);
 for(const s of m.sources)if(!Number.isInteger(s.volume)||s.volume<1||s.volume>4||!s.chapter||!s.tab_id||!s.anchor)throw Error('Invalid source '+m.id);
 for(const f of ['skills','traits','applications',...(m.category==='complex'?['components']:[])]){if(!Array.isArray(m[f]))throw Error('Invalid properties '+m.id);for(const p of m[f])for(const k of ['name_vi','name_en','description_vi','description_en'])if(!p[k]?.trim())throw Error('Missing '+m.id+' '+k);}
 if(m.skills.length>m.rarity+1)throw Error('Core ability cap '+m.id);
 if(!m.quantity||!['mass-produced','limited','finite','singleton','unknown'].includes(m.quantity.kind))throw Error('Missing abundance '+m.id);
 if(m.quantity.count!==undefined&&(!Number.isInteger(m.quantity.count)||m.quantity.count<1))throw Error('Invalid quantity '+m.id);
 if(m.category==='complex'&&m.components.length<2)throw Error('Complex requires constituent natures '+m.id);
 delete m.artwork;delete m.thumbnail;const artwork=artMap[m.id]||m.art_asset||'/vestigium/art/'+m.id+'.webp';if(artwork&&mediaExists(artwork)){m.artwork=artwork;const thumb=m.thumbnail_asset||'/vestigium/thumbs/'+m.id+'.webp';const sharedThumb=artwork.replace('/art/','/thumbs/');m.thumbnail=mediaExists(thumb)?thumb:mediaExists(sharedThumb)?sharedThumb:artwork;manifest.illustrated++;}if(m.origin==='canon')manifest.canon++;
 }
 // Rank follows the individual dossier. Reclassification must not require artificial filler per tier.
 if(!items.length)throw Error('Empty category '+category);
 const out=items.map(({art,editorial_review_kind,...m})=>({...m,sources:m.sources.map(({volume,chapter})=>({volume,chapter}))}));
 fs.writeFileSync('public/vestigium/'+category+'.json',JSON.stringify(out));all.push(...out);manifest.categories.push({id:category,url:'/vestigium/'+category+'.json',count:items.length,tiers:counts});
}
const guard=all.filter(m=>m.royal_guard);fs.writeFileSync('public/vestigium/royal-guard.json',JSON.stringify(guard));manifest.categories.push({id:'royal-guard',url:'/vestigium/royal-guard.json',count:guard.length,tiers:Array.from({length:8},(_,r)=>guard.filter(m=>m.rarity===r).length)});
for(const m of all)for(const link of m.relationships||[]){const target=all.find(r=>r.id===link.target_id);if(!target||target.category!==link.target_category||!link.label_vi?.trim()||!link.label_en?.trim())throw Error('Invalid relationship '+m.id+' '+link.target_id);}
manifest.count=all.length;const artworkHashes=[...new Set(all.flatMap(m=>[m.artwork,m.thumbnail]).filter(Boolean))].sort().map(p=>mediaHash(p));manifest.version=crypto.createHash('sha256').update(JSON.stringify(all)+artworkHashes.join('')).digest('hex').slice(0,16);fs.writeFileSync('public/vestigium/manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest));
