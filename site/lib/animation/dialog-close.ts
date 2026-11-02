const pending=new WeakSet<HTMLDialogElement>();
/** Keep the existing dialog mounted for its CSS exit, then run its normal close. */
export function closeDialog(dialog:HTMLDialogElement|null,close:()=>void){
 if(!dialog||!dialog.open||typeof matchMedia==='undefined'||document.documentElement.dataset.motion==='off'){close();return;}
 if(pending.has(dialog))return;pending.add(dialog);dialog.dataset.motionClosing='true';
 let finished=false;let timer:ReturnType<typeof setTimeout>;
 const done=()=>{if(finished)return;finished=true;clearTimeout(timer);dialog.removeEventListener('animationend',end);pending.delete(dialog);delete dialog.dataset.motionClosing;if(dialog.isConnected)close();};
 const end=(event:AnimationEvent)=>{if(event.target===dialog&&event.animationName==='tfam-dialog-leave')done();};
 dialog.addEventListener('animationend',end);timer=setTimeout(done,260);
}
