export type LedgerKind='cold-deaths'|'vestigium';
// Ambient estimates for the atlas, not figures extracted from the novel.
// A fixed epoch keeps visitors and reloads on the same clock without background writes.
export const LEDGER_EPOCH=Date.UTC(2026,9,6);
const baseline:Record<string,{deaths:number;vestigium:number}>={
 '1715':{deaths:18743612,vestigium:1284},
 '1716':{deaths:28496804,vestigium:1936},
};
export const ledgerPeriod=(kind:LedgerKind)=>kind==='cold-deaths'?1000:3600000;
export function ledgerCount(year:string,kind:LedgerKind,now:number){
 const entry=baseline[year];if(!entry)return null;
 const ticks=Math.max(0,Math.floor((now-LEDGER_EPOCH)/ledgerPeriod(kind)));
 return (kind==='cold-deaths'?entry.deaths:entry.vestigium)+ticks;
}
