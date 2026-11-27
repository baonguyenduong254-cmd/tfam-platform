import {env} from 'cloudflare:workers';
import seed from './story/seed.json';
import finalArc from './story/english-arc1-final.json';
import {isArchivedEnglishChapter,storyIndex,storyKey,type Chapter} from './story';
type Seed={text_vi:string;text_en:string;complete:boolean};
export function storyDatabase(){if(!env.DB)throw Error('Story storage unavailable');return env.DB;}
export function baseChapter(id:string):Chapter|null{
 if(isArchivedEnglishChapter(id))return null;
 const english=finalArc.find(c=>c.id===id);if(english)return {...english,revision:0};
 const meta=storyIndex.find(m=>m.id===id);if(!meta)return null;
 const body=(seed as Record<string,Seed>)[id]||{text_vi:'',text_en:'',complete:false};
 return {...meta,...body,revision:0};
}
export async function readChapter(id:string):Promise<Chapter|null>{
 const base=baseChapter(id);if(!base)return null;
 try{
  const row=await storyDatabase().prepare('SELECT body, revision FROM content WHERE id=?').bind(storyKey(id)).first<{body:string;revision:number}>();
  return row?{...base,...JSON.parse(row.body),id,revision:row.revision}:base;
 }catch{
  return base;
 }
}
