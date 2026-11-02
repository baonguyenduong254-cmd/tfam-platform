import {assetUrl} from './media/asset-url';
import featured from './featured-military.json';

export function unitIllustration(factionId:string,imageAsset?:string){
 if(imageAsset&&!imageAsset.startsWith('/units/'))return assetUrl(imageAsset);
 const units=featured[factionId as keyof typeof featured]||featured.castilian_empire;
 return assetUrl(units[0].artwork);
}
