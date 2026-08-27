import {NextResponse} from 'next/server';
import {getPatenteByRoleId,canAdmin,isAltoComando} from '@/lib/patentes';
import {DIVISION_IDS,getDivisaoByGroupId} from '@/lib/divisoes-mig';

export async function GET(request:Request){
  const url=new URL(request.url),code=url.searchParams.get('code'),state=url.searchParams.get('state');
  const oauth=readCookie(request.headers.get('cookie')||'','rbx_oauth');
  if(!code||!state||!oauth||oauth.split('.')[0]!==state)return NextResponse.redirect(`${url.origin}/?login=invalid`);
  const verifier=oauth.slice(oauth.indexOf('.')+1),clientId=process.env.ROBLOX_CLIENT_ID,secret=process.env.ROBLOX_CLIENT_SECRET,sessionSecret=process.env.SESSION_SECRET;
  if(!clientId||!secret||!sessionSecret)return NextResponse.redirect(`${url.origin}/?login=config`);
  const token=await fetch('https://apis.roblox.com/oauth/v1/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',authorization:`Basic ${btoa(`${clientId}:${secret}`)}`},body:new URLSearchParams({grant_type:'authorization_code',code,code_verifier:verifier,redirect_uri:`${url.origin}/api/auth/roblox/callback`})});
  if(!token.ok)return NextResponse.redirect(`${url.origin}/?login=failed`);
  const tokens=await token.json() as {access_token:string};
  const info=await fetch('https://apis.roblox.com/oauth/v1/userinfo',{headers:{authorization:`Bearer ${tokens.access_token}`}});
  if(!info.ok)return NextResponse.redirect(`${url.origin}/?login=profile`);
  const profile=await info.json() as {sub:string;preferred_username?:string;name?:string;picture?:string};
  const groupResponse=await fetch(`https://groups.roblox.com/v2/users/${profile.sub}/groups/roles`);
  const memberships=groupResponse.ok?(await groupResponse.json() as {data:Array<{group:{id:number;name:string};role:{id:number;name:string;rank:number}}>}).data:[];
  const main=memberships.find(x=>x.group.id===521106467);
  if(!main)return NextResponse.redirect(`${url.origin}/?login=nogroup`);
  const patente=getPatenteByRoleId(String(main.role.id));
  const divisions=memberships.filter(x=>DIVISION_IDS.has(x.group.id)).map(x=>{
    const div=getDivisaoByGroupId(x.group.id);
    return{id:x.group.id,name:div?.sigla||x.group.name,role:x.role.name,roleId:String(x.role.id)};
  });
  const primaryDivision=divisions.find(d=>d.id!==521106467);
  const isCreator=main.role.name==='[CR] Criador'||main.role.rank>=253;
  const isAdmin=canAdmin(String(main.role.id))||isCreator;
  const isHighCommand=isAltoComando(String(main.role.id))||isCreator;
  const payload=btoa(JSON.stringify({
    id:profile.sub,
    username:profile.preferred_username||profile.name||'Militar',
    avatar:profile.picture||'',
    rank:patente?`[${patente.sigla}] ${patente.nome}`:main.role.name,
    rankNumber:main.role.rank,
    roleId:String(main.role.id),
    isCreator,
    isAdmin,
    isHighCommand,
    division:primaryDivision?.name||'EXÉRCITO',
    divisions,
    cdpDias:patente?.cdpDias||0,
    exp:Date.now()+86400000
  }));
  const signature=await sign(payload,sessionSecret);
  const response=NextResponse.redirect(url.origin);
  response.cookies.set('eb_session',`${payload}.${signature}`,{httpOnly:true,secure:true,sameSite:'lax',maxAge:86400,path:'/'});
  response.cookies.delete('rbx_oauth');return response;
}
function readCookie(raw:string,name:string){return raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)}
async function sign(value:string,key:string){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);const s=await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(value));return btoa(String.fromCharCode(...new Uint8Array(s))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
