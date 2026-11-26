'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,Compass,Snowflake,Trophy} from 'lucide-react';
import StoryLibrary from './StoryLibrary';
import {AccountMenu} from './ReaderAccount';
import '../reader-room.css';

export default function ReadingRoom({initialChapter}:{initialChapter:string}){
 const lang='en';
 const [font,setFont]=useState(19),[ready,setReady]=useState(false);
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem('tfam-campaign-prefs')||'{}');if(p.font>=16&&p.font<=28)setFont(p.font);}catch{}setReady(true);},[]);
 useEffect(()=>{document.documentElement.lang='en';if(ready)try{const p=JSON.parse(localStorage.getItem('tfam-campaign-prefs')||'{}');localStorage.setItem('tfam-campaign-prefs',JSON.stringify({...p,lang,font}));}catch{}},[lang,font,ready]);

 return (
  <main data-tfam211 className="reading-room reading-room-v266" data-lang={lang}>
   <a className="reader-skip" href="#reading-text">Skip to chapter</a>
   <header className="reading-room-header">
    <div className="rr266-nav-left">
     <a className="rr266-back-link" href="/chronicles">
      <ArrowLeft size={16} aria-hidden="true"/>
      <span>Chronicles</span>
     </a>
     <a className="rr266-world-link" href="/#map">
      <Compass size={15} aria-hidden="true"/>
      <span>The World</span>
     </a>
    </div>

    <a className="rr266-brand" href="/#map" aria-label="Through Frost and Myth home">
     <Snowflake size={17} aria-hidden="true"/>
     <span>Through Frost and Myth</span>
    </a>

    <div className="rr266-nav-right">
     <a className="rr266-ach-link" href="/achievements" aria-label="Reading achievements">
      <Trophy size={16} aria-hidden="true"/>
      <span>Achievements</span>
     </a>
     <AccountMenu lang={lang}/>
    </div>
   </header>

   <StoryLibrary
    standalone
    initialChapter={initialChapter}
    lang={lang}
    font={font}
    setFont={setFont}
    editMode={false}
    admin={null}
    onEdit={()=>{}}
    onCloseEdit={()=>{}}
   />

   <footer className="rr266-footer">
    <p>© Leonardo Ravenna · All rights reserved.</p>
    <div className="rr266-footer-links">
     <a href="/chronicles">The Chronicles</a>
     <a href="/achievements">Achievements</a>
     <a href="/vestigium">Maison Vestigium</a>
     <a href="/#map">The World</a>
    </div>
   </footer>
  </main>
 );
}
