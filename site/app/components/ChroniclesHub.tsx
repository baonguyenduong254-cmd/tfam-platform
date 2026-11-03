'use client';
import {useEffect,useMemo,useState} from 'react';
import {BookOpen,ArrowLeft,ArrowRight,Search} from 'lucide-react';
import {storyIndex,type ChapterMeta} from '../../lib/story';
import {chapterPath,READING_HISTORY_KEY,parseReadingHistory} from '../../lib/reader-state';
import {READING_POSITION_KEY,parseReadingPosition} from '../../lib/reading-position';
import {scopedReaderKey,mergeAccountHistory,latestAccountCheckpoint} from '../../lib/accounts';
import {useReaderAccount} from './ReaderAccount';
import {useDiscovery} from './DiscoveryProgress';
import {carryArtwork} from '../../lib/motion/artwork-transition';
import StoryLibrary,{type StoryLibraryProps} from './StoryLibrary';
type Entry=ChapterMeta&{complete?:boolean};
const cover='/art/evelyne-monodica-moonfall-205-1920.webp';
const roman=['I','II','III','IV','V','VI'];
export default function ChroniclesHub(props:StoryLibraryProps){
 const account=useReaderAccount(),discovery=useDiscovery();
 const [catalog,setCatalog]=useState<Entry[]>(storyIndex),[query,setQuery]=useState(''),[volume,setVolume]=useState(1),[reading,setReading]=useState<string|null>(null),[recent,setRecent]=useState<ReturnType<typeof parseReadingHistory>>([]),[resume,setResume]=useState<string|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{const sync=()=>{const m=location.hash.match(/^#reader\/([a-zA-Z0-9_]+)$/);const id=m&&storyIndex.some(c=>c.id===m[1])?m[1]:null;setReading(id);if(id)props.onLanguage?.(id.startsWith('en_book')?'en':'vi');};sync();addEventListener('popstate',sync);addEventListener('hashchange',sync);return()=>{removeEventListener('popstate',sync);removeEventListener('hashchange',sync);};},[]);
 useEffect(()=>{const c=new AbortController();setError(false);fetch('/api/story',{signal:c.signal,cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();const x=await r.json() as {chapters:Entry[]};setCatalog(x.chapters);setReady(true);}).catch(e=>{if(e.name!=='AbortError'){setError(true);setReady(true);}});return()=>c.abort();},[attempt]);
 useEffect(()=>{if(!account.ready)return;try{const ids=storyIndex.map(c=>c.id),history=mergeAccountHistory(parseReadingHistory(localStorage.getItem(scopedReaderKey(READING_HISTORY_KEY,account.data?.profile?.id)),ids),account.data?.progress||[]),checkpoint=latestAccountCheckpoint(parseReadingPosition(localStorage.getItem(scopedReaderKey(READING_POSITION_KEY,account.data?.profile?.id)),ids),account.data?.progress||[]);setRecent(history);setResume(checkpoint?.chapterId||history[0]?.chapterId||null);}catch{}},[account.ready,account.epoch,account.data,reading]);
 useEffect(()=>{try{const saved=Number(sessionStorage.getItem('tfam-library-volume:'+props.lang));setVolume(saved>0?saved:1);}catch{}},[props.lang]);
 const title=(c:ChapterMeta)=>props.lang==='en'?(c.title_en||c.title_vi):c.title_vi;
 const edition=catalog.filter(c=>props.lang==='en'?c.id.startsWith('en_book'):!c.id.startsWith('en_book'));
 const volumes=[...new Set(edition.map(c=>c.arc))];
 const active=volumes.includes(volume)?volume:volumes[0]||1;
 const chapterSet=edition.filter(c=>c.arc===active);
 const filtered=chapterSet.filter(c=>(c.title_en+' '+c.title_vi).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const readIds=new Set(recent.filter(c=>c.status==='read').map(c=>c.chapterId)),complete=chapterSet.filter(c=>c.complete),count=complete.filter(c=>readIds.has(c.id)).length;
 const resumeEntry=catalog.find(c=>c.id===resume),recentEntries=useMemo(()=>recent.slice(0,5).flatMap(v=>{const c=catalog.find(c=>c.id===v.chapterId);return c?[c]:[];}),[recent,catalog]);
 function open(id:string,button?:HTMLElement){history.replaceState({...history.state,libraryScroll:scrollY},'');carryArtwork(button||null,()=>{setReading(id);props.onLanguage?.(id.startsWith('en_book')?'en':'vi');history.pushState({libraryScroll:scrollY},'','#reader/'+id);},'tfam-book-cover',()=>scrollTo({top:0,behavior:'instant'}));}
 function library(){setReading(null);history.replaceState({...history.state},'',location.pathname);requestAnimationFrame(()=>scrollTo({top:history.state?.libraryScroll||0,behavior:'instant'}));}
 if(reading)return <div className="chronicle211-reading"><div className="chronicle211-return"><button onClick={library}><img src={cover} width={640} height={960} alt="" style={{viewTransitionName:'tfam-book-cover'}}/><ArrowLeft size={16}/>Library</button></div><StoryLibrary {...props} initialChapter={reading}/></div>;
 return <section className="chronicle211" aria-labelledby="library211-title">
  <header className="chronicle211-intro"><div><h1 id="library211-title">The Chronicles</h1><p>Every empire begins with a story.<br/>Return to the page where yours last stopped.</p>{resumeEntry?<button className="chronicle211-continue" onClick={()=>open(resumeEntry.id)}><BookOpen size={22}/><span>Continue reading<strong>{title(resumeEntry)}</strong></span><ArrowRight size={20}/></button>:<button className="chronicle211-continue" onClick={()=>open(edition[0]?.id||'en_book1_001')}><BookOpen size={22}/><span>Begin the chronicles<strong>{edition[0]?title(edition[0]):''}</strong></span><ArrowRight size={20}/></button>}<small>{account.data?.profile?(account.error?'Device history preserved · Account connection unavailable':'Account reading history available'):'Guest journey · Saved in this browser'}</small></div>
   <button className="chronicle211-cover" aria-label={'Open '+(props.lang==='en'?'Book I':'Arc '+roman[active-1])} onClick={e=>open(chapterSet[0]?.id||edition[0].id,e.currentTarget)}><img src={cover} alt=""/><span><strong>Through Frost<br/>and Myth</strong><em>{props.lang==='en'?'Book I · The Pathmaker':'Arc '+roman[active-1]}</em><small>Leonardo Ravenna</small></span></button>
  </header>
  <div className="chronicle211-shelves"><div><nav className="chronicle211-editions" aria-label="Reading edition"><button aria-pressed={props.lang==='en'} onClick={()=>props.onLanguage?.('en')}>English edition</button><button aria-pressed={props.lang==='vi'} onClick={()=>props.onLanguage?.('vi')}>Bản tiếng Việt</button></nav><nav className="chronicle211-volumes" aria-label="Volumes">{volumes.map(a=><button key={a} aria-pressed={active===a} onClick={()=>{setVolume(a);setQuery('');try{sessionStorage.setItem('tfam-library-volume:'+props.lang,String(a));}catch{}}}>{props.lang==='en'?'Book I · The Pathmaker':'Arc '+(roman[a-1]||a)}</button>)}</nav><header className="chronicle211-contents-heading"><h2>Contents</h2><span>{ready?count+' / '+complete.length+' read':'Loading availability…'}</span></header><label className="chronicle211-search"><Search size={18}/><input type="search" aria-label="Search chapters" placeholder="Find a chapter…" value={query} onChange={e=>setQuery(e.target.value)}/></label>{error&&<p role="alert">Availability could not be refreshed. <button onClick={()=>setAttempt(n=>n+1)}>Retry</button></p>}<div className="chronicle211-contents">{filtered.map(c=><a key={c.id} href={chapterPath(c.id)} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();open(c.id);}}><span>{title(c)}</span><small>{readIds.has(c.id)?'Read':ready&&c.complete?'Available':ready?'In preparation':'Checking…'}</small><ArrowRight size={17}/></a>)}{!filtered.length&&<p role="status">No matching chapters. Try another title.</p>}</div></div>
  <aside><h2>Recently read</h2>{recentEntries.map(c=><button key={c.id} onClick={()=>open(c.id)}>{c.title_en||c.title_vi}<ArrowRight size={16}/></button>)}{!recentEntries.length&&<p>Your first chapter will appear here.</p>}<h2>Discoveries</h2><p>{discovery.earned.size} reading milestones achieved. New horizons unfold as your journey continues.</p><a href="/achievements">View reading achievements <ArrowRight size={16}/></a></aside></div>
 </section>;
}
