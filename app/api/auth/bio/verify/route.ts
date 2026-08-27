import {NextResponse} from 'next/server';

export async function POST(request:Request){
  const sessionSecret=process.env.SESSION_SECRET;
  if(!sessionSecret)return NextResponse.json({error:'Servidor não configurado.'},{status:503});

  const rawCookie=request.headers.get('cookie')||'';
  const verifyData=readCookie(rawCookie,'bio_verify');
  if(!verifyData)return NextResponse.json({error:'Sessão de verificação expirada. Gere um novo código.'},{status:401});

  let parsed:{code:string;userId:number;username:string;exp:number};
  try{parsed=JSON.parse(verifyData)}catch{return NextResponse.json({error:'Dados inválidos.'},{status:400})}
  if(Date.now()>parsed.exp)return NextResponse.json({error:'Código expirado. Gere um novo código.'},{status:401});

  const userRes=await fetch(`https://users.roblox.com/v1/users/${parsed.userId}`);
  if(!userRes.ok)return NextResponse.json({error:'Erro ao buscar perfil no Roblox.'},{status:502});

  const profile=await userRes.json() as {name:string;displayName:string;description:string;id:number};
  const bio=profile.description||'';

  if(!bio.includes(parsed.code)){
    return NextResponse.json({error:`Código não encontrado na bio. Certifique-se de colar "${parsed.code}" na descrição do seu perfil.`},{status:403});
  }

  const groupRes=await fetch(`https://groups.roblox.com/v2/users/${parsed.userId}/groups/roles`);
  const memberships=groupRes.ok?(await groupRes.json() as {data:Array<{group:{id:number;name:string};role:{id:number;name:string;rank:number}}>}).data:[];
  const main=memberships.find(x=>x.group.id===521106467);
  const divisionIds=new Set([319140811,34565583,729809284,886757353,710960394]);
  const divisions=memberships.filter(x=>divisionIds.has(x.group.id)).map(x=>({id:x.group.id,name:x.group.name,role:x.role.name}));

  const thumbRes=await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${parsed.userId}&size=150x150&format=Png&isCircular=false`);
  let avatar='';
  if(thumbRes.ok){const t=await thumbRes.json() as {data:Array<{imageUrl:string}>};if(t.data.length)avatar=t.data[0].imageUrl;}

  const payload=btoa(JSON.stringify({id:String(parsed.userId),username:profile.name,avatar,rank:main?.role.name||'Não pertence ao grupo',rankNumber:main?.role.rank||0,isCreator:main?.role.name==='[CR] Criador',divisions,exp:Date.now()+86400000}));
  const signature=await sign(payload,sessionSecret);

  const response=NextResponse.json({ok:true});
  response.cookies.set('eb_session',`${payload}.${signature}`,{httpOnly:true,secure:true,sameSite:'lax',maxAge:86400,path:'/'});
  response.cookies.delete('bio_verify');
  return response;
}

function readCookie(raw:string,name:string){return raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||''}
async function sign(value:string,key:string){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);const s=await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(value));return btoa(String.fromCharCode(...new Uint8Array(s))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
