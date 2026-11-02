'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Play,Pause,ListMusic,Check,SkipForward,X} from 'lucide-react';
import '../background-music.css';

import {assetUrl} from '../../lib/media/asset-url';
import tracks from '../../lib/soundtrack.json';
const KEY='tfam-background-music-v1',TRACK_KEY='tfam-background-track-v1';

export default function BackgroundMusic(){
 return <BackgroundMusicPlayer/>;
}
function BackgroundMusicPlayer(){
 const audio=useRef<HTMLAudioElement>(null),wanted=useRef(false),introLock=useRef(true),introMuted=useRef(false),trackRef=useRef(0);
 const [volume,setVolume]=useState(.18);
 useEffect(()=>{if(audio.current)audio.current.volume=volume;},[volume]);
 const [track,setTrack]=useState(0);trackRef.current=track;
 const [pickerOpen,setPickerOpen]=useState(false);const root=useRef<HTMLDivElement>(null),pickerTrigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!pickerOpen)return;const dismiss=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setPickerOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPickerOpen(false);pickerTrigger.current?.focus();}};document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};},[pickerOpen]);
 const [mount,setMount]=useState<HTMLElement|null>(null),[mounted,setMounted]=useState(false);
 useEffect(()=>{const locate=()=>setMount(document.querySelector<HTMLElement>('[data-background-music-slot][data-music-ready="true"]'));locate();setMounted(true);const observer=new MutationObserver(locate);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-music-ready']});return()=>observer.disconnect();},[]);
 const [playing,setPlaying]=useState(false),[blocked,setBlocked]=useState(false),[failed,setFailed]=useState(false),[lang,setLang]=useState('en');
 const t=(vi:string,en:string)=>en;
 async function play(){const el=audio.current;if(!el||introLock.current||introMuted.current)return;const source=el.src;setFailed(false);try{await el.play();if(!wanted.current||introLock.current||introMuted.current)el.pause();setBlocked(false);}catch(e){if(!wanted.current||el.src!==source||(e as DOMException).name==='AbortError')return;if((e as DOMException).name==='NotAllowedError'){setBlocked(true);window.dispatchEvent(new CustomEvent('tfam-voyage-audio-state',{detail:{blocked:true}}));}else{setFailed(true);}}}
 useEffect(()=>{
  const el=audio.current;if(!el)return;
  const quiet=()=>{wanted.current=false;el.pause();try{localStorage.setItem(KEY,'off');}catch{}};window.addEventListener('tfam-quiet',quiet);
  el.volume=.18;introLock.current=false;introMuted.current=false;
  try{const saved=localStorage.getItem('tfam-music-volume-v1');if(saved!==null){const v=Number(saved);if(Number.isFinite(v)&&v>=0&&v<=.6){el.volume=v;setVolume(v);}}wanted.current=localStorage.getItem(KEY)!=='off';const savedTrack=Number(localStorage.getItem(TRACK_KEY));if(Number.isInteger(savedTrack)&&savedTrack>=0&&savedTrack<tracks.length)setTrack(savedTrack);}catch{wanted.current=true;}
  const unlock=(e:Event)=>{if((e.target as Element)?.closest?.('.background-music'))return;if(wanted.current&&el.paused)void play();};
  const preference=(event:Event)=>{const enabled=Boolean((event as CustomEvent).detail?.enabled);wanted.current=enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}if(enabled)void play();else el.pause();};
  window.addEventListener('tfam-music-preference',preference);document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
  if(wanted.current)void play();
  return()=>{window.removeEventListener('tfam-quiet',quiet);window.removeEventListener('tfam-music-preference',preference);document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);wanted.current=false;el.pause();};
 },[]);
 useEffect(()=>{if(wanted.current)void play();},[track]);
 function toggle(){const el=audio.current;if(!el)return;if(!el.paused){wanted.current=false;el.pause();setBlocked(false);try{localStorage.setItem(KEY,'off');}catch{}}else{introMuted.current=false;wanted.current=true;try{localStorage.setItem(KEY,'on');}catch{}if(el.error)el.load();void play();}}
 function chooseTrack(index:number){wanted.current=true;introMuted.current=false;setPickerOpen(false);setFailed(false);try{localStorage.setItem(KEY,'on');localStorage.setItem(TRACK_KEY,String(index));}catch{}if(index===track){if(audio.current?.error)audio.current.load();void play();}else setTrack(index);}
 const label=playing?t('Tạm dừng nhạc','Pause music'):failed?t('Thử phát nhạc lại','Retry music'):t('Phát nhạc','Play music');
 const control=<div className="background-music" ref={root} data-playing={playing} data-picker-open={pickerOpen}>
  <div className="music-console"><button className="music-play" type="button" onClick={toggle} aria-label={label+': '+tracks[track].title} aria-pressed={playing} title={label}><span className="music-disc" aria-hidden="true">{playing?<Pause size={15} fill="currentColor"/>:<Play size={15} fill="currentColor"/>}</span></button>
  <div className="music-now-playing"><span className="music-track-title" title={tracks[track].title}>{tracks[track].title}</span><span className="music-track-credit">Original Soundtrack</span></div>
  <span className="music-levels" aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i}/>)}</span>
  <button className="music-picker-toggle" ref={pickerTrigger} type="button" onClick={()=>setPickerOpen(v=>!v)} aria-expanded={pickerOpen} aria-controls="tfam-track-picker" aria-label={t('Chọn bài nhạc','Choose a track')} title={t('Chọn bài nhạc','Choose a track')}><ListMusic size={19}/></button></div>
  {pickerOpen&&<section className="music-track-picker" id="tfam-track-picker" aria-label={t('Danh sách nhạc nền','Soundtrack selection')}><header><div><span>TFAM · ORIGINAL SOUNDTRACK</span><h3>{t('Những giai điệu của thế giới','Melodies of the world')}</h3></div><button type="button" className="music-picker-close" aria-label={t('Đóng danh sách nhạc','Close track selection')} onClick={()=>{setPickerOpen(false);pickerTrigger.current?.focus();}}><X size={17}/></button></header><ol>{tracks.map((item,i)=><li key={item.src}><button type="button" aria-pressed={track===i} onClick={()=>chooseTrack(i)}><span className="music-track-number">{String(i+1).padStart(2,'0')}</span><span><strong>{item.title}</strong><small>Original Soundtrack</small></span>{track===i&&<Check size={16}/>}</button></li>)}</ol><label className="music-volume"><span>{t('Âm lượng','Volume')} · {Math.round(volume*100)}%</span><input aria-label={t('Âm lượng nhạc nền','Soundtrack volume')} type="range" min="0" max="0.6" step="0.01" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);try{localStorage.setItem('tfam-music-volume-v1',String(v));}catch{}}}/></label><footer><span>{tracks.length} {t('bản nhạc','tracks')}</span><button type="button" onClick={()=>chooseTrack((track+1)%tracks.length)}>{t('Bài tiếp theo','Next track')}<SkipForward size={14}/></button></footer></section>}
  <span className="sr-only" role="status">{failed?t('Chưa tải được nhạc. Bấm để thử lại.','Music could not load. Press to retry.'):blocked?t('Bấm Phát nhạc để bắt đầu nhạc nền.','Press Play music to start background music.'):playing?t('Đang phát ','Playing ')+tracks[track].title:''}</span></div>;
 return <><audio hidden ref={audio} src={assetUrl(tracks[track].src)} preload="auto" onEnded={()=>{setPlaying(false);setTrack(i=>(i+1)%tracks.length);}} onPlaying={()=>{window.dispatchEvent(new Event('tfam-music-status'));setPlaying(true);setFailed(false);setBlocked(false);}} onPause={()=>{setPlaying(false);window.dispatchEvent(new Event('tfam-music-status'));}} onError={()=>{setPlaying(false);setFailed(true);}}/>{mounted&&(mount?createPortal(control,mount):<div className="background-music-fallback">{control}</div>)}</>;
}
