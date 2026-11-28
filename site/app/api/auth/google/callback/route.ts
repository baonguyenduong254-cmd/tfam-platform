import {authReply} from '../../../../../lib/admin-auth';
import {registrationIp} from '../../../../../lib/engagement-server';
import {consumeOAuthState,createReaderSession,isSecureOrigin,oauthEnv,publicOrigin,upsertOAuthLogin} from '../../../../../lib/reader-auth';

export const dynamic='force-dynamic';

function redirectWithError(origin:string,returnTo:string,code:string){
 const target=new URL(returnTo,origin);
 target.searchParams.set('auth_error',code);
 return Response.redirect(target.toString(),302);
}

export async function GET(req:Request){
 const origin=publicOrigin(req);
 const url=new URL(req.url);
 const errorParam=url.searchParams.get('error');
 const code=url.searchParams.get('code')||'';
 const state=url.searchParams.get('state')||'';

 const stateData=state?await consumeOAuthState(state,'google').catch(()=>null):null;
 const returnTo=stateData?.returnTo||'/#reader';
 if(errorParam||!code||!stateData){
  return redirectWithError(origin,returnTo,errorParam?'oauth_cancelled':'oauth_state_invalid');
 }

 const env=oauthEnv();
 const clientId=env.GOOGLE_OAUTH_CLIENT_ID?.trim();
 const clientSecret=env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
 if(!clientId||!clientSecret){
  return authReply({code:'OAUTH_NOT_CONFIGURED',provider:'google'},503);
 }

 try{
  const tokenRes=await fetch('https://oauth2.googleapis.com/token',{
   method:'POST',
   headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({
    code,
    client_id:clientId,
    client_secret:clientSecret,
    redirect_uri:`${origin}/api/auth/google/callback`,
    grant_type:'authorization_code',
   }),
  });
  if(!tokenRes.ok){
   console.error('Google token exchange failed',tokenRes.status);
   return redirectWithError(origin,returnTo,'google_token_failed');
  }
  const tokens=await tokenRes.json() as {access_token?:string};
  if(!tokens.access_token){
   return redirectWithError(origin,returnTo,'google_token_missing');
  }

  const profileRes=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{
   headers:{Authorization:`Bearer ${tokens.access_token}`},
  });
  if(!profileRes.ok){
   console.error('Google userinfo failed',profileRes.status);
   return redirectWithError(origin,returnTo,'google_profile_failed');
  }
  const user=await profileRes.json() as {sub?:string;email?:string;name?:string};
  if(!user.sub){
   return redirectWithError(origin,returnTo,'google_sub_missing');
  }

  const login=await upsertOAuthLogin({
   provider:'google',
   providerUserId:user.sub,
   email:user.email||null,
   displayName:user.name||null,
   linkAccountId:null,
   registrationIpHash:registrationIp(req),
  });

  const cookie=await createReaderSession({
   identityHash:login.identityHash,
   accountId:login.accountId,
   provider:'google',
   email:user.email||null,
   secure:isSecureOrigin(origin),
  });

  return new Response(null,{
   status:302,
   headers:{
    Location:new URL(returnTo,origin).toString(),
    'Set-Cookie':cookie,
    'Cache-Control':'no-store',
   },
  });
 }catch(e){
  console.error('Google OAuth callback error',e);
  return redirectWithError(origin,returnTo,'google_callback_error');
 }
}
