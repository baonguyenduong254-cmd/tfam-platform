import {env} from 'cloudflare:workers';
import {createHash,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
const COOKIE='__Host-tfam_admin',TTL=8*60*60;
type Secrets={TFAM_ADMIN_USERNAME?:string;TFAM_ADMIN_PASSWORD_HASH?:string};
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export function authReply(body:unknown,status=200,headers:Record<string,string>={}){return Response.json(body,{status,headers:{'Cache-Control':'no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff',...headers}});}
export function credential(){const e=env as typeof env&Secrets;if(!e.TFAM_ADMIN_USERNAME||!e.TFAM_ADMIN_PASSWORD_HASH)throw Error('Admin configuration unavailable');return {username:e.TFAM_ADMIN_USERNAME,hash:e.TFAM_ADMIN_PASSWORD_HASH,version:digest(e.TFAM_ADMIN_PASSWORD_HASH)};}
export async function verifyPassword(password:string,encoded:string){
 const [algorithm,salt,hex]=encoded.split('$');if(algorithm!=='scrypt-32768-8-3'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(hex))throw Error('Invalid password verifier');
 const actual=await new Promise<Buffer>((resolve,reject)=>scrypt(password,Buffer.from(salt,'hex'),32,{N:32768,r:8,p:3,maxmem:64*1024*1024},(err,key)=>err?reject(err):resolve(key)));
 return timingSafeEqual(actual,Buffer.from(hex,'hex'));
}
function cookieToken(req:Request){const value=req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return value&&/^[a-f0-9]{64}$/.test(value)?value:null;}
export async function adminSession(req:Request){
 const token=cookieToken(req);if(!token)return null;const c=credential();
 const row=await env.DB!.prepare('SELECT expires_at, credential_version FROM admin_sessions WHERE token_hash=?').bind(digest(token)).first<{expires_at:number;credential_version:string}>();
 if(!row||row.expires_at<=Math.floor(Date.now()/1000)||row.credential_version!==c.version)return null;
 return {username:c.username,csrf:digest('csrf:'+token),tokenHash:digest(token)};
}
export async function authorizeWrite(req:Request){if(!sameOrigin(req))return authReply({error:'Yêu cầu không hợp lệ.'},403);const session=await adminSession(req);if(!session)return authReply({error:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'},401);const csrf=req.headers.get('x-csrf-token')||'';if(!/^[a-f0-9]{64}$/.test(csrf)||!timingSafeEqual(Buffer.from(csrf),Buffer.from(session.csrf)))return authReply({error:'Yêu cầu không hợp lệ.'},403);return null;}
export async function throttleLogin(req:Request){
 const now=Math.floor(Date.now()/1000),ip=digest(req.headers.get('cf-connecting-ip')||'shared');
 // Atomic counters prevent parallel attempts bypassing the window.
 for(const [bucket,limit,window] of [['ip:'+ip,6,900],['global',30,60]] as const){
  const row=await env.DB!.prepare('INSERT INTO admin_login_limits(bucket, attempts, reset_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN reset_at<=? THEN 1 ELSE attempts+1 END, reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END RETURNING attempts, reset_at').bind(bucket,now+window,now,now,now+window).first<{attempts:number;reset_at:number}>();
  if(!row||row.attempts>limit)return authReply({error:'Quá nhiều lần thử. Vui lòng thử lại sau.'},429,{'Retry-After':String(Math.max(1,(row?.reset_at||now+window)-now))});
 }
 return null;
}
export async function createSession(){const token=randomBytes(32).toString('hex'),c=credential(),now=Math.floor(Date.now()/1000);await env.DB!.batch([env.DB!.prepare('DELETE FROM admin_sessions WHERE expires_at<=? OR credential_version<>?').bind(now,c.version),env.DB!.prepare('INSERT INTO admin_sessions(token_hash, expires_at, credential_version) VALUES (?,?,?)').bind(digest(token),now+TTL,c.version),env.DB!.prepare('DELETE FROM admin_login_limits WHERE reset_at<=?').bind(now)]);return {csrf:digest('csrf:'+token),cookie:`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL}`};}
export async function endSession(req:Request){const token=cookieToken(req);if(token)await env.DB!.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(digest(token)).run();return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;}
