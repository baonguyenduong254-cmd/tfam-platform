// Same-origin, bounded proxy for public Mapzen elevation tiles. No API key.
export async function GET(_request:Request,{params}:{params:Promise<{z:string;x:string;y:string}>}){
 const p=await params;const z=Number(p.z),x=Number(p.x),y=Number(p.y.replace(/\.png$/,''));
 if(!/^\d+$/.test(p.z)||!/^\d+$/.test(p.x)||!/^\d+(\.png)?$/.test(p.y)||![z,x,y].every(Number.isInteger)||z<0||z>14||x<0||y<0||x>=2**z||y>=2**z)return new Response('Invalid tile',{status:400});
 try{const response=await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,{signal:AbortSignal.timeout(15000),cf:{cacheTtl:604800,cacheEverything:true}} as RequestInit);
 if(!response.ok)return new Response('Elevation unavailable',{status:502,headers:{'Cache-Control':'no-store'}});
 return new Response(response.body,{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=604800, stale-while-revalidate=86400','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Elevation unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
