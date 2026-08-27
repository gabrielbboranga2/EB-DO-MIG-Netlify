import {NextResponse} from 'next/server';

export async function POST(request:Request){
  const {username}=await request.json() as {username:string};
  if(!username||username.length<3)return NextResponse.json({error:'Digite um username válido.'},{status:400});

  const usersRes=await fetch('https://users.roblox.com/v1/usernames/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({usernames:[username],excludeBannedUsers:false})});
  if(!usersRes.ok)return NextResponse.json({error:'Erro ao buscar usuário no Roblox.'},{status:502});

  const {data}=await usersRes.json() as {data:Array<{requestedUsername?:string;name:string;displayName:string;id:number}>};
  if(!data.length)return NextResponse.json({error:'Usuário não encontrado no Roblox.'},{status:404});

  const user=data[0];
  const code=`EBMIG-${Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase().slice(0,6)}`;

  const avatarRes=await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`);
  let avatar='';
  if(avatarRes.ok){const t=await avatarRes.json() as {data:Array<{imageUrl:string}>};if(t.data.length)avatar=t.data[0].imageUrl;}

  const response=NextResponse.json({code,username:user.name,displayName:user.displayName,userId:user.id,avatar});
  response.cookies.set('bio_verify',JSON.stringify({code,userId:user.id,username:user.name,exp:Date.now()+300000}),{httpOnly:true,secure:true,sameSite:'lax',maxAge:300,path:'/'});
  return response;
}
