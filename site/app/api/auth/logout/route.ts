import {authReply,sameOrigin} from '../../../../lib/admin-auth';
import {clearReaderSession,publicOrigin,safeReturnTo} from '../../../../lib/reader-auth';

export const dynamic='force-dynamic';

export async function GET(req:Request){
 const cookie=await clearReaderSession(req);
 const url=new URL(req.url);
 const returnTo=safeReturnTo(url.searchParams.get('return_to')||'/');
 const origin=publicOrigin(req);
 return new Response(null,{
  status:302,
  headers:{
   Location:new URL(returnTo,origin).toString(),
   'Set-Cookie':cookie,
   'Cache-Control':'no-store',
  },
 });
}

export async function POST(req:Request){
 if(!sameOrigin(req))return authReply({error:'Invalid origin.'},403);
 const cookie=await clearReaderSession(req);
 return authReply({ok:true},200,{'Set-Cookie':cookie});
}
