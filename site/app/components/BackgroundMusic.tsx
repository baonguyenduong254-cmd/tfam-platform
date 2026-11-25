'use client';
import {useEffect,useRef,useState} from 'react';
import {assetUrl} from '../../lib/media/asset-url';
import tracks from '../../lib/soundtrack.json';
const KEY='tfam-background-music-v1';

/** Hidden ambient soundtrack controller: keeps audio active without visible player chrome. */
export default function BackgroundMusic(){
 const audio=useRef<HTMLAudioElement>(null),mountedRef=useRef(true);
 const [track,setTrack]=useState(0),[mounted,setMounted]=useState(false);
 const muteRef=useRef(false);

 async function play(){
  const el=audio.current;
  if(!el||muteRef.current)return;
  const source=el.currentSrc;
  try{
   await el.play();
  }catch(error){
   if(!mountedRef.current||el.currentSrc!==source||(error as DOMException).name==='AbortError')return;
  }
 }

 useEffect(()=>{
  mountedRef.current=true;
  setMounted(true);
  const el=audio.current!;
  try{muteRef.current=localStorage.getItem(KEY)==='off';}catch{}
  el.muted=muteRef.current;
  el.volume=.18;
  const unlock=()=>{if(!muteRef.current&&el.paused)void play();};
  const preference=(e:Event)=>{
   const value=!(e as CustomEvent).detail?.enabled;
   muteRef.current=value;
   el.muted=value;
   try{localStorage.setItem(KEY,value?'off':'on');}catch{}
   if(!value)void play();
   else el.pause();
   window.dispatchEvent(new Event('tfam-music-status'));
  };
  const quiet=()=>preference(new CustomEvent('quiet',{detail:{enabled:false}}));
  window.addEventListener('tfam-music-preference',preference);
  window.addEventListener('tfam-quiet',quiet);
  document.addEventListener('pointerdown',unlock,{passive:true});
  document.addEventListener('keydown',unlock,{passive:true});
  void play();
  return()=>{
   mountedRef.current=false;
   window.removeEventListener('tfam-music-preference',preference);
   window.removeEventListener('tfam-quiet',quiet);
   document.removeEventListener('pointerdown',unlock);
   document.removeEventListener('keydown',unlock);
   el.pause();
  };
 },[]);

 useEffect(()=>{if(mounted&&!muteRef.current)void play();},[track,mounted]);

 return <audio hidden ref={audio} src={assetUrl(tracks[track].src)} preload="metadata" onEnded={()=>setTrack(i=>(i+1)%tracks.length)} onPlaying={()=>window.dispatchEvent(new Event('tfam-music-status'))}/>;
}
