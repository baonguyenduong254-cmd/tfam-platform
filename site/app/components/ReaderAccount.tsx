'use client';
import MediaImage from './MediaImage';

import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {UserRound,X,LogIn,LogOut,Heart,Bookmark,RefreshCw,Check,ChevronDown,Crown,Link2} from 'lucide-react';
import {avatars,scopedReaderKey,type AccountSnapshot} from '../../lib/accounts';
import {storyIndex} from '../../lib/story';
import {chapterPath} from '../../lib/reader-state';
import {READING_HISTORY_KEY,parseReadingHistory} from '../../lib/reader-state';
import {READING_POSITION_KEY,parseReadingPosition} from '../../lib/reading-position';
import '../account.css';

type ContextValue={data:AccountSnapshot|null;ready:boolean;error:string;epoch:number;refresh:()=>Promise<void>;mutate:(body:Record<string,unknown>)=>Promise<AccountSnapshot>};
const Context=createContext<ContextValue|null>(null);
export function useReaderAccount(){const x=useContext(Context);if(!x)throw Error('Reader account provider required');return x;}

const AUTH_ERROR_MESSAGES:Record<string,string>={
 oauth_cancelled:'Sign-in was cancelled before completing verification.',
 oauth_state_invalid:'Your sign-in session expired. Please try again.',
 google_token_failed:'Could not complete Google authentication.',
 google_token_missing:'Google authentication did not return a valid session.',
 google_profile_failed:'Could not read your Google profile.',
 google_sub_missing:'Google profile verification was incomplete.',
 google_callback_error:'Google sign-in encountered a temporary error.',
 patreon_token_failed:'Could not complete Patreon authentication.',
 patreon_token_missing:'Patreon authentication did not return a valid session.',
 patreon_profile_failed:'Could not read your Patreon membership status.',
 patreon_id_missing:'Patreon profile verification was incomplete.',
 patreon_already_linked:'That Patreon account is already linked to a different reader profile.',
 patreon_callback_error:'Patreon sign-in encountered a temporary error.',
};

export function ReaderAccountProvider({children}:{children:ReactNode}){
 const [data,setData]=useState<AccountSnapshot|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[epoch,setEpoch]=useState(0);const live=useRef(data),queue=useRef<Promise<unknown>>(Promise.resolve());live.current=data;
 async function refresh(){setError('');try{const r=await fetch('/api/account',{cache:'no-store'});if(!r.ok)throw Error();let x=await r.json() as AccountSnapshot;live.current=x;if(x.profile)try{const history=parseReadingHistory(localStorage.getItem(scopedReaderKey(READING_HISTORY_KEY,x.profile.id)),storyIndex.map(c=>c.id)).filter(v=>Date.parse(v.visitedAt)>(x.progress.find(p=>p.chapterId===v.chapterId)?.visitedAt||0));const checkpoint=parseReadingPosition(localStorage.getItem(scopedReaderKey(READING_POSITION_KEY,x.profile.id)),storyIndex.map(c=>c.id)),latest=Math.max(0,...x.progress.map(p=>p.checkpoint?Date.parse(p.checkpoint.savedAt):0)),pending=checkpoint&&Date.parse(checkpoint.savedAt)>latest?checkpoint:null;if(history.length||pending){try{x=await mutate({action:'sync',history,checkpoint:pending});}catch{}}}catch{}live.current=x;setData(x);setEpoch(n=>n+1);}catch{setError('UNAVAILABLE');}finally{setReady(true);}}

 useEffect(()=>{void refresh();},[]);
 function mutate(body:Record<string,unknown>){const operation=queue.current.catch(()=>{}).then(async()=>{try{const r=await fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json','X-Reader-CSRF':live.current?.csrf||''},body:JSON.stringify(body)}),x=await r.json() as AccountSnapshot&{code?:string};if(!r.ok)throw Error(x.code||'UNAVAILABLE');live.current=x;setData(x);setError('');if(body.action==='profile'||body.action==='claim')setEpoch(n=>n+1);return x;}catch(e){setError((e as Error).message);throw e;}});queue.current=operation;return operation;}
 return <Context.Provider value={{data,ready,error,epoch,refresh,mutate}}>{children}</Context.Provider>;
}

export function AccountMenu({lang}:{lang:string}){
 const account=useReaderAccount(),profile=account.data?.profile,entitlement=account.data?.entitlement,vi=false,t=(a:string,b:string)=>b;
 const [open,setOpen]=useState(false),[name,setName]=useState(''),[avatarId,setAvatarId]=useState(avatars[0].id),[picker,setPicker]=useState(false),[query,setQuery]=useState(''),[section,setSection]=useState('profile'),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[returnTo,setReturnTo]=useState('/');const dialog=useRef<HTMLDialogElement>(null);

 useEffect(()=>{
  const show=()=>setOpen(true);
  window.addEventListener('tfam-open-account',show);
  const params=new URLSearchParams(location.search);
  const authError=params.get('auth_error');
  if(authError){
   setOpen(true);
   setNotice(AUTH_ERROR_MESSAGES[authError]||'Could not complete authentication.');
   params.delete('auth_error');
   const cleanSearch=params.toString();
   history.replaceState(null,'',location.pathname+(cleanSearch?'?'+cleanSearch:'')+location.hash);
  }
  return()=>window.removeEventListener('tfam-open-account',show);
 },[]);

 useEffect(()=>{
  if(!open)return;
  setName(profile?.name||'');
  setAvatarId(profile?.avatarId||avatars[0].id);
  setPicker(false);
  setReturnTo(location.pathname+location.search+location.hash);
  const el=dialog.current;if(!el)return;
  const prev=document.body.style.overflow;
  el.showModal();
  document.body.style.overflow='hidden';
  return()=>{el.close();document.body.style.overflow=prev;};
 },[open,profile?.id]);

 const avatar=avatars.find(a=>a.id===profile?.avatarId),selected=avatars.find(a=>a.id===avatarId)!;
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
 const filtered=avatars.filter(a=>normalize(a.name_vi+' '+a.name_en+' '+a.faction_vi+' '+a.faction_en).includes(normalize(query)));

 async function save(e:React.FormEvent){
  e.preventDefault();setBusy(true);setNotice('');
  try{await account.mutate({action:'profile',name,avatarId});setNotice(t('Đã lưu hồ sơ.','Profile saved.'));setPicker(false);}
  catch(e){const code=(e as Error).message;setNotice(code==='REGISTRATION_IP_LIMIT'?t('Địa chỉ IP này đã tạo đủ 3 hồ sơ. Chủ hồ sơ hiện có vẫn có thể đăng nhập.','This IP address has reached its 3-profile limit. Existing readers can still sign in.'):code==='REGISTRATION_IP_UNAVAILABLE'?t('Chưa xác minh được địa chỉ mạng. Vui lòng thử lại sau.','Your network address could not be verified. Please try again later.'):t('Chưa lưu được hồ sơ. Hãy tải lại kết nối rồi thử lại.','Could not save your profile. Reconnect and try again.'));}
  finally{setBusy(false);}
 }

 async function claim(){
  setBusy(true);setNotice('');
  try{const history=JSON.parse(localStorage.getItem(READING_HISTORY_KEY)||'[]'),checkpoint=JSON.parse(localStorage.getItem(READING_POSITION_KEY)||'null');await account.mutate({action:'claim',history,checkpoint});setNotice(t('Đã nhận dữ liệu từ trình duyệt này vào tài khoản.','This browser’s data has been added to your account.'));window.dispatchEvent(new Event('tfam-account-import'));}
  catch{setNotice(t('Chưa nhận được dữ liệu. Dữ liệu trên thiết bị vẫn còn nguyên.','Import failed. Your device data is still intact.'));}
  finally{setBusy(false);}
 }

 const shelf=(account.data?.progress||[]).filter(p=>section==='favorites'?p.favorite:p.readLater);
 const encodedReturn=encodeURIComponent(returnTo||'/');
 const googleHref='/api/auth/google?return_to='+encodedReturn;
 const patreonHref='/api/auth/patreon?return_to='+encodedReturn;
 const linkPatreonHref='/api/auth/patreon?mode=link&return_to='+encodedReturn;
 const logoutHref='/api/auth/logout?return_to='+encodedReturn;
 const isImperial=!!entitlement?.isImperial;
 const patreonLinked=!!entitlement?.linkedProviders.includes('patreon');

 return <>
  <button type="button" className={`reader-account-button${isImperial?' is-imperial':''}`} onClick={()=>{setNotice('');setOpen(true);}} aria-label={t('Tài khoản độc giả','Reader account')}>
   {avatar?<MediaImage src={avatar.asset} alt=""/>:<UserRound size={19}/>}
   {isImperial&&<Crown size={14} className="account-crown-badge" aria-label="Imperial Tier"/>}
   <span className="sr-only">{profile?.name||t('Tài khoản','Account')}</span>
   {account.error&&<span className="account-offline" title={t('Cần kết nối lại để đồng bộ','Reconnect to sync')}>!</span>}
  </button>

  {open&&createPortal(
   <dialog className="reader-account-dialog" ref={dialog} onCancel={e=>{e.preventDefault();setOpen(false);}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}} aria-labelledby="account-title">
    <header>
     <div>
      <span className="eyebrow">THROUGH FROST AND MYTH</span>
      <h2 id="account-title">{t('Hồ sơ độc giả','Reader profile')}</h2>
     </div>
     <button onClick={()=>setOpen(false)} aria-label={t('Đóng','Close')}><X/></button>
    </header>

    {account.error&&<div className="account-notice" role="status"><p>{t('Đồng bộ chưa hoàn tất. Dữ liệu đọc trên thiết bị vẫn được giữ.','Sync is incomplete. Your device reading data is preserved.')}</p><button onClick={()=>void account.refresh()} disabled={busy}><RefreshCw size={16}/>{t('Kết nối lại','Reconnect')}</button></div>}

    {!account.ready?<p role="status">{t('Đang mở hồ sơ…','Opening profile…')}</p>:!account.data?.authenticated?(
     <div className="account-welcome">
      <UserRound size={40}/>
      <h3>{t('Giữ lại hành trình qua băng giá','Keep your journey through the frost')}</h3>
      <p>{t('Đăng nhập để đồng bộ tiến trình đọc, lưu chương yêu thích và mở khóa quyền hội viên Hoàng triều.','Sign in to sync reading progress, save favourite chapters, and unlock your Imperial Tier membership.')}</p>
      <div className="account-oauth-actions">
       <a className="account-oauth-google" href={googleHref}><LogIn size={18}/>Continue with Google</a>
       <a className="account-oauth-patreon" href={patreonHref}><Crown size={18}/>Continue with Patreon</a>
      </div>
      {notice&&<p className="account-notice" role="status">{notice}</p>}
      <small>{t('Khách vẫn có thể đọc các chương miễn phí và khám phá thế giới.','Guests can still read free chapters and explore the world.')}</small>
     </div>
    ):(
     <>
      <section className={`account-tier-card${isImperial?' is-imperial':''}`}>
       <div className="account-tier-head">
        <span className="account-tier-pill">
         <Crown size={15}/>
         {isImperial?'Imperial Tier':'Free Reader'}
        </span>
        {isImperial&&entitlement?.provider&&(
         <small>Active via {entitlement.provider==='patreon'?'Patreon':'Direct Pass'}</small>
        )}
       </div>
       <p className="account-tier-desc">
        {isImperial
         ?'Full access to main-story NSFW chapters, side stories, uncensored art, early chapter releases, and supporter status.'
         :'Upgrade to Imperial Tier (Launch offer $9.99/mo · reg. $19.90/mo) for main-story NSFW chapters, NSFW side stories, uncensored art, and early access.'}
       </p>
       {profile&&(
        <div className="account-tier-actions">
         <a href="/subscribe">
          <Crown size={15}/>
          {isImperial?'Manage Imperial Tier':'Upgrade to Imperial ($9.99/mo)'}
         </a>
         <a href={linkPatreonHref}>
          <Link2 size={15}/>
          {patreonLinked?'Refresh Patreon membership':'Link Patreon account'}
         </a>
        </div>
       )}
      </section>

      <nav className="account-tabs">
       <button aria-pressed={section==='profile'} onClick={()=>setSection('profile')}>{t('Hồ sơ','Profile')}</button>
       <button disabled={!profile} aria-pressed={section==='favorites'} onClick={()=>setSection('favorites')}><Heart size={15}/>{t('Yêu thích','Favourites')}</button>
       <button disabled={!profile} aria-pressed={section==='later'} onClick={()=>setSection('later')}><Bookmark size={15}/>{t('Đọc sau','Read later')}</button>
      </nav>

      {section==='profile'?(
       <>
        <form onSubmit={save}>
         <div className="account-avatar-preview">
          <MediaImage src={selected.asset} alt={vi?selected.name_vi:selected.name_en}/>
          <div>
           <strong>{vi?selected.name_vi:selected.name_en}</strong>
           <button type="button" onClick={()=>setPicker(v=>!v)}>{t('Chọn chân dung nhân vật','Choose character portrait')}<ChevronDown size={15}/></button>
           <small>{t('Dùng kho ảnh TFAM có sẵn.','Uses the existing TFAM portrait collection.')}</small>
          </div>
         </div>
         {picker&&(
          <div className="account-avatar-picker">
           <label>{t('Tìm nhân vật hoặc quốc gia','Find a character or faction')}<input value={query} onChange={e=>setQuery(e.target.value)} type="search"/></label>
           <div role="group" aria-label={t('Kho chân dung','Portrait collection')}>
            {filtered.map(a=><button type="button" key={a.id} aria-pressed={avatarId===a.id} onClick={()=>{setAvatarId(a.id);setPicker(false);}}><MediaImage src={a.asset} alt="" loading="lazy" decoding="async"/><span>{vi?a.name_vi:a.name_en}</span>{avatarId===a.id&&<Check size={16}/>}</button>)}
            {!filtered.length&&<p>{t('Không tìm thấy nhân vật.','No matching characters.')}</p>}
           </div>
          </div>
         )}
         <label>{t('Tên hiển thị công khai','Public display name')}<input maxLength={60} required value={name} onChange={e=>setName(e.target.value)} autoComplete="nickname" placeholder={t('Tên hoặc bút danh','Name or pen name')}/></label>
         <small>{t('Tên này sẽ xuất hiện cùng bình luận. Email đăng nhập không hiển thị công khai.','This name appears on your comments. Your sign-in email is not public.')}</small>
         <button className="account-save" disabled={busy||!name.trim()} type="submit">{busy?t('Đang lưu…','Saving…'):profile?t('Lưu hồ sơ','Save profile'):t('Tạo hồ sơ độc giả','Create reader profile')}</button>
        </form>
        {profile&&<section className="account-import"><h3>{t('Dữ liệu đã có trên thiết bị','Existing device data')}</h3><p>{t('Nhận tiến trình khách, bình luận và phản ứng từ trình duyệt này. Tiến trình tài khoản mới hơn sẽ được giữ.','Import guest progress, comments and reactions from this browser. Newer account progress is preserved.')}</p><button disabled={busy} onClick={claim}>{t('Nhận dữ liệu vào tài khoản','Import into account')}</button></section>}
       </>
      ):(
       <div className="account-shelf">
        {shelf.map(p=>{const c=storyIndex.find(c=>c.id===p.chapterId);return c&&<a key={c.id} href={chapterPath(c.id)}><BookIcon kind={section}/><span>{vi?c.title_vi:c.title_en||c.title_vi}</span></a>;})}
        {!shelf.length&&<p>{t('Chưa có chương trong mục này. Dùng nút ở cuối chương để thêm vào.','No chapters here yet. Use the buttons at the end of a chapter to add one.')}</p>}
       </div>
      )}

      <p className="account-notice" role="status">{notice}</p>
      <a className="account-signout" href={logoutHref}><LogOut size={16}/>{t('Đăng xuất','Sign out')}</a>
     </>
    )}
   </dialog>,
   document.body
  )}
 </>;
}

function BookIcon({kind}:{kind:string}){return kind==='favorites'?<Heart size={17}/>:<Bookmark size={17}/>;}

export function AccountBookmarks({chapterId,lang}:{chapterId:string;lang:string}){
 const account=useReaderAccount(),profile=account.data?.profile,vi=false,t=(a:string,b:string)=>b,[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
 const row=account.data?.progress.find(p=>p.chapterId===chapterId);
 if(!profile)return null;
 async function toggle(kind:string,value:boolean){setBusy(true);setFailed(false);try{await account.mutate({action:'bookmark',chapterId,kind,value});}catch{setFailed(true);}finally{setBusy(false);}}
 return <div className="account-bookmarks"><button disabled={busy} aria-pressed={!!row?.favorite} onClick={()=>toggle('favorite',!row?.favorite)}><Heart size={17}/>{row?.favorite?t('Đã yêu thích','Favourited'):t('Yêu thích','Favourite')}</button><button disabled={busy} aria-pressed={!!row?.readLater} onClick={()=>toggle('read_later',!row?.readLater)}><Bookmark size={17}/>{row?.readLater?t('Đã lưu đọc sau','Saved for later'):t('Đọc sau','Read later')}</button>{failed&&<small role="alert">{t('Chưa lưu được. Vui lòng thử lại.','Could not save. Please try again.')}</small>}</div>;
}
