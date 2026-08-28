import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const user=await getSessionUser<{exp:number}>(request);
  return NextResponse.json({user},{headers:{'cache-control':'no-store'}});
}
