import {randomBytes} from 'node:crypto';
import {authReply} from '../../../../lib/admin-auth';
import {accountIdentity,findAccount} from '../../../../lib/account-server';
import {boundedReaderBody,readerIdentity,readerLimit,readerWriteDenied} from '../../../../lib/engagement-server';
import {oauthEnv} from '../../../../lib/reader-auth';
import {storyDatabase} from '../../../../lib/story-server';
import {findImperialPlan,IMPERIAL_PLANS} from '../../../../lib/subscriptions';

export const dynamic='force-dynamic';

type OrderRow={
 id:string;
 reference_code:string;
 provider:string;
 tier_id:string;
 amount_cents:number;
 currency:string;
 status:string;
 created_at:number;
 paid_at:number|null;
};

export async function GET(req:Request){
 const envCfg=oauthEnv();
 let who:ReturnType<typeof readerIdentity>|null=null;
 try{who=readerIdentity(req);}catch{}
 const patreonJoinUrl=envCfg.PATREON_JOIN_URL?.trim()||null;
 const wisePaymentUrl=envCfg.WISE_PAYMENT_URL?.trim()||null;
 const wiseAccountNote=envCfg.WISE_ACCOUNT_NOTE?.trim()||null;
 const paymentsEnabled=envCfg.PAYMENTS_ENABLED?.trim()==='true';

 let orders:OrderRow[]=[];
 try{
  const profile=await findAccount(req);
  if(profile){
   const rows=await storyDatabase().prepare(
    'SELECT id,reference_code,provider,tier_id,amount_cents,currency,status,created_at,paid_at FROM payment_orders WHERE account_id=? ORDER BY created_at DESC LIMIT 10'
   ).bind(profile.id).all<OrderRow>();
   orders=rows.results;
  }
 }catch{}

 return authReply({
  plans:IMPERIAL_PLANS,
  paymentsEnabled,
  patreonJoinUrl,
  wisePaymentUrl,
  wiseAccountNote,
  orders,
 },200,who?.fresh?{'Set-Cookie':who.cookie}:{});
}

export async function POST(req:Request){
 try{
  if(oauthEnv().PAYMENTS_ENABLED?.trim()!=='true'){
   return authReply({code:'PAYMENTS_COMING_SOON',error:'Direct payments are not open yet. Launch offer preview only.'},503);
  }
  const identity=await accountIdentity(req);
  if(!identity)return authReply({code:'SIGN_IN',error:'Please sign in first.'},401);

  const who=readerIdentity(req);
  const denied=readerWriteDenied(req,who);
  if(denied)return denied;

  const limited=await readerLimit(req,'sub-order',8,60);
  if(limited)return limited;

  const profile=await findAccount(req);
  if(!profile)return authReply({code:'PROFILE_REQUIRED',error:'Please create your reader profile first.'},409);

  let body:{planId?:string};
  try{
   body=JSON.parse(await boundedReaderBody(req,8192)) as {planId?:string};
  }catch{
   return authReply({code:'INVALID',error:'Invalid request body.'},400);
  }

  const plan=findImperialPlan(body?.planId);
  if(!plan)return authReply({code:'INVALID_PLAN',error:'Selected subscription plan was not found.'},400);

  const db=storyDatabase();
  const id=randomBytes(16).toString('hex');
  const referenceCode='TFAM-'+randomBytes(3).toString('hex').toUpperCase();
  const now=Math.floor(Date.now()/1000);

  await db.prepare(
   'INSERT INTO payment_orders(id,account_id,reference_code,provider,tier_id,amount_cents,currency,status,created_at,paid_at) VALUES (?,?,?,?,?,?,?,?,?,NULL)'
  ).bind(id,profile.id,referenceCode,'wise','imperial',plan.amountCents,plan.currency,'pending',now).run();

  const envCfg=oauthEnv();
  return authReply({
   order:{
    id,
    reference_code:referenceCode,
    provider:'wise',
    tier_id:'imperial',
    amount_cents:plan.amountCents,
    currency:plan.currency,
    status:'pending',
    created_at:now,
    paid_at:null,
   },
   wisePaymentUrl:envCfg.WISE_PAYMENT_URL?.trim()||null,
   wiseAccountNote:envCfg.WISE_ACCOUNT_NOTE?.trim()||null,
  },201);
 }catch(e){
  console.error('Create Wise order failed',e);
  return authReply({code:'UNAVAILABLE',error:'Could not create payment order. Ensure D1 migration 0006 is applied.'},503);
 }
}
