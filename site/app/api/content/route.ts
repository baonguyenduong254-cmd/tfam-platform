import { withCharacterPortraits } from '../../../lib/character-portraits';
import { env } from 'cloudflare:workers';
import seed from '../../../lib/seed.json';
import { upgradeAtlas } from '../../../lib/atlas-upgrade';
import { authorizeWrite } from '../../../lib/admin-auth';
export async function GET(){
 try{
  const db=env.DB!;
  let row=await db.prepare('SELECT body, revision FROM content WHERE id = ?').bind('atlas').first<{body:string;revision:number}>();
  if(!row)return Response.json({data:withCharacterPortraits(upgradeAtlas(seed)),revision:0},{headers:{'Cache-Control':'no-store'}});
  let data=JSON.parse(row.body);
  if((data.atlasRevision||0)<25){
   const upgraded=upgradeAtlas(data);
   const update=await db.prepare('UPDATE content SET body=?, revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(upgraded),'atlas',row.revision).run();
   if(update.meta.changes){data=upgraded;row.revision+=1;}
   else{row=await db.prepare('SELECT body, revision FROM content WHERE id = ?').bind('atlas').first<{body:string;revision:number}>();if(!row)throw Error('Content disappeared');data=JSON.parse(row.body);}
  }
  return Response.json({data:withCharacterPortraits(data),revision:row.revision},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Không thể tải dữ liệu đã lưu.'},{status:503});}
}
export async function PUT(req:Request){try{const denied=await authorizeWrite(req);if(denied)return denied;}catch{return Response.json({error:'Không thể kiểm tra quyền quản trị.'},{status:503});}try{const raw=await req.text();if(raw.length>2000000)return Response.json({error:'Dữ liệu quá lớn.'},{status:413});const {data,revision}=JSON.parse(raw);if(!Number.isInteger(revision)||!['factions','characters','units','timeline','chapters'].every(k=>Array.isArray(data?.[k]))||!data.territories)return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400});await env.DB!.prepare('INSERT OR IGNORE INTO content (id,body,revision) VALUES (?,?,?)').bind('atlas',JSON.stringify(seed),0).run();const r=await env.DB!.prepare('UPDATE content SET body=?, revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(data),'atlas',revision).run();if(!r.meta.changes)return Response.json({error:'Dữ liệu đã đổi ở cửa sổ khác. Tải lại trước khi sửa tiếp.'},{status:409});return Response.json({revision:revision+1});}catch(e){console.error(e);return Response.json({error:'Không lưu được. Nội dung chỉnh sửa vẫn được giữ trên màn hình.'},{status:503});}}
