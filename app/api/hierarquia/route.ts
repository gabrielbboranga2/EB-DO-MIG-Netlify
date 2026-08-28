import{NextResponse}from'next/server';
import{getLiveHierarchies}from'@/lib/roblox';
import{getHierarchySnapshot,HIERARCHY_SNAPSHOT_DATE}from'@/lib/hierarchy-snapshot';

export const dynamic='force-dynamic';

export async function GET(){
  try{
    const groups=await getLiveHierarchies();
    return NextResponse.json({groups},{headers:{'cache-control':'private, max-age=60'}});
  }catch(error){
    console.error('Falha ao carregar hierarquias do Roblox',error);
    return NextResponse.json({groups:getHierarchySnapshot(),source:'verified-snapshot',verifiedAt:HIERARCHY_SNAPSHOT_DATE},{headers:{'cache-control':'public, max-age=60'}});
  }
}
