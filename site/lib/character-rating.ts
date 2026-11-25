import {characterAttributes,courtGroup} from './character-attributes';
import connections from './character-connections.json';

export type RatingAxisKey='martial'|'vestigium'|'tactics'|'statecraft'|'presence'|'resolve';
export type RatingGrade='EX'|'S+'|'S'|'A+'|'A'|'B+'|'B'|'C';

export type RatingAxisDef={
 key:RatingAxisKey;
 label:string;
 short:string;
 color:string;
 description:string;
};

export const RATING_AXES:readonly RatingAxisDef[]=[
 {key:'martial',label:'Martial',short:'MAR',color:'#d66b58',description:'Direct combat mastery, weaponry, reflexes, and physical lethality.'},
 {key:'vestigium',label:'Vestigium',short:'VST',color:'#b084df',description:'Resonance with Vestigium relics, esoteric engineering, and arcane load.'},
 {key:'tactics',label:'Tactics',short:'TAC',color:'#6cc0c8',description:'Battlefield reading, improvisation, and operational command under pressure.'},
 {key:'statecraft',label:'Statecraft',short:'STA',color:'#8ba4db',description:'Court intrigue, administration, intelligence, and diplomatic judgment.'},
 {key:'presence',label:'Presence',short:'PRE',color:'#e4c48a',description:'Sovereign authority, charisma, loyalty, and command over men.'},
 {key:'resolve',label:'Resolve',short:'RES',color:'#c2946a',description:'Mental fortitude, composure under siege, and endurance against the Frost.'},
] as const;

export type RatingBreakdown={
 scores:Record<RatingAxisKey,number>;
 grades:Record<RatingAxisKey,RatingGrade>;
 notes:Record<RatingAxisKey,string>;
 overallScore:number;
 overallGrade:RatingGrade;
 archetype:string;
 topAxes:[RatingAxisKey,RatingAxisKey];
};

const clamp=(n:number)=>Math.max(40,Math.min(99,Math.round(n)));

export function gradeForScore(score:number):RatingGrade{
 if(score>=96)return 'EX';
 if(score>=92)return 'S+';
 if(score>=88)return 'S';
 if(score>=83)return 'A+';
 if(score>=78)return 'A';
 if(score>=72)return 'B+';
 if(score>=64)return 'B';
 return 'C';
}

export function gradeColor(grade:RatingGrade):string{
 switch(grade){
  case 'EX':return '#fae0a2';
  case 'S+':return '#f0cc84';
  case 'S':return '#e2bc76';
  case 'A+':return '#dc9b74';
  case 'A':return '#8ec6cb';
  case 'B+':return '#9cb0d4';
  case 'B':return '#a598b3';
  default:return '#847a90';
 }
}

function archetypeFor(top1:RatingAxisKey,top2:RatingAxisKey,group:string):string{
 const pair=new Set([top1,top2]);
 if(group==='crown')return 'Sovereign Architect';
 if(pair.has('martial')&&pair.has('vestigium'))return 'Vestigium Duelist';
 if(pair.has('martial')&&pair.has('resolve'))return 'Imperial Vanguard';
 if(pair.has('martial')&&pair.has('tactics'))return 'Field Commander';
 if(pair.has('martial')&&pair.has('presence'))return 'Banner Champion';
 if(pair.has('tactics')&&pair.has('statecraft'))return 'Grand Strategist';
 if(pair.has('statecraft')&&pair.has('presence'))return 'Court Chancellor';
 if(pair.has('vestigium')&&pair.has('tactics'))return 'Arcane Tactician';
 if(pair.has('vestigium')&&pair.has('statecraft'))return 'Vestigium Savant';
 if(pair.has('vestigium')&&pair.has('resolve'))return 'Relic Bearer';
 if(pair.has('presence')&&pair.has('resolve'))return 'Iron Pillar';
 if(pair.has('tactics')&&pair.has('resolve'))return 'Siege Warden';
 if(top1==='martial')return 'Steel Specialist';
 if(top1==='vestigium')return 'Esoteric Adept';
 if(top1==='statecraft')return 'High Minister';
 if(top1==='presence')return 'Royal Envoy';
 return 'Imperial Retainer';
}

function countMatches(text:string,re:RegExp){
 const m=text.match(re);
 return m?m.length:0;
}

/**
 * Computes the 6-Pillar Imperial Rating for any character dossier.
 * Preserves full compatibility with the 3 canonical scores in character-attributes.json
 * while supporting explicit author overrides via `character.rating_axes`.
 */
export function characterRating(character:Record<string,any>):RatingBreakdown|null{
 const base=characterAttributes(character);
 if(!base)return null;

 const b=Number(base.battlecraft??70);
 const i=Number(base.insight??70);
 const p=Number(base.presence??70);
 const group=courtGroup(character);

 const corpus=[
  character.role_en,
  character.office_en,
  character.lore_en,
  ...(Array.isArray(character.traits_en)?character.traits_en:[]),
  ...(Array.isArray(character.skills_en)?character.skills_en:[]),
 ].filter(Boolean).join(' ').toLowerCase();

 const vestItems=((connections.items as Record<string,unknown[]>)[character.id]||[]).length;
 const hasVestCue=countMatches(corpus,/vestigium|relic|artifact|lightning|arcane|alchemy|frost|ice|crystal|conduit|resonance|device/g);
 const hasMartialCue=countMatches(corpus,/sword|blade|rapier|duel|rifle|musket|cavalry|guard|combat|strike|spear|assassin|melee|weapon/g);
 const hasTacticsCue=countMatches(corpus,/tactic|strateg|command|formation|siege|campaign|battlefield|logistics|recon|intel/g);
 const hasStateCue=countMatches(corpus,/court|diploma|minister|chancellor|crown|queen|emperor|sultan|finance|treaty|law|admin|politics|council/g);
 const hasResolveCue=countMatches(corpus,/iron|unbreakable|endur|stoic|winter|frost|devot|oath|discipline|survival|will|resolve|scar/g);

 // Deterministic micro-offset (-2..+2) from character ID so no two profiles feel cloned
 let hash=0;
 const idStr=String(character.id||'');
 for(let k=0;k<idStr.length;k++)hash=(hash*31+idStr.charCodeAt(k))|0;
 const jitter=(slot:number)=>((Math.abs(hash>>(slot*3))%5)-2);

 const isGuard=group==='guard';
 const isCrown=group==='crown';
 const isOfficial=group==='official';

 const derived:Record<RatingAxisKey,number>={
  martial:clamp(b+(isGuard?3:isCrown?-3:isOfficial?-6:0)+Math.min(4,hasMartialCue)+jitter(0)),
  vestigium:clamp(b*0.58+i*0.42+(vestItems>0?5:0)+(isGuard?3:0)+Math.min(5,hasVestCue*2)-3+jitter(1)),
  tactics:clamp(i*0.64+b*0.36+(isCrown?2:0)+Math.min(4,hasTacticsCue*2)+jitter(2)),
  statecraft:clamp(i*0.56+p*0.44+(isCrown?4:isOfficial?5:isGuard?-6:0)+Math.min(4,hasStateCue*2)+jitter(3)),
  presence:clamp(p+(isCrown?1:0)),
  resolve:clamp(b*0.44+p*0.34+i*0.22+(isGuard?5:isCrown?3:0)+Math.min(4,hasResolveCue*2)+jitter(4)),
 };

 // Respect explicit author overrides if provided on the record
 const authored=character.rating_axes as Partial<Record<RatingAxisKey,number>>|undefined;
 const scores:Record<RatingAxisKey,number>={
  martial:typeof authored?.martial==='number'?clamp(authored.martial):derived.martial,
  vestigium:typeof authored?.vestigium==='number'?clamp(authored.vestigium):derived.vestigium,
  tactics:typeof authored?.tactics==='number'?clamp(authored.tactics):derived.tactics,
  statecraft:typeof authored?.statecraft==='number'?clamp(authored.statecraft):derived.statecraft,
  presence:typeof authored?.presence==='number'?clamp(authored.presence):derived.presence,
  resolve:typeof authored?.resolve==='number'?clamp(authored.resolve):derived.resolve,
 };

 const grades={} as Record<RatingAxisKey,RatingGrade>;
 for(const axis of RATING_AXES)grades[axis.key]=gradeForScore(scores[axis.key]);

 const sorted=[...RATING_AXES].sort((a,bAxis)=>scores[bAxis.key]-scores[a.key]);
 const topAxes:[RatingAxisKey,RatingAxisKey]=[sorted[0].key,sorted[1].key];

 // Specialist-friendly overall rating: 55% top-2 peak average + 45% 6-axis mean
 const mean=(scores.martial+scores.vestigium+scores.tactics+scores.statecraft+scores.presence+scores.resolve)/6;
 const peak=(scores[topAxes[0]]+scores[topAxes[1]])/2;
 const overallScore=clamp(peak*0.58+mean*0.42);
 const overallGrade=gradeForScore(overallScore);

 const rEn=Array.isArray(base.rationale_en)?base.rationale_en:[];
 const notes:Record<RatingAxisKey,string>={
  martial:rEn[0]||RATING_AXES[0].description,
  vestigium:vestItems>0?`Verified resonance across ${vestItems} recorded Vestigium ${vestItems===1?'exhibit':'exhibits'}.`:RATING_AXES[1].description,
  tactics:rEn[1]||RATING_AXES[2].description,
  statecraft:rEn[2]||RATING_AXES[3].description,
  presence:rEn[2]||RATING_AXES[4].description,
  resolve:RATING_AXES[5].description,
 };

 return {
  scores,
  grades,
  notes,
  overallScore,
  overallGrade,
  archetype:archetypeFor(topAxes[0],topAxes[1],group),
  topAxes,
 };
}
