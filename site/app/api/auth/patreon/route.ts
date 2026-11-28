import {authReply} from '../../../../lib/admin-auth';
import {createOAuthState,getReaderSession,oauthEnv,publicOrigin,safeReturnTo} from '../../../../lib/reader-auth';

export const dynamic='force-dynamic';

export async function GET(req:Request){
 const env=oauthEnv();
 const clientId=env.PATREON_OAUTH_CLIENT_ID?.trim();
 const clientSecret=env.PATREON_OAUTH_CLIENT_SECRET?.trim();
 if(!clientId||!clientSecret){
  return authReply({code:'OAUTH_NOT_CONFIGURED',provider:'patreon',error:'Patreon OAuth is not configured yet.'},503);
 }
 const url=new URL(req.url);
 const returnTo=safeReturnTo(url.searchParams.get('return_to'));
 const mode=url.searchParams.get('mode');
 try{
  const session=mode==='link'?await getReaderSession(req):null;
  const linkAccountId=mode==='link'&&session?.accountId?session.accountId:null;
  const state=await createOAuthState('patreon',returnTo,linkAccountId);
  const authUrl=new URL('https://www.patreon.com/oauth2/authorize');
  authUrl.searchParams.set('response_type','code');
  authUrl.searchParams.set('client_id',clientId);
  authUrl.searchParams.set('redirect_uri',`${publicOrigin(req)}/api/auth/patreon/callback`);
  authUrl.searchParams.set('scope','identity identity[email] identity.memberships');
  authUrl.searchParams.set('state',state);
  return Response.redirect(authUrl.toString(),302);
 }catch(e){
  console.error('Patreon OAuth start failed',e);
  return authReply({code:'UNAVAILABLE',error:'Could not start Patreon sign-in.'},503);
 }
}
