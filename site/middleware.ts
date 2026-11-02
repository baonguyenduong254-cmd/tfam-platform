import {assetUrl} from './lib/media/asset-url';
import {NextResponse,type NextRequest} from 'next/server';
export function middleware(request:NextRequest){
 const legacy=request.nextUrl.pathname+request.nextUrl.search;
 const media=assetUrl(legacy);
 if(media!==legacy&&/^https:\/\//.test(media))return NextResponse.redirect(media,307);
 const response=NextResponse.next();
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('Referrer-Policy','no-referrer');
 response.headers.set('Content-Security-Policy',"base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com");
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.svg).*)']};
