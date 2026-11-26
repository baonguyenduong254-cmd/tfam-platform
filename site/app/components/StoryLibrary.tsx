'use client';
import {presentationPunctuation} from '../../lib/presentation-punctuation';
import {DISCOVERY_EVENT} from '../../lib/discovery';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowUpRight,BookOpen,Check,ChevronLeft,ChevronRight,Clock,Download,Eye,Maximize2,Minimize2,Pencil,RotateCcw,Save,Search,Sparkles,Trophy,X} from 'lucide-react';
import {storyIndex,editionIndex,type Chapter,type ChapterMeta} from '../../lib/story';
import useModalFocus from '../hooks/useModalFocus';
import ReadingProgress from './ReadingProgress';
import ReaderWorldContext from './ReaderWorldContext';
import {useReaderAccount,AccountBookmarks} from './ReaderAccount';
import {scopedReaderKey,mergeAccountHistory} from '../../lib/accounts';
import ChapterDiscussion from './ChapterDiscussion';
import ReaderSettings from './ReaderSettings';
import {READER_PREFS_KEY,READING_HISTORY_KEY,defaultReaderPreferences,parseReaderPreferences,parseReadingHistory,recordReadingVisit,searchChapter,chapterPath,type ReadingVisit} from '../../lib/reader-state';
import '../reader-room.css';

type Entry=ChapterMeta&{complete?:boolean};
export type StoryLibraryProps={initialChapter?:string;standalone?:boolean;lang:string;onLanguage?:(language:string)=>void;font:number;setFont:(n:number)=>void;editMode:boolean;onEdit:()=>void;onCloseEdit:()=>void;admin:{username:string;csrf:string}|null};
const draftKey=(id:string)=>'tfam-story-draft-v1:'+id;
function Prose({text}:{text:string}){return <div className="story-prose">{text.split(/\n\s*\n/).filter(p=>p.trim()).map((p,i)=><p key={i}>{p}</p>)}</div>;}

export default function StoryLibrary({font,setFont,editMode,onEdit,onCloseEdit,admin,initialChapter='en_book1_001',standalone=false}:StoryLibraryProps){
 const account=useReaderAccount(),historyKey=scopedReaderKey(READING_HISTORY_KEY,account.data?.profile?.id);
 const lang='en';
 const editLang='en' as 'vi'|'en';
 const t=(_vi:string,en:string)=>en;
 const [catalog,setEntries]=useState<Entry[]>(()=>storyIndex.filter(c=>c.id.startsWith('en_book'))),[id,setId]=useState(initialChapter.startsWith('en_book')?initialChapter:editionIndex('en')[0].id),[chapter,setChapter]=useState<Chapter|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const [draft,setDraft]=useState<Chapter|null>(null),[dirty,setDirty]=useState(false),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false),[preview,setPreview]=useState(false),[recovery,setRecovery]=useState<Chapter|null>(null),[draftWarning,setDraftWarning]=useState('');
 const [pagePrefs,setPagePrefs]=useState(defaultReaderPreferences),[visits,setVisits]=useState<ReadingVisit[]>([]),[localReady,setLocalReady]=useState(false),[storageWarning,setStorageWarning]=useState(false),[query,setQuery]=useState(''),[contentsOpen,setContentsOpen]=useState(false),[listView,setListView]=useState<'all'|'history'>('all');
 const entries=catalog.filter(c=>c.id.startsWith('en_book'));
 const [focused,setFocused]=useState(false);
 const [reachedEnd,setReachedEnd]=useState('');

 useEffect(()=>{setReachedEnd('');if(loading||editMode||!chapter?.complete)return;const sentinel=reader.current?.querySelector('.chapter-end-credit');if(!sentinel)return;const check=()=>{const prose=reader.current?.querySelector('.story-prose');if(prose&&prose.getBoundingClientRect().bottom<=window.innerHeight-16)setReachedEnd(id);};const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))setReachedEnd(id);},{threshold:.6});observer.observe(sentinel);window.addEventListener('scroll',check,{passive:true});window.addEventListener('resize',check);check();return()=>{observer.disconnect();window.removeEventListener('scroll',check);window.removeEventListener('resize',check);};},[id,loading,editMode,chapter?.revision,lang]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(contentsOpen)setContentsOpen(false);else setFocused(false);}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[contentsOpen]);
 useEffect(()=>{try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key&&(key.startsWith('tfam-listening-v1:')||key.startsWith('tfam-speech-prefs-v1:')))localStorage.removeItem(key);}}catch{}},[]);

 const [viewCounts,setViewCounts]=useState<Record<string,number>|null>(null),[viewStatus,setViewStatus]=useState('loading');
 useEffect(()=>{const c=new AbortController();fetch('/api/engagement',{cache:'no-store',signal:c.signal}).then(async r=>{if(!r.ok)throw Error();const x=await r.json() as {chapters:Record<string,number>;total:number};setViewCounts(old=>{const next={...x.chapters};for(const [k,v] of Object.entries(old||{}))next[k]=Math.max(next[k]||0,v);return next;});setViewStatus('ready');}).catch(()=>{if(!c.signal.aborted)setViewStatus('error');});return()=>c.abort();},[]);
 const updateViews=(key:string,views:number)=>setViewCounts(old=>({...old,[key]:Math.max(old?.[key]||0,views)}));
 const viewNumber=(n:number)=>new Intl.NumberFormat('en-US').format(n);

 const visited=useRef('');
 useEffect(()=>{if(!account.ready)return;visited.current='';try{const restored=parseReaderPreferences(localStorage.getItem(READER_PREFS_KEY));if(!localStorage.getItem('tfam-ivory-reader-v1')){restored.theme='cream';localStorage.setItem('tfam-ivory-reader-v1','1');}setPagePrefs(restored);const history=mergeAccountHistory(parseReadingHistory(localStorage.getItem(historyKey),storyIndex.map(c=>c.id)),(account.data?.progress||[]).filter(v=>v.chapterId.startsWith('en_book')));setVisits(history.filter(v=>v.chapterId.startsWith('en_book')));localStorage.setItem(historyKey,JSON.stringify(history));}catch{setStorageWarning(true);}setLocalReady(true);const sync=(e:StorageEvent)=>{if(e.key===historyKey||e.key===null)setVisits(parseReadingHistory(e.newValue,storyIndex.filter(c=>c.id.startsWith('en_book')).map(c=>c.id)));if(e.key===READER_PREFS_KEY||e.key===null)setPagePrefs(parseReaderPreferences(e.newValue));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[historyKey,account.ready,account.epoch]);
 useEffect(()=>{if(!localReady)return;try{localStorage.setItem(READER_PREFS_KEY,JSON.stringify(pagePrefs));}catch{setStorageWarning(true);}},[pagePrefs,localReady]);
 useEffect(()=>{if(!standalone)return;document.documentElement.dataset.readerFocus=focused?'true':'false';return()=>{delete document.documentElement.dataset.readerFocus;};},[focused,standalone]);

 function visit(next:string,status?:'reading'|'read'){if(status==='read'&&(next!==id||reachedEnd!==id||!chapter?.complete))return;let resolved=status||visits.find(v=>v.chapterId===next)?.status||'reading';try{const current=parseReadingHistory(localStorage.getItem(historyKey),storyIndex.map(c=>c.id)),updated=recordReadingVisit(current,next,status,new Date().toISOString());resolved=updated[0].status;localStorage.setItem(historyKey,JSON.stringify(updated));setVisits(updated.filter(v=>v.chapterId.startsWith('en_book')));}catch{setStorageWarning(true);setVisits(current=>recordReadingVisit(current,next,status,new Date().toISOString()));}window.dispatchEvent(new Event(DISCOVERY_EVENT));if(account.data?.profile)void account.mutate({action:'visit',chapterId:next,status:resolved}).catch(()=>{});}

 useEffect(()=>{if(account.ready&&localReady&&!loading&&!editMode&&chapter?.id===id&&(chapter.text_vi.trim()||chapter.text_en.trim())&&visited.current!==id){visited.current=id;visit(id);}},[localReady,loading,editMode,chapter,id,historyKey,account.ready,account.epoch]);
 useEffect(()=>{if(!standalone)return;const pop=()=>{const next=decodeURIComponent(window.location.pathname.split('/').pop()||'');if(storyIndex.some(c=>c.id===next))select(next,false,false);};window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[standalone]);
 useEffect(()=>{if(standalone&&chapter)document.title=presentationPunctuation(lang==='en'?(chapter.title_en||chapter.title_vi):chapter.title_vi)+' · Through Frost and Myth';},[chapter,lang,standalone]);
 useEffect(()=>{if(standalone)return;const sync=()=>{const match=window.location.hash.match(/^#reader\/([a-zA-Z0-9_]+)$/);if(match&&storyIndex.some(c=>c.id===match[1]))select(match[1],true,false);};sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[standalone]);

 const modal=useRef<HTMLDivElement>(null),reader=useRef<HTMLElement>(null),dirtyRef=useRef(false);dirtyRef.current=dirty;
 const index=entries.findIndex(c=>c.id===id),meta=entries[index],arc=meta?.arc||1;
 const prevEntry=index>0?entries[index-1]:null;
 const nextEntry=index>=0&&index<entries.length-1?entries[index+1]:null;

 useEffect(()=>{fetch('/api/story',{cache:'no-store'}).then(async r=>{if(!r.ok)return;const x=await r.json() as {chapters?:Entry[]};if(Array.isArray(x.chapters))setEntries(x.chapters.filter(c=>c.id.startsWith('en_book')));}).catch(()=>{});},[]);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');setChapter(null);fetch('/api/story/'+id,{cache:'no-store',signal:controller.signal}).then(async r=>{const x=await r.json() as {error?:string;chapters:Entry[];chapter:Chapter};if(!r.ok)throw Error(x.error||'Unable to load or save the chapter.');setChapter(x.chapter);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[id,attempt]);
 useEffect(()=>{if(!editMode||!chapter||dirtyRef.current)return;setDraft(structuredClone(chapter));setSaved(false);setRecovery(null);try{const cached=localStorage.getItem(draftKey(chapter.id));if(cached){const x=JSON.parse(cached);if(x.id===chapter.id&&typeof x.text_vi==='string'&&typeof x.text_en==='string'&&JSON.stringify(x)!==JSON.stringify(chapter))setRecovery(x);}}catch{}},[editMode,chapter]);
 useEffect(()=>{if(!dirty||!draft)return;const timer=setTimeout(()=>{try{localStorage.setItem(draftKey(draft.id),JSON.stringify(draft));setDraftWarning('');}catch{setDraftWarning('Device draft storage is unavailable. Download your draft before leaving.');}},250);return()=>clearTimeout(timer);},[draft,dirty,lang]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirtyRef.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);

 function keepDraft(){if(dirty&&draft)try{localStorage.setItem(draftKey(draft.id),JSON.stringify(draft));}catch{}}
 function close(){if(saving)return;if(dirty&&!confirm('Not saved to the website. Close and keep the device draft?'))return;keepDraft();setDirty(false);onCloseEdit();}
 useModalFocus(modal,close,editMode);
 function select(next:string,restore=false,push=true){if(saving||!next.startsWith('en_book'))return;if(dirty&&!confirm('Keep the unsaved device draft and switch chapters?'))return;keepDraft();setDirty(false);setDraft(null);setRecovery(null);setPreview(false);setId(next);setContentsOpen(false);if(push&&next!==id)window.history.pushState({...history.state},'',standalone?chapterPath(next):'#reader/'+next);if(!editMode&&!restore)requestAnimationFrame(()=>{reader.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});});}
 function update(k:keyof Chapter,v:string|boolean){setDraft(d=>d?{...d,[k]:v}:d);setDirty(true);setSaved(false);}
 async function save(){if(!draft||!admin||saving)return;setSaving(true);setError('');keepDraft();try{const r=await fetch('/api/story/'+draft.id,{method:'PUT',headers:{'Content-Type':'application/json','X-CSRF-Token':admin.csrf},body:JSON.stringify({chapter:draft,revision:draft.revision})});const x=await r.json() as {error?:string;chapters:Entry[];chapter:Chapter};if(!r.ok)throw Error(x.error||'Unable to load or save the chapter.');setChapter(x.chapter);setDraft(x.chapter);setDirty(false);setSaved(true);setRecovery(null);setEntries(list=>list.map(c=>c.id===draft.id?{...c,title_vi:draft.title_vi,title_en:draft.title_en,complete:draft.complete}:c));try{localStorage.removeItem(draftKey(draft.id));}catch{}}catch(e){setError((e as Error).message);}finally{setSaving(false);}}
 function download(){if(!draft)return;const text=editLang==='vi'?draft.text_vi:draft.text_en,title=editLang==='vi'?draft.title_vi:draft.title_en;const url=URL.createObjectURL(new Blob([title+'\n\n'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=draft.id+'-'+editLang+'-draft.txt';a.click();URL.revokeObjectURL(url);}

 const displayText=presentationPunctuation(lang==='en'?(chapter?.text_en||''):(chapter?.text_vi||''));
 const displayTitle=presentationPunctuation((lang==='en'&&chapter?.title_en?chapter.title_en:chapter?.title_vi||meta?.title_vi)||'');
 const readMinutes=displayText?Math.max(1,Math.ceil(displayText.trim().split(/\s+/).length/220)):0;
 const filtered=entries.filter(c=>searchChapter(c.title_vi+' '+c.title_en+' Arc '+c.arc+' '+c.number).includes(searchChapter(query)));
 const status=(chapterId:string)=>visits.find(v=>v.chapterId===chapterId)?.status;
 const statusLabel=(chapterId:string)=>status(chapterId)==='read'?'Read':status(chapterId)==='reading'?'Reading':'';
 const isCurrentRead=status(id)==='read';
 const canMarkRead=Boolean(chapter?.complete&&(isCurrentRead||reachedEnd===id));

 const chapterButton=(c:Entry)=>(
  <button key={c.id} type="button" aria-current={id===c.id?'page':undefined} className={'reader266-toc-item'+(id===c.id?' selected':'')} disabled={saving} onClick={()=>select(c.id)}>
   <span className="reader266-toc-num" aria-hidden="true">{String(c.number).padStart(2,'0')}</span>
   <span className="reader266-toc-copy">
    <span className="reader266-toc-title">{presentationPunctuation(lang==='en'&&c.title_en?c.title_en:c.title_vi)}</span>
    <span className="reader266-toc-meta">
     {viewCounts&&(viewStatus==='ready'||c.id in viewCounts)&&<small className="chapter-view-count">{viewNumber(viewCounts[c.id]||0)} views</small>}
     {statusLabel(c.id)&&<small className={'chapter-status '+status(c.id)}>{statusLabel(c.id)==='Read'?'Read ✓':'Reading'}</small>}
    </span>
   </span>
  </button>
 );

 const recent=visits.map(v=>filtered.find(c=>c.id===v.chapterId)).filter((c):c is Entry=>!!c);
 const contents=(
  <>
   <label className="chapter-search reader266-drawer-search">
    <Search size={15} aria-hidden="true"/>
    <span className="sr-only">Find a chapter</span>
    <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter by chapter title or number…"/>
    {query&&<button type="button" className="reader266-search-clear" aria-label="Clear chapter search" onClick={()=>setQuery('')}><X size={14}/></button>}
   </label>
   <div className="contents-tabs" role="group" aria-label="Chapter list filter">
    <button type="button" aria-pressed={listView==='all'} onClick={()=>setListView('all')}>All Chapters ({entries.length})</button>
    <button type="button" aria-pressed={listView==='history'} onClick={()=>setListView('history')}>Recent ({recent.length})</button>
   </div>
   {listView==='history'?(
    <div className="reading-history-list">
     {recent.map(chapterButton)}
     {!recent.length&&<p className="reader266-toc-empty">No matching chapters in your reading history yet.</p>}
    </div>
   ):(
    <div className="reader266-toc-groups">
     {Array.from(new Set(entries.map(c=>c.arc))).sort((a,b)=>a-b).map(a=>{
      const items=filtered.filter(c=>c.arc===a);
      return !!items.length&&(
       <section key={a} className="reader266-toc-group" aria-label={lang==='en'?'Book I · The Pathmaker':'Arc '+a}>
        <div className="reader266-toc-group-head">
         <span>{lang==='en'?'Book I · The Pathmaker':'Arc '+(['I','II','III','IV','V'][a-1]||a)}</span>
         <small>{items.length} chapters</small>
        </div>
        <div className="reader266-toc-list">{items.map(chapterButton)}</div>
       </section>
      );
     })}
     {!filtered.length&&<p className="reader266-toc-empty">No chapters match &ldquo;{query.trim()}&rdquo;.</p>}
    </div>
   )}
  </>
 );

 return <>
  <section
   className={'story-library reader-layout enhanced-reader reader-v266 '+(standalone?'standalone-reader ':'')+(contentsOpen?'contents-open ':'')}
   data-reader-theme={pagePrefs.theme}
   data-reader-focus={focused}
   data-reader-font={pagePrefs.fontFamily||'serif'}
   data-page-width={pagePrefs.width}
   style={{'--page-leading':pagePrefs.lineHeight,'--page-gap':pagePrefs.paragraphGap+'em'} as CSSProperties}
  >
   {contentsOpen&&<div className="reader266-drawer-backdrop" onClick={()=>setContentsOpen(false)} aria-hidden="true"/>}

   <aside id="chapter-contents" className="story-contents reader266-toc-drawer" hidden={!contentsOpen} aria-label="Chapter contents">
    <div className="reader266-drawer-head">
     <div>
      <span className="eyebrow">Imperial Chronicles</span>
      <h2>Chapter Index</h2>
     </div>
     <button type="button" className="reader266-drawer-close" aria-label="Close contents" onClick={()=>setContentsOpen(false)}>
      <X size={20}/>
     </button>
    </div>
    <div className="reader266-drawer-body">
     {contents}
     {admin&&<button type="button" className="story-edit-button" onClick={()=>standalone?window.location.assign('/#reader/'+id):onEdit()}><Pencil size={16}/>Edit story</button>}
    </div>
   </aside>

   <article id="reading-text" tabIndex={-1} className="reader story-reader" ref={reader} aria-busy={loading}>
    <div className="reader-tools reader266-toolbar">
     <div className="reader266-toolbar-left">
      <button type="button" className="reader266-tool-btn" aria-expanded={contentsOpen} aria-controls="chapter-contents" onClick={()=>setContentsOpen(v=>!v)}>
       <BookOpen size={16} aria-hidden="true"/>
       <span>{contentsOpen?'Close Index':'Contents'}</span>
      </button>
      <span className="reader266-chapter-pill">
       <span>Book I</span>
       <em aria-hidden="true">·</em>
       <strong>Ch. {String(meta?.number??Math.max(1,index+1)).padStart(2,'0')} / {entries.length}</strong>
      </span>
     </div>

     <div className="reader266-toolbar-right">
      <button type="button" aria-label={focused?'Leave focus mode':'Focus mode'} className="reader-focus-toggle reader266-tool-btn" aria-pressed={focused} onClick={()=>{setFocused(v=>!v);setContentsOpen(false);}}>
       {focused?<Minimize2 size={15} aria-hidden="true"/>:<Maximize2 size={15} aria-hidden="true"/>}
       <span>{focused?'Exit Focus':'Focus'}</span>
      </button>
      {admin&&<button type="button" className="reader266-tool-btn" aria-label="Edit chapter" onClick={()=>standalone?window.location.assign('/#reader/'+id):onEdit()}><Pencil size={16}/></button>}
      <ReaderSettings font={font} onFont={setFont} value={pagePrefs} onChange={setPagePrefs} lang={lang}/>
     </div>
    </div>

    {storageWarning&&<p className="notice" role="status">Browser storage is unavailable. Preferences and history last for this visit only.</p>}

    <ReadingProgress chapter={chapter} selectedId={id} loading={loading} editMode={editMode} lang={lang} readerRef={reader} onChapter={next=>select(next,true)}/>

    <div className="reader266-folio-sheet">
     <header className="chapter-heading reader266-folio-head">
      <span className="reader266-folio-kicker">Book I · The Pathmaker · Chapter {String(meta?.number??Math.max(1,index+1)).padStart(2,'0')}</span>
      <h2>{displayTitle}</h2>
      <div className="reader266-folio-meta">
       {readMinutes>0&&(
        <span className="chapter-reading-time">
         <Clock size={14} aria-hidden="true"/>
         <span>About {readMinutes} min read</span>
        </span>
       )}
       {viewCounts&&(viewStatus==='ready'||id in viewCounts)&&(
        <span className="reading-view-count">
         <Eye size={14} aria-hidden="true"/>
         <span>{viewNumber(viewCounts[id]||0)} views</span>
        </span>
       )}
       {!editMode&&!loading&&chapter?.id===id&&displayText&&<ReaderWorldContext text={displayText} lang={lang}/>}
      </div>
      <div className="reader266-folio-ornament" aria-hidden="true"><span/><Sparkles size={13}/><span/></div>
     </header>

     {loading?(
      <div className="reader266-loading" role="status">
       <BookOpen size={24} aria-hidden="true"/>
       <p>Opening chapter manuscript…</p>
      </div>
     ):error&&!chapter?(
      <div className="reader266-error" role="alert">
       <p>{error}</p>
       <button type="button" className="story-action" onClick={()=>setAttempt(n=>n+1)}>Retry</button>
      </div>
     ):(
      <>
       {lang==='en'&&!chapter?.text_en?.trim()&&<p className="notice">This chapter is awaiting its English text.</p>}
       {!chapter?.complete&&<p className="notice">This chapter is being added.</p>}
       {displayText?(
        <div className="reader266-prose-frame" style={{fontSize:font}} lang="en">
         <Prose text={displayText}/>
        </div>
       ):(
        <p className="archive-pending">Chapter text is not available yet.</p>
       )}
      </>
     )}

     <div className="reader266-end-ornament" aria-hidden="true"><span/><Sparkles size={12}/><span/></div>
     <p className="chapter-copyright chapter-end-credit">Through Frost and Myth · © Leonardo Ravenna · All rights reserved.</p>

     {chapter&&!loading&&displayText&&(
      <section className={'reading-completion reader266-completion-card'+(isCurrentRead?' is-complete':'')} aria-label="Chapter completion">
       <div className="reader266-completion-top">
        <span className="reader266-completion-medallion" aria-hidden="true">
         {isCurrentRead?<Check size={17} strokeWidth={2.4}/>:<Trophy size={16}/>}
        </span>
        <div className="reader266-completion-copy">
         <strong>{isCurrentRead?'Chapter Verified & Recorded':reachedEnd===id?'Reached the Final Line':'Read to the End to Verify'}</strong>
         <small>
          {reachedEnd!==id&&!isCurrentRead?'Scroll through the final paragraph to unlock Mark as Read. ':''}
          {account.data?.profile?t('Lịch sử đồng bộ với tài khoản.',account.error?'Device history preserved; account sync is unavailable.':'Account history connected.'):'Saved only in this browser.'}
         </small>
        </div>
       </div>
       <div className="reader266-completion-actions">
        <button
         type="button"
         className={'reader266-mark-btn'+(isCurrentRead?' is-read':'')}
         disabled={!canMarkRead}
         title={reachedEnd===id||isCurrentRead?'Toggle read status for this chapter':'Read to the end before marking this chapter as read'}
         aria-pressed={isCurrentRead}
         onClick={()=>visit(id,isCurrentRead?'reading':'read')}
        >
         {isCurrentRead?<><Check size={15} aria-hidden="true"/><span>Read · Mark as Reading</span></>:<><Sparkles size={15} aria-hidden="true"/><span>Mark Chapter as Read</span></>}
        </button>
        <a className="reader266-ach-cta" href="/achievements">
         <span>Achievements</span>
         <ArrowUpRight size={14} aria-hidden="true"/>
        </a>
       </div>
      </section>
     )}

     <AccountBookmarks chapterId={id} lang={lang}/>

     <nav className="story-pagination reader266-pagination" aria-label="Chapter navigation">
      <button type="button" className="reader266-page-card is-prev" disabled={!prevEntry} onClick={()=>prevEntry&&select(prevEntry.id)}>
       <span className="reader266-page-dir"><ChevronLeft size={15} aria-hidden="true"/>Previous Chapter</span>
       <strong>{prevEntry?presentationPunctuation(prevEntry.title_en||prevEntry.title_vi):'Beginning of Book I'}</strong>
      </button>
      <button type="button" className="reader266-page-card is-next" disabled={!nextEntry} onClick={()=>nextEntry&&select(nextEntry.id)}>
       <span className="reader266-page-dir">Next Chapter<ChevronRight size={15} aria-hidden="true"/></span>
       <strong>{nextEntry?presentationPunctuation(nextEntry.title_en||nextEntry.title_vi):'End of Published Chapters'}</strong>
      </button>
     </nav>

     {chapter&&!loading&&displayText&&<ChapterDiscussion key={id} chapterId={id} lang={lang} enabled={!editMode} onViews={updateViews}/>}
    </div>
   </article>
  </section>

  {editMode&&<div className="modal-backdrop story-editor-backdrop" ref={modal}><section className="story-editor frost-shell" role="dialog" aria-modal="true" aria-labelledby="story-editor-title"><header><div><span className="eyebrow">{admin?.username}</span><h2 id="story-editor-title">Story editor</h2></div><button type="button" aria-label="Close editor" disabled={saving} onClick={close}><X/></button></header><div className="story-editor-body"><aside className="story-contents">{contents}</aside><div className="story-editor-fields"><label>Editing chapter<select disabled={saving} value={id} onChange={e=>select(e.target.value)}>{entries.map(c=><option key={c.id} value={c.id}>{c.id.startsWith('en_book')?'Book I':'Arc '+c.arc} · {presentationPunctuation(lang==='en'&&c.title_en?c.title_en:c.title_vi)}</option>)}</select></label>{loading?<p role="status">Loading text…</p>:draft?<><div className="story-editor-toolbar"><div></div><button type="button" aria-pressed={preview} onClick={()=>setPreview(v=>!v)}><Eye size={17}/>{preview?'Back to editing':'Preview'}</button><button type="button" onClick={download}><Download size={17}/>Download draft</button></div>{recovery&&<div className="story-recovery"><p>An unsaved device draft is available.</p><button type="button" onClick={()=>{setDraft({...recovery,revision:chapter?.revision??recovery.revision});setDirty(true);setRecovery(null);}}><RotateCcw size={17}/>Restore draft</button><button type="button" onClick={()=>{try{localStorage.removeItem(draftKey(id));}catch{}setRecovery(null);}}>Discard draft</button></div>}{preview?<article className="story-preview" lang={editLang}><h2>{draft[editLang==='vi'?'title_vi':'title_en']}</h2><Prose text={draft[editLang==='vi'?'text_vi':'text_en']}/></article>:<><label>Chapter title · {editLang.toUpperCase()}<input disabled={saving} value={draft[editLang==='vi'?'title_vi':'title_en']} onChange={e=>update(('title_'+editLang) as keyof Chapter,e.target.value)}/></label><label>Chapter text · {editLang.toUpperCase()}<textarea className="story-text-input" disabled={saving} lang={editLang} value={draft[editLang==='vi'?'text_vi':'text_en']} onChange={e=>update(('text_'+editLang) as keyof Chapter,e.target.value)} placeholder="Paste the full chapter here. Leave a blank line between paragraphs."/></label></>}<label className="story-complete"><input type="checkbox" disabled={saving} checked={draft.complete} onChange={e=>update('complete',e.target.checked)}/>Full chapter text is present</label><p className="story-editor-note">Saving updates the reader’s website version. The original Doc stays unchanged.</p></>:<button type="button" className="story-action" onClick={()=>setAttempt(n=>n+1)}>Reload chapter</button>}</div></div><footer><div role="status">{saved?'Saved to the website.':dirty?'Unsaved · Device draft available':'Choose a chapter, edit or paste text, then save.'}{draftWarning&&<p>{draftWarning}</p>}{error&&<><p role="alert" className="save-error">{error}</p><button type="button" disabled={saving} onClick={()=>{keepDraft();setDirty(false);setDraft(null);setAttempt(n=>n+1);}}>Load saved version to compare</button></>}</div><button type="button" className="save" disabled={!dirty||saving||loading||!draft||!admin} onClick={save}><Save size={18}/>{saving?'Saving…':'Save chapter'}</button></footer></section></div>}
 </>;
}
