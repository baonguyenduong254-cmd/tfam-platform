import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from '../app/chatgpt-auth';
import {digest} from './admin-auth';
import {storyDatabase} from './story-server';
import type {ReaderProfile,AccountProgress} from './accounts';
export async function accountIdentity(){const user=await getChatGPTUser();return user?digest('tfam-reader:'+user.userId):null;}
export async function findAccount(){const identity=await accountIdentity();if(!identity)return null;return storyDatabase().prepare('SELECT id,display_name AS name,avatar_id AS avatarId FROM reader_accounts WHERE identity_hash=?').bind(identity).first<ReaderProfile>();}
export const accountVisitor=(id:string)=>digest('account:'+id);
export async function accountSnapshot(profile:ReaderProfile|null,authenticated:boolean,csrf:string){
 const rows=profile?await storyDatabase().prepare('SELECT chapter_id,status,visited_at,checkpoint,favorite,read_later FROM reader_progress WHERE account_id=?').bind(profile.id).all<{chapter_id:string;status:AccountProgress['status'];visited_at:number;checkpoint:string|null;favorite:number;read_later:number}>():{results:[]};
 return {authenticated,profile,csrf,progress:rows.results.map(r=>({chapterId:r.chapter_id,status:r.status,visitedAt:r.visited_at,checkpoint:r.checkpoint?JSON.parse(r.checkpoint):null,favorite:!!r.favorite,readLater:!!r.read_later})),signIn:chatGPTSignInPath('/#reader'),signOut:chatGPTSignOutPath('/')};
}
export async function saveVisit(accountId:string,chapterId:string,status:string,at:number){await storyDatabase().prepare("INSERT INTO reader_progress(account_id,chapter_id,status,visited_at) VALUES (?,?,?,?) ON CONFLICT(account_id,chapter_id) DO UPDATE SET status=excluded.status,visited_at=excluded.visited_at WHERE excluded.visited_at>=reader_progress.visited_at").bind(accountId,chapterId,status,at).run();}
export async function saveCheckpoint(accountId:string,p:Record<string,unknown>){await storyDatabase().prepare('INSERT INTO reader_progress(account_id,chapter_id,checkpoint,checkpoint_at) VALUES (?,?,?,?) ON CONFLICT(account_id,chapter_id) DO UPDATE SET checkpoint=excluded.checkpoint,checkpoint_at=excluded.checkpoint_at WHERE excluded.checkpoint_at>=reader_progress.checkpoint_at').bind(accountId,p.chapterId,JSON.stringify(p),Date.parse(String(p.savedAt))).run();}
