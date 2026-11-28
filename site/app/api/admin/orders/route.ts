import {randomBytes} from 'node:crypto';
import {adminSession,authReply,authorizeWrite} from '../../../../lib/admin-auth';
import {storyDatabase} from '../../../../lib/story-server';
import {planMonthsForAmount} from '../../../../lib/subscriptions';

export const dynamic='force-dynamic';

type AdminOrderRow={
 id:string;
 account_id:string;
 display_name:string|null;
 reference_code:string;
 provider:string;
 tier_id:string;
 amount_cents:number;
 currency:string;
 status:string;
 created_at:number;
 paid_at:number|null;
};

async function listOrders(){
 const rows=await storyDatabase().prepare(
  `SELECT o.id,o.account_id,a.display_name,o.reference_code,o.provider,o.tier_id,o.amount_cents,o.currency,o.status,o.created_at,o.paid_at
   FROM payment_orders o
   LEFT JOIN reader_accounts a ON a.id=o.account_id
   ORDER BY CASE WHEN o.status='pending' THEN 0 ELSE 1 END, o.created_at DESC
   LIMIT 100`
 ).all<AdminOrderRow>();
 return rows.results;
}

export async function GET(req:Request){
 const session=await adminSession(req);
 if(!session)return authReply({error:'Phiên đăng nhập đã hết hạn.'},401);
 try{
  return authReply({orders:await listOrders()});
 }catch(e){
  console.error('Admin orders list failed',e);
  return authReply({orders:[],migrationRequired:true});
 }
}

export async function POST(req:Request){
 const denied=await authorizeWrite(req);
 if(denied)return denied;

 let body:{id?:string;action?:string};
 try{
  body=await req.json() as {id?:string;action?:string};
 }catch{
  return authReply({error:'Dữ liệu không hợp lệ.'},400);
 }
 if(!body.id||!['approve','reject'].includes(body.action||'')){
  return authReply({error:'Hành động không hợp lệ.'},400);
 }

 try{
  const db=storyDatabase();
  const order=await db.prepare(
   'SELECT id,account_id,reference_code,provider,tier_id,amount_cents,status FROM payment_orders WHERE id=?'
  ).bind(body.id).first<{
   id:string;account_id:string;reference_code:string;provider:string;tier_id:string;amount_cents:number;status:string;
  }>();
  if(!order)return authReply({error:'Không tìm thấy đơn thanh toán.'},404);
  if(order.status!=='pending'){
   return authReply({error:'Đơn này đã được xử lý trước đó.'},409);
  }

  const now=Math.floor(Date.now()/1000);
  if(body.action==='reject'){
   await db.prepare("UPDATE payment_orders SET status='rejected' WHERE id=? AND status='pending'").bind(order.id).run();
   return authReply({orders:await listOrders()});
  }

  const months=planMonthsForAmount(order.amount_cents);
  const existingSub=await db.prepare(
   "SELECT current_period_end,status FROM subscriptions WHERE account_id=? AND provider='wise'"
  ).bind(order.account_id).first<{current_period_end:number|null;status:string}>();

  const anchor=existingSub?.status==='active'&&existingSub.current_period_end&&existingSub.current_period_end>now
   ?existingSub.current_period_end
   :now;
  const periodEnd=anchor+months*31*86400;

  await db.batch([
   db.prepare("UPDATE payment_orders SET status='paid',paid_at=? WHERE id=? AND status='pending'").bind(now,order.id),
   db.prepare(
    `INSERT INTO subscriptions(id,account_id,provider,tier_id,status,current_period_end,external_id,updated_at)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(account_id,provider) DO UPDATE SET
       tier_id=excluded.tier_id,
       status=excluded.status,
       current_period_end=excluded.current_period_end,
       external_id=excluded.external_id,
       updated_at=excluded.updated_at`
   ).bind(randomBytes(16).toString('hex'),order.account_id,'wise','imperial','active',periodEnd,order.reference_code,now),
  ]);

  return authReply({orders:await listOrders()});
 }catch(e){
  console.error('Admin order action failed',e);
  return authReply({error:'Không thể cập nhật đơn thanh toán.'},503);
 }
}
