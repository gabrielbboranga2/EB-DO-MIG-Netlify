import{NextResponse}from'next/server';
import{base64url,getAppOrigin,secureCookie}from'@/lib/auth';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const clientId=process.env.ROBLOX_CLIENT_ID?.trim();
  const origin=getAppOrigin(request.url);
  if(!clientId||!origin){
    const fallback=new URL(request.url).origin;
    return NextResponse.redirect(`${fallback}/?login=config`);
  }

  const state=crypto.randomUUID();
  const verifier=base64url(crypto.getRandomValues(new Uint8Array(48)));
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
  const redirectUri=`${origin}/api/auth/roblox/callback`;
  const params=new URLSearchParams({
    client_id:clientId,
    redirect_uri:redirectUri,
    scope:'openid profile',
    response_type:'code',
    state,
    code_challenge:base64url(new Uint8Array(digest)),
    code_challenge_method:'S256',
  });

  const response=NextResponse.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`);
  response.headers.set('cache-control','no-store');
  response.cookies.set('rbx_oauth',`${state}.${verifier}`,{
    httpOnly:true,
    secure:secureCookie(origin),
    sameSite:'lax',
    maxAge:600,
    path:'/',
  });
  return response;
}
