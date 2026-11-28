import {env} from 'cloudflare:workers';
import {randomBytes} from 'node:crypto';
import {headers} from 'next/headers';
import {digest} from './admin-auth';
import {avatars,FREE_ENTITLEMENT,type AccountEntitlement,type OAuthProvider} from './accounts';
import {storyDatabase} from './story-server';

const SESSION_COOKIE='tfam_reader_session';
const SESSION_TTL=30*86400;
const STATE_TTL=600;

export type ReaderSessionRow={
 tokenHash:string;
 identityHash:string;
 accountId:string|null;
 provider:OAuthProvider;
 email:string|null;
 expiresAt:number;
};

export type PatreonMembershipSync={
 tierId:'free'|'imperial';
 status:'active'|'canceled'|'expired';
 currentPeriodEnd:number|null;
 externalId:string|null;
};

export function oauthEnv(){
 return env as typeof env & Cloudflare.Env;
}

export function publicOrigin(req:Request):string{
 const configured=oauthEnv().TFAM_PUBLIC_ORIGIN?.trim().replace(/\/+$/,'');
 if(configured)return configured;
 const url=new URL(req.url);
 const proto=req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()||url.protocol.replace(/:$/,'');
 const host=req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()||req.headers.get('host')||url.host;
 return `${proto}://${host}`;
}

export function isSecureOrigin(originOrReq:string|Request):boolean{
 const origin=typeof originOrReq==='string'?originOrReq:publicOrigin(originOrReq);
 return origin.startsWith('https://');
}

export function safeReturnTo(value:string|null|undefined):string{
 if(!value||!value.startsWith('/')||value.startsWith('//'))return '/#reader';
 try{
  const parsed=new URL(value,'https://app.local');
  if(parsed.origin!=='https://app.local')return '/#reader';
  if(parsed.pathname.startsWith('/api/auth/'))return '/#reader';
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
 }catch{
  return '/#reader';
 }
}

export function extractSessionToken(cookieHeader:string|null|undefined):string|null{
 if(!cookieHeader)return null;
 const raw=cookieHeader.split(';').map(v=>v.trim()).find(v=>v.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);
 return raw&&/^[a-f0-9]{64}$/.test(raw)?raw:null;
}

export async function getReaderSession(req?:Request):Promise<ReaderSessionRow|null>{
 try{
  const cookieHeader=req?req.headers.get('cookie'):(await headers()).get('cookie');
  const token=extractSessionToken(cookieHeader);
  if(!token)return null;
  const now=Math.floor(Date.now()/1000);
  const row=await storyDatabase().prepare(
   'SELECT token_hash,identity_hash,account_id,provider,email,expires_at FROM reader_sessions WHERE token_hash=?'
  ).bind(digest(token)).first<{token_hash:string;identity_hash:string;account_id:string|null;provider:string;email:string|null;expires_at:number}>();
  if(!row||row.expires_at<=now)return null;
  const provider:OAuthProvider=row.provider==='patreon'?'patreon':'google';
  return {
   tokenHash:row.token_hash,
   identityHash:row.identity_hash,
   accountId:row.account_id,
   provider,
   email:row.email,
   expiresAt:row.expires_at,
  };
 }catch{
  return null;
 }
}

export async function createReaderSession(input:{identityHash:string;accountId:string|null;provider:OAuthProvider;email:string|null;secure:boolean}):Promise<string>{
 const token=randomBytes(32).toString('hex');
 const now=Math.floor(Date.now()/1000);
 const db=storyDatabase();
 await db.batch([
  db.prepare('DELETE FROM reader_sessions WHERE expires_at<=?').bind(now),
  db.prepare('INSERT INTO reader_sessions(token_hash,identity_hash,account_id,provider,email,expires_at,created_at) VALUES (?,?,?,?,?,?,?)')
   .bind(digest(token),input.identityHash,input.accountId,input.provider,input.email,now+SESSION_TTL,now),
 ]);
 return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${input.secure?'; Secure':''}`;
}

export async function clearReaderSession(req:Request):Promise<string>{
 const token=extractSessionToken(req.headers.get('cookie'));
 if(token){
  try{
   await storyDatabase().prepare('DELETE FROM reader_sessions WHERE token_hash=?').bind(digest(token)).run();
  }catch{}
 }
 const secure=isSecureOrigin(req);
 return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure?'; Secure':''}`;
}

export async function createOAuthState(provider:OAuthProvider,returnTo:string,linkAccountId:string|null=null):Promise<string>{
 const state=randomBytes(32).toString('hex');
 const now=Math.floor(Date.now()/1000);
 const db=storyDatabase();
 await db.batch([
  db.prepare('DELETE FROM oauth_states WHERE expires_at<=?').bind(now),
  db.prepare('INSERT INTO oauth_states(state_hash,provider,return_to,link_account_id,expires_at) VALUES (?,?,?,?,?)')
   .bind(digest(state),provider,safeReturnTo(returnTo),linkAccountId,now+STATE_TTL),
 ]);
 return state;
}

export async function consumeOAuthState(state:string,provider:OAuthProvider):Promise<{returnTo:string;linkAccountId:string|null}|null>{
 if(!/^[a-f0-9]{64}$/.test(state))return null;
 const now=Math.floor(Date.now()/1000);
 const db=storyDatabase();
 const stateHash=digest(state);
 const row=await db.prepare('SELECT return_to,link_account_id,expires_at FROM oauth_states WHERE state_hash=? AND provider=?')
  .bind(stateHash,provider).first<{return_to:string;link_account_id:string|null;expires_at:number}>();
 await db.prepare('DELETE FROM oauth_states WHERE state_hash=?').bind(stateHash).run();
 if(!row||row.expires_at<=now)return null;
 return {returnTo:safeReturnTo(row.return_to),linkAccountId:row.link_account_id};
}

function cleanDisplayName(raw:string|null|undefined,email:string|null|undefined):string{
 const base=(raw||'').trim().normalize('NFC')||(email?email.split('@')[0]:'')||'Castilian Reader';
 return base.slice(0,60);
}

export async function upsertOAuthLogin(input:{
 provider:OAuthProvider;
 providerUserId:string;
 email:string|null;
 displayName:string|null;
 linkAccountId:string|null;
 registrationIpHash:string|null;
 patreonMembership?:PatreonMembershipSync|null;
}):Promise<{identityHash:string;accountId:string|null;linkConflict?:boolean}>{
 const db=storyDatabase();
 const now=Math.floor(Date.now()/1000);
 const existing=await db.prepare(
  'SELECT id,account_id,identity_hash FROM auth_identities WHERE provider=? AND provider_user_id=?'
 ).bind(input.provider,input.providerUserId).first<{id:string;account_id:string|null;identity_hash:string}>();

 let accountId:string|null=null;
 let identityHash=existing?.identity_hash||digest(`tfam-oauth:${input.provider}:${input.providerUserId}`);

 if(input.linkAccountId){
  if(existing?.account_id&&existing.account_id!==input.linkAccountId){
   return {identityHash,accountId:existing.account_id,linkConflict:true};
  }
  const target=await db.prepare('SELECT id,identity_hash FROM reader_accounts WHERE id=?')
   .bind(input.linkAccountId).first<{id:string;identity_hash:string}>();
  if(target){
   accountId=target.id;
   identityHash=target.identity_hash;
  }
 }else if(existing?.account_id){
  const existingAccount=await db.prepare('SELECT id,identity_hash FROM reader_accounts WHERE id=?')
   .bind(existing.account_id).first<{id:string;identity_hash:string}>();
  if(existingAccount){
   accountId=existingAccount.id;
   identityHash=existingAccount.identity_hash;
  }
 }

 if(!accountId&&!input.linkAccountId){
  const matchedByHash=await db.prepare('SELECT id,identity_hash FROM reader_accounts WHERE identity_hash=?')
   .bind(identityHash).first<{id:string;identity_hash:string}>();
  if(matchedByHash){
   accountId=matchedByHash.id;
  }else{
   const newAccountId=randomBytes(16).toString('hex');
   const name=cleanDisplayName(input.displayName,input.email);
   const avatarId=avatars[0].id;
   if(input.registrationIpHash){
    await db.prepare(
     `INSERT INTO reader_accounts(id,identity_hash,display_name,avatar_id,created_at,updated_at,registration_ip)
      SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM reader_accounts WHERE registration_ip=?)<3
      ON CONFLICT(identity_hash) DO NOTHING`
    ).bind(newAccountId,identityHash,name,avatarId,now,now,input.registrationIpHash,input.registrationIpHash).run();
   }else{
    await db.prepare(
     `INSERT INTO reader_accounts(id,identity_hash,display_name,avatar_id,created_at,updated_at,registration_ip)
      VALUES (?,?,?,?,?,?,NULL) ON CONFLICT(identity_hash) DO NOTHING`
    ).bind(newAccountId,identityHash,name,avatarId,now,now).run();
   }
   const created=await db.prepare('SELECT id FROM reader_accounts WHERE identity_hash=?')
    .bind(identityHash).first<{id:string}>();
   accountId=created?.id||null;
  }
 }

 await db.prepare(
  `INSERT INTO auth_identities(id,account_id,provider,provider_user_id,identity_hash,email,display_name,created_at,updated_at)
   VALUES (?,?,?,?,?,?,?,?,?)
   ON CONFLICT(provider,provider_user_id) DO UPDATE SET
     account_id=COALESCE(excluded.account_id,auth_identities.account_id),
     identity_hash=COALESCE(excluded.identity_hash,auth_identities.identity_hash),
     email=COALESCE(excluded.email,auth_identities.email),
     display_name=COALESCE(excluded.display_name,auth_identities.display_name),
     updated_at=excluded.updated_at`
 ).bind(
  existing?.id||randomBytes(16).toString('hex'),
  accountId,
  input.provider,
  input.providerUserId,
  identityHash,
  input.email,
  input.displayName,
  now,
  now
 ).run();

 if(accountId&&input.patreonMembership){
  await db.prepare(
   `INSERT INTO subscriptions(id,account_id,provider,tier_id,status,current_period_end,external_id,updated_at)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(account_id,provider) DO UPDATE SET
      tier_id=excluded.tier_id,
      status=excluded.status,
      current_period_end=excluded.current_period_end,
      external_id=COALESCE(excluded.external_id,subscriptions.external_id),
      updated_at=excluded.updated_at`
  ).bind(
   randomBytes(16).toString('hex'),
   accountId,
   'patreon',
   input.patreonMembership.tierId,
   input.patreonMembership.status,
   input.patreonMembership.currentPeriodEnd,
   input.patreonMembership.externalId,
   now
  ).run();
 }

 return {identityHash,accountId};
}

export function parsePatreonMembership(payload:Record<string,unknown>):PatreonMembershipSync{
 const envCfg=oauthEnv();
 const targetCampaignId=envCfg.PATREON_CAMPAIGN_ID?.trim()||null;
 const targetTierId=envCfg.PATREON_IMPERIAL_TIER_ID?.trim()||null;
 const included=Array.isArray(payload.included)?payload.included as Array<Record<string,unknown>>:[];
 const memberships=included.filter(item=>item?.type==='member');

 const chosen=memberships.find(m=>{
  if(!targetCampaignId)return true;
  const rel=m.relationships as Record<string,unknown>|undefined;
  const camp=(rel?.campaign as Record<string,unknown>|undefined)?.data as Record<string,unknown>|undefined;
  return camp?.id===targetCampaignId;
 })||memberships[0];

 if(!chosen){
  return {tierId:'free',status:'expired',currentPeriodEnd:null,externalId:null};
 }

 const attrs=(chosen.attributes||{}) as Record<string,unknown>;
 const patronStatus=String(attrs.patron_status||'');
 const isActive=patronStatus==='active_patron';
 const entitledCents=Number(attrs.currently_entitled_amount_cents||0);
 const rel=(chosen.relationships||{}) as Record<string,unknown>;
 const tierRefs=Array.isArray((rel.currently_entitled_tiers as Record<string,unknown>|undefined)?.data)
  ?((rel.currently_entitled_tiers as Record<string,unknown>).data as Array<Record<string,unknown>>).map(t=>String(t.id||''))
  :[];

 const matchesImperial=isActive&&(
  targetTierId
   ?tierRefs.includes(targetTierId)
   :entitledCents>=900||tierRefs.length>0||patronStatus==='active_patron'
 );

 let periodEnd:number|null=null;
 const rawNextCharge=attrs.next_charge_date;
 if(typeof rawNextCharge==='string'&&rawNextCharge){
  const parsedMs=Date.parse(rawNextCharge);
  if(!Number.isNaN(parsedMs))periodEnd=Math.floor(parsedMs/1000);
 }

 return {
  tierId:matchesImperial?'imperial':'free',
  status:isActive?'active':patronStatus==='declined_patron'?'expired':'canceled',
  currentPeriodEnd:periodEnd,
  externalId:typeof chosen.id==='string'?chosen.id:null,
 };
}

export async function getAccountEntitlements(accountId:string|null):Promise<AccountEntitlement>{
 if(!accountId)return FREE_ENTITLEMENT;
 try{
  const db=storyDatabase();
  const now=Math.floor(Date.now()/1000);
  const [subRows,idRows]=await Promise.all([
   db.prepare('SELECT provider,tier_id,status,current_period_end FROM subscriptions WHERE account_id=? ORDER BY updated_at DESC')
    .bind(accountId).all<{provider:string;tier_id:string;status:string;current_period_end:number|null}>(),
   db.prepare('SELECT DISTINCT provider FROM auth_identities WHERE account_id=?')
    .bind(accountId).all<{provider:string}>(),
  ]);
  const linkedProviders:OAuthProvider[]=idRows.results
   .map(r=>r.provider)
   .filter((p):p is OAuthProvider=>p==='google'||p==='patreon');

  const activeImperial=subRows.results.find(
   s=>s.tier_id==='imperial'&&s.status==='active'&&(!s.current_period_end||s.current_period_end>now)
  );
  if(activeImperial){
   return {
    tier:'imperial',
    isImperial:true,
    provider:activeImperial.provider,
    currentPeriodEnd:activeImperial.current_period_end,
    linkedProviders,
   };
  }
  return {
   tier:'free',
   isImperial:false,
   provider:null,
   currentPeriodEnd:null,
   linkedProviders,
  };
 }catch{
  return FREE_ENTITLEMENT;
 }
}
