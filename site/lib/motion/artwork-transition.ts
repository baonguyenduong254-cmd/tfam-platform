import {flushSync} from 'react-dom';
type Transition={skipTransition:()=>void;finished:Promise<void>};
let active:Transition|undefined,restoreActive:(()=>void)|undefined,revision=0;
/** One carried artwork. A newer intent cancels pending captures and never queues input. */
export function carryArtwork(trigger:HTMLElement|null|undefined,update:()=>void,name='tfam-carried-art',afterUpdate?:()=>void){
 const intent=++revision;active?.skipTransition();restoreActive?.();restoreActive=undefined;if(process.env.NODE_ENV!=='production')delete document.documentElement.dataset.artMotionSample;
 const start=(document as Document&{startViewTransition?:(callback:()=>void)=>Transition}).startViewTransition;
 const image=trigger?.matches('img')?trigger:trigger?.querySelector<HTMLElement>('img');
 const commit=()=>{flushSync(update);afterUpdate?.();};
 if(!start||document.hidden){commit();return;}
 const previous=image?.style.viewTransitionName||'',others=image?Array.from(document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]')).filter(el=>el!==image&&el.style.viewTransitionName===name):[];
 let restored=false;const restore=()=>{if(restored)return;restored=true;if(image)image.style.viewTransitionName=previous;others.forEach(el=>{el.style.viewTransitionName=name;});};restoreActive=restore;
 others.forEach(el=>{el.style.viewTransitionName='none';});if(image)image.style.viewTransitionName=name;
 let frame=0,last=performance.now();const began=last,samples:number[]=[];
 try{
  const transition=start.call(document,()=>{restore();if(intent===revision)commit();});active=transition;
  if(process.env.NODE_ENV!=='production'){const sample=(now:number)=>{samples.push(now-last);last=now;if(active===transition)frame=requestAnimationFrame(sample);};frame=requestAnimationFrame(sample);}
  void transition.finished.catch(()=>{}).finally(()=>{
   cancelAnimationFrame(frame);restore();if(active===transition){active=undefined;restoreActive=undefined;}
   if(process.env.NODE_ENV!=='production'&&intent===revision)document.documentElement.dataset.artMotionSample=JSON.stringify({name,elapsedMs:Math.round(performance.now()-began),frames:samples.length,averageMs:Math.round(samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length)*100)/100,maxMs:Math.round(Math.max(0,...samples)*100)/100});
  });
 }catch{restore();restoreActive=undefined;commit();}
}
