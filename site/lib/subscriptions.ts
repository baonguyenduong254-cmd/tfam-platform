export type ImperialPlan={
 id:'imperial_1m'|'imperial_3m'|'imperial_12m';
 label:string;
 months:number;
 amountCents:number;
 regularCents:number;
 currency:'USD';
 badge:string;
 perMonthLabel:string;
};

export const IMPERIAL_PLANS:readonly ImperialPlan[]=[
 {
  id:'imperial_1m',
  label:'1 Month Pass',
  months:1,
  amountCents:999,
  regularCents:1990,
  currency:'USD',
  badge:'Launch Sale · -50%',
  perMonthLabel:'$9.99 / mo',
 },
 {
  id:'imperial_3m',
  label:'3 Months Pass',
  months:3,
  amountCents:2799,
  regularCents:5970,
  currency:'USD',
  badge:'Save 53%',
  perMonthLabel:'$9.33 / mo',
 },
 {
  id:'imperial_12m',
  label:'12 Months Founding Patron',
  months:12,
  amountCents:9900,
  regularCents:23880,
  currency:'USD',
  badge:'Best Value · 2 Months Free',
  perMonthLabel:'$8.25 / mo',
 },
] as const;

export function findImperialPlan(id:unknown):ImperialPlan|undefined{
 return IMPERIAL_PLANS.find(p=>p.id===id);
}

export function planMonthsForAmount(amountCents:number):number{
 const matched=IMPERIAL_PLANS.find(p=>p.amountCents===amountCents);
 return matched?matched.months:1;
}

export function formatUsd(cents:number):string{
 return '$'+(cents/100).toFixed(2);
}
