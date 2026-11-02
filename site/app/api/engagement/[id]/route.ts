import {getChatGPTUser} from '../../../chatgpt-auth';
export const dynamic='force-dynamic';
import {authReply,adminSession} from '../../../../lib/admin-auth';
import {storyIndex} from '../../../../lib/story';
import {readChapter,storyDatabase} from '../../../../lib/story-server';
import {engagementIdentity,readerWriteDenied,readerLimit,engagementStats,commentPage,boundedReaderBody} from '../../../../lib/engagement-server';
type Context={params:Promise<{id:string}>};
export async function GET(req:Request,ctx:Context){try{
 const {id}=await ctx.params;if(!storyIndex.some(c=>c.id===id))return authReply({code:'NOT_FOUND'},404);
 const beforeText=new URL(req.url).searchParams.get('before'),before=beforeText?Number(beforeText):null;
 if(before!==null&&(!Number.isSafeInteger(before)||before<1))return authReply({code:'INVALID'},400);
 const who=await engagementIdentity(req),stats=await engagementStats(id,who.hash),comments=await commentPage(req,id,who.hash,before);
 return authReply({stats,comments,csrf:who.csrf},200,who.fresh?{'Set-Cookie':who.cookie}:{});
 }catch(e){console.error('Engagement read failed',e);return authReply({code:'UNAVAILABLE'},503);}}
export async function POST(req:Request,ctx:Context){try{
 const {id}=await ctx.params;if(!storyIndex.some(c=>c.id===id))return authReply({code:'NOT_FOUND'},404);
 const who=await engagementIdentity(req),denied=readerWriteDenied(req,who);if(denied)return denied;
 let raw;try{raw=await boundedReaderBody(req);}catch{return authReply({code:'INVALID'},413);}
 let body;try{body=JSON.parse(raw);}catch{return authReply({code:'INVALID'},400);}
 if(!['view','reaction','comment'].includes(body?.action))return authReply({code:'INVALID'},400);
 if(body.action==='reaction'&&![0,1,-1].includes(body.value))return authReply({code:'INVALID'},400);
 if(body.action==='comment'&&!(await getChatGPTUser()))return authReply({code:'SIGN_IN'},401);
 if(body.action==='comment'&&!who.account)return authReply({code:'PROFILE_REQUIRED'},409);
 if(body.action==='comment'&&(typeof body.body!=='string'||body.body.trim().length<2||body.body.trim().length>2000))return authReply({code:'INVALID'},400);
 const limit=await readerLimit(req,body.action,body.action==='comment'?3:60,60);if(limit)return limit;
 if(body.action==='comment'){const daily=await readerLimit(req,'comments-day',20,86400);if(daily)return daily;}
 const chapter=await readChapter(id);if(!chapter||!(chapter.text_vi.trim()||chapter.text_en.trim()))return authReply({code:'EMPTY'},409);
 const db=storyDatabase(),now=Math.floor(Date.now()/1000);
 if(body.action==='view')await db.prepare('INSERT INTO chapter_visits(chapter_id,visitor_hash,last_viewed_at,views) VALUES (?,?,?,1) ON CONFLICT(chapter_id,visitor_hash) DO UPDATE SET last_viewed_at=excluded.last_viewed_at,views=chapter_visits.views+1 WHERE chapter_visits.last_viewed_at<=?').bind(id,who.hash,now,now-86400).run();
 if(body.action==='reaction'){
  if(body.value===0)await db.prepare('DELETE FROM chapter_reactions WHERE chapter_id=? AND visitor_hash=?').bind(id,who.hash).run();
  else await db.prepare('INSERT INTO chapter_reactions(chapter_id,visitor_hash,value,updated_at) VALUES (?,?,?,?) ON CONFLICT(chapter_id,visitor_hash) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind(id,who.hash,body.value,now).run();
 }
 if(body.action==='comment')await db.prepare('INSERT INTO chapter_comments(chapter_id,visitor_hash,display_name,body,created_at,account_id) VALUES (?,?,?,?,?,?)').bind(id,who.hash,who.account!.name.trim().normalize('NFC'),body.body.trim().normalize('NFC'),now,who.account?.id||null).run();
 return authReply({stats:await engagementStats(id,who.hash),...(body.action==='comment'?{comments:await commentPage(req,id,who.hash,null)}:{})});
 }catch(e){console.error('Engagement write failed',e);return authReply({code:'UNAVAILABLE'},503);}}
export async function DELETE(req:Request,ctx:Context){try{
 const {id}=await ctx.params;if(!storyIndex.some(c=>c.id===id))return authReply({code:'NOT_FOUND'},404);
 const who=await engagementIdentity(req),denied=readerWriteDenied(req,who);if(denied)return denied;
 const commentId=Number(new URL(req.url).searchParams.get('comment'));
 if(!Number.isSafeInteger(commentId)||commentId<1)return authReply({code:'INVALID'},400);
 const limited=await readerLimit(req,'delete',30,60);if(limited)return limited;
 const admin=Boolean(await adminSession(req)),db=storyDatabase();
 await db.prepare('DELETE FROM chapter_comments WHERE id=? AND chapter_id=? AND (?=1 OR visitor_hash=?)').bind(commentId,id,admin?1:0,who.hash).run();
 return authReply({stats:await engagementStats(id,who.hash),comments:await commentPage(req,id,who.hash,null)});
 }catch(e){console.error('Comment delete failed',e);return authReply({code:'UNAVAILABLE'},503);}}
