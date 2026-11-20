'use client';
import CharacterDepth from './CharacterDepth';
import SceneStage from './SceneStage';
import MediaImage from './MediaImage';
import {sceneArt} from '../../lib/faction-scene';
import {hasWardrobe,getLooks} from '../../lib/wardrobe-looks';
import {characterCutout} from '../../lib/character-artwork';
type R=Record<string,any>;
export default function CharacterStage({character,faction,name}:{character:R;faction:R;name:string}){
 const cutout=characterCutout(character);
 return <><CharacterDepth identity={character.id}><SceneStage className={'character-scene '+(cutout?'has-cutout':'has-original')} identity={character.id}>
  <div className="character-scene-environment" data-scene-plane="environment" aria-hidden="true"><MediaImage src={sceneArt(faction)} alt="" width={1672} height={941}/></div>
  <div className="character-scene-light" aria-hidden="true"/>
  <div className="character-scene-aperture" data-scene-plane="aperture" aria-hidden="true"><MediaImage src={faction.flag_asset} alt="" width={600} height={400}/></div>
  <div className="character-scene-subject" data-scene-plane="subject" style={{viewTransitionName:'tfam-carried-art'}}>
   {character.portrait_asset?<MediaImage src={cutout||character.portrait_asset} fallbackSrc={character.portrait_asset} alt={name} width={1024} height={1536} loading="eager" fetchPriority="high"/>:<span className="character-scene-pending">Portrait forthcoming</span>}
  </div>
  <div className="character-scene-foreground" aria-hidden="true"/>
 </SceneStage></CharacterDepth>{hasWardrobe(character.id)
 ? <a className="character-wardrobe-link" href={'/evelyne-stage?character='+encodeURIComponent(character.id)+(getLooks(character.id,'uniform').length?'':'#naughty_office')} onClick={event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();window.location.assign(event.currentTarget.href);}}>Explore wardrobe <span aria-hidden="true">↗</span></a>
 : <div className="character-wardrobe-pending"><span>Wardrobe artwork forthcoming</span><small>Uniform · Office · Afterwork · Beach</small></div>}</>;
}
