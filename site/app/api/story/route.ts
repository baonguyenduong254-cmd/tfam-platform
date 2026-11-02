import {storyIndex} from '../../../lib/story';
import {baseChapter,storyDatabase} from '../../../lib/story-server';
import {authReply} from '../../../lib/admin-auth';
export async function GET(){try{
 const rows=await storyDatabase().prepare("SELECT id, json_extract(body,'$.title_vi') AS title_vi, json_extract(body,'$.title_en') AS title_en, json_extract(body,'$.complete') AS complete, length(trim(COALESCE(json_extract(body,'$.text_vi'),'')))+length(trim(COALESCE(json_extract(body,'$.text_en'),''))) AS text_length FROM content WHERE id LIKE 'story:%'").all<{id:string;title_vi:string;title_en:string;complete:number;text_length:number}>();
 const edited=new Map(rows.results.map(r=>[r.id.slice(6),r]));
 return authReply({chapters:storyIndex.map(m=>{const r=edited.get(m.id);return {...m,title_vi:r?.title_vi??m.title_vi,title_en:r?.title_en??m.title_en,complete:r?!!r.complete&&r.text_length>0:!!baseChapter(m.id)!.complete&&!!(baseChapter(m.id)!.text_vi.trim()||baseChapter(m.id)!.text_en.trim())};})});
 }catch(e){console.error(e);return authReply({error:'Không thể tải thư viện truyện. Vui lòng thử lại.'},503);}}
