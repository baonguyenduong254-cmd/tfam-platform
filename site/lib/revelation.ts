import preludeRecords from './prelude-records.json';
import fingerprints from './prelude-field-fingerprints.json';
import exhibitRequirements from './exhibit-revelations.json';
import type {VestigiumRecord} from './vestigium';
type Row=Record<string,any>;
const preludes=new Map(Object.entries(preludeRecords) as [string,Row][]);
const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
const signatures=fingerprints as Record<string,Record<string,string>>;
function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(16);}
/** Fingerprints attest only the exact pre-opening fields audited in dossier v24. */
function isPrelude(row:Row,key:string){return row[key]!==undefined&&signatures[row.id]?.[key]===hash(JSON.stringify(row[key]));}
export function presentCharacter(row:Row,earned:ReadonlySet<string>){
 const arcs=(String(row.canon_arcs||'').match(/\b(?:XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b/g)||[]).map(r=>roman.indexOf(r)+1);
 const last=arcs.length?Math.max(...arcs):null,first=arcs.length?Math.min(...arcs):null;
 const revealed=last!==null&&earned.has('arc-'+last),prelude=preludes.get(row.id);
 const next:Row={...row,presentation_limited:!revealed,presentation_visible:!!prelude||first===1||(first!==null&&earned.has('arc-'+first))};
 if(revealed)return next;
 for(const key of ['lore','lore_en','lore_vi','traits','traits_en','traits_vi','skills','skills_en','skills_vi'])if(!isPrelude(row,key))next[key]=prelude?.[key]??(key.startsWith('lore')?'This part of the dossier awaits your reading discoveries.':[]);
 if(prelude)next.presentation_prelude=true;
 // These two offices are explicitly dated to the Arc III investiture by migration v31.
 if(['juliet_spencer','england_ruins_representative'].includes(row.id)&&!earned.has('arc-3')){next.office_en='';next.office_vi='';next.guard_number=null;if(row.id==='juliet_spencer'){next.role_en='';next.role_vi='';}else{next.role_en='';next.role_vi='';next.castilian_branch='foreign';}}
 return next;
}
export function canRevealExhibit(id:string,covered:ReadonlySet<string>){
 const required=(exhibitRequirements as Record<string,(string|null)[]>)[id];
 return !!required&&required.every(chapter=>chapter!==null&&covered.has(chapter));
}
export function canInspectExhibit(item:VestigiumRecord,covered:ReadonlySet<string>){return canRevealExhibit(item.id,covered);}
/** Explicit scene-backed relationship requirements; unknown timing remains sealed. */
export function canRevealBond(a:string,b:string,covered:ReadonlySet<string>){
 const pair=[a,b].sort().join(':');
 const chapter=pair==='edward_spencer:juliet_spencer'?'chapter_001':pair==='marco_stones:millennia_stones'?'extra_1_12':null;
 return !!chapter&&covered.has(chapter);
}
