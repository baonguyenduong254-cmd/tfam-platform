export const READER_PREFS_KEY='tfam-reader-preferences-v1';
export const READING_HISTORY_KEY='tfam-reading-history-v1';
export type ReaderPreferences={theme:'dark'|'cream';lineHeight:number;paragraphGap:number;width:'compact'|'regular'|'wide';fontFamily?:'serif'|'sans'};
export const defaultReaderPreferences:ReaderPreferences={theme:'cream',lineHeight:1.95,paragraphGap:1.25,width:'regular'};
export function parseReaderPreferences(raw:string|null):ReaderPreferences{
 try{const p=JSON.parse(raw||'{}');return {theme:p.theme==='dark'?'dark':'cream',lineHeight:typeof p.lineHeight==='number'&&p.lineHeight>=1.5&&p.lineHeight<=2.4?p.lineHeight:1.95,paragraphGap:typeof p.paragraphGap==='number'&&p.paragraphGap>=.5&&p.paragraphGap<=2?p.paragraphGap:1.25,width:['compact','regular','wide'].includes(p.width)?p.width:'regular',...(['serif','sans'].includes(p.fontFamily)?{fontFamily:p.fontFamily}:{})};}catch{return {...defaultReaderPreferences};}
}
export type ReadingVisit={chapterId:string;status:'reading'|'read';visitedAt:string};
export function parseReadingHistory(raw:string|null,knownIds:readonly string[]):ReadingVisit[]{
 try{const data=JSON.parse(raw||'[]');if(!Array.isArray(data))return [];const seen=new Set<string>();return data.filter(v=>{if(!v||!knownIds.includes(v.chapterId)||seen.has(v.chapterId)||!['reading','read'].includes(v.status)||typeof v.visitedAt!=='string'||!Number.isFinite(Date.parse(v.visitedAt)))return false;seen.add(v.chapterId);return true;}).map(v=>({chapterId:v.chapterId,status:v.status,visitedAt:v.visitedAt})).sort((a,b)=>Date.parse(b.visitedAt)-Date.parse(a.visitedAt));}catch{return [];}
}
export function recordReadingVisit(visits:ReadingVisit[],id:string,status:'reading'|'read'|undefined,now:string):ReadingVisit[]{
 const prior=visits.find(v=>v.chapterId===id);return [{chapterId:id,status:status||prior?.status||'reading',visitedAt:now},...visits.filter(v=>v.chapterId!==id)];
}
export function searchChapter(text:string){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim();}
export function chapterPath(id:string){return '/read/'+encodeURIComponent(id);}
