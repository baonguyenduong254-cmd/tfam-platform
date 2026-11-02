'use client';
import {useEffect} from 'react';
import {defaultFaction,factionThemes,royalThemeVariables} from '../../lib/faction-theme';
/** One theme owner survives navigation to Chronicles, Vestigium and modal portals. */
export default function RoyalTheme(){
 useEffect(()=>{
  function apply(id:string){if(!factionThemes[id])id=defaultFaction;const root=document.documentElement;root.dataset.royalFaction=id;for(const [key,value] of Object.entries(royalThemeVariables(id)))root.style.setProperty(key,value);}
  let id=defaultFaction;try{id=localStorage.getItem('tfam-royal-faction')||localStorage.getItem('tfam-last-faction')||id;}catch{}apply(id);
  function change(e:Event){const id=(e as CustomEvent<string>).detail;if(typeof id!=='string')return;apply(id);try{localStorage.setItem('tfam-royal-faction',id);}catch{}}
  function storage(e:StorageEvent){if(e.key==='tfam-royal-faction'&&e.newValue)apply(e.newValue);}
  window.addEventListener('tfam-faction-theme',change);window.addEventListener('storage',storage);
  return()=>{window.removeEventListener('tfam-faction-theme',change);window.removeEventListener('storage',storage);};
 },[]);
 return null;
}
