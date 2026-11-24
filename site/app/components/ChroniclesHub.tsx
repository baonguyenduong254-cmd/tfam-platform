'use client';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import {useEffect,useMemo,useState} from 'react';
import {BookOpen,ArrowLeft,ArrowRight,Search} from 'lucide-react';
import {storyIndex,type ChapterMeta} from '../../lib/story';
import {chapterPath,READING_HISTORY_KEY,parseReadingHistory} from '../../lib/reader-state';
import {READING_POSITION_KEY,parseReadingPosition} from '../../lib/reading-position';
import {scopedReaderKey,mergeAccountHistory,latestAccountCheckpoint} from '../../lib/accounts';
import {useReaderAccount} from './ReaderAccount';
import {useDiscovery} from './DiscoveryProgress';
import BookHandoff from './BookHandoff';
import SceneStage from './SceneStage';
import StoryLibrary,{type StoryLibraryProps} from './StoryLibrary';

type Entry=ChapterMeta&{complete?:boolean};
const cover='/art/evelyne-monodica-moonfall-205-1920.webp';
const englishOnly=(list:Entry[])=>list.filter(c=>c.id.startsWith('en_book'));

export default function ChroniclesHub(props:StoryLibraryProps){
 const account=useReaderAccount(),discovery=useDiscovery();
 const [handoff,setHandoff]=useState(0);
 const [catalog,setCatalog]=useState<Entry[]>(()=>englishOnly(storyIndex));
 const [query,setQuery]=useState(''),[volume,setVolume]=useState(1),[reading,setReading]=useState<string|null>(null),[recent,setRecent]=useState<ReturnType<typeof parseReadingHistory>>([]),[resume,setResume]=useState<string|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);

 useEffect(()=>{
  const englishIds=new Set(englishOnly(storyIndex).map(c=>c.id));
  const sync=()=>{
   const m=location.hash.match(/^#reader\/([a-zA-Z0-9_]+)$/);
   const id=m&&englishIds.has(m[1])?m[1]:null;
   setReading(id);
   props.onLanguage?.('en');
  };
  sync();
  addEventListener('popstate',sync);
  addEventListener('hashchange',sync);
  return()=>{removeEventListener('popstate',sync);removeEventListener('hashchange',sync);};
 },[]);

 useEffect(()=>{
  const c=new AbortController();setError(false);
  fetch('/api/story',{signal:c.signal,cache:'no-store'})
   .then(async r=>{if(!r.ok)throw Error();const x=await r.json() as {chapters:Entry[]};setCatalog(englishOnly(x.chapters));setReady(true);})
   .catch(e=>{if(e.name!=='AbortError'){setError(true);setReady(true);}});
  return()=>c.abort();
 },[attempt]);

 useEffect(()=>{
  if(!account.ready)return;
  try{
   const ids=englishOnly(storyIndex).map(c=>c.id);
   const history=mergeAccountHistory(parseReadingHistory(localStorage.getItem(scopedReaderKey(READING_HISTORY_KEY,account.data?.profile?.id)),ids),account.data?.progress||[]).filter(v=>v.chapterId.startsWith('en_book'));
   const checkpoint=latestAccountCheckpoint(parseReadingPosition(localStorage.getItem(scopedReaderKey(READING_POSITION_KEY,account.data?.profile?.id)),ids),account.data?.progress||[]);
   setRecent(history);
   setResume(checkpoint?.chapterId?.startsWith('en_book')?checkpoint.chapterId:history[0]?.chapterId||null);
  }catch{}
 },[account.ready,account.epoch,account.data,reading]);

 const title=(c:ChapterMeta)=>presentationPunctuation(c.title_en||'Untitled Chapter');
 const edition=useMemo(()=>englishOnly(catalog),[catalog]);
 const volumes=[...new Set(edition.map(c=>c.arc))];
 const active=volumes.includes(volume)?volume:volumes[0]||1;
 const chapterSet=edition.filter(c=>c.arc===active);
 const filtered=chapterSet.filter(c=>(c.title_en||'').toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const readIds=new Set(recent.filter(c=>c.status==='read').map(c=>c.chapterId));
 const complete=chapterSet.filter(c=>c.complete);
 const count=complete.filter(c=>readIds.has(c.id)).length;
 const resumeEntry=edition.find(c=>c.id===resume);
 const recentEntries=useMemo(()=>recent.slice(0,5).flatMap(v=>{const c=edition.find(x=>x.id===v.chapterId);return c?[c]:[];}),[recent,edition]);

 function open(id:string){
  history.replaceState({...history.state,libraryScroll:scrollY},'');
  setHandoff(Date.now());
  setReading(id);
  props.onLanguage?.('en');
  history.pushState({libraryScroll:scrollY},'','#reader/'+id);
  scrollTo({top:0,behavior:'instant'});
 }
 function library(){
  setHandoff(0);
  setReading(null);
  history.replaceState({...history.state},'',location.pathname);
  requestAnimationFrame(()=>scrollTo({top:history.state?.libraryScroll||0,behavior:'instant'}));
 }

 if(reading){
  return <div className="chronicle211-reading">
   {handoff>0&&<BookHandoff key={handoff} cover={cover} onEnd={()=>setHandoff(0)}/>}
   <div className="chronicle211-return"><button onClick={library}><img src={cover} width={640} height={960} alt="" style={{viewTransitionName:'tfam-book-cover'}}/><ArrowLeft size={16}/>Library</button></div>
   <StoryLibrary {...props} lang="en" initialChapter={reading}/>
  </div>;
 }

 return <section className="chronicle211" aria-labelledby="library211-title">
  <header className="chronicle211-intro library-stage">
   <div className="library-stage-backdrop" aria-hidden="true"><img src={cover} alt=""/></div>
   <div className="library-stage-copy">
    <h1 id="library211-title">The Chronicles</h1>
    <p>Every empire begins with a story.<br/>Return to the page where yours last stopped.</p>
    {resumeEntry
     ? <button className="chronicle211-continue" onClick={()=>open(resumeEntry.id)}><BookOpen size={22}/><span>Continue reading<strong>{title(resumeEntry)}</strong></span><ArrowRight size={20}/></button>
     : <button className="chronicle211-continue" onClick={()=>open(edition[0]?.id||'en_book1_001')}><BookOpen size={22}/><span>Begin the chronicles<strong>{edition[0]?title(edition[0]):''}</strong></span><ArrowRight size={20}/></button>}
    <small>{account.data?.profile?(account.error?'Device history preserved · Account connection unavailable':'Account reading history available'):'Guest journey · Saved in this browser'}</small>
    <nav className="chronicle211-volumes" aria-label="Volumes">{volumes.map(a=><button key={a} aria-pressed={active===a} onClick={()=>{setVolume(a);setQuery('');}}>Book {a===1?'I · The Pathmaker':String(a)}</button>)}</nav>
   </div>
   <SceneStage className="library-volume" identity={'en'+active} kind="book">
    <div className="library-volume-pages" aria-hidden="true"/>
    <button data-scene-plane="subject" className="chronicle211-cover" aria-label={'Open Book '+active} onClick={()=>open(chapterSet[0]?.id||edition[0]?.id||'en_book1_001')}>
     <img src={cover} alt=""/>
     <span><strong>Through Frost<br/>and Myth</strong><em>Book I · The Pathmaker</em><small>Leonardo Ravenna</small></span>
    </button>
   </SceneStage>
  </header>
  <div className="chronicle211-shelves">
   <div>
    <header className="chronicle211-contents-heading"><h2>Contents</h2><span>{ready?count+' / '+complete.length+' read':'Loading availability...'}</span></header>
    <label className="chronicle211-search"><Search size={18}/><input type="search" aria-label="Search chapters" placeholder="Find a chapter..." value={query} onChange={e=>setQuery(e.target.value)}/></label>
    {error&&<p role="alert">Availability could not be refreshed. <button onClick={()=>setAttempt(n=>n+1)}>Retry</button></p>}
    <div className="chronicle211-contents">{filtered.map(c=><a key={c.id} href={chapterPath(c.id)} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();open(c.id);}}><span>{title(c)}</span><small>{readIds.has(c.id)?'Read':ready&&c.complete?'Available':ready?'In preparation':'Checking...'}</small><ArrowRight size={17}/></a>)}{!filtered.length&&<p role="status">No matching chapters. Try another title.</p>}</div>
   </div>
   <aside>
    <h2>Recently read</h2>
    {recentEntries.map(c=><button key={c.id} onClick={()=>open(c.id)}>{title(c)}<ArrowRight size={16}/></button>)}
    {!recentEntries.length&&<p>Your first chapter will appear here.</p>}
    <h2>Discoveries</h2>
    <p>{discovery.earned.size} reading milestones achieved. New horizons unfold as your journey continues.</p>
    <a href="/achievements">View reading achievements <ArrowRight size={16}/></a>
   </aside>
  </div>
 </section>;
}
