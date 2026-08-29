import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{getMemberCdp,startMemberCdp,updateMemberCdp}from'@/lib/cdp';
import{DatabaseNotConfiguredError,isDatabaseConfigured}from'@/lib/db';
import{getUserGroupMemberships}from'@/lib/roblox';
import{getPatenteByRoleId}from'@/lib/patentes';
import{sendSiteLog}from'@/lib/discord-logs';

export const dynamic='force-dynamic';
export const runtime='nodejs';
type Session={exp:number;id:string;username:string;isAdmin?:boolean;isCreator?:boolean;isHighCommand?:boolean};

function canManage(session:Session){return Boolean(session.isAdmin||session.isCreator||session.isHighCommand)}

export async function GET(request:Request){
  const session=await getSessionUser<Session>(request);
  if(!session)return NextResponse.json({error:'Sua sessão expirou. Entre novamente.'},{status:401});
  const requested=new URL(request.url).searchParams.get('userId')?.trim()||session.id;
  if(requested!==session.id&&!canManage(session))return NextResponse.json({error:'Você não pode consultar a CDP de outro militar.'},{status:403});
  try{return NextResponse.json({configured:isDatabaseConfigured(),record:await getMemberCdp(requested),canManage:canManage(session)},{headers:{'cache-control':'no-store'}})}
  catch(error){return failure(error)}
}

export async function POST(request:Request){
  const session=await getSessionUser<Session>(request);
  if(!session)return NextResponse.json({error:'Sua sessão expirou. Entre novamente.'},{status:401});
  if(!canManage(session))return NextResponse.json({error:'Somente administradores e alto comando podem controlar CDPs.'},{status:403});
  try{
    const body=await request.json()as{action?:string;userId?:string;username?:string;recordId?:string;reason?:string};
    const action=body.action;
    const reason=String(body.reason||'').trim().slice(0,500);
    if(action==='start'){
      const userId=String(body.userId||'').trim();
      const username=String(body.username||'Militar').trim().slice(0,30);
      if(!/^\d+$/.test(userId))return NextResponse.json({error:'Militar inválido.'},{status:400});
      const membership=(await getUserGroupMemberships(userId)).find(item=>item.sigla==='EXÉRCITO');
      if(!membership)return NextResponse.json({error:'Este usuário não pertence ao Exército.'},{status:404});
      const rank=getPatenteByRoleId(membership.roleId);
      const rankName=rank?`[${rank.sigla}] ${rank.nome}`:membership.roleName;
      const record=await startMemberCdp({userId,username,roleId:membership.roleId,rankName,actorId:session.id,actorUsername:session.username,reason});
      await logCdp('CDP iniciada',record,session.username,reason);
      return NextResponse.json({ok:true,record},{status:201,headers:{'cache-control':'no-store'}});
    }
    if(action==='complete'||action==='cancel'){
      const recordId=String(body.recordId||'').trim();
      if(!recordId)return NextResponse.json({error:'Registro de CDP inválido.'},{status:400});
      if(action==='cancel'&&reason.length<5)return NextResponse.json({error:'Informe o motivo do cancelamento.'},{status:400});
      const record=await updateMemberCdp(recordId,action,{id:session.id,username:session.username},reason);
      await logCdp(action==='complete'?'CDP concluída':'CDP cancelada',record,session.username,reason);
      return NextResponse.json({ok:true,record},{headers:{'cache-control':'no-store'}});
    }
    return NextResponse.json({error:'Ação de CDP inválida.'},{status:400});
  }catch(error){return failure(error)}
}

function failure(error:unknown){
  const message=error instanceof Error?error.message:'Não foi possível processar a CDP.';
  console.error('Falha na CDP',error);
  const status=error instanceof DatabaseNotConfiguredError?503:message.includes('já possui')?409:message.includes('não exige')?409:500;
  return NextResponse.json({error:message},{status});
}

async function logCdp(title:string,record:{username:string;rankName:string;durationDays:number;endsAt:string;status:string},actor:string,reason:string){return sendSiteLog({title,color:0xBDA866,fields:[{name:'Militar',value:`${record.username}\n${record.rankName}`,inline:true},{name:'Responsável',value:actor,inline:true},{name:'Duração',value:`${record.durationDays} dia(s)`,inline:true},{name:'Situação',value:record.status,inline:true},{name:'Término previsto',value:new Date(record.endsAt).toLocaleString('pt-BR'),inline:true},{name:'Motivo',value:reason||'Não informado'}]})}
