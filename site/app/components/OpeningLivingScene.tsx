'use client';
import {useEffect,useRef} from 'react';
/** Only transparent particles use canvas; the master artwork remains an image layer. */
export default function OpeningLivingScene({scene='opening'}:{scene?:'opening'|'court'}){
 const surface=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=surface.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
  let frame=0,clock=0,elapsed=0,width=1,height=1;
  const resize=()=>{const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const draw=(now:number)=>{if(!clock)clock=now;elapsed+=Math.min((now-clock)/1000,.05);clock=now;ctx.clearRect(0,0,width,height);
   for(let i=0;i<64;i++){const x=((i*61+19)%997)/997*width,y=((((i*43+7)%509)/509*height-elapsed*(3+i%5))%height+height)%height;ctx.globalAlpha=.15+.36*(.5+.5*Math.sin(elapsed*.7+i));ctx.fillStyle=i%4?'#d7ebfa':'#e6b5be';ctx.beginPath();ctx.arc(x,y,.55+i%3*.35,0,Math.PI*2);ctx.fill();}
   if(scene==='opening')for(let i=0;i<4;i++){const period=8+i*2.6,t=(elapsed+i*3.2)%period;if(t>1.8)continue;const p=t/1.8,x=(.4+i*.18)*width-p*width*.32,y=(.02+i*.08)*height+p*height*.45,len=Math.min(width*.12,190);const glow=ctx.createLinearGradient(x,y,x+len,y-len*.68);glow.addColorStop(0,'#f1f9ff');glow.addColorStop(.3,'#c6ddfa9a');glow.addColorStop(1,'#c6ddfa00');ctx.globalAlpha=Math.sin(Math.PI*p)*.85;ctx.strokeStyle=glow;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len,y-len*.68);ctx.stroke();}
   ctx.globalAlpha=1;canvas.dataset.motionState='ready';canvas.dataset.frameTime=elapsed.toFixed(2);frame=requestAnimationFrame(draw);
  };
  const sync=()=>{cancelAnimationFrame(frame);clock=0;if(!document.hidden)frame=requestAnimationFrame(draw);};
  document.addEventListener('visibilitychange',sync);sync();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',sync);};
 },[scene]);
 return <div className={'opening-living-scene '+(scene==='court'?'court-living-scene':'')} aria-hidden="true"><picture key={scene}><img src={scene==='court'?'/art/update210/realm-selection-hall.webp':'/art/moonfall-duel-209-6688.jpg'} alt="" fetchPriority="high" decoding="async"/></picture><canvas ref={surface} className="opening-scene-surface"/></div>;
}
