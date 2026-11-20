'use client';
import {useState,type ReactNode} from 'react';
import {ChevronLeft, ChevronRight, ScanLine} from 'lucide-react';
import SceneStage from './SceneStage';
import '../artifact-depth.css';

function InspectionTable({children}:{children:ReactNode}){
 const [angle,setAngle]=useState<'left'|'front'|'right'>('front');
 return <>
  <div className="artifact-depth-table" data-angle={angle}>
   <div className="artifact-depth-camera">
    <div className="artifact-depth-cage" aria-hidden="true">
     <div className="artifact-depth-ring artifact-depth-ring-near"/>
     <div className="artifact-depth-ring artifact-depth-ring-far"/>
     <div className="artifact-depth-deck"><span/><span/><span/></div>
    </div>
    <div className="artifact-scene-object" data-scene-plane="subject">{children}</div>
   </div>
  </div>
  <div className="artifact-depth-controls" role="group" aria-label="Exhibit viewing angle">
   <button type="button" aria-label="View from the left" aria-pressed={angle==='left'} onClick={()=>setAngle('left')}><ChevronLeft size={19}/></button>
   <button type="button" aria-label="Front view" aria-pressed={angle==='front'} onClick={()=>setAngle('front')}><ScanLine size={18}/></button>
   <button type="button" aria-label="View from the right" aria-pressed={angle==='right'} onClick={()=>setAngle('right')}><ChevronRight size={19}/></button>
  </div>
 </>;
}
/** Geometric display furniture around the original 2D plate, never a fake 3D model. */
export default function ArtifactStage({category,identity,children,inspect=false}:{category:string;identity:string;children:ReactNode;inspect?:boolean}){
 const family=['botanical','creature','entity'].includes(category)?'living':['phenomenon','complex'].includes(category)?'domain':['device','armament','royal-guard'].includes(category)?'crafted':'mineral';
 return <SceneStage identity={identity} kind="artifact" className={'artifact-scene artifact-'+family+(inspect?' is-inspect':'')}>
  <div className="artifact-scene-atmosphere" data-scene-plane="environment" aria-hidden="true"/>
  <svg className="artifact-scene-aperture" data-scene-plane="aperture" viewBox="0 0 600 600" aria-hidden="true" fill="none"><circle cx="300" cy="300" r="246"/><circle cx="300" cy="300" r="220"/><path d="M300 32v48m268 220h-48M300 568v-48M32 300h48"/><path className="artifact-orbit" d="M88 88l424 424M512 88L88 512"/></svg>
  {inspect
   ? <InspectionTable key={identity}>{children}</InspectionTable>
   : <><div className="artifact-scene-object" data-scene-plane="subject">{children}</div><div className="artifact-scene-floor" aria-hidden="true"/></>}
 </SceneStage>;
}
