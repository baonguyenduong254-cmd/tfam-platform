'use client';
import {createContext,useContext,useEffect,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {ArrowUpRight,BookOpen,ChevronDown,Cloud,CloudOff,Compass,Crown,HardDrive,Sparkles,Trophy} from 'lucide-react';
import ImperialSectionHeader from './ImperialSectionHeader';
import {useReaderAccount} from './ReaderAccount';
import {scopedReaderKey,mergeAccountHistory} from '../../lib/accounts';
import {READING_HISTORY_KEY,parseReadingHistory} from '../../lib/reader-state';
import {storyIndex} from '../../lib/story';
import {DISCOVERY_EVENT,coveredChapters,factionGroups,unlockRequirements,milestoneState,canExplore,requirementText,type CatalogEntry,type Milestone} from '../../lib/discovery';
import definitions from '../../lib/discovery-milestones.json';

const milestones=definitions as Milestone[];
const englishIds=storyIndex.filter(c=>c.id.startsWith('en_book')).map(c=>c.id);

const Context=createContext<{ready:boolean;earned:Set<string>;covered:Set<string>;states:ReturnType<typeof milestoneState>[];canExplore:(id:string)=>boolean;condition:(id:string)=>string}>({ready:false,earned:new Set<string>(),covered:new Set<string>(),states:[] as ReturnType<typeof milestoneState>[],canExplore:(_id:string)=>false,condition:(_id:string)=>'Loading reading progress...'});
export const useDiscovery=()=>useContext(Context);

export function DiscoveryProvider({children}:{children:ReactNode}){
 const account=useReaderAccount(),[history,setHistory]=useState<ReturnType<typeof parseReadingHistory>>([]),[catalog,setCatalog]=useState<CatalogEntry[]>([]),[localReady,setReady]=useState(false),[notice,setNotice]=useState('');
 const scope=account.data?.profile?.id||'guest',seen=useRef<Set<string>|null>(null),priorScope=useRef(scope);
 useEffect(()=>{if(priorScope.current!==scope){seen.current=null;priorScope.current=scope;setNotice('');}},[scope]);
 useEffect(()=>{let live=true;fetch('/api/story',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json() as Promise<{chapters:CatalogEntry[]}>;}).then(x=>{if(live)setCatalog(x.chapters.filter(c=>c.id.startsWith('en_book')));}).catch(()=>{});return()=>{live=false;};},[]);
 useEffect(()=>{if(!account.ready)return;const sync=()=>{try{setHistory(mergeAccountHistory(parseReadingHistory(localStorage.getItem(scopedReaderKey(READING_HISTORY_KEY,account.data?.profile?.id)),englishIds),account.data?.progress||[]));}catch{setHistory(mergeAccountHistory([],account.data?.progress||[]));}setReady(true);};sync();window.addEventListener(DISCOVERY_EVENT,sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener(DISCOVERY_EVENT,sync);window.removeEventListener('storage',sync);};},[account.ready,account.data,account.epoch]);
 const states=useMemo(()=>{const read=new Set(history.filter(v=>v.status==='read').map(v=>v.chapterId));return milestones.map(m=>milestoneState(m,read,catalog));},[history,catalog]);
 const earned=useMemo(()=>new Set(milestones.filter((_,i)=>states[i].earned).map(m=>m.id)),[states]);
 const covered=useMemo(()=>coveredChapters(milestones,new Set(history.filter(v=>v.status==='read').map(v=>v.chapterId)),catalog),[history,catalog]);
 const ready=localReady&&catalog.length>0;
 useEffect(()=>{if(!ready)return;if(seen.current){const fresh=milestones.filter(m=>earned.has(m.id)&&!seen.current!.has(m.id));if(fresh.length)setNotice('Achievement unlocked · '+fresh.map(m=>m.title).join(', '));}seen.current=new Set(earned);},[earned,ready]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);},[notice]);
 return <Context.Provider value={{ready,earned,covered,states,canExplore:id=>canExplore(id,ready?earned:new Set()),condition:id=>ready?requirementText(id,earned,milestones):'Loading reading progress...'}}>{children}{notice&&<div className="discovery-toast" role="status">{notice}</div>}</Context.Provider>;
}

const MILESTONE_ICONS=[Trophy,Crown,Compass] as const;
const MILESTONE_ACCENTS=[
 {from:'#ff7a88',to:'#cf274d',glow:'rgba(255, 92, 118, 0.48)',tint:'rgba(207, 39, 77, 0.16)'},
 {from:'#86e7ff',to:'#2c87e6',glow:'rgba(98, 210, 255, 0.46)',tint:'rgba(44, 135, 230, 0.16)'},
 {from:'#e3a8ff',to:'#8947ff',glow:'rgba(186, 116, 255, 0.52)',tint:'rgba(137, 71, 255, 0.16)'},
 {from:'#ffe8a3',to:'#ce8e32',glow:'rgba(246, 200, 108, 0.48)',tint:'rgba(206, 142, 50, 0.16)'},
] as const;
const EARNED_ACCENT={from:'#ffe8a3',to:'#249a79',glow:'rgba(246, 200, 108, 0.52)',tint:'rgba(232, 184, 92, 0.18)'} as const;

export function AchievementTracker(){
 const d=useDiscovery(),account=useReaderAccount();
 const published=milestones.map((m,i)=>({m,state:d.states[i]})).filter(({m})=>m.required.length>0);
 const forthcoming=milestones.filter(m=>!m.required.length);

 const hasProfile=Boolean(account.data?.profile);
 const syncInfo=hasProfile
  ?(account.error
    ?{mode:'offline',pill:'Offline · Local Retained',detail:'Device progress retained · Account sync unavailable',Icon:CloudOff,from:'#ff7a88',to:'#cf274d',glow:'rgba(255, 92, 118, 0.48)',tint:'rgba(207, 39, 77, 0.16)'}
    :{mode:'synced',pill:'Account Synced',detail:'Reading milestones synced with your reader account',Icon:Cloud,from:'#88f5ce',to:'#249a79',glow:'rgba(104, 232, 184, 0.44)',tint:'rgba(36, 154, 121, 0.16)'})
  :{mode:'guest',pill:'Guest · Browser Storage',detail:'Saved only in this browser · Does not sync across devices',Icon:HardDrive,from:'#e3a8ff',to:'#8947ff',glow:'rgba(186, 116, 255, 0.52)',tint:'rgba(137, 71, 255, 0.16)'};
 const SyncIcon=syncInfo.Icon;
 const completionPct=published.length>0?Math.round((d.earned.size/published.length)*100):0;

 return <section className="achievement-tracker achievement211 achievement-v241 achievement-v265" aria-labelledby="achievements-title">
  <ImperialSectionHeader
   kicker="Imperial Codex · Reader Progression"
   title="Reading Achievements"
   subtitle="Your reading milestones connect the chronicles directly to the empires and characters beyond them."
   titleId="achievements-title"
   countValue={d.earned.size}
   countLabel="achieved"
   rightControls={
    <a className="ach265-primary-cta" href="/chronicles">
     <span>Continue Reading</span>
     <ArrowUpRight size={15} aria-hidden="true"/>
    </a>
   }
   bottomBar={
    <div className="ach265-header-bar">
     <span className={'ach265-sync-pill is-'+syncInfo.mode} style={{'--sync-from':syncInfo.from,'--sync-to':syncInfo.to,'--sync-glow':syncInfo.glow} as CSSProperties}>
      <SyncIcon size={13} aria-hidden="true"/>
      <span>{syncInfo.pill}</span>
     </span>
     <span className="ach265-header-note">Read complete English chapters to unlock new dossiers, regions, and imperial milestones.</span>
    </div>
   }
  />

  <div className="ach265-kpi-grid" role="region" aria-label="Progression summary">
   <article className="ach265-kpi-card" style={{'--kpi-from':'var(--glow-gold-from)','--kpi-to':'var(--glow-gold-to)','--kpi-glow':'var(--glow-gold)','--kpi-tint':'rgba(206, 142, 50, 0.16)'} as CSSProperties}>
    <div className="ach265-kpi-top">
     <span className="ach265-medallion" aria-hidden="true"><Trophy size={16} strokeWidth={2}/></span>
     <span className="ach265-kpi-label">Milestones Achieved</span>
    </div>
    <div className="ach265-kpi-value">
     <strong>{d.earned.size}</strong>
     <span>/ {published.length}</span>
    </div>
    <p className="ach265-kpi-sub">{completionPct}% of published imperial codex unlocked</p>
   </article>

   <article className="ach265-kpi-card" style={{'--kpi-from':'var(--glow-frost-from)','--kpi-to':'var(--glow-frost-to)','--kpi-glow':'var(--glow-frost)','--kpi-tint':'rgba(44, 135, 230, 0.16)'} as CSSProperties}>
    <div className="ach265-kpi-top">
     <span className="ach265-medallion" aria-hidden="true"><BookOpen size={16} strokeWidth={2}/></span>
     <span className="ach265-kpi-label">Verified Chapters Read</span>
    </div>
    <div className="ach265-kpi-value">
     <strong>{d.covered.size}</strong>
     <span>{d.covered.size===1?'chapter':'chapters'}</span>
    </div>
    <p className="ach265-kpi-sub">{d.ready?'Verified against the live English canon':'Syncing chapter catalog…'}</p>
   </article>

   <article className="ach265-kpi-card" style={{'--kpi-from':syncInfo.from,'--kpi-to':syncInfo.to,'--kpi-glow':syncInfo.glow,'--kpi-tint':syncInfo.tint} as CSSProperties}>
    <div className="ach265-kpi-top">
     <span className="ach265-medallion" aria-hidden="true"><SyncIcon size={16} strokeWidth={2}/></span>
     <span className="ach265-kpi-label">Account Sync Status</span>
    </div>
    <div className="ach265-kpi-value is-status">
     <strong>{syncInfo.pill}</strong>
    </div>
    <p className="ach265-kpi-sub">{syncInfo.detail}</p>
   </article>
  </div>

  <div className="achievement211-milestones ach241-bento">
   {published.map(({m,state:s},idx)=>{
    const total=Math.max(1,s?.total||m.required.length);
    const count=s?.count||0;
    const pct=Math.min(100,Math.round((count/total)*100));
    const realms=factionGroups.flatMap(g=>g.ids.filter(id=>unlockRequirements[id]===m.id)).map(id=>id.replace(/_/g,' ')).join(' · ')||'Reading milestone';
    const Icon=MILESTONE_ICONS[idx%MILESTONE_ICONS.length];
    const accent=s?.earned?EARNED_ACCENT:MILESTONE_ACCENTS[idx%MILESTONE_ACCENTS.length];
    return <article
     key={m.id}
     className={'ach241-card'+(s?.earned?' is-earned':'')}
     style={{'--card-from':accent.from,'--card-to':accent.to,'--card-glow':accent.glow,'--card-tint':accent.tint} as CSSProperties}
    >
     <div className="ach241-card-head">
      <div className="ach265-card-title-wrap">
       <span className="ach265-card-medallion" aria-hidden="true"><Icon size={15} strokeWidth={2}/></span>
       <h3>{m.title}</h3>
      </div>
      <span className={'ach241-badge'+(s?.earned?' is-earned':'')}>{s?.earned?'Achieved':pct+'%'}</span>
     </div>
     <p className="ach241-status">{s?.earned?'Milestone unlocked':!d.ready?'Loading reading progress...':s?.available?'Continue your journey':'Chapters in preparation'}</p>
     <div className="ach241-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${m.title} progress`}>
      <i style={{width:pct+'%'}} data-empty={pct===0?'true':undefined}/>
     </div>
     <div className="ach241-foot">
      <small>{count} of {total} verified chapters</small>
      <span className="ach265-realms">{realms}</span>
     </div>
    </article>;
   })}
  </div>

  <details className="achievement211-future">
   <summary>
    <span className="ach265-future-title">
     <Sparkles size={15} aria-hidden="true"/>
     <span>Horizons still to come</span>
    </span>
    <span className="ach265-future-meta">
     <em>{forthcoming.length} milestones</em>
     <ChevronDown size={16} className="ach265-future-chevron" aria-hidden="true"/>
    </span>
   </summary>
   <div className="ach265-future-body">
    <p>These milestones open automatically as upcoming volumes are published.</p>
    <div className="ach265-future-chips">{forthcoming.map(m=><span key={m.id}>{m.title}</span>)}</div>
   </div>
  </details>
 </section>;
}
