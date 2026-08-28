import{NextResponse}from'next/server';
import{encodeSession,getAppOrigin,readCookie,secureCookie,sign}from'@/lib/auth';
import{getPatenteByRoleId,canAdmin,isAltoComando}from'@/lib/patentes';
import{getUserGroupMemberships}from'@/lib/roblox';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const requestUrl=new URL(request.url);
  const origin=getAppOrigin(request.url);
  if(!origin)return NextResponse.redirect(`${requestUrl.origin}/?login=config`);

  if(requestUrl.searchParams.get('error'))return redirectError(origin,'cancelled');
  const code=requestUrl.searchParams.get('code');
  const state=requestUrl.searchParams.get('state');
  const oauth=readCookie(request.headers.get('cookie')||'','rbx_oauth');
  if(!code||!state||!oauth||oauth.split('.')[0]!==state)return redirectError(origin,'invalid');

  const verifier=oauth.slice(oauth.indexOf('.')+1);
  const clientId=process.env.ROBLOX_CLIENT_ID?.trim();
  const clientSecret=process.env.ROBLOX_CLIENT_SECRET?.trim();
  const sessionSecret=process.env.SESSION_SECRET?.trim();
  if(!clientId||!clientSecret||!sessionSecret||!process.env.ROBLOX_API_KEY?.trim())return redirectError(origin,'config');

  const redirectUri=`${origin}/api/auth/roblox/callback`;
  try{
    const tokenResponse=await fetch('https://apis.roblox.com/oauth/v1/token',{
      method:'POST',
      headers:{
        'content-type':'application/x-www-form-urlencoded',
        authorization:`Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body:new URLSearchParams({
        grant_type:'authorization_code',
        code,
        code_verifier:verifier,
        redirect_uri:redirectUri,
      }),
      cache:'no-store',
    });
    if(!tokenResponse.ok)return redirectError(origin,'token');
    const tokens=await tokenResponse.json()as{access_token?:string};
    if(!tokens.access_token)return redirectError(origin,'token');

    const profileResponse=await fetch('https://apis.roblox.com/oauth/v1/userinfo',{
      headers:{authorization:`Bearer ${tokens.access_token}`},
      cache:'no-store',
    });
    if(!profileResponse.ok)return redirectError(origin,'profile');
    const profile=await profileResponse.json()as{sub?:string;preferred_username?:string;name?:string;picture?:string};
    if(!profile.sub)return redirectError(origin,'profile');

    const memberships=await getUserGroupMemberships(profile.sub);
    const main=memberships.find(membership=>membership.groupId===521106467);
    if(!main)return redirectError(origin,'nogroup');

    const patente=getPatenteByRoleId(main.roleId);
    const divisions=memberships.map(membership=>({
      id:membership.groupId,
      name:membership.sigla,
      role:membership.roleName,
      roleId:membership.roleId,
      rankNumber:membership.rankNumber,
    }));
    const primaryDivision=divisions.find(division=>division.id!==521106467);
    const isCreator=patente?.sigla==='CR'||main.rankNumber>=253;
    const payload=encodeSession({
      id:profile.sub,
      username:profile.preferred_username||profile.name||'Militar',
      avatar:profile.picture||'',
      rank:patente?`[${patente.sigla}] ${patente.nome}`:main.roleName,
      rankNumber:main.rankNumber,
      roleId:main.roleId,
      isCreator,
      isAdmin:canAdmin(main.roleId)||isCreator,
      isHighCommand:isAltoComando(main.roleId)||isCreator,
      division:primaryDivision?.name||'EXÉRCITO',
      divisions,
      cdpDias:patente?.cdpDias||0,
      exp:Date.now()+86_400_000,
    });
    const signature=await sign(payload,sessionSecret);
    const response=NextResponse.redirect(origin);
    response.headers.set('cache-control','no-store');
    response.cookies.set('eb_session',`${payload}.${signature}`,{
      httpOnly:true,
      secure:secureCookie(origin),
      sameSite:'lax',
      maxAge:86_400,
      path:'/',
    });
    response.cookies.delete('rbx_oauth');
    return response;
  }catch(error){
    console.error('Falha no callback OAuth do Roblox',error);
    return redirectError(origin,'service');
  }
}

function redirectError(origin:string,code:string){
  const response=NextResponse.redirect(`${origin}/?login=${encodeURIComponent(code)}`);
  response.headers.set('cache-control','no-store');
  response.cookies.delete('rbx_oauth');
  return response;
}
