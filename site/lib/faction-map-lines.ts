// Map-only display color: preserve each faction's hue, lift dark pigments for snow/sea.
export function factionMapColor(color:string):string{
 const hex=/^#([\da-f]{6})$/i.exec(color||'');if(!hex)return '#d5c08a';
 const n=parseInt(hex[1],16),r=(n>>16)/255,g=((n>>8)&255)/255,b=(n&255)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
 let h=0,s=d===0?0:d/(1-Math.abs(2*l-1));if(d){h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=((h*60)%360+360)%360;}
 s=s<.12?s:Math.min(.88,Math.max(.65,s));const light=Math.min(.68,Math.max(.59,l)),c=(1-Math.abs(2*light-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=light-c/2;
 const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+rgb.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');
}
export type FrontierTopology={version:2;provinceIds:string[];arcs:[number,number,number[][][]][]};
// Topology is matched, joined and simplified offline. Runtime only assigns owners/colors.
export function frontiersFromTopology(topology:FrontierTopology,owners:Record<string,string>,factions:Record<string,any>[]){
 const resolved=topology.provinceIds.map(id=>owners[id]||''),colors=new Map(factions.map(f=>[f.id,factionMapColor(f.ui_color_primary)]));
 const groups=new Map<string,{owner:string;edgeColor:string;offset:number;coordinates:number[][][]}>();
 for(const [a,b,paths]of topology.arcs){const left=resolved[a],right=b<0?'':resolved[b];if(left===right)continue;
 for(const [owner,offset]of [[left,right?-1:0],[right,left?1:0]] as [string,number][]){if(!owner)continue;const id=owner+':'+offset;let g=groups.get(id);if(!g){g={owner,edgeColor:colors.get(owner)||'#d5c08a',offset,coordinates:[]};groups.set(id,g);}for(const line of paths)g.coordinates.push(line);}}
 return {type:'FeatureCollection' as const,features:[...groups.values()].map(({coordinates,...properties})=>({type:'Feature' as const,properties,geometry:{type:'MultiLineString' as const,coordinates}}))};
}
