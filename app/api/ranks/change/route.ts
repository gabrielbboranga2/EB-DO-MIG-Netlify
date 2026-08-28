import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{applyRankChange,previewRankChange}from'@/lib/roblox';

export const dynamic='force-dynamic';
type AdminSession={exp:number;id:string;username:string;isAdmin?:boolean;isCreator?:boolean};

export async function POST(request:Request){
  const session=await getSessionUser<AdminSession>(request);
  if(!session)return NextResponse.json({error:'Sua sessão expirou. Entre novamente.'},{status:401});
  if(!session.isAdmin&&!session.isCreator)return NextResponse.json({error:'Você não possui permissão administrativa para alterar cargos.'},{status:403});
  try{
    const body=await request.json()as{userId?:string;groupId?:number;direction?:string;confirm?:boolean;targetRoleId?:string;reason?:string};
    const userId=String(body.userId||'').trim();
    const groupId=Number(body.groupId);
    const direction=body.direction==='demotion'?'demotion':body.direction==='promotion'?'promotion':null;
    if(!/^\d+$/.test(userId)||!Number.isSafeInteger(groupId)||!direction)return NextResponse.json({error:'Solicitação de cargo inválida.'},{status:400});
    if(body.confirm&&String(body.reason||'').trim().length<5)return NextResponse.json({error:'Informe um motivo com pelo menos 5 caracteres.'},{status:400});
    const change=body.confirm?await applyRankChange(userId,groupId,direction,String(body.targetRoleId||'')):await previewRankChange(userId,groupId,direction);
    return NextResponse.json({ok:true,applied:Boolean(body.confirm),change},{headers:{'cache-control':'no-store'}});
  }catch(error){
    const message=error instanceof Error?error.message:'Não foi possível processar a alteração.';
    console.error('Falha na alteração de cargo',error);
    return NextResponse.json({error:message},{status:message.includes('não pertence')?404:message.includes('já está')?409:502});
  }
}
