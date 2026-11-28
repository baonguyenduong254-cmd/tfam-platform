import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {authReply} from '../../../../lib/admin-auth';
import {oauthEnv} from '../../../../lib/reader-auth';
import {storyDatabase} from '../../../../lib/story-server';

export const dynamic='force-dynamic';

type PatreonWebhookBody={
 data?:{
  id?:string;
  attributes?:{
   patron_status?:string;
   currently_entitled_amount_cents?:number;
   next_charge_date?:string|null;
  };
  relationships?:{
   user?:{data?:{id?:string}};
   currently_entitled_tiers?:{data?:Array<{id?:string}>};
  };
 };
};

export async function POST(req:Request){
 const envCfg=oauthEnv();
 const secret=envCfg.PATREON_WEBHOOK_SECRET?.trim();
 if(!secret){
  return authReply({error:'Patreon webhook secret is not configured.'},503);
 }

 const signature=req.headers.get('x-patreon-signature')?.trim().toLowerCase()||'';
 const eventName=req.headers.get('x-patreon-event')?.trim()||'';
 const raw=await req.text();
 if(raw.length>262144)return authReply({error:'Payload too large.'},413);

 const expected=createHmac('md5',secret).update(raw).digest('hex');
 if(!/^[a-f0-9]{32}$/.test(signature)||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected))){
  return authReply({error:'Invalid webhook signature.'},401);
 }

 let payload:PatreonWebhookBody;
 try{
  payload=JSON.parse(raw) as PatreonWebhookBody;
 }catch{
  return authReply({error:'Invalid JSON payload.'},400);
 }

 const memberId=payload.data?.id?String(payload.data.id):null;
 const patreonUserId=payload.data?.relationships?.user?.data?.id?String(payload.data.relationships.user.data.id):null;
 const db=storyDatabase();

 let accountId:string|null=null;
 try{
  if(patreonUserId){
   const identityRow=await db.prepare(
    "SELECT account_id FROM auth_identities WHERE provider='patreon' AND provider_user_id=?"
   ).bind(patreonUserId).first<{account_id:string|null}>();
   accountId=identityRow?.account_id||null;
  }
  if(!accountId&&memberId){
   const subRow=await db.prepare(
    "SELECT account_id FROM subscriptions WHERE provider='patreon' AND external_id=?"
   ).bind(memberId).first<{account_id:string}>();
   accountId=subRow?.account_id||null;
  }
 }catch(e){
  console.error('Patreon webhook account lookup failed',e);
  return authReply({error:'Storage unavailable.'},503);
 }

 if(!accountId){
  return authReply({ok:true,handled:false,reason:'Account not yet linked on site.'});
 }

 const attrs=payload.data?.attributes||{};
 const patronStatus=String(attrs.patron_status||'');
 const isDelete=eventName.endsWith(':delete');
 const isActive=!isDelete&&patronStatus==='active_patron';

 const targetTierId=envCfg.PATREON_IMPERIAL_TIER_ID?.trim()||null;
 const tierRefs=(payload.data?.relationships?.currently_entitled_tiers?.data||[]).map(t=>String(t.id||''));
 const entitledCents=Number(attrs.currently_entitled_amount_cents||0);
 const matchesImperial=isActive&&(
  targetTierId
   ?tierRefs.includes(targetTierId)
   :entitledCents>=900||tierRefs.length>0||patronStatus==='active_patron'
 );

 let periodEnd:number|null=null;
 if(typeof attrs.next_charge_date==='string'&&attrs.next_charge_date){
  const parsedMs=Date.parse(attrs.next_charge_date);
  if(!Number.isNaN(parsedMs))periodEnd=Math.floor(parsedMs/1000);
 }

 const now=Math.floor(Date.now()/1000);
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
  matchesImperial?'imperial':'free',
  isActive?'active':isDelete?'canceled':'expired',
  periodEnd,
  memberId,
  now
 ).run();

 return authReply({ok:true,handled:true,event:eventName,tier:matchesImperial?'imperial':'free'});
}
