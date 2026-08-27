import{NextResponse}from'next/server';
import{getMembers}from'@/lib/store';

export async function GET(request:Request){
  const url=new URL(request.url);
  const q=url.searchParams.get('q')||'';
  const division=url.searchParams.get('division')||'';
  const members=getMembers();
  let filtered=members;
  if(q){
    const lower=q.toLowerCase();
    filtered=filtered.filter(m=>m.username.toLowerCase().includes(lower)||m.rankName.toLowerCase().includes(lower)||m.userId.includes(lower));
  }
  if(division){
    filtered=filtered.filter(m=>m.division===division);
  }
  return NextResponse.json({members:filtered.slice(0,50),total:filtered.length});
}
