import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const session=await getSessionUser<{exp:number}>(request);
  if(!session)return NextResponse.json({error:'Não autorizado.'},{status:401});
  return NextResponse.json({
    trainings:Boolean(process.env.DISCORD_TRAININGS_WEBHOOK?.trim()),promotions:Boolean(process.env.DISCORD_PROMOTIONS_WEBHOOK?.trim()),
    demotions:Boolean(process.env.DISCORD_DEMOTIONS_WEBHOOK?.trim()),logs:Boolean(process.env.DISCORD_LOGS_WEBHOOK?.trim()),
  },{headers:{'cache-control':'no-store'}});
}
