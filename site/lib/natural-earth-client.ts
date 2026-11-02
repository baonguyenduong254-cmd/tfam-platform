let worker:Worker|null=null,sequence=0;
const pending=new Map<number,{resolve:(url:string)=>void;reject:(e:Error)=>void}>();
export function naturalEarthBlob(path:string):Promise<string>{
 if(!worker){worker=new Worker('/map-runtime/natural-earth-loader.mjs',{type:'module'});worker.onmessage=({data})=>{const task=pending.get(data.id);if(!task)return;pending.delete(data.id);if(data.error)task.reject(Error(data.error));else task.resolve(data.url);};worker.onerror=()=>{for(const task of pending.values())task.reject(Error('Natural Earth decoder unavailable'));pending.clear();worker?.terminate();worker=null;};}
 return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});worker!.postMessage({id,url:new URL(path,location.origin).href});});
}
export async function naturalEarthJSON<T>(path:string):Promise<T>{const r=await fetch(path);if(!r.ok||!r.body)throw Error('Natural Earth source unavailable');return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json() as Promise<T>;}
