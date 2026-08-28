import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{DIVISOES}from'@/lib/divisoes-mig';
import{getLiveRoster}from'@/lib/roblox';

export const dynamic='force-dynamic';
type AdminSession={exp:number;isAdmin?:boolean;isCreator?:boolean};

export async function GET(request:Request){
  const session=await getSessionUser<AdminSession>(request);
  if(!session)return NextResponse.json({error:'Não autorizado.'},{status:401});
  try{
    const members=await getLiveRoster();
    return NextResponse.json({
      connected:true,
      total:members.filter(member=>member.divisions.includes('EXÉRCITO')).length,
      groups:DIVISOES.map(group=>({id:group.groupId,name:group.nome,sigla:group.sigla,members:members.filter(member=>member.divisions.includes(group.sigla)).length})),
      checkedAt:new Date().toISOString(),
    },{headers:{'cache-control':'private, max-age=30'}});
  }catch(error){
    console.error('Falha ao verificar conexão com a Roblox',error);
    return NextResponse.json({error:'Não foi possível consultar os grupos da Roblox.'},{status:503});
  }
}

export async function POST(request:Request){
  const session=await getSessionUser<AdminSession>(request);
  if(!session?.isAdmin&&!session?.isCreator)return NextResponse.json({error:'Acesso administrativo necessário.'},{status:403});
  return GET(request);
}
