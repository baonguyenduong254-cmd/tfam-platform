import {authReply,credential,verifyPassword,throttleLogin,createSession,sameOrigin} from '../../../../lib/admin-auth';
export async function POST(req:Request){
 if(!sameOrigin(req))return authReply({error:'Yêu cầu không hợp lệ.'},403);
 try{
  if(req.headers.get('content-type')?.split(';')[0]!=='application/json')return authReply({error:'Yêu cầu không hợp lệ.'},400);
  if(Number(req.headers.get('content-length')||0)>2048)return authReply({error:'Yêu cầu quá lớn.'},413);
  const raw=await req.text();if(raw.length>2048)return authReply({error:'Yêu cầu quá lớn.'},413);
  let body;try{body=JSON.parse(raw);}catch{return authReply({error:'Yêu cầu không hợp lệ.'},400);}
  if(!body||typeof body!=='object'||typeof body.username!=='string'||typeof body.password!=='string'||body.username.length>100||body.password.length>256)return authReply({error:'Thông tin đăng nhập không hợp lệ.'},400);
  const denied=await throttleLogin(req);if(denied)return denied;const c=credential();
  const matches=await verifyPassword(body.password,c.hash);
  if(!matches||body.username!==c.username)return authReply({error:'Tên đăng nhập hoặc mật khẩu không đúng.'},401);
  const session=await createSession();return authReply({authenticated:true,username:c.username,csrf:session.csrf},200,{'Set-Cookie':session.cookie});
 }catch{return authReply({error:'Đăng nhập tạm thời không khả dụng.'},503);}
}
