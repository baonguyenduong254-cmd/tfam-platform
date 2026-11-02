import {authorizeWrite,authReply,endSession} from '../../../../lib/admin-auth';
export async function POST(req:Request){try{const denied=await authorizeWrite(req);if(denied)return denied;return authReply({authenticated:false},200,{'Set-Cookie':await endSession(req)});}catch{return authReply({error:'Không thể đăng xuất lúc này.'},503);}}
