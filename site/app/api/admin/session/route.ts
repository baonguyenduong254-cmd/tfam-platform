import {adminSession,authReply} from '../../../../lib/admin-auth';
export async function GET(req:Request){try{const session=await adminSession(req);return authReply(session?{authenticated:true,username:session.username,csrf:session.csrf}:{authenticated:false});}catch{return authReply({authenticated:false,error:'Không thể kiểm tra phiên đăng nhập.'},503);}}
