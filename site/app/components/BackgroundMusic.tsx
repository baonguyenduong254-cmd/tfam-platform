'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Volume2,VolumeX} from 'lucide-react';
import {assetUrl} from '../../lib/media/asset-url';
import tracks from '../../lib/soundtrack.json';
import '../background-music.css';
const KEY='tfam-background-music-v1';
export default function BackgroundMusic(){
 const audio=useRef<HTMLAudioElement>(null),mountedRef=useRef(true);
 const [track,setTrack]=useState(0),[muted,setMuted]=useState(false),[playing,setPlaying]=useState(false),[blocked,setBlocked]=useState(false),[failed,setFailed]=useState(false),[mount,setMount]=useState<HTMLElement|null>(null),[mounted,setMounted]=useState(false);
 const muteRef=useRef(false);
 async function play(){const el=audio.current;if(!el)return;const source=el.currentSrc;try{await el.play();if(mountedRef.current){setBlocked(false);setFailed(false);}}catch(error){if(!mountedRef.current||el.currentSrc!==source||(error as DOMException).name==='AbortError')return;setBlocked((error as DOMException).name==='NotAllowedError');}}
 useEffect(()=>{mountedRef.current=true;setMounted(true);
  const locate=()=>setMount(document.querySelector<HTMLElement>('[data-background-music-slot][data-music-ready="true"]'));locate();const observer=new MutationObserver(locate);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-music-ready']});
  const el=audio.current!;try{muteRef.current=localStorage.getItem(KEY)==='off';}catch{}setMuted(muteRef.current);el.muted=muteRef.current;el.volume=.18;
  const unlock=()=>{if(el.paused)void play();};
  const preference=(e:Event)=>{const value=!(e as CustomEvent).detail?.enabled;muteRef.current=value;setMuted(value);el.muted=value;try{localStorage.setItem(KEY,value?'off':'on');}catch{}void play();};
  const quiet=()=>preference(new CustomEvent('quiet',{detail:{enabled:false}}));
  window.addEventListener('tfam-music-preference',preference);window.addEventListener('tfam-quiet',quiet);document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);void play();
  return()=>{mountedRef.current=false;observer.disconnect();window.removeEventListener('tfam-music-preference',preference);window.removeEventListener('tfam-quiet',quiet);document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);el.pause();};
 },[]);
 useEffect(()=>{if(mounted)void play();},[track,mounted]);
 function toggle(){const el=audio.current;if(!el)return;const value=blocked||failed?false:!muteRef.current;muteRef.current=value;setMuted(value);el.muted=value;try{localStorage.setItem(KEY,value?'off':'on');}catch{}if(el.error)el.load();void play();window.dispatchEvent(new Event('tfam-music-status'));}
 const audible=playing&&!muted&&!failed;
 const control=<div className="background-music music-compact" data-playing={audible}><span className="music-levels" aria-hidden="true">{[0,1,2,3].map(i=><i key={i}/>)}</span><span className="music-track-title" title={tracks[track].title}>{tracks[track].title}</span><button className="music-mute" type="button" onClick={toggle} aria-label={muted||blocked||failed?'Unmute music':'Mute music'} aria-pressed={muted} title={muted||blocked||failed?'Unmute music':'Mute music'}>{muted||blocked||failed?<VolumeX size={18}/>:<Volume2 size={18}/>}</button><span className="sr-only" role="status">{failed?'Music could not load. Unmute to retry.':blocked?'Music awaits your first interaction.':audible?'Playing '+tracks[track].title:'Music muted'}</span></div>;
 return <><audio hidden ref={audio} src={assetUrl(tracks[track].src)} preload="auto" onEnded={()=>setTrack(i=>(i+1)%tracks.length)} onPlaying={()=>{setPlaying(true);setBlocked(false);setFailed(false);window.dispatchEvent(new Event('tfam-music-status'));}} onPause={()=>setPlaying(false)} onError={()=>{setPlaying(false);setFailed(true);}}/>{mounted&&(mount?createPortal(control,mount):<div className="background-music-fallback">{control}</div>)}</>;
}
