import{NextResponse}from'next/server';
import{upsertMember,getMembers}from'@/lib/store';
import{DIVISOES,DIVISION_IDS,getDivisaoByGroupId}from'@/lib/divisoes-mig';
import{getPatenteByRoleId}from'@/lib/patentes';

interface RobloxMember{
  user:{userId:number;username:string;displayName:string};
  role:{id:number;name:string;rank:number};
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

async function fetchUserThumbnails(userIds:number[]):Promise<Record<number,string>>{
  if(userIds.length===0)return{};
  const chunks:number[][]=[];
  for(let i=0;i<userIds.length;i+=100)chunks.push(userIds.slice(i,i+100));
  const result:Record<number,string>={};
  for(const chunk of chunks){
    const params=chunk.map(id=>`userIds=${id}&size=150x150&format=Png&isCircular=false`).join('&');
    try{
      const res=await fetch(`https://thumbnails.roblox.com/v1/users/batch?${params}`);
      if(!res.ok)continue;
      const data=await res.json()as{data:Array<{targetId:number;imageUrl:string}>};
      data.data.forEach(t=>{result[t.targetId]=t.imageUrl});
    }catch{}
  }
  return result;
}

export async function POST(request:Request){
  try{
    const authHeader=request.headers.get('authorization');
    if(authHeader!=='Bearer sync_eb_mig_2026')return NextResponse.json({error:'Não autorizado'},{status:401});
    const mainMembers=await fetchGroupMembers(521106467);
    const divisionMembers:Record<number,RobloxMember[]>={};
    for(const div of DIVISOES){
      if(div.groupId===521106467)continue;
      divisionMembers[div.groupId]=await fetchGroupMembers(div.groupId);
    }
    const userIds=mainMembers.map(m=>m.user.userId);
    const thumbnails=await fetchUserThumbnails(userIds);
    let updated=0;
    for(const member of mainMembers){
      const patente=getPatenteByRoleId(String(member.role.id));
      const userDivisions=Object.entries(divisionMembers)
        .filter(([_,members])=>members.some(m=>m.user.userId===member.user.userId))
        .map(([gid])=>getDivisaoByGroupId(Number(gid)))
        .filter(Boolean);
      const primaryDiv=userDivisions[0];
      upsertMember({
        userId:String(member.user.userId),
        username:member.user.displayName||member.user.username,
        avatar:thumbnails[member.user.userId]||'',
        rankName:patente?`[${patente.sigla}] ${patente.nome}`:member.role.name,
        rankNumber:member.role.rank,
        roleId:String(member.role.id),
        division:primaryDiv?.sigla||'EXÉRCITO',
        divisionRole:primaryDiv?member.role.name:'',
      });
      updated++;
    }
    return NextResponse.json({ok:true,updated,totalMain:mainMembers.length});
  }catch(e){
    return NextResponse.json({error:String(e)},{status:500});
  }
}

export async function GET(){
  const members=getMembers();
  return NextResponse.json({total:members.length,lastSync:members.length>0?members[0].lastSync:null});
}
