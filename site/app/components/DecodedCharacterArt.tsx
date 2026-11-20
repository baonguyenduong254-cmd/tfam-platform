'use client';
import {useEffect,useRef,useState} from 'react';
import {assetUrl} from '../../lib/media/asset-url';
const decoded=new Map<string,Promise<void>>();
export function warmCharacterArt(src:string){
 const url=assetUrl(src);let task=decoded.get(url);
 if(!task){task=new Promise<void>((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=()=>image.decode().then(()=>resolve(),reject);image.onerror=()=>reject(new Error('Artwork unavailable'));image.src=url;});decoded.set(url,task);task.catch(()=>decoded.delete(url));if(decoded.size>8)decoded.delete(decoded.keys().next().value!);}
 return task;
}
type Plate={src:string;name:string};
/** Keep the visible plate until its replacement has decoded; stale requests cannot win. */
export default function DecodedCharacterArt({src,name}:{src?:string;name:string}){
 const [plate,setPlate]=useState<Plate|null>(null),[previous,setPrevious]=useState<Plate|null>(null),[pending,setPending]=useState(false),[failed,setFailed]=useState(false);
 const shown=useRef<Plate|null>(null),sequence=useRef(0);
 useEffect(()=>{const revision=++sequence.current;let timer:ReturnType<typeof setTimeout>|undefined;setFailed(false);
 if(!src){shown.current=null;setPlate(null);setPrevious(null);setPending(false);return;}
 if(shown.current?.src===src){setPending(false);return;}
 setPending(true);warmCharacterArt(src).then(()=>{if(sequence.current!==revision)return;const next={src,name};setPrevious(shown.current);shown.current=next;setPlate(next);setPending(false);timer=setTimeout(()=>{if(sequence.current===revision)setPrevious(null);},360);}).catch(()=>{if(sequence.current!==revision)return;setPending(false);setFailed(true);setPlate(null);setPrevious(null);shown.current=null;});
 return()=>{sequence.current++;if(timer)clearTimeout(timer);};
 },[src,name]);
 return <div className="decoded-character-art" aria-busy={pending}>
 {previous&&<img key={'previous-'+previous.src} className="decoded-art-out" src={assetUrl(previous.src)} alt="" aria-hidden="true"/>}
 {plate&&<img key={plate.src} className="decoded-art-in" src={assetUrl(plate.src)} alt={plate.name} decoding="async"/>}
 {!src&&<p>Uniform artwork forthcoming</p>}
 {pending&&<span className="decoded-art-status" role="status">Preparing {name}…</span>}
 {failed&&<span className="decoded-art-status" role="alert">Artwork unavailable for {name}. Choose another character.</span>}
 </div>;
}

