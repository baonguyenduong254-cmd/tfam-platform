'use client';
import {Component,useEffect,useMemo,useRef,type ReactNode} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import * as THREE from 'three';
class SafeScene extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?null:this.props.children;}
}
function Relic({variant}:{variant:string}){
 const cursor=useRef({x:0,y:0});useEffect(()=>{const move=(e:PointerEvent)=>{cursor.current={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5};};window.addEventListener('pointermove',move,{passive:true});return()=>window.removeEventListener('pointermove',move);},[]);
 const group=useRef<THREE.Group>(null);const particles=useMemo(()=>{const p=new Float32Array(210);for(let i=0;i<70;i++){p[i*3]=Math.sin(i*19.3)*4;p[i*3+1]=Math.cos(i*7.1)*2.8;p[i*3+2]=Math.sin(i*4.3)*2;}return p;},[]);
 useFrame(({clock},delta)=>{const g=group.current;if(!g)return;const t=clock.elapsedTime;g.rotation.y+=Math.min(delta,.05)*.065;g.rotation.x=THREE.MathUtils.damp(g.rotation.x,cursor.current.y*.16,3,delta);g.rotation.z=THREE.MathUtils.damp(g.rotation.z,-.12+cursor.current.x*.1,3,delta);g.position.y=Math.sin(t*.3)*.07;});
 return <group ref={group} rotation={[.15,.2,-.12]}>
  <mesh><icosahedronGeometry args={[1.05,1]}/><meshPhysicalMaterial color={variant==='archive'?'#c9dccb':'#a9cddb'} metalness={.12} roughness={.22} clearcoat={1} transparent opacity={.8} flatShading/></mesh>
  <mesh scale={1.012}><icosahedronGeometry args={[1.05,1]}/><meshBasicMaterial color="#e1e9d8" wireframe transparent opacity={.22}/></mesh>
  {[0,1,2].map(i=><group key={i} rotation={[i*.7,.5+i*.8,.3]}><mesh><torusGeometry args={[1.48+i*.15,.012,8,100]}/><meshStandardMaterial color="#bda16c" metalness={.8} roughness={.32}/></mesh><mesh position={[1.48+i*.15,0,0]}><sphereGeometry args={[.045,12,12]}/><meshStandardMaterial color="#ead7a1" emissive="#c5a566" emissiveIntensity={.35}/></mesh></group>)}
  {variant==='reader'&&<group position={[0,-1.6,.1]} rotation={[-.35,0,0]}>{[-1,1].map(side=><mesh key={side} position={[side*.55,0,0]} rotation={[0,0,side*.13]}><boxGeometry args={[1.07,.09,.9]}/><meshStandardMaterial color="#ddcfaf" roughness={.95}/></mesh>)}<mesh position={[0,-.12,0]}><boxGeometry args={[2.28,.08,1.05]}/><meshStandardMaterial color="#334748" metalness={.1} roughness={.8}/></mesh></group>}
  <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[particles,3]}/></bufferGeometry><pointsMaterial color="#b3cdd3" size={.018} transparent opacity={.45} depthWrite={false}/></points>
 </group>;
}
export default function AtmosphereCanvas({variant,onFailure}:{variant:string;onFailure:()=>void}){
 return <SafeScene onFailure={onFailure}><Canvas camera={{position:[0,0,6.3],fov:43}} dpr={[1,1.25]} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} onCreated={({gl})=>{gl.domElement.addEventListener('webglcontextlost',onFailure,{once:true});}} fallback={null}><ambientLight intensity={1.2}/><directionalLight position={[3,4,5]} color="#e9d7b3" intensity={2.4}/><pointLight position={[-3,1,1]} color="#7ba4bf" intensity={5}/><Relic variant={variant}/></Canvas></SafeScene>;
}
