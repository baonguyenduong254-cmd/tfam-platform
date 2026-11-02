import type {Architecture} from './campaign-cities';
type V=[number,number,number];
// Shared tabletop meshes: positions, flat normals, material-local UV, atlas quadrant.
// Houses are instanced as a whole settlement, never one DOM element per building.
export function buildCityMesh(style:Architecture,lod:number,port=false):Float32Array{
 const out:number[]=[];
 const warm=['iberian','moorish','colonial'].includes(style),wall=warm?2:0,roof=warm?3:1;
 function tri(a:V,b:V,c:V,material:number,uv=[[0,0],[1,0],[1,1]]){const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const d=Math.hypot(...n)||1;[a,b,c].forEach((p,i)=>out.push(...p,...n.map(x=>x/d),...uv[i],material));}
 function quad(a:V,b:V,c:V,d:V,m:number){tri(a,b,c,m);tri(a,c,d,m,[[0,0],[1,1],[0,1]]);}
 function box(x:number,y:number,z:number,w:number,d:number,h:number,m:number){const a:V=[x-w/2,y-d/2,z],b:V=[x+w/2,y-d/2,z],c:V=[x+w/2,y+d/2,z],e:V=[x-w/2,y+d/2,z],A:V=[a[0],a[1],z+h],B:V=[b[0],b[1],z+h],C:V=[c[0],c[1],z+h],E:V=[e[0],e[1],z+h];quad(a,b,B,A,m);quad(b,c,C,B,m);quad(c,e,E,C,m);quad(e,a,A,E,m);quad(A,B,C,E,1);}
 function gable(x:number,y:number,z:number,w:number,d:number,h:number){const a:V=[x-w/2,y-d/2,z],b:V=[x+w/2,y-d/2,z],c:V=[x+w/2,y+d/2,z],e:V=[x-w/2,y+d/2,z],t:V=[x,y-d/2,z+h],u:V=[x,y+d/2,z+h];quad(a,t,u,e,roof);quad(t,b,c,u,roof);tri(a,b,t,wall);tri(e,u,c,wall);}
 function cylinder(x:number,y:number,z:number,r:number,h:number,m:number,tip?:number){const segments=lod===0?6:12;for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;const A:V=[x+Math.cos(a)*r,y+Math.sin(a)*r,z],B:V=[x+Math.cos(b)*r,y+Math.sin(b)*r,z],C:V=[B[0],B[1],z+h],D:V=[A[0],A[1],z+h];quad(A,B,C,D,m);tri(D,C,[x,y,z+h+(tip||0)],tip?roof:1);}}
 function dome(x:number,y:number,z:number,r:number){const n=lod===0?6:12,steps=lod===0?3:5;for(let j=0;j<steps;j++)for(let i=0;i<n;i++){const point=(a:number,b:number):V=>[x+Math.cos(a)*Math.cos(b)*r,y+Math.sin(a)*Math.cos(b)*r,z+Math.sin(b)*r];const a=i/n*2*Math.PI,b=(i+1)/n*2*Math.PI,t=j/steps*Math.PI/2,u=(j+1)/steps*Math.PI/2;quad(point(a,t),point(b,t),point(b,u),point(a,u),roof);}}
 // Buildings sit directly on the terrain anchor.
 
 const ruined=style==='ruins',houses=[8,24,52][Math.max(0,Math.min(2,lod))];
 for(let i=0;i<houses;i++){const angle=i*2.399963,ring=.29+.49*Math.sqrt((i+1)/houses),x=Math.cos(angle)*ring,y=Math.sin(angle)*ring;const w=.1+(i%4)*.017,d=.13+(i%3)*.018,h=ruined?.045+(i%3)*.027:.09+(i%5)*.02;box(x,y,.025,w,d,h,wall);if(!ruined)gable(x,y,h+.025,w*1.1,d*1.1,.055);if(lod===2&&!ruined)box(x+w*.2,y,h+.055,.018,.02,.07,wall);}
 // Central landmark differs by regional architecture.
 box(0,0,.02,.35,.34,ruined?.14:.23,wall);
 if(style==='moorish'){dome(0,0,.25,.22);for(const x of [-.28,.28])cylinder(x,-.16,.025,.035,.5,wall,.055);}
 else if(style==='eastern'){gable(0,0,.25,.4,.4,.1);cylinder(0,0,.3,.075,.22,wall);dome(0,0,.52,.11);}
 else if(style==='northern'){gable(0,0,.25,.38,.4,.2);cylinder(0,-.2,.025,.055,.55,wall,.18);}
 else if(style==='iberian'||style==='colonial'){gable(0,0,.25,.4,.4,.1);for(const x of [-.17,.17]){box(x,-.2,.025,.085,.085,.44,wall);gable(x,-.2,.465,.095,.095,.08);}}
 else if(!ruined){gable(0,0,.25,.4,.4,.12);for(const x of [-.2,.2])cylinder(x,-.17,.025,.06,.48,wall,.16);}
 if(lod>0){for(const y of [-.85,.85])box(0,y,.025,1.65,.045,ruined?.055:.1,wall);for(const x of [-.85,.85])box(x,0,.025,.045,1.7,ruined?.045:.1,wall);for(const x of [-.83,.83])for(const y of [-.83,.83])cylinder(x,y,.025,.075,ruined?.09:.2,wall,ruined?0:.05);}
 if(port){box(0,1.08,.02,.8,.18,.035,0);for(const x of [-.3,0,.3]){box(x,1.25,.02,.055,.4,.03,0);if(lod>0){box(x+.1,1.42,.03,.09,.24,.055,2);box(x+.1,1.42,.08,.009,.009,.24,0);quad([x+.1,1.35,.13],[x+.1,1.49,.13],[x+.1,1.49,.29],[x+.1,1.35,.29],0);}}}
 return new Float32Array(out);
}
