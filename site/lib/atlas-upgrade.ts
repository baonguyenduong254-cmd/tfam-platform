import {replaceAnNamCharacters} from './annam-characters';
import {upgradeCharacterDossiers} from './character-dossiers';
import {addFourthDossierTraits} from './dossier-traits-v22';
import {completeCharacterDossiers} from './character-upgrade-v23';
import seed from './seed.json';
import territoryPatch from './territory-patch-v3.json';
import factionPatch from './faction-patch-v4.json';
import atlasPatch from './atlas-patch-v5.json';
import ruinsPatch from './atlas-patch-v6.json';
import overseasPatch from './atlas-patch-v7.json';
import eastCoastPatch from './atlas-patch-v8.json';
import castilianPatch from './castilian-patch-v10.json';
import frenchPatch from './french-patch-v11.json';
import campaignArtPatch from './campaign-art-patch-v12.json';
import flagPatch from './flag-patch-v13.json';
import flatFlagPatch from './flag-patch-v14.json';
import originalBannerPatch from './flag-patch-v15.json';
import easternPatch from './atlas-patch-v16.json';
import {applyEasternLore, rewriteEasternLore, completeWesternLore, applyMoorCanon, applyRomanLore} from './lore-upgrade';
export function upgradeAtlas(current:Record<string,any>){
 if((current.atlasRevision||0)>=25)return current;
 const result=structuredClone(current);
 result.territories??={};
 if((current.atlasRevision||0)<2){
  for(const year of ['1715','1716'] as const){result.territories[year]={...(result.territories[year]||{}),...seed.territories[year]};}
  for(const faction of result.factions){const updated=seed.factions.find(f=>f.id===faction.id);if(updated)faction.flag_asset=updated.flag_asset;}
 }
 if((current.atlasRevision||0)<3){for(const year of ['1715','1716'] as const){result.territories[year]={...(result.territories[year]||{}),...territoryPatch[year]};}}
 if((current.atlasRevision||0)<4){
 for(const collection of ['factions','characters','units'] as const){
  result[collection]??=[];
  const ids=new Set(result[collection].map((r:Record<string,any>)=>r.id));
  result[collection].push(...factionPatch[collection].filter(r=>!ids.has(r.id)));
 }
 for(const year of ['1715','1716'] as const){result.territories[year]={...(result.territories[year]||{}),...factionPatch.territories[year]};}
 }
 if((current.atlasRevision||0)<5){
 for(const year of ['1715','1716'] as const){result.territories[year]={...(result.territories[year]||{}),...atlasPatch.territories[year]};}
 for(const faction of result.factions){const flag=atlasPatch.flags[faction.id as keyof typeof atlasPatch.flags];if(flag)faction.flag_asset=flag;}
 }
 if((current.atlasRevision||0)<6){
 for(const year of ['1715','1716'] as const){result.territories[year]={...(result.territories[year]||{}),...ruinsPatch.territories[year]};}
 const factionIds=new Set(result.factions.map((f:Record<string,any>)=>f.id));
 result.factions.push(...ruinsPatch.factions.filter(f=>!factionIds.has(f.id)));
 }
 if((current.atlasRevision||0)<7){
 for(const year of ['1715','1716'] as const){result.territories[year]={...(result.territories[year]||{}),...overseasPatch.territories[year]};}
 for(const collection of ['factions','characters','units'] as const){result[collection]??=[];const ids=new Set(result[collection].map((r:Record<string,any>)=>r.id));result[collection].push(...overseasPatch[collection].filter(r=>!ids.has(r.id)));}
 }
 if((current.atlasRevision||0)<8){
 for(const year of ['1715','1716'] as const){result.territories[year]={...(result.territories[year]||{}),...eastCoastPatch[year]};}
 }
 if((current.atlasRevision||0)<9){
 for(const faction of result.factions){
  for(const language of ['vi','en'])for(const year of ['1715','1716'])faction['lore_'+language+'_'+year]??=faction['lore_'+language]||'';
  faction.legacy_status??={ '1715':faction.status_1715||'', '1716':faction.status_1716||'' };
  delete faction.lore_vi;delete faction.lore_en;delete faction.status_1715;delete faction.status_1716;
 }
 }
 if((current.atlasRevision||0)<10){
 const castilian=result.factions.find((f:Record<string,any>)=>f.id==='castilian_empire');
 if(castilian)Object.assign(castilian,structuredClone(castilianPatch));
 }
 if((current.atlasRevision||0)<11){
 const french=result.factions.find((f:Record<string,any>)=>f.id==='holy_french_kingdom');
 if(french)Object.assign(french,structuredClone(frenchPatch));
 }
 if((current.atlasRevision||0)<12)for(const faction of result.factions){const art=campaignArtPatch[faction.id as keyof typeof campaignArtPatch];if(art){faction.flag_asset=art.flag_asset;faction.backdrop_asset??=art.backdrop_asset;}}
 if((current.atlasRevision||0)<13)for(const faction of result.factions){const flag=flagPatch[faction.id as keyof typeof flagPatch];if(flag)faction.flag_asset=flag;}
 if((current.atlasRevision||0)<14)for(const faction of result.factions){const flag=flatFlagPatch[faction.id as keyof typeof flatFlagPatch];if(flag)faction.flag_asset=flag;}
 if((current.atlasRevision||0)<15)for(const faction of result.factions){const flag=originalBannerPatch[faction.id as keyof typeof originalBannerPatch];if(flag)faction.flag_asset=flag;}
 if((current.atlasRevision||0)<16){
  for(const faction of result.factions){const name=easternPatch.names[faction.id as keyof typeof easternPatch.names];if(name)Object.assign(faction,structuredClone(name));}
  for(const collection of ['factions','characters','units'] as const){result[collection]??=[];const ids=new Set(result[collection].map((r:Record<string,any>)=>r.id));result[collection].push(...structuredClone(easternPatch[collection].filter(r=>!ids.has(r.id))));}
  for(const year of ['1715','1716'] as const)result.territories[year]={...(result.territories[year]||{}),...easternPatch.territories[year]};
 }
 if((current.atlasRevision||0)<17)applyEasternLore(result);
 if((current.atlasRevision||0)<18)rewriteEasternLore(result);
 if((current.atlasRevision||0)<19)completeWesternLore(result);
 if((current.atlasRevision||0)<20)applyMoorCanon(result);
 if((current.atlasRevision||0)<21)applyRomanLore(result);
 if((current.atlasRevision||0)<22)addFourthDossierTraits(result);
 if((current.atlasRevision||0)<23)completeCharacterDossiers(result);
 if((current.atlasRevision||0)<24)upgradeCharacterDossiers(result);
 if((current.atlasRevision||0)<25)replaceAnNamCharacters(result);
 result.atlasRevision=25;
 return result;
}
