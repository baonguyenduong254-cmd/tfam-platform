 'use client';
import BackgroundMusicSlot from './BackgroundMusicSlot';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,Snowflake} from 'lucide-react';
import StoryLibrary from './StoryLibrary';
import {AccountMenu} from './ReaderAccount';
import '../reader-room.css';
export default function ReadingRoom({initialChapter}:{initialChapter:string}){
 const [lang,setLang]=useState(initialChapter.startsWith('en_book')?'en':'vi'),[font,setFont]=useState(19),[ready,setReady]=useState(false);
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem('tfam-campaign-prefs')||'{}');if(p.font>=16&&p.font<=28)setFont(p.font);}catch{}setReady(true);},[]);
 useEffect(()=>{document.documentElement.lang='en';if(ready)try{const p=JSON.parse(localStorage.getItem('tfam-campaign-prefs')||'{}');localStorage.setItem('tfam-campaign-prefs',JSON.stringify({...p,lang,font}));}catch{}},[lang,font,ready]);
 return <main data-tfam211 className="reading-room" data-lang={lang}><a className="reader-skip" href="#reading-text">Skip to chapter</a><header className="reading-room-header"><BackgroundMusicSlot className="reading-room-music"/><Link href="/#map"><ArrowLeft size={17}/>Return to TFAM</Link><span><Snowflake size={20}/>Through Frost and Myth</span><button onClick={()=>setLang(l=>l==='vi'?'en':'vi')} aria-label="Switch reading edition">{lang==='vi'?'English':'Tiếng Việt'}</button><AccountMenu lang={lang}/></header><StoryLibrary onLanguage={setLang} standalone initialChapter={initialChapter} lang={lang} font={font} setFont={setFont} editMode={false} admin={null} onEdit={()=>{}} onCloseEdit={()=>{}}/><footer>© Leonardo Ravenna · All rights reserved.</footer></main>;
}
