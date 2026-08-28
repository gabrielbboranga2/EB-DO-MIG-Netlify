import{NextResponse}from'next/server';
import{getAppOrigin}from'@/lib/auth';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const origin=getAppOrigin(request.url)||new URL(request.url).origin;
  const response=NextResponse.redirect(origin);
  response.headers.set('cache-control','no-store');
  response.cookies.delete('eb_session');
  response.cookies.delete('rbx_oauth');
  return response;
}
