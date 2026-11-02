 'use client';
import Link from 'next/link';
import {createContext,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {useReaderAccount} from './ReaderAccount';
import {scopedReaderKey,mergeAccountHistory} from '../../lib/accounts';
import {READING_HISTORY_KEY,parseReadingHistory} from '../../lib/reader-state';
import {storyIndex} from '../../lib/story';
import {DISCOVERY_EVENT,milestoneState,canExplore,requirementText,type CatalogEntry,type Milestone} from '../../lib/discovery';
import definitions from '../../lib/discovery-milestones.json';
const milestones=definitions as Milestone[];
const Context=createContext<{ready:boolean;earned:Set<string>;states:ReturnType<typeof milestoneState>[];canExplore:(id:string)=>boolean;condition:(id:string)=>string}>({ready:false,earned:new Set<string>(),states:[] as ReturnType<typeof milestoneState>[],canExplore:(_id:string)=>false,condition:(_id:string)=>'Loading reading progress…'});
export const useDiscovery=()=>useContext(Context);
export function DiscoveryProvider({children}:{children:ReactNode}){
 const account=useReaderAccount(),[history,setHistory]=useState<ReturnType<typeof parseReadingHistory>>([]),[catalog,setCatalog]=useState<CatalogEntry[]>([]),[localReady,setReady]=useState(false),[notice,setNotice]=useState('');
 const scope=account.data?.profile?.id||'guest',seen=useRef<Set<string>|null>(null),priorScope=useRef(scope);
 useEffect(()=>{if(priorScope.current!==scope){seen.current=null;priorScope.current=scope;setNotice('');}},[scope]);
 useEffect(()=>{let live=true;fetch('/api/story',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json() as Promise<{chapters:CatalogEntry[]}>;}).then(x=>{if(live)setCatalog(x.chapters);}).catch(()=>{});return()=>{live=false;};},[]);
 useEffect(()=>{if(!account.ready)return;const sync=()=>{try{setHistory(mergeAccountHistory(parseReadingHistory(localStorage.getItem(scopedReaderKey(READING_HISTORY_KEY,account.data?.profile?.id)),storyIndex.map(c=>c.id)),account.data?.progress||[]));}catch{setHistory(mergeAccountHistory([],account.data?.progress||[]));}setReady(true);};sync();window.addEventListener(DISCOVERY_EVENT,sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener(DISCOVERY_EVENT,sync);window.removeEventListener('storage',sync);};},[account.ready,account.data,account.epoch]);
 const states=useMemo(()=>{const read=new Set(history.filter(v=>v.status==='read').map(v=>v.chapterId));return milestones.map(m=>milestoneState(m,read,catalog));},[history,catalog]);
 const earned=useMemo(()=>new Set(milestones.filter((_,i)=>states[i].earned).map(m=>m.id)),[states]);
 const ready=localReady&&catalog.length>0;
 useEffect(()=>{if(!ready)return;if(seen.current){const fresh=milestones.filter(m=>earned.has(m.id)&&!seen.current!.has(m.id));if(fresh.length)setNotice('Achievement unlocked · '+fresh.map(m=>m.title).join(', '));}seen.current=new Set(earned);},[earned,ready]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);},[notice]);
 return <Context.Provider value={{ready,earned,states,canExplore:id=>canExplore(id,ready?earned:new Set()),condition:id=>ready?requirementText(id,earned,milestones):'Loading reading progress…'}}>{children}{notice&&<div className="discovery-toast" role="status">{notice}</div>}</Context.Provider>;
}
export function AchievementTracker(){const d=useDiscovery();return <section className="achievement-tracker"><span className="eyebrow">YOUR JOURNEY</span><h1>Reading achievements</h1><p>Complete every published chapter in a milestone to discover more of the world. Read either edition where verified content coverage is available.</p><p className="notice">English Book I covers the story through Vietnamese Chapter 24, including Juliet’s side story. Arc I continues through Chapter 32. Read either edition for covered scenes; remaining English content is not yet available.</p><Link href="/chronicles">Continue reading →</Link><div className="achievement-grid">{milestones.map((m,i)=>{const s=d.states[i];return <article key={m.id}><h2>{m.title}</h2><strong>{s?.earned?'Achieved':!d.ready?'Loading…':s?.available?'In progress':m.id.startsWith('side-')?'Required side story not yet available':'Required arc not yet fully available'}</strong><progress max={Math.max(1,s?.total||0)} value={s?.count||0}/><small>{s?.count||0} / {s?.total||0} verified chapters</small></article>;})}</div></section>;}
