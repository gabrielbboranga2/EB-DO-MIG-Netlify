import {NextResponse} from 'next/server';
export async function GET(request:Request){const r=NextResponse.redirect(new URL(request.url).origin);r.cookies.delete('eb_session');return r}
