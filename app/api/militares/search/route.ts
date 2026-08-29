import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{getLiveRoster}from'@/lib/roblox';
import{DIVISOES}from'@/lib/divisoes-mig';
import{getActiveCdpMap}from'@/lib/cdp';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const session=await getSessionUser<{exp:number}>(request);
  if(!session)return NextResponse.json({error:'Não autorizado.'},{status:401});

  const url=new URL(request.url);
  const query=(url.searchParams.get('q')||'').trim().toLocaleLowerCase('pt-BR');
  const division=(url.searchParams.get('division')||'').trim().toUpperCase();
  const requestedPage=Number.parseInt(url.searchParams.get('page')||'1',10);
  const page=Number.isFinite(requestedPage)&&requestedPage>0?requestedPage:1;
  const pageSize=50;

  try{
    const[baseRoster,activeCdp]=await Promise.all([getLiveRoster(),getActiveCdpMap()]);
    const roster=baseRoster.map(member=>{const cdp=activeCdp.get(member.userId);return{...member,cdpActive:Boolean(cdp),cdpStartedAt:cdp?.startedAt||null,cdpEndsAt:cdp?.endsAt||null,cdpRecordId:cdp?.id||null}});
    const counts=Object.fromEntries(DIVISOES.map(group=>[
      group.sigla,
      roster.filter(member=>member.divisions.includes(group.sigla)).length,
    ]));
    let members=roster;
    if(division)members=members.filter(member=>member.divisions.includes(division));
    if(query)members=members.filter(member=>`${member.username} ${member.displayName} ${member.userId} ${member.rankName} ${member.division}`.toLocaleLowerCase('pt-BR').includes(query));
    const total=members.length;
    const totalPages=Math.max(1,Math.ceil(total/pageSize));
    const currentPage=Math.min(page,totalPages);
    const start=(currentPage-1)*pageSize;
    return NextResponse.json({
      members:members.slice(start,start+pageSize),
      total,
      rosterTotal:roster.length,
      page:currentPage,
      pageSize,
      totalPages,
      counts,
      cdpActive:roster.filter(member=>member.cdpActive).length,
    },{headers:{'cache-control':'private, max-age=30'}});
  }catch(error){
    console.error('Falha ao carregar efetivo do Roblox',error);
    return NextResponse.json({error:'Não foi possível sincronizar o efetivo com o Roblox.'},{status:503});
  }
}
