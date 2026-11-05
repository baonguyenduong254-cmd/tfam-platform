'use client';
import {useEffect,useState} from 'react';
import {Play,RotateCcw,Pause} from 'lucide-react';
import {motionPreference} from '../../lib/motion/preference';
/** Visible scene controls: an entrance must be replayable after its image has loaded. */
export default function ScenePlayback(){
 const [reduced,setReduced]=useState(true);
 useEffect(()=>{const sync=()=>setReduced(motionPreference.matches);sync();motionPreference.addEventListener('change',sync);return()=>motionPreference.removeEventListener('change',sync);},[]);
 function replay(){motionPreference.choose('full');window.dispatchEvent(new Event('tfam-scene-replay'));}
 return <div className="scene-playback" role="group" aria-label="Scene motion"><span role="status">{reduced?'Cinematic motion is reduced':'Cinematic motion is on'}</span><button type="button" onClick={replay}>{reduced?<Play size={16}/>:<RotateCcw size={16}/>}<span>{reduced?'Enable cinematic motion':'Replay scene'}</span></button>{!reduced&&<button type="button" onClick={()=>motionPreference.choose('reduced')} aria-label="Reduce cinematic motion"><Pause size={16}/></button>}</div>;
}
