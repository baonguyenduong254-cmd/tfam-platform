import {authReply} from '../../../lib/admin-auth';
import {storyDatabase} from '../../../lib/story-server';
export async function GET(){try{
 const rows=await storyDatabase().prepare('SELECT chapter_id,SUM(views) AS views FROM chapter_visits GROUP BY chapter_id').all<{chapter_id:string;views:number}>();
 const chapters=Object.fromEntries(rows.results.map(r=>[r.chapter_id,r.views]));
 return authReply({chapters,total:rows.results.reduce((sum,r)=>sum+r.views,0)});
 }catch(e){console.error('Reading totals failed',e);return authReply({code:'UNAVAILABLE'},503);}}
