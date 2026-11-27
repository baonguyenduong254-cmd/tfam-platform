import {authorizeWrite,authReply} from '../../../../lib/admin-auth';
import {readChapter,storyDatabase} from '../../../../lib/story-server';
import {isArchivedEnglishChapter,storyIndex,storyKey,validChapter} from '../../../../lib/story';
type Context={params:Promise<{id:string}>};
export async function GET(_req:Request,ctx:Context){try{const {id}=await ctx.params;const chapter=await readChapter(id);return chapter?authReply({chapter}):authReply({error:'Không tìm thấy chương.'},404);}catch(e){console.error(e);return authReply({error:'Không thể tải chương. Vui lòng thử lại.'},503);}}
export async function PUT(req:Request,ctx:Context){try{
 const denied=await authorizeWrite(req);if(denied)return denied;
 const {id}=await ctx.params;if(isArchivedEnglishChapter(id)||!storyIndex.some(c=>c.id===id))return authReply({error:'Không tìm thấy chương.'},404);
 const raw=await req.text();if(new TextEncoder().encode(raw).length>1500000)return authReply({error:'Nội dung chương quá dài.'},413);
 const {chapter,revision}=JSON.parse(raw);if(!validChapter(chapter)||chapter.id!==id||!Number.isInteger(revision)||revision<0)return authReply({error:'Dữ liệu chương không hợp lệ.'},400);
 const meta=storyIndex.find(c=>c.id===id)!;
 const body={...meta,title_vi:chapter.title_vi,title_en:chapter.title_en,text_vi:chapter.text_vi,text_en:chapter.text_en,complete:chapter.complete,updated_at:new Date().toISOString()};
 const result=await storyDatabase().prepare('INSERT INTO content(id,body,revision) SELECT ?,?,1 WHERE ?=0 OR EXISTS (SELECT 1 FROM content WHERE id=?) ON CONFLICT(id) DO UPDATE SET body=excluded.body, revision=content.revision+1 WHERE content.revision=? RETURNING revision').bind(storyKey(id),JSON.stringify(body),revision,storyKey(id),revision).first<{revision:number}>();
 if(!result)return authReply({error:'Chương đã được sửa ở cửa sổ khác. Giữ bản nháp, tải bản mới rồi đối chiếu trước khi lưu.'},409);
 return authReply({chapter:{...body,revision:result.revision}});
 }catch(e){console.error(e);return authReply({error:'Không lưu được. Bản nháp vẫn được giữ để thử lại.'},503);}}
