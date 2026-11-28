import {authReply} from '../../../../lib/admin-auth';
import {createOAuthState,oauthEnv,publicOrigin,safeReturnTo} from '../../../../lib/reader-auth';

export const dynamic='force-dynamic';

export async function GET(req:Request){
 const env=oauthEnv();
 const clientId=env.GOOGLE_OAUTH_CLIENT_ID?.trim();
 const clientSecret=env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
 if(!clientId||!clientSecret){
  return authReply({code:'OAUTH_NOT_CONFIGURED',provider:'google',error:'Google OAuth is not configured yet.'},503);
 }
 const url=new URL(req.url);
 const returnTo=safeReturnTo(url.searchParams.get('return_to'));
 try{
  const state=await createOAuthState('google',returnTo,null);
  const authUrl=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id',clientId);
  authUrl.searchParams.set('redirect_uri',`${publicOrigin(req)}/api/auth/google/callback`);
  authUrl.searchParams.set('response_type','code');
  authUrl.searchParams.set('scope','openid email profile');
  authUrl.searchParams.set('state',state);
  authUrl.searchParams.set('prompt','select_account');
  return Response.redirect(authUrl.toString(),302);
 }catch(e){
  console.error('Google OAuth start failed',e);
  return authReply({code:'UNAVAILABLE',error:'Could not start Google sign-in.'},503);
 }
}
