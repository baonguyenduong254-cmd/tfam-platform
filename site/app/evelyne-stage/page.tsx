'use client';
import {useEffect,useMemo,useState} from 'react';
import {belongsToFaction} from '../../lib/castilian-presentation';
import {canonicalCharacters} from '../../lib/canonical-characters';
import {orderCharacters} from '../../lib/character-order';
import {isRemovedRosterCharacter,withCharacterPortraits} from '../../lib/character-portraits';
import seed from '../../lib/seed.json';
import {hasWardrobe} from '../../lib/wardrobe-looks';
import CharacterStageView,{STAGE_SKINS,type StageTab} from '../components/CharacterStageView';

const initial=withCharacterPortraits(seed);

/**
 * Dedicated Private Salon route (/evelyne-stage) unified with the v258 Gamelike Character Stage.
 * Preserves ?character=, ?look=, and #wardrobe/#office/#afterwork/#beach deep links with zero overlap.
 */
export default function CharacterLounge(){
 const [records,setRecords]=useState<Record<string,any>[]>(initial.characters);
 const [characterId,setCharacterId]=useState<string>('evelyne_vesper');
 const [initialTab,setInitialTab]=useState<StageTab>('overview');
 const [initialSkin,setInitialSkin]=useState<string>('uniform');
 const [initialVariant,setInitialVariant]=useState<string>('');

 useEffect(()=>{
  function sync(){
   const url=new URL(location.href);
   const requestedId=url.searchParams.get('character');
   const cleanId=requestedId&&!isRemovedRosterCharacter(requestedId)?requestedId:'evelyne_vesper';
   const hash=url.hash.slice(1);
   setCharacterId(cleanId);
   setInitialVariant(url.searchParams.get('look')||'');
   setInitialTab(hash==='wardrobe'?'wardrobe':'overview');
   setInitialSkin(STAGE_SKINS.some(s=>s.id===hash)?hash:'uniform');
  }
  sync();
  window.addEventListener('popstate',sync);
  window.addEventListener('hashchange',sync);
  const controller=new AbortController();
  fetch('/api/content',{signal:controller.signal})
   .then(r=>r.ok?r.json() as Promise<{data?:any}>:null)
   .then(r=>{if(r?.data?.characters)setRecords(withCharacterPortraits(r.data).characters);})
   .catch(()=>{});
  return()=>{
   window.removeEventListener('popstate',sync);
   window.removeEventListener('hashchange',sync);
   controller.abort();
  };
 },[]);

 const character=records.find(c=>c.id===characterId)||records[0];
 const faction=character?.faction_id==='england_ruins'?'castilian_empire':character?.faction_id||'castilian_empire';
 const roster=useMemo(()=>{
  const ordered=orderCharacters(records).filter(c=>c.presentation_visible&&(belongsToFaction(c,faction)||hasWardrobe(c.id)));
  const canonical=canonicalCharacters(ordered);
  return canonical.length?canonical:ordered;
 },[records,faction]);

 const index=Math.max(0,roster.findIndex(c=>c.id===character?.id));

 function syncLocation(id:string,skinId:string,variantId:string){
  const url=new URL(location.href);
  url.searchParams.set('character',id);
  if(variantId)url.searchParams.set('look',variantId);
  else url.searchParams.delete('look');
  url.hash=skinId==='uniform'?'':skinId;
  history.replaceState(null,'',url);
 }

 function handleSelect(id:string){
  setCharacterId(id);
  setInitialTab('overview');
  setInitialSkin('uniform');
  setInitialVariant('');
  try{sessionStorage.setItem('tfam-champion-selection',id);}catch{}
  syncLocation(id,'uniform','');
 }

 if(!character)return null;

 return <main style={{margin:0,padding:0}}>
  <CharacterStageView
   character={character}
   roster={roster}
   index={index}
   total={roster.length}
   initialTab={initialTab}
   initialSkin={initialSkin}
   initialVariant={initialVariant}
   onBack={()=>window.location.assign('/#archive/'+faction+'/characters')}
   onSelectCharacter={handleSelect}
   onLocationSync={syncLocation}
  />
 </main>;
}
