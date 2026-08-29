import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{applyBulkRankChange,previewBulkRankChange}from'@/lib/roblox';
import{sendSiteLog}from'@/lib/discord-logs';

export const dynamic='force-dynamic';
export const runtime='nodejs';
type CreatorSession={exp:number;id:string;username:string;isCreator?:boolean};

export async function POST(request:Request){
  const session=await getSessionUser<CreatorSession>(request);
  if(!session)return NextResponse.json({error:'Sua sessão expirou. Entre novamente.'},{status:401});
  if(!session.isCreator)return NextResponse.json({error:'A gestão em massa é exclusiva do Criador.'},{status:403});
  try{
    const body=await request.json()as{groupId?:number;sourceRoleId?:string;direction?:string;confirm?:boolean;targetRoleId?:string;expectedCount?:number;confirmation?:string;reason?:string};
    const groupId=Number(body.groupId);const sourceRoleId=String(body.sourceRoleId||'');const direction=body.direction==='demotion'?'demotion':body.direction==='promotion'?'promotion':null;
    if(!Number.isSafeInteger(groupId)||!/^\d+$/.test(sourceRoleId)||!direction)return NextResponse.json({error:'Seleção de cargos inválida.'},{status:400});
    if(!body.confirm){const preview=await previewBulkRankChange(groupId,sourceRoleId,direction);return NextResponse.json({ok:true,applied:false,preview},{headers:{'cache-control':'no-store'}})}
    const expectedCount=Number(body.expectedCount);const reason=String(body.reason||'').trim();
    if(!Number.isSafeInteger(expectedCount)||expectedCount<1||body.confirmation!==`MOVER ${expectedCount}`||reason.length<5)return NextResponse.json({error:`Digite MOVER ${expectedCount} e informe um motivo para confirmar.`},{status:400});
    const result=await applyBulkRankChange(groupId,sourceRoleId,direction,String(body.targetRoleId||''),expectedCount);
    await sendSiteLog({title:'Gestão em massa de patentes',description:result.failedCount?'A operação terminou com falhas parciais.':'Todos os militares foram processados.',color:result.failedCount?0xD19B61:0x78A785,fields:[{name:'Comunidade',value:result.preview.community,inline:true},{name:'Responsável',value:session.username,inline:true},{name:'Direção',value:direction==='promotion'?'Subir patente':'Descer patente',inline:true},{name:'Origem',value:result.preview.current.name,inline:true},{name:'Destino',value:result.preview.target.name,inline:true},{name:'Resultado',value:`${result.succeededCount} concluído(s) · ${result.failedCount} falha(s)`,inline:true},{name:'Motivo',value:reason}]});
    return NextResponse.json({ok:result.failedCount===0,applied:true,result},{status:result.failedCount?207:200,headers:{'cache-control':'no-store'}});
  }catch(error){const message=error instanceof Error?error.message:'Não foi possível processar a gestão em massa.';console.error('Falha na gestão em massa',error);return NextResponse.json({error:message},{status:message.includes('mudou')?409:502})}
}
