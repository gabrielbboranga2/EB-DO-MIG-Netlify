import {NextResponse} from 'next/server';

export async function GET(request:Request){
  const clientId=process.env.ROBLOX_CLIENT_ID;
  if(!clientId)return NextResponse.json({error:'Login Roblox ainda não configurado.'},{status:503});
  const origin=new URL(request.url).origin;
  const state=crypto.randomUUID();
  const verifier=base64url(crypto.getRandomValues(new Uint8Array(48)));
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
  const params=new URLSearchParams({client_id:clientId,redirect_uri:`${origin}/api/auth/roblox/callback`,scope:'openid profile',response_type:'code',state,code_challenge:base64url(new Uint8Array(digest)),code_challenge_method:'S256'});
  const response=NextResponse.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params}`);
  response.cookies.set('rbx_oauth',`${state}.${verifier}`,{httpOnly:true,secure:true,sameSite:'lax',maxAge:600,path:'/'});
  return response;
}
function base64url(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
