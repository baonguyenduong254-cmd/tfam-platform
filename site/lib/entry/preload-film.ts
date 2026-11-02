/** Resolve only after EOF, rejecting truncated transfers before exposing a video URL. */
export async function downloadFilm(response:Response,onProgress:(percent:number|null)=>void){
 if(!response.ok||!response.body)throw new Error('Intro unavailable');
 const total=Number(response.headers.get('Content-Length'))||0,reader=response.body.getReader(),chunks:BlobPart[]=[];let received=0,lastPercent=-1;
 onProgress(total?0:null);
 while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.byteLength;const percent=total?Math.min(99,Math.floor(received/total*100)):-1;if(percent!==lastPercent){lastPercent=percent;onProgress(percent<0?null:percent);}}
 if(!received||(total&&received!==total))throw new Error('Incomplete intro');
 const blob=new Blob(chunks,{type:'video/mp4'});onProgress(100);return blob;
}
