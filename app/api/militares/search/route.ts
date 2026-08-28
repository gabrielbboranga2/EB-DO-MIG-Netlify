import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{getLiveRoster}from'@/lib/roblox';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const session=await getSessionUser<{exp:number}>(request);
  if(!session)return NextResponse.json({error:'Não autorizado.'},{status:401});

  const url=new URL(request.url);
  const query=(url.searchParams.get('q')||'').trim().toLocaleLowerCase('pt-BR');
  const division=(url.searchParams.get('division')||'').trim().toUpperCase();

  try{
    let members=await getLiveRoster();
    if(division)members=members.filter(member=>member.divisions.includes(division));
    if(query)members=members.filter(member=>`${member.username} ${member.displayName} ${member.userId} ${member.rankName} ${member.division}`.toLocaleLowerCase('pt-BR').includes(query));
    return NextResponse.json({members:members.slice(0,200),total:members.length},{headers:{'cache-control':'private, max-age=30'}});
  }catch(error){
    console.error('Falha ao carregar efetivo do Roblox',error);
    return NextResponse.json({error:'Não foi possível sincronizar o efetivo com o Roblox.'},{status:503});
  }
}
