import {authReply} from '../../../../../lib/admin-auth';
import {registrationIp} from '../../../../../lib/engagement-server';
import {consumeOAuthState,createReaderSession,isSecureOrigin,oauthEnv,parsePatreonMembership,publicOrigin,upsertOAuthLogin} from '../../../../../lib/reader-auth';

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

 const stateData=state?await consumeOAuthState(state,'patreon').catch(()=>null):null;
 const returnTo=stateData?.returnTo||'/#reader';
 if(errorParam||!code||!stateData){
  return redirectWithError(origin,returnTo,errorParam?'oauth_cancelled':'oauth_state_invalid');
 }

 const env=oauthEnv();
 const clientId=env.PATREON_OAUTH_CLIENT_ID?.trim();
 const clientSecret=env.PATREON_OAUTH_CLIENT_SECRET?.trim();
 if(!clientId||!clientSecret){
  return authReply({code:'OAUTH_NOT_CONFIGURED',provider:'patreon'},503);
 }

 try{
  const tokenRes=await fetch('https://www.patreon.com/api/oauth2/token',{
   method:'POST',
   headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({
    code,
    grant_type:'authorization_code',
    client_id:clientId,
    client_secret:clientSecret,
    redirect_uri:`${origin}/api/auth/patreon/callback`,
   }),
  });
  if(!tokenRes.ok){
   console.error('Patreon token exchange failed',tokenRes.status);
   return redirectWithError(origin,returnTo,'patreon_token_failed');
  }
  const tokens=await tokenRes.json() as {access_token?:string};
  if(!tokens.access_token){
   return redirectWithError(origin,returnTo,'patreon_token_missing');
  }

  const identityUrl=new URL('https://www.patreon.com/api/oauth2/v2/identity');
  identityUrl.searchParams.set('include','memberships,memberships.currently_entitled_tiers,memberships.campaign');
  identityUrl.searchParams.set('fields[user]','email,full_name,vanity');
  identityUrl.searchParams.set('fields[member]','patron_status,currently_entitled_amount_cents,next_charge_date');
  identityUrl.searchParams.set('fields[tier]','title,amount_cents');

  const identityRes=await fetch(identityUrl.toString(),{
   headers:{Authorization:`Bearer ${tokens.access_token}`},
  });
  if(!identityRes.ok){
   console.error('Patreon identity failed',identityRes.status);
   return redirectWithError(origin,returnTo,'patreon_profile_failed');
  }
  const payload=await identityRes.json() as {
   data?:{id?:string;attributes?:{email?:string;full_name?:string;vanity?:string}};
  };
  const patreonId=String(payload.data?.id||'');
  if(!patreonId){
   return redirectWithError(origin,returnTo,'patreon_id_missing');
  }

  const email=payload.data?.attributes?.email||null;
  const displayName=payload.data?.attributes?.full_name||payload.data?.attributes?.vanity||null;
  const membership=parsePatreonMembership(payload as unknown as Record<string,unknown>);

  const login=await upsertOAuthLogin({
   provider:'patreon',
   providerUserId:patreonId,
   email,
   displayName,
   linkAccountId:stateData.linkAccountId,
   registrationIpHash:registrationIp(req),
   patreonMembership:membership,
  });

  if(login.linkConflict){
   return redirectWithError(origin,returnTo,'patreon_already_linked');
  }

  if(stateData.linkAccountId){
   return Response.redirect(new URL(returnTo,origin).toString(),302);
  }

  const cookie=await createReaderSession({
   identityHash:login.identityHash,
   accountId:login.accountId,
   provider:'patreon',
   email,
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
  console.error('Patreon OAuth callback error',e);
  return redirectWithError(origin,returnTo,'patreon_callback_error');
 }
}
