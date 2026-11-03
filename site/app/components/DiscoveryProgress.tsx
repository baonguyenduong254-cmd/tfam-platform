 'use client';
import Link from 'next/link';
import {createContext,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {useReaderAccount} from './ReaderAccount';
import {scopedReaderKey,mergeAccountHistory} from '../../lib/accounts';
import {READING_HISTORY_KEY,parseReadingHistory} from '../../lib/reader-state';
import {storyIndex} from '../../lib/story';
import {DISCOVERY_EVENT,coveredChapters,factionGroups,unlockRequirements,milestoneState,canExplore,requirementText,type CatalogEntry,type Milestone} from '../../lib/discovery';
import definitions from '../../lib/discovery-milestones.json';
const milestones=definitions as Milestone[];
const Context=createContext<{ready:boolean;earned:Set<string>;covered:Set<string>;states:ReturnType<typeof milestoneState>[];canExplore:(id:string)=>boolean;condition:(id:string)=>string}>({ready:false,earned:new Set<string>(),covered:new Set<string>(),states:[] as ReturnType<typeof milestoneState>[],canExplore:(_id:string)=>false,condition:(_id:string)=>'Loading reading progress…'});
export const useDiscovery=()=>useContext(Context);
export function DiscoveryProvider({children}:{children:ReactNode}){
 const account=useReaderAccount(),[history,setHistory]=useState<ReturnType<typeof parseReadingHistory>>([]),[catalog,setCatalog]=useState<CatalogEntry[]>([]),[localReady,setReady]=useState(false),[notice,setNotice]=useState('');
 const scope=account.data?.profile?.id||'guest',seen=useRef<Set<string>|null>(null),priorScope=useRef(scope);
 useEffect(()=>{if(priorScope.current!==scope){seen.current=null;priorScope.current=scope;setNotice('');}},[scope]);
 useEffect(()=>{let live=true;fetch('/api/story',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json() as Promise<{chapters:CatalogEntry[]}>;}).then(x=>{if(live)setCatalog(x.chapters);}).catch(()=>{});return()=>{live=false;};},[]);
 useEffect(()=>{if(!account.ready)return;const sync=()=>{try{setHistory(mergeAccountHistory(parseReadingHistory(localStorage.getItem(scopedReaderKey(READING_HISTORY_KEY,account.data?.profile?.id)),storyIndex.map(c=>c.id)),account.data?.progress||[]));}catch{setHistory(mergeAccountHistory([],account.data?.progress||[]));}setReady(true);};sync();window.addEventListener(DISCOVERY_EVENT,sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener(DISCOVERY_EVENT,sync);window.removeEventListener('storage',sync);};},[account.ready,account.data,account.epoch]);
 const states=useMemo(()=>{const read=new Set(history.filter(v=>v.status==='read').map(v=>v.chapterId));return milestones.map(m=>milestoneState(m,read,catalog));},[history,catalog]);
 const earned=useMemo(()=>new Set(milestones.filter((_,i)=>states[i].earned).map(m=>m.id)),[states]);
 const covered=useMemo(()=>coveredChapters(milestones,new Set(history.filter(v=>v.status==='read').map(v=>v.chapterId)),catalog),[history,catalog]);
 const ready=localReady&&catalog.length>0;
 useEffect(()=>{if(!ready)return;if(seen.current){const fresh=milestones.filter(m=>earned.has(m.id)&&!seen.current!.has(m.id));if(fresh.length)setNotice('Achievement unlocked · '+fresh.map(m=>m.title).join(', '));}seen.current=new Set(earned);},[earned,ready]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);},[notice]);
 return <Context.Provider value={{ready,earned,covered,states,canExplore:id=>canExplore(id,ready?earned:new Set()),condition:id=>ready?requirementText(id,earned,milestones):'Loading reading progress…'}}>{children}{notice&&<div className="discovery-toast" role="status">{notice}</div>}</Context.Provider>;
}
export function AchievementTracker(){
 const d=useDiscovery(),account=useReaderAccount();
 const published=milestones.map((m,i)=>({m,state:d.states[i]})).filter(({m})=>m.required.length>0);
 const forthcoming=milestones.filter(m=>!m.required.length);
 return <section className="achievement-tracker achievement211"><header><h1>Every page opens a horizon.</h1><p>Your reading achievements connect the chronicles to the world beyond them.</p><Link href="/chronicles">Continue reading</Link><small>{account.data?.profile?(account.error?'Device progress retained · Account sync unavailable':'Account progress available'):'Guest progress · Saved in this browser'}</small></header>
 <div className="achievement211-summary"><strong>{d.earned.size}<span>milestones achieved</span></strong><p>Read complete chapters to earn discoveries. Selecting a historical year in the Atlas does not change your reading progress.</p></div>
 <section className="achievement211-editions"><h2>Two editions, one journey</h2><p>English Book I follows the story through Vietnamese Chapter 24. Juliet’s side story spans English Chapters 21–23. Arc I continues through Vietnamese Chapter 32; reading only English Book I does not yet complete Arc I.</p><p>Credit is awarded by verified scene coverage. When a Vietnamese chapter spans several English chapters, every mapped part must be read.</p></section>
 <div className="achievement211-milestones">{published.map(({m,state:s})=><article key={m.id}><div><h2>{m.title}</h2><p>{s?.earned?'Achieved':!d.ready?'Loading reading progress…':s?.available?'Continue your journey':'Edition content is still being completed'}</p></div><div><progress aria-label={m.title+' reading progress'} max={Math.max(1,s?.total||0)} value={s?.count||0}/><small>{s?.count||0} of {s?.total||m.required.length} verified chapters</small></div><p>{factionGroups.flatMap(g=>g.ids.filter(id=>unlockRequirements[id]===m.id)).map(id=>id.replace(/_/g,' ')).join(' · ')||'Reading milestone'}</p></article>)}</div>
 <details className="achievement211-future"><summary>Horizons still to come · {forthcoming.length} milestones</summary><p>These milestones will become available when their required stories are published in full.</p><div>{forthcoming.map(m=><span key={m.id}>{m.title}</span>)}</div></details>
 </section>;
}
