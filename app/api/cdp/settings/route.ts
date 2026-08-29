import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{getCdpSettings,saveCdpSettings}from'@/lib/cdp';
import{DatabaseNotConfiguredError,isDatabaseConfigured}from'@/lib/db';

export const dynamic='force-dynamic';
export const runtime='nodejs';
type Session={exp:number;id:string;username:string;isCreator?:boolean};

export async function GET(request:Request){
  const session=await getSessionUser<Session>(request);
  if(!session)return NextResponse.json({error:'Não autorizado.'},{status:401});
  try{return NextResponse.json({configured:isDatabaseConfigured(),settings:await getCdpSettings()},{headers:{'cache-control':'no-store'}})}catch(error){return failure(error)}
}

export async function PATCH(request:Request){
  const session=await getSessionUser<Session>(request);
  if(!session)return NextResponse.json({error:'Não autorizado.'},{status:401});
  if(!session.isCreator)return NextResponse.json({error:'Somente o criador pode alterar o tempo das CDPs.'},{status:403});
  try{
    const body=await request.json()as{settings?:Array<{roleId?:string;days?:number}>};
    const updates=(body.settings||[]).map(item=>({roleId:String(item.roleId||''),days:Number(item.days)}));
    return NextResponse.json({ok:true,configured:true,settings:await saveCdpSettings(updates,{id:session.id,username:session.username})},{headers:{'cache-control':'no-store'}});
  }catch(error){return failure(error)}
}

function failure(error:unknown){const message=error instanceof Error?error.message:'Não foi possível salvar a configuração.';return NextResponse.json({error:message},{status:error instanceof DatabaseNotConfiguredError?503:400})}
