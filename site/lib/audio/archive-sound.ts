import {Howl} from 'howler';
let seal:Howl|undefined;
/** Small generated cue, no network asset or permanent audio loop. */
export function playArchiveSeal(){
 if(typeof window==='undefined')return;
 try{if(localStorage.getItem('tfam-intro-sound')==='off')return;}catch{}
 if(!seal){const rate=16000,length=rate,buffer=new ArrayBuffer(44+length*2),v=new DataView(buffer);const str=(at:number,s:string)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};str(0,'RIFF');v.setUint32(4,36+length*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,length*2,true);for(let i=0;i<length;i++){const t=i/rate,x=(Math.sin(t*440*Math.PI*2)+Math.sin(t*659*Math.PI*2)*.5)*Math.exp(-t*7)*.18;v.setInt16(44+i*2,x*32767,true);}const url=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));seal=new Howl({src:[url],format:['wav'],volume:.35,onload:()=>URL.revokeObjectURL(url),onloaderror:()=>URL.revokeObjectURL(url)});}
 seal.play();
}
