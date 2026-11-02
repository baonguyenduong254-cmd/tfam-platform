// Offline only: shared-edge matching and line simplification never run in visitors' tabs.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';import vm from 'node:vm';import ts from 'typescript';
const box={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/terrain-map.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:box.exports});
const provinces=JSON.parse(fs.readFileSync('public/provinces.json')).features,edges=new Map(),key=p=>p.join(',');
for(let index=0;index<provinces.length;index++)for(const polygon of box.exports.provinceGeometry(provinces[index]).geometry.coordinates)for(const ring of polygon)for(let i=1;i<ring.length;i++){
 const a=ring[i-1].map(v=>Math.round(v*1200)),b=ring[i].map(v=>Math.round(v*1200)),ka=key(a),kb=key(b);if(ka===kb)continue;const id=ka<kb?ka+'|'+kb:kb+'|'+ka;let edge=edges.get(id);if(!edge){edge={a,b,owners:[]};edges.set(id,edge);}if(!edge.owners.includes(index))edge.owners.push(index);
}
// Rounded independently segmented paths need geometric neighbour matching.
const unmatched=[...edges.values()].filter(e=>e.owners.length===1),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'tfam-frontiers-'));
try{fs.writeFileSync(path.join(temporary,'edges.json'),JSON.stringify(unmatched.map(e=>[e.owners[0],e.a,e.b])));execFileSync('python',['scripts/match-frontier-neighbours.py',path.join(temporary,'edges.json'),path.join(temporary,'matches.json')],{stdio:'inherit'});for(const [index,neighbour]of JSON.parse(fs.readFileSync(path.join(temporary,'matches.json')))){unmatched[index].owners.push(neighbour);}}
finally{fs.rmSync(temporary,{recursive:true,force:true});}
const groups=new Map();for(const edge of edges.values()){edge.owners.sort((a,b)=>a-b);const id=edge.owners.join(':');if(!groups.has(id))groups.set(id,{owners:edge.owners,edges:[]});groups.get(id).edges.push([edge.a,edge.b]);}
function simplify(points,tolerance=10){if(points.length<4)return points;const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;const stack=[[0,points.length-1]],tol=tolerance*tolerance;
 while(stack.length){const [a,b]=stack.pop(),p=points[a],q=points[b],dx=q[0]-p[0],dy=q[1]-p[1],den=dx*dx+dy*dy;let max=tol,pick=-1;for(let i=a+1;i<b;i++){const v=points[i],t=den?Math.max(0,Math.min(1,((v[0]-p[0])*dx+(v[1]-p[1])*dy)/den)):0,ex=v[0]-p[0]-t*dx,ey=v[1]-p[1]-t*dy,d=ex*ex+ey*ey;if(d>max){max=d;pick=i;}}if(pick>=0){keep[pick]=1;stack.push([a,pick],[pick,b]);}}
 return points.filter((_,i)=>keep[i]);}
const arcs=[];let rawPoints=0,points=0;
for(const group of groups.values()){const links=new Map(),used=new Uint8Array(group.edges.length);group.edges.forEach(([a,b],i)=>{for(const p of [a,b]){const k=key(p);if(!links.has(k))links.set(k,[]);links.get(k).push(i);}});const paths=[];
 function walk(start,index){const path=[start];let p=start;while(index!==undefined&&!used[index]){used[index]=1;const [a,b]=group.edges[index];p=key(a)===key(p)?b:a;path.push(p);const next=links.get(key(p));if(next.length!==2)break;index=next.find(i=>!used[i]);}rawPoints+=path.length;const line=simplify(path).map(p=>p.map(v=>+((v/1200).toFixed(5))));points+=line.length;if(line.length>=2)paths.push(line);}
 for(const [k,indices]of links)if(indices.length!==2)for(const i of indices)if(!used[i]){const [a,b]=group.edges[i];walk(key(a)===k?a:b,i);}
 group.edges.forEach(([a],i)=>{if(!used[i])walk(a,i);});arcs.push([group.owners[0],group.owners[1]??-1,paths]);
}
const data={version:2,provinceIds:provinces.map(p=>p.id),arcs};fs.writeFileSync('public/map-art/faction-topology-v2.json',JSON.stringify(data));console.log(JSON.stringify({provinces:provinces.length,arcs:arcs.length,rawPoints,points,bytes:fs.statSync('public/map-art/faction-topology-v2.json').size}));
