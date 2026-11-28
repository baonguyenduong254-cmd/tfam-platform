import {isIP} from 'node:net';
import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {adminSession,authReply,credential,digest,sameOrigin} from './admin-auth';
import {findAccount,accountVisitor} from './account-server';
import {validAvatar,avatars} from './accounts';
import {storyDatabase} from './story-server';
const COOKIE='__Host-tfam_reader',TTL=365*86400;
const mac=(s:string)=>createHmac('sha256',credential().hash).update('reader:'+s).digest('hex');
// Accept only the edge-provided IP, never client-supplied forwarding headers.
export function registrationIp(req:Request){const raw=req.headers.get('cf-connecting-ip')?.trim()||'';const family=isIP(raw);if(!family)return null;const normalized=family===6?new URL('http://['+raw+']/').hostname.toLowerCase():raw;return mac('registration-ip:'+normalized);}
export function readerIdentity(req:Request){
 const raw=req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
 const [token,signature]=raw.split('.');const valid=/^[a-f0-9]{64}$/.test(token||'')&&/^[a-f0-9]{64}$/.test(signature||'')&&timingSafeEqual(Buffer.from(signature),Buffer.from(mac(token)));
 const id=valid?token:randomBytes(32).toString('hex');
 return {hash:digest(id),csrf:mac('csrf:'+id),fresh:!valid,cookie:`${COOKIE}=${id}.${mac(id)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL}`};
}
export async function engagementIdentity(req:Request){const who=readerIdentity(req),account=await findAccount(req);return {...who,hash:account?accountVisitor(account.id):who.hash,account};}
export function readerWriteDenied(req:Request,identity:ReturnType<typeof readerIdentity>){
 if(!sameOrigin(req)||identity.fresh||req.headers.get('x-reader-csrf')!==identity.csrf)return authReply({code:'SESSION',error:'Hãy tải lại phần bình luận rồi thử lại.'},403);
 return null;
}
export async function readerLimit(req:Request,kind:string,limit:number,seconds:number){
 const now=Math.floor(Date.now()/1000),ip=mac('ip:'+(req.headers.get('cf-connecting-ip')||'shared'));
 const db=storyDatabase();
 const row=await db.prepare(`INSERT INTO reader_rate_limits(bucket,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN reset_at<=? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END RETURNING attempts,reset_at`).bind(kind+':'+ip,now+seconds,now,now,now+seconds).first<{attempts:number;reset_at:number}>();
 if(!row||row.attempts>limit)return authReply({code:'RATE_LIMIT',error:'Thao tác quá nhanh. Vui lòng thử lại sau.'},429,{'Retry-After':String(Math.max(1,(row?.reset_at||now+seconds)-now))});
 await db.prepare('DELETE FROM reader_rate_limits WHERE bucket IN (SELECT bucket FROM reader_rate_limits WHERE reset_at<=? LIMIT 100)').bind(now).run();return null;
}
export async function engagementStats(id:string,visitor:string){
 const db=storyDatabase();const result=await db.batch<Record<string,number>>([
 db.prepare('SELECT COALESCE(SUM(views),0) AS views FROM chapter_visits WHERE chapter_id=?').bind(id),
 db.prepare('SELECT COALESCE(SUM(value=1),0) AS likes,COALESCE(SUM(value=-1),0) AS dislikes FROM chapter_reactions WHERE chapter_id=?').bind(id),
 db.prepare('SELECT COUNT(*) AS comments FROM chapter_comments WHERE chapter_id=?').bind(id)
 ]);
 // A reader has at most one current reaction per chapter.
 const mine=await db.prepare('SELECT value FROM chapter_reactions WHERE chapter_id=? AND visitor_hash=?').bind(id,visitor).first<{value:number}>();
 return {...result[0].results[0],...result[1].results[0],...result[2].results[0],reaction:mine?.value||0};
}
export async function commentPage(req:Request,id:string,visitor:string,before:number|null){
 const admin=Boolean(await adminSession(req)),db=storyDatabase();
 const rows=await db.prepare('SELECT c.id,COALESCE(a.display_name,c.display_name) AS display_name,c.body,c.created_at,c.visitor_hash,a.avatar_id FROM chapter_comments c LEFT JOIN reader_accounts a ON c.account_id=a.id WHERE c.chapter_id=? AND c.id<? ORDER BY c.id DESC LIMIT 21').bind(id,before??Number.MAX_SAFE_INTEGER).all<{id:number;display_name:string;body:string;created_at:number;visitor_hash:string;avatar_id:string|null}>();
 const items=rows.results.slice(0,20);return {items:items.map(({visitor_hash,...r})=>({...r,avatar:validAvatar(r.avatar_id)?avatars.find(a=>a.id===r.avatar_id)!.asset:null,canDelete:admin||visitor_hash===visitor})),next:rows.results.length>20?items.at(-1)!.id:null,isAdmin:admin};
}

export async function boundedReaderBody(req:Request,maxBytes=10000){
 const reader=req.body?.getReader();if(!reader)throw Error('INVALID');let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('TOO_LARGE');}chunks.push(value);}
 const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}return new TextDecoder().decode(all);
}
