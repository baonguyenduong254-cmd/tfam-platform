/** Browser-local reading checkpoint. Never contains chapter text or author drafts. */
export const READING_POSITION_KEY='tfam-reading-position-v1';
export type ReadingPosition={version:1;chapterId:string;title:string;lang:'vi'|'en';revision:number;paragraph:number;offset:number;fraction:number;savedAt:string};
export function clampFraction(value:number){return Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;}
export function parseReadingPosition(raw:string|null,knownIds:readonly string[]):ReadingPosition|null{
 if(!raw)return null;try{const v=JSON.parse(raw) as ReadingPosition;
  if(!v||v.version!==1||!knownIds.includes(v.chapterId)||typeof v.title!=='string'||v.title.length>500||!['vi','en'].includes(v.lang)||!Number.isInteger(v.revision)||v.revision<0||!Number.isInteger(v.paragraph)||v.paragraph<0||v.paragraph>10000||!Number.isFinite(v.offset)||v.offset<0||v.offset>1||!Number.isFinite(v.fraction)||v.fraction<0||v.fraction>1||typeof v.savedAt!=='string'||!Number.isFinite(Date.parse(v.savedAt)))return null;
  return {version:1,chapterId:v.chapterId,title:v.title,lang:v.lang,revision:v.revision,paragraph:v.paragraph,offset:v.offset,fraction:v.fraction,savedAt:v.savedAt};
 }catch{return null;}
}
export function locateReadingPosition(rects:readonly {top:number;height:number}[],anchor:number){
 if(!rects.length)return {paragraph:0,offset:0};
 let paragraph=rects.findIndex(r=>r.top+r.height>anchor);if(paragraph<0)paragraph=rects.length-1;
 const rect=rects[paragraph];return {paragraph,offset:clampFraction((anchor-rect.top)/Math.max(1,rect.height))};
}
export function readingFraction(top:number,height:number,anchor:number){return clampFraction((anchor-top)/Math.max(1,height));}
export function restoreReadingOffset(position:ReadingPosition,revision:number,lang:string,rects:readonly {top:number;height:number}[],proseTop:number,proseHeight:number){
 const exact=position.revision===revision&&position.lang===lang&&position.paragraph<rects.length;
 const rect=rects[position.paragraph];return {exact,top:exact?rect.top+rect.height*position.offset:proseTop+proseHeight*position.fraction};
}
