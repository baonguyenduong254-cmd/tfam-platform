'use client';
import {motionPreference} from '../../lib/motion/preference';
import {useEffect,useRef,useState} from 'react';
import {assetUrl} from '../../lib/media/asset-url';
import MediaImage from './MediaImage';
type Props={src:string;poster?:string;label:string;autoPlay?:boolean;loop?:boolean;controls?:boolean;className?:string};
/** Source is attached near the viewport; no hidden cinematic downloads. */
export default function R2Video({src,poster,label,autoPlay=false,loop=false,controls=true,className}:Props){
 const video=useRef<HTMLVideoElement>(null),[motionAllowed,setMotionAllowed]=useState(false),[near,setNear]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{setFailed(false);},[src]);
 useEffect(()=>{const mq=motionPreference;const change=()=>setMotionAllowed(!mq.matches);change();mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change);},[]);
 useEffect(()=>{const element=video.current;if(!element)return;const observer=new IntersectionObserver(entries=>{const visible=entries[0]?.isIntersecting;setNear(!!visible);if(!visible)element.pause();else if(autoPlay&&!motionPreference.matches)void element.play().catch(()=>{});},{rootMargin:'150px'});observer.observe(element);const visibility=()=>{if(document.hidden)element.pause();};document.addEventListener('visibilitychange',visibility);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility);element.pause();};},[src,autoPlay,failed]);
 if(failed)return <figure className={className}>{poster&&<MediaImage src={poster} alt={label}/>}<figcaption role="status">{label} · Video unavailable</figcaption></figure>;
 return <video ref={video} className={className} src={near?assetUrl(src):undefined} poster={poster?assetUrl(poster):undefined} preload={near?'metadata':'none'} playsInline muted={autoPlay} autoPlay={autoPlay&&motionAllowed} loop={loop} controls={controls} aria-label={label} onError={()=>setFailed(true)}/>;
}
