import catalog from './avatar-catalog.json';
import {storyIndex} from './story';
import {parseReadingPosition,type ReadingPosition} from './reading-position';
export const avatars=catalog;
export type ReaderTier='free'|'imperial';
export type OAuthProvider='google'|'patreon';
export type AccountEntitlement={tier:ReaderTier;isImperial:boolean;provider:string|null;currentPeriodEnd:number|null;linkedProviders:OAuthProvider[]};
export type ReaderProfile={id:string;name:string;avatarId:string};
export type AccountProgress={chapterId:string;status:'unread'|'reading'|'read';visitedAt:number;checkpoint:ReadingPosition|null;favorite:boolean;readLater:boolean};
export type AccountSnapshot={authenticated:boolean;profile:ReaderProfile|null;progress:AccountProgress[];entitlement:AccountEntitlement;csrf:string;signIn:string;signInGoogle:string;signInPatreon:string;signOut:string};
export const FREE_ENTITLEMENT:AccountEntitlement={tier:'free',isImperial:false,provider:null,currentPeriodEnd:null,linkedProviders:[]};
export const validAvatar=(id:unknown):id is string=>typeof id==='string'&&avatars.some(a=>a.id===id);
export const validChapterId=(id:unknown):id is string=>typeof id==='string'&&storyIndex.some(c=>c.id===id);
export function cleanCheckpoint(raw:unknown){const p=parseReadingPosition(JSON.stringify(raw),storyIndex.map(c=>c.id));if(!p||Date.parse(p.savedAt)>Date.now()+300000)return null;const chapter=storyIndex.find(c=>c.id===p.chapterId)!;return {...p,title:p.lang==='en'?chapter.title_en||chapter.title_vi:chapter.title_vi};}
export const scopedReaderKey=(key:string,id?:string)=>id?key+':account:'+id:key;
export function mergeAccountHistory(local:{chapterId:string;status:'reading'|'read';visitedAt:string}[],remote:AccountProgress[]){const map=new Map(local.map(v=>[v.chapterId,v]));for(const r of remote){if(r.status==='unread'||!r.visitedAt)continue;const prior=map.get(r.chapterId);if(!prior||Date.parse(prior.visitedAt)<=r.visitedAt)map.set(r.chapterId,{chapterId:r.chapterId,status:r.status,visitedAt:new Date(r.visitedAt).toISOString()});}return [...map.values()].sort((a,b)=>Date.parse(b.visitedAt)-Date.parse(a.visitedAt));}
export function latestAccountCheckpoint(local:ReadingPosition|null,progress:AccountProgress[]){return progress.reduce((best,r)=>r.checkpoint&&(!best||Date.parse(r.checkpoint.savedAt)>Date.parse(best.savedAt))?r.checkpoint:best,local);}
