import index from './story/index.json';
import englishIndex from './story/english-index.json';
import finalArcIndex from './story/english-arc1-final-index.json';
export type ChapterMeta={id:string;arc:number;number:number|null;order:number;title_vi:string;title_en:string;source_tab?:string};
export type Chapter=ChapterMeta&{text_vi:string;text_en:string;complete:boolean;revision:number;updated_at?:string};
export const isArchivedEnglishChapter=(id:string)=>/^en_book1_\d+$/.test(id);
export const storyIndex:ChapterMeta[]=[...index,...finalArcIndex,...englishIndex];
export const editionIndex=(language:string)=>storyIndex.filter(c=>language==='en'?c.id.startsWith('en_book')&&!isArchivedEnglishChapter(c.id):!c.id.startsWith('en_book'));
export function storyKey(id:string){return 'story:'+id;}
export function validChapter(value:unknown):value is Omit<Chapter,'revision'>{
 const c=value as Chapter;
 return !!c&&storyIndex.some(m=>m.id===c.id)&&['title_vi','title_en','text_vi','text_en'].every(k=>typeof (c as unknown as Record<string,unknown>)[k]==='string')&&c.title_vi.trim().length>0&&c.title_vi.length<=500&&c.title_en.length<=500&&c.text_vi.length<=500000&&c.text_en.length<=500000&&typeof c.complete==='boolean';
}
