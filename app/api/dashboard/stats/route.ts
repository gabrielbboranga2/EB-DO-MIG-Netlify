import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{getLiveRoster}from'@/lib/roblox';
import{DIVISOES}from'@/lib/divisoes-mig';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const session=await getSessionUser<{exp:number}>(request);
  if(!session)return NextResponse.json({error:'Não autorizado.'},{status:401});

  try{
    const members=await getLiveRoster();
    const divisoes=Object.fromEntries(DIVISOES.map(division=>[
      division.sigla,
      members.filter(member=>member.divisions.includes(division.sigla)).length,
    ]));
    return NextResponse.json({
      totalSincronizados:divisoes['EXÉRCITO']||members.length,
      emCdp:0,
      treinosMes:0,
      acoesRegistradas:0,
      ultimaSincronizacao:new Date().toISOString(),
      divisoes,
      atividadesRecentes:[],
    },{headers:{'cache-control':'private, max-age=30'}});
  }catch(error){
    console.error('Falha ao carregar estatísticas do Roblox',error);
    return NextResponse.json({error:'Não foi possível sincronizar os grupos do Roblox.'},{status:503});
  }
}
