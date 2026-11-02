import {MEDIA_BASE_URL} from './config';
import externalPaths from './external-paths.json';
const paths=externalPaths as Record<string,string>;
const logical=/^(?:audio\/(?:soundtrack|sfx)|images|video\/(?:cinematic|backgrounds|trailers)|3d\/(?:models|textures|hdr|animations))\//;
/** Legacy metadata remains editable. Only verified local assets are remapped. */
export function assetUrl(value:string|undefined|null):string {
 if(!value)return '';
 // Retire the old An Nam dragon banner, including its external R2 URL.
 if(/(?:^|\/)(?:annam-emblem\.webp|annam-lac-bird\.svg)(?:[?#]|$)/.test(value))return '/campaign/annam-lac-emblem-v2.webp';
 if(/^(?:https?:|data:|blob:|\/\/)/i.test(value))return value;
 const [,pathname,suffix='']=value.match(/^([^?#]*)(.*)$/)||[];
 if(!pathname||pathname.split('/').includes('..'))return value;
 const key=paths[pathname.startsWith('/')?pathname:'/'+pathname]||(logical.test(pathname.replace(/^\//,''))?pathname.replace(/^\//,''):undefined);
 return key?MEDIA_BASE_URL+'/'+key.split('/').map(encodeURIComponent).join('/')+suffix:value;
}
export const media={
 soundtrack:(file:string)=>assetUrl('audio/soundtrack/'+file),
 sfx:(file:string)=>assetUrl('audio/sfx/'+file),
 video:(file:string)=>assetUrl('video/'+file),
 model:(file:string)=>assetUrl('3d/models/'+file),
};
