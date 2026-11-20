'use client';
import {useEffect,useState} from 'react';
import {ledgerCount,ledgerPeriod,type LedgerKind} from '../../lib/world-ledger';

export function LedgerIcon({kind}:{kind:LedgerKind}){
 return <svg className="ledger-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
 {kind==='cold-deaths'?<>
  <path d="M13 26c-3-2-5-5-5-9a12 12 0 0 1 24 0c0 4-2 7-5 9v6H13zM16 32v-5m4 5v-5m4 5v-5"/>
  <path d="m12 16 5 2-2 4-4-2zm16 0-5 2 2 4 4-2zM20 21l-2 3h4z"/>
  <path d="M20 2v9m-4-7 8 5m0-5-8 5M4 29l4 3m-4 2 4-5m24 0 4 3m-4 2 4-5M8 36h24"/>
 </>:<>
  <path d="m20 2 15 9v18l-15 9-15-9V11z" opacity=".5"/>
  <path d="m20 7 8 9-3 12-5 6-5-6-3-12zm0 0-3 12 3 15 3-15zM12 16l5 3 6 0 5-3M15 28l5-5 5 5"/>
  <path d="M2 20h3m30 0h3M20 1v3m0 32v3"/>
 </>}
 </svg>;
}

export default function WorldLedgerWidget({kind,year,lang}:{kind:LedgerKind;year:string;lang:string}){
 const [now,setNow]=useState<number|null>(null),deaths=kind==='cold-deaths';
 const t=(vi:string,en:string)=>en;
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;let active=true;
  const refresh=()=>{
   if(!active)return;clearTimeout(timer);
   const clock=Date.now();setNow(clock);
   const period=ledgerPeriod(kind);
   timer=setTimeout(refresh,period-clock%period+15);
  };
  const visible=()=>{if(!document.hidden)refresh();};
  refresh();document.addEventListener('visibilitychange',visible);
  return()=>{active=false;clearTimeout(timer);document.removeEventListener('visibilitychange',visible);};
 },[kind]);
 const count=now===null?null:ledgerCount(year,kind,now);
 const number=count===null?'Not recorded':new Intl.NumberFormat(lang==='vi'?'vi-VN':'en-GB').format(count);
 return <aside className={'world-ledger ledger-'+kind} aria-label={deaths?t('Số người chết vì lạnh trên toàn thế giới','Worldwide deaths from cold'):t('Số Vestigium đã được tìm thấy trên toàn thế giới','Vestigium discovered worldwide')} title={t('Số liệu giả lập tạo không khí cho bản đồ TFAM; chưa phải thống kê được xác nhận trong truyện.','Simulated estimates for the TFAM atlas; not confirmed figures from the novel.')}>
  <div className="ledger-heading"><LedgerIcon kind={kind}/><span>{deaths?t('Tử vong vì lạnh','Deaths from cold'):t('Vestigium tìm thấy','Vestigium discovered')}</span></div>
  <strong className="ledger-number" aria-live="off" key={year+'-'+number}>{number}</strong>
  <span className="ledger-cadence"><i aria-hidden="true"/>{deaths?t('Cập nhật mỗi giây','Updated every second'):t('Cập nhật mỗi giờ','Updated every hour')}</span>
  <small>{t('Ước tính giả lập','Simulated estimate')} · {year} · {t('Toàn thế giới','Worldwide')}</small>
 </aside>;
}
