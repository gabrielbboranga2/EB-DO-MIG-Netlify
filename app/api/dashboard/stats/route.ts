import{NextResponse}from'next/server';
import{DIVISOES}from'@/lib/divisoes-mig';

interface RobloxMember{
  user:{userId:number;username:string;displayName:string};
  roles:Array<{id:number;name:string;rank:number}>;
}

async function fetchGroupMembers(groupId:number):Promise<RobloxMember[]>{
  const allMembers:RobloxMember[]=[];
  let cursor='';
  do{
    const url=`https://groups.roblox.com/v2/groups/${groupId}/users?limit=100${cursor?'&cursor='+cursor:''}`;
    const res=await fetch(url);
    if(!res.ok)break;
    const data=await res.json()as{data:RobloxMember[];nextPageCursor:string|null};
    allMembers.push(...data.data);
    cursor=data.nextPageCursor||'';
  }while(cursor);
  return allMembers;
}

export const dynamic='force-dynamic';

export async function GET(){
  try{
    const mainMembers=await fetchGroupMembers(521106467);
    const divisionCounts:Record<string,number>={'EXÉRCITO':0,'STAFF':0,'BFE':0,'CIE':0,'BAC':0,'BPE':0};

    for(const member of mainMembers){
      const role=member.roles[0];
      if(!role)continue;
      divisionCounts['EXÉRCITO']++;
    }

    for(const div of DIVISOES){
      if(div.groupId===521106467)continue;
      try{
        const divMembers=await fetchGroupMembers(div.groupId);
        divisionCounts[div.sigla]=divMembers.length;
      }catch{}
    }

    return NextResponse.json({
      totalSincronizados:mainMembers.length,
      emCdp:0,
      treinosMes:0,
      acoesRegistradas:0,
      ultimaSincronizacao:new Date().toISOString(),
      divisoes:divisionCounts,
      atividadesRecentes:[]
    });
  }catch(e){
    return NextResponse.json({error:String(e)},{status:500});
  }
}
