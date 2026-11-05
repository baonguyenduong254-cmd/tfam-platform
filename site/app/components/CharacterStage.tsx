'use client';
import SceneStage from './SceneStage';
import MediaImage from './MediaImage';
import {sceneArt} from '../../lib/faction-scene';
import {characterCutout} from '../../lib/character-artwork';
type R=Record<string,any>;
export default function CharacterStage({character,faction,name}:{character:R;faction:R;name:string}){
 const cutout=characterCutout(character);
 return <SceneStage className={'character-scene '+(cutout?'has-cutout':'has-original')} identity={character.id}>
  <div className="character-scene-environment" data-scene-plane="environment" aria-hidden="true"><MediaImage src={sceneArt(faction)} alt="" width={1672} height={941}/></div>
  <div className="character-scene-light" aria-hidden="true"/>
  <div className="character-scene-aperture" data-scene-plane="aperture" aria-hidden="true"><MediaImage src={faction.flag_asset} alt="" width={600} height={400}/></div>
  <div className="character-scene-subject" data-scene-plane="subject" style={{viewTransitionName:'tfam-carried-art'}}>
   {character.portrait_asset?<MediaImage src={cutout||character.portrait_asset} fallbackSrc={character.portrait_asset} alt={name} width={1024} height={1536} loading="eager" fetchPriority="high"/>:<span className="character-scene-pending">Portrait forthcoming</span>}
  </div>
  <div className="character-scene-foreground" aria-hidden="true"/>
 </SceneStage>;
}
