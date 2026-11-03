export type MotionChoice='system'|'full'|'reduced';
const KEY='tfam-motion-preference-v1',EVENT='tfam-motion-preference';
let query:MediaQueryList|undefined,override:MotionChoice|undefined;
const listeners=new Map<(event:MediaQueryListEvent)=>void,()=>void>();
function preference(){return typeof window==='undefined'?undefined:(query??=window.matchMedia('(prefers-reduced-motion: reduce)'));}
function choice():MotionChoice{if(override)return override;if(typeof window==='undefined')return 'system';try{const value=localStorage.getItem(KEY);return value==='full'||value==='reduced'?value:'system';}catch{return 'system';}}
/** Device preference is the default; an explicit in-app choice belongs to the reader. */
export const motionPreference={
 get choice(){return choice();},
 get matches(){const value=choice();return value==='reduced'||value==='system'&&(preference()?.matches??false);},
 choose(value:MotionChoice){if(typeof window==='undefined')return;override=value;try{localStorage.setItem(KEY,value);}catch{}document.documentElement.dataset.tfamMotion=value;window.dispatchEvent(new Event(EVENT));},
 addEventListener(_type:string,listener:(event:MediaQueryListEvent)=>void){if(typeof window==='undefined'||listeners.has(listener))return;const notify=()=>{document.documentElement.dataset.tfamMotion=choice();listener({matches:motionPreference.matches,media:'(prefers-reduced-motion: reduce)'} as MediaQueryListEvent);};listeners.set(listener,notify);preference()?.addEventListener('change',notify);window.addEventListener(EVENT,notify);},
 removeEventListener(_type:string,listener:(event:MediaQueryListEvent)=>void){const notify=listeners.get(listener);if(!notify)return;preference()?.removeEventListener('change',notify);if(typeof window!=='undefined')window.removeEventListener(EVENT,notify);listeners.delete(listener);}
};
