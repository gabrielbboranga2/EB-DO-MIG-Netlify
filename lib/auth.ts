export function getConfiguredOrigin():string|null{
  const vercelHost=process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const candidates=[process.env.SITE_URL?.trim(),vercelHost?`https://${vercelHost}`:''];
  for(const candidate of candidates){
    if(!candidate)continue;
    try{
      const url=new URL(candidate);
      const local=url.hostname==='localhost'||url.hostname==='127.0.0.1';
      if(url.protocol==='https:'||(local&&process.env.NODE_ENV!=='production'))return url.origin;
    }catch{}
  }
  return null;
}

export function getAppOrigin(requestUrl:string):string|null{
  const configured=getConfiguredOrigin();
  if(configured)return configured;

  if(process.env.NODE_ENV!=='production'){
    try{return new URL(requestUrl).origin}catch{return null}
  }

  return null;
}

export function readCookie(raw:string,name:string):string|undefined{
  return raw.split(';').map(value=>value.trim()).find(value=>value.startsWith(`${name}=`))?.slice(name.length+1);
}

export function base64url(bytes:Uint8Array):string{
  return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}

export function encodeSession(value:unknown):string{
  return base64url(new TextEncoder().encode(JSON.stringify(value)));
}

export function decodeSession<T>(value:string):T{
  const normalized=value.replaceAll('-','+').replaceAll('_','/');
  const padded=normalized+'='.repeat((4-normalized.length%4)%4);
  const bytes=Uint8Array.from(atob(padded),character=>character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

export async function sign(value:string,key:string):Promise<string>{
  const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(value));
  return base64url(new Uint8Array(signature));
}

export function secureCookie(origin:string):boolean{
  return origin.startsWith('https://');
}

export async function getSessionUser<T extends {exp:number}>(request:Request):Promise<T|null>{
  const raw=readCookie(request.headers.get('cookie')||'','eb_session');
  const secret=process.env.SESSION_SECRET;
  if(!raw||!secret)return null;
  const separator=raw.lastIndexOf('.');
  if(separator<1)return null;
  const payload=raw.slice(0,separator);
  const signature=raw.slice(separator+1);
  const expected=await sign(payload,secret);
  if(!safeEqual(signature,expected))return null;
  try{
    const user=decodeSession<T>(payload);
    return user.exp>Date.now()?user:null;
  }catch{return null}
}

function safeEqual(left:string,right:string):boolean{
  if(left.length!==right.length)return false;
  let difference=0;
  for(let index=0;index<left.length;index++)difference|=left.charCodeAt(index)^right.charCodeAt(index);
  return difference===0;
}
