import {randomBytes} from 'node:crypto';
import {authReply} from '../../../lib/admin-auth';
import {registrationIp,readerIdentity,readerWriteDenied,readerLimit,boundedReaderBody} from '../../../lib/engagement-server';
import {accountIdentity,findAccount,accountSnapshot,accountVisitor,saveVisit,saveCheckpoint} from '../../../lib/account-server';
import {storyDatabase} from '../../../lib/story-server';
import {validAvatar,validChapterId,cleanCheckpoint} from '../../../lib/accounts';
import {parseReadingHistory} from '../../../lib/reader-state';
import {storyIndex} from '../../../lib/story';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const who=readerIdentity(req),identity=await accountIdentity(),profile=identity?await findAccount():null;return authReply(await accountSnapshot(profile,!!identity,who.csrf),200,who.fresh?{'Set-Cookie':who.cookie}:{});}catch(e){console.error('Account read failed',e);return authReply({code:'UNAVAILABLE'},503);}}
export async function POST(req:Request){try{
 const identity=await accountIdentity();if(!identity)return authReply({code:'SIGN_IN'},401);
 const who=readerIdentity(req),denied=readerWriteDenied(req,who);if(denied)return denied;
 let body;try{body=JSON.parse(await boundedReaderBody(req,65536));}catch{return authReply({code:'INVALID'},400);}
 if(!['profile','visit','checkpoint','bookmark','claim','sync'].includes(body?.action))return authReply({code:'INVALID'},400);
 const limited=await readerLimit(req,body.action==='claim'?'account-import':'account',body.action==='claim'?3:60,60);if(limited)return limited;
 const db=storyDatabase();let profile=await findAccount();
 if(body.action==='profile'){
  if(typeof body.name!=='string'||!body.name.trim()||body.name.trim().length>60||!validAvatar(body.avatarId))return authReply({code:'INVALID'},400);
  const now=Math.floor(Date.now()/1000),ip=registrationIp(req);
  if(!profile&&!ip)return authReply({code:'REGISTRATION_IP_UNAVAILABLE'},503);
  // One atomic SQLite statement checks quota and creates the account. Existing identities
  // may edit their profile at the cap; their original registration IP is preserved.
  await db.prepare(`INSERT INTO reader_accounts(id,identity_hash,display_name,avatar_id,created_at,updated_at,registration_ip)
   SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM reader_accounts WHERE identity_hash=?) OR (SELECT COUNT(*) FROM reader_accounts WHERE registration_ip=?)<3
   ON CONFLICT(identity_hash) DO UPDATE SET display_name=excluded.display_name,avatar_id=excluded.avatar_id,updated_at=excluded.updated_at`).bind(randomBytes(16).toString('hex'),identity,body.name.trim().normalize('NFC'),body.avatarId,now,now,ip,identity,ip).run();profile=await findAccount();
  if(!profile)return authReply({code:'REGISTRATION_IP_LIMIT'},429);
 }else{
  if(!profile)return authReply({code:'PROFILE_REQUIRED'},409);
  if(body.action==='visit'){
   if(!validChapterId(body.chapterId)||!['reading','read'].includes(body.status))return authReply({code:'INVALID'},400);
   await saveVisit(profile.id,body.chapterId,body.status,Date.now());
  }
  if(body.action==='checkpoint'){
   const p=cleanCheckpoint(body.checkpoint);if(!p)return authReply({code:'INVALID'},400);await saveCheckpoint(profile.id,p);
  }
  if(body.action==='bookmark'){
   if(!validChapterId(body.chapterId)||!['favorite','read_later'].includes(body.kind)||typeof body.value!=='boolean')return authReply({code:'INVALID'},400);
   // The column is selected exclusively from this fixed allowlist.
   const column=body.kind==='favorite'?'favorite':'read_later';await db.prepare(`INSERT INTO reader_progress(account_id,chapter_id,${column}) VALUES (?,?,?) ON CONFLICT(account_id,chapter_id) DO UPDATE SET ${column}=excluded.${column}`).bind(profile.id,body.chapterId,body.value?1:0).run();
  }
  if(body.action==='claim'||body.action==='sync'){
   const history=parseReadingHistory(JSON.stringify(body.history),storyIndex.map(c=>c.id));if(history.length>storyIndex.length||history.some(v=>Date.parse(v.visitedAt)>Date.now()+300000))return authReply({code:'INVALID'},400);
   const p=body.checkpoint?cleanCheckpoint(body.checkpoint):null;if(body.checkpoint&&!p)return authReply({code:'INVALID'},400);
   const target=accountVisitor(profile.id);
   if(body.action==='claim')await db.batch([
    db.prepare('UPDATE chapter_comments SET visitor_hash=?,account_id=? WHERE visitor_hash=? AND account_id IS NULL').bind(target,profile.id,who.hash),
    db.prepare('INSERT INTO chapter_reactions(chapter_id,visitor_hash,value,updated_at) SELECT chapter_id,?,value,updated_at FROM chapter_reactions WHERE visitor_hash=? ON CONFLICT(chapter_id,visitor_hash) DO NOTHING').bind(target,who.hash),
    db.prepare('DELETE FROM chapter_reactions WHERE visitor_hash=?').bind(who.hash),
    db.prepare('INSERT INTO chapter_visits(chapter_id,visitor_hash,last_viewed_at,views) SELECT chapter_id,?,last_viewed_at,views FROM chapter_visits WHERE visitor_hash=? ON CONFLICT(chapter_id,visitor_hash) DO UPDATE SET views=chapter_visits.views+excluded.views,last_viewed_at=MAX(chapter_visits.last_viewed_at,excluded.last_viewed_at)').bind(target,who.hash),
    db.prepare('DELETE FROM chapter_visits WHERE visitor_hash=?').bind(who.hash)
   ]);
   for(const v of history)await saveVisit(profile.id,v.chapterId,v.status,Date.parse(v.visitedAt));if(p)await saveCheckpoint(profile.id,p);
  }
 }
 return authReply(await accountSnapshot(profile,true,who.csrf));
 }catch(e){console.error('Account update failed',e);return authReply({code:'UNAVAILABLE'},503);}}
