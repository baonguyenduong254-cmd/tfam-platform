'use client';

import {useEffect,useState} from 'react';
import {Check,Copy,Crown,ExternalLink,Link2,LogIn,ShieldCheck} from 'lucide-react';
import {AccountMenu,useReaderAccount} from '../components/ReaderAccount';
import {formatUsd,IMPERIAL_PLANS,type ImperialPlan} from '../../lib/subscriptions';

type PaymentOrder={
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

type OrderCatalogResponse={
 plans:ImperialPlan[];
 paymentsEnabled:boolean;
 patreonJoinUrl:string|null;
 wisePaymentUrl:string|null;
 wiseAccountNote:string|null;
 orders:PaymentOrder[];
};

const FREE_PERKS=[
 'All public main-story chapters across released arcs',
 'Interactive 1715 & 1716 Atlas and faction chronicles',
 'Cross-device bookmarks, reading history & comments',
];

const IMPERIAL_PERKS=[
 'All main-story NSFW chapters unlocked',
 'All NSFW side stories & after-hours vignettes',
 'Uncensored & after-hours character art editions',
 'Early chapter access before public release',
 'Imperial Crown badge & Roll of Honour recognition',
];

export default function SubscribeClient(){
 const account=useReaderAccount();
 const [catalog,setCatalog]=useState<OrderCatalogResponse>({
  plans:[...IMPERIAL_PLANS],
  paymentsEnabled:false,
  patreonJoinUrl:null,
  wisePaymentUrl:null,
  wiseAccountNote:null,
  orders:[],
 });
 const [selectedPlan,setSelectedPlan]=useState<ImperialPlan['id']>('imperial_1m');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [copiedCode,setCopiedCode]=useState('');

 async function loadCatalog(){
  try{
   const res=await fetch('/api/subscriptions/order',{cache:'no-store'});
   if(!res.ok)return;
   const data=await res.json() as OrderCatalogResponse;
   setCatalog(data);
  }catch{}
 }

 useEffect(()=>{void loadCatalog();},[account.epoch,account.data?.authenticated]);

 async function createWiseOrder(){
  setBusy(true);
  setError('');
  try{
   const res=await fetch('/api/subscriptions/order',{
    method:'POST',
    headers:{
     'Content-Type':'application/json',
     'X-Reader-CSRF':account.data?.csrf||'',
    },
    body:JSON.stringify({planId:selectedPlan}),
   });
   const data=await res.json() as {error?:string;order?:PaymentOrder};
   if(!res.ok)throw new Error(data.error||'Could not create Wise order.');
   await loadCatalog();
  }catch(e){
   setError(e instanceof Error?e.message:'Could not create Wise order.');
  }finally{
   setBusy(false);
  }
 }

 async function copyReference(code:string){
  try{
   await navigator.clipboard.writeText(code);
   setCopiedCode(code);
   setTimeout(()=>setCopiedCode(''),2200);
  }catch{}
 }

 const profile=account.data?.profile;
 const entitlement=account.data?.entitlement;
 const isImperial=!!entitlement?.isImperial;
 const patreonLinked=!!entitlement?.linkedProviders.includes('patreon');
 const activePlan=catalog.plans.find(p=>p.id===selectedPlan)||IMPERIAL_PLANS[0];
 const latestPending=catalog.orders.find(o=>o.status==='pending');

 return (
  <main className="subscribe-main">
   <header className="subscribe-hero">
    <div className="subscribe-hero-top">
     <span className="subscribe-eyebrow">THROUGH FROST AND MYTH · IMPERIAL PATRONAGE</span>
     <AccountMenu lang="en" />
    </div>
    <h1>Imperial Tier Membership</h1>
    <p className="subscribe-subtitle">
     Unlock every main-story NSFW chapter, private side stories, uncensored artwork, and early chapter releases while directly funding new volumes.
    </p>
    <div className="subscribe-sale-banner">
     <Crown size={18} />
     <span>
      <strong>Launch Sale: $9.99 / month</strong> <s>$19.90 / month</s> · Lock in the Founding Imperial rate
     </span>
    </div>
    {account.data?.authenticated&&(
     <div className={`subscribe-status-pill${isImperial?' is-imperial':''}`}>
      <ShieldCheck size={16} />
      <span>
       {isImperial
        ?`Active: Imperial Tier${entitlement?.provider?` (${entitlement.provider==='patreon'?'Patreon':'Wise Direct'})`:''}${entitlement?.currentPeriodEnd?` · Valid until ${new Date(entitlement.currentPeriodEnd*1000).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`:''}`
        :'Current status: Free Reader'}
      </span>
     </div>
    )}
   </header>

   <section className="subscribe-tiers" aria-label="Membership tiers">
    <article className="subscribe-tier-card">
     <div className="tier-card-head">
      <h2>Free Reader</h2>
      <div className="tier-price">$0<span>/month</span></div>
     </div>
     <ul>
      {FREE_PERKS.map(item=>(
       <li key={item}><Check size={16} /><span>{item}</span></li>
      ))}
     </ul>
    </article>

    <article className="subscribe-tier-card featured">
     <div className="tier-card-head">
      <div>
       <span className="tier-badge">Launch Sale -50%</span>
       <h2>Imperial Tier</h2>
      </div>
      <div className="tier-price">
       <s>$19.90</s>
       <strong>$9.99</strong>
       <span>/month</span>
      </div>
     </div>
     <ul>
      {IMPERIAL_PERKS.map(item=>(
       <li key={item}><Crown size={16} /><span>{item}</span></li>
      ))}
     </ul>
    </article>
   </section>

   <section className="subscribe-checkout">
    <div className="subscribe-checkout-head">
     <h2>Choose Payment Method</h2>
     {!catalog.paymentsEnabled&&(
      <span className="subscribe-preview-pill">Pre-Launch Preview · Payments Opening Soon</span>
     )}
    </div>
    {!catalog.paymentsEnabled&&(
     <p className="subscribe-preview-note">
      Google Sign-In and account profiles are live now. Founding Imperial Tier billing ($9.99/mo launch offer) is currently in showcase preview and will open once Volume releases go live.
     </p>
    )}
    {!account.ready?(
     <p className="subscribe-muted">Checking account session…</p>
    ):!account.data?.authenticated?(
     <div className="subscribe-gate">
      <p>Sign in with Google right now to reserve your reader profile, sync progress across devices, and be ready when Founding Imperial Tier opens.</p>
      <div className="subscribe-auth-row">
       <a className="sub-btn primary" href="/api/auth/google?return_to=%2Fsubscribe"><LogIn size={16} />Continue with Google</a>
       {catalog.paymentsEnabled&&(
        <a className="sub-btn patreon" href="/api/auth/patreon?return_to=%2Fsubscribe"><Crown size={16} />Continue with Patreon</a>
       )}
      </div>
     </div>
    ):!profile?(
     <div className="subscribe-gate">
      <p>Complete your reader profile display name first.</p>
      <button type="button" className="sub-btn primary" onClick={()=>window.dispatchEvent(new CustomEvent('tfam-open-account'))}>
       Complete Reader Profile
      </button>
     </div>
    ):(
     <div className={`checkout-grid${!catalog.paymentsEnabled?' is-preview':''}`}>
      <div className="checkout-panel">
       <h3>1. Instant Monthly Billing via Patreon</h3>
       <p>
        Recommended for international cards, PayPal, and Apple Pay. Patreon renews automatically and syncs straight to your TFAM account.
       </p>
       <div className="checkout-actions">
        {!catalog.paymentsEnabled?(
         <button type="button" className="sub-btn patreon" disabled>Patreon Billing Opening Soon</button>
        ):(
         <>
          {catalog.patreonJoinUrl&&(
           <a className="sub-btn patreon" href={catalog.patreonJoinUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />Join Imperial Tier on Patreon
           </a>
          )}
          <a className="sub-btn secondary" href="/api/auth/patreon?mode=link&return_to=%2Fsubscribe">
           <Link2 size={16} />{patreonLinked?'Refresh Patreon Status':'Link Patreon to Sync'}
          </a>
         </>
        )}
       </div>
       {catalog.paymentsEnabled&&!catalog.patreonJoinUrl&&(
        <small className="subscribe-muted">Already pledged on Patreon? Use “Link Patreon to Sync” above to activate immediately.</small>
       )}
      </div>

      <div className="checkout-panel">
       <h3>2. Direct Payment via Wise</h3>
       <p>
        Low-fee direct transfer in USD. Generate a unique order code, send the exact amount via Wise, and include the code in the transfer note.
       </p>

       <div className="wise-plan-grid" role="radiogroup" aria-label="Wise duration plans">
        {catalog.plans.map(plan=>(
         <button
          key={plan.id}
          type="button"
          className={`wise-plan-option${selectedPlan===plan.id?' selected':''}`}
          aria-pressed={selectedPlan===plan.id}
          onClick={()=>setSelectedPlan(plan.id)}
         >
          <span className="plan-badge">{plan.badge}</span>
          <strong>{plan.label}</strong>
          <span className="plan-amount">{formatUsd(plan.amountCents)} <s>{formatUsd(plan.regularCents)}</s></span>
          <small>{plan.perMonthLabel}</small>
         </button>
        ))}
       </div>

       <div className="checkout-actions">
        <button type="button" className="sub-btn primary" disabled={busy||!catalog.paymentsEnabled} onClick={()=>{void createWiseOrder();}}>
         {!catalog.paymentsEnabled?'Wise Checkout Opening Soon':busy?'Creating reference…':`Create Wise Order (${formatUsd(activePlan.amountCents)})`}
        </button>
        {catalog.paymentsEnabled&&catalog.wisePaymentUrl&&(
         <a className="sub-btn secondary" href={catalog.wisePaymentUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />Open Wise Payment Link
         </a>
        )}
       </div>

       {error&&<p className="subscribe-error" role="alert">{error}</p>}

       {latestPending&&(
        <div className="wise-pending-box">
         <div>
          <span className="pending-label">Pending Reference Code</span>
          <strong className="pending-code">{latestPending.reference_code}</strong>
          <small>
           Send exactly <strong>{formatUsd(latestPending.amount_cents)} {latestPending.currency}</strong> with memo <code>{latestPending.reference_code}</code>.
          </small>
          {catalog.wiseAccountNote&&<small>{catalog.wiseAccountNote}</small>}
         </div>
         <button type="button" className="sub-btn secondary" onClick={()=>{void copyReference(latestPending.reference_code);}}>
          <Copy size={15} />{copiedCode===latestPending.reference_code?'Copied':'Copy Code'}
         </button>
        </div>
       )}

       {catalog.orders.length>0&&(
        <div className="wise-order-history">
         <h4>Your Wise Orders</h4>
         <ul>
          {catalog.orders.map(order=>(
           <li key={order.id}>
            <code>{order.reference_code}</code>
            <span>{formatUsd(order.amount_cents)} {order.currency}</span>
            <span className={`order-status status-${order.status}`}>{order.status}</span>
           </li>
          ))}
         </ul>
        </div>
       )}
      </div>
     </div>
    )}
   </section>
  </main>
 );
}
