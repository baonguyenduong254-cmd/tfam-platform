'use client';
import {useState,type ComponentPropsWithRef} from 'react';
import {assetUrl} from '../../lib/media/asset-url';
type Props=ComponentPropsWithRef<'img'>&{fallbackSrc?:string};
/** Keeps the native img DOM and events; all artwork goes through one resolver. */
export default function MediaImage({src,loading,decoding='async',fallbackSrc='/media-unavailable.svg',onError,...props}:Props){
 const resolved=typeof src==='string'?assetUrl(src):src;
 const [failed,setFailed]=useState<string|undefined>();
 const missing=typeof resolved==='string'&&failed===resolved;
 return <img {...props} src={missing?assetUrl(fallbackSrc):resolved} loading={loading||(props.fetchPriority==='high'?'eager':'lazy')} decoding={decoding} onError={event=>{if(missing)return;if(typeof resolved==='string')setFailed(resolved);onError?.(event);}}/>;
}
