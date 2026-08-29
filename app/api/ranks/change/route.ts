import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{applyRankChange,previewRankChange}from'@/lib/roblox';
import{consumePromotionCdp,getPromotionCdp}from'@/lib/cdp';
import{sendSiteLog}from'@/lib/discord-logs';

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
    if(!body.confirm){const change=await previewRankChange(userId,groupId,direction);return NextResponse.json({ok:true,applied:false,change},{headers:{'cache-control':'no-store'}})}
    const before=await previewRankChange(userId,groupId,direction);
    const cdp=direction==='promotion'&&groupId===521106467?await getPromotionCdp(userId,before.current.id):null;
    const change=await applyRankChange(userId,groupId,direction,String(body.targetRoleId||''));
    if(cdp)await consumePromotionCdp(cdp.id,change.target.id);
    await sendSiteLog({title:direction==='promotion'?'Promoção realizada':'Rebaixamento realizado',color:direction==='promotion'?0x78A785:0xC56F68,fields:[{name:'Militar',value:`Roblox ID: ${userId}`,inline:true},{name:'Comunidade',value:change.community,inline:true},{name:'Responsável',value:session.username,inline:true},{name:'Cargo anterior',value:change.current.name,inline:true},{name:'Novo cargo',value:change.target.name,inline:true},{name:'Motivo',value:String(body.reason||'').trim()}]});
    return NextResponse.json({ok:true,applied:Boolean(body.confirm),change},{headers:{'cache-control':'no-store'}});
  }catch(error){
    const message=error instanceof Error?error.message:'Não foi possível processar a alteração.';
    console.error('Falha na alteração de cargo',error);
    return NextResponse.json({error:message},{status:message.includes('não pertence')?404:message.includes('já está')||message.includes('CDP')||message.includes('bloqueada')?409:502});
  }
}
