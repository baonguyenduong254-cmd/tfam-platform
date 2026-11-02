'use client';
import {useEffect,useState} from 'react';
/** A portal may attach only after this part of the page has hydrated. */
export default function BackgroundMusicSlot({className}:{className:string}){
 const [ready,setReady]=useState(false);
 useEffect(()=>setReady(true),[]);
 return <div className={className} data-background-music-slot data-music-ready={ready?'true':undefined}/>;
}
