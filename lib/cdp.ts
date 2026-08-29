import{randomUUID}from'crypto';
import{db,isDatabaseConfigured}from'./db';
import{PATENTES,getPatenteByRoleId}from'./patentes';

export type CdpStatus='active'|'completed'|'cancelled'|'consumed';
export interface CdpRecord{
  id:string;userId:string;username:string;roleId:string;rankName:string;durationDays:number;
  status:CdpStatus;startedAt:string;endsAt:string;completedAt:string|null;cancelledAt:string|null;
  consumedAt:string|null;createdByUsername:string;reason:string;
}
export interface CdpSetting{roleId:string;sigla:string;nome:string;days:number;promovivel:boolean}

type Row={id:string;user_id:string;username:string;role_id:string;rank_name:string;duration_days:number;status:CdpStatus;started_at:Date|string;ends_at:Date|string;completed_at:Date|string|null;cancelled_at:Date|string|null;consumed_at:Date|string|null;created_by_username:string;reason:string};
let schemaReady:Promise<void>|null=null;

async function ensureSchema(){
  if(schemaReady)return schemaReady;
  schemaReady=(async()=>{
    const sql=db();
    await sql`CREATE TABLE IF NOT EXISTS cdp_records (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      username text NOT NULL,
      role_id text NOT NULL,
      rank_name text NOT NULL,
      duration_days integer NOT NULL CHECK (duration_days BETWEEN 0 AND 365),
      status text NOT NULL CHECK (status IN ('active','completed','cancelled','consumed')),
      started_at timestamptz NOT NULL,
      ends_at timestamptz NOT NULL,
      completed_at timestamptz,
      cancelled_at timestamptz,
      consumed_at timestamptz,
      consumed_for_role_id text,
      created_by_user_id text NOT NULL,
      created_by_username text NOT NULL,
      reason text NOT NULL DEFAULT '',
      updated_by_user_id text,
      updated_by_username text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS cdp_one_active_per_user ON cdp_records(user_id) WHERE status='active'`;
    await sql`CREATE INDEX IF NOT EXISTS cdp_records_user_created ON cdp_records(user_id,created_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS cdp_settings (
      role_id text PRIMARY KEY,
      days integer NOT NULL CHECK (days BETWEEN 0 AND 30),
      updated_by_user_id text NOT NULL,
      updated_by_username text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  })().catch(error=>{schemaReady=null;throw error});
  return schemaReady;
}

function iso(value:Date|string|null){return value?new Date(value).toISOString():null}
function mapRow(row:Row):CdpRecord{return{id:row.id,userId:row.user_id,username:row.username,roleId:row.role_id,rankName:row.rank_name,durationDays:Number(row.duration_days),status:row.status,startedAt:iso(row.started_at)!,endsAt:iso(row.ends_at)!,completedAt:iso(row.completed_at),cancelledAt:iso(row.cancelled_at),consumedAt:iso(row.consumed_at),createdByUsername:row.created_by_username,reason:row.reason}}

async function completeExpired(){
  await ensureSchema();
  await db()`UPDATE cdp_records SET status='completed',completed_at=ends_at,updated_at=now() WHERE status='active' AND ends_at<=now()`;
}

export async function getCdpSettings():Promise<CdpSetting[]>{
  const overrides=new Map<string,number>();
  if(isDatabaseConfigured()){
    await ensureSchema();
    const rows=await db()<Array<{role_id:string;days:number}>>`SELECT role_id,days FROM cdp_settings`;
    rows.forEach(row=>overrides.set(row.role_id,Number(row.days)));
  }
  return PATENTES.filter(rank=>rank.promovivel).map(rank=>({roleId:rank.roleId,sigla:rank.sigla,nome:rank.nome,days:overrides.get(rank.roleId)??rank.cdpDias,promovivel:rank.promovivel}));
}

export async function saveCdpSettings(updates:Array<{roleId:string;days:number}>,actor:{id:string;username:string}){
  await ensureSchema();
  const allowed=new Set(PATENTES.filter(rank=>rank.promovivel).map(rank=>rank.roleId));
  const clean=updates.filter(item=>allowed.has(item.roleId)&&Number.isInteger(item.days)&&item.days>=0&&item.days<=30);
  if(clean.length!==updates.length||!clean.length)throw new Error('Configuração de dias inválida.');
  const sql=db();
  await sql.begin(async transaction=>{
    for(const item of clean)await transaction`INSERT INTO cdp_settings(role_id,days,updated_by_user_id,updated_by_username) VALUES(${item.roleId},${item.days},${actor.id},${actor.username}) ON CONFLICT(role_id) DO UPDATE SET days=excluded.days,updated_by_user_id=excluded.updated_by_user_id,updated_by_username=excluded.updated_by_username,updated_at=now()`;
  });
  return getCdpSettings();
}

export async function getMemberCdp(userId:string):Promise<CdpRecord|null>{
  if(!isDatabaseConfigured())return null;
  await completeExpired();
  const rows=await db()<Row[]>`SELECT * FROM cdp_records WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 1`;
  return rows[0]?mapRow(rows[0]):null;
}

export async function getActiveCdpMap(){
  const result=new Map<string,CdpRecord>();
  if(!isDatabaseConfigured())return result;
  await completeExpired();
  const rows=await db()<Row[]>`SELECT * FROM cdp_records WHERE status='active' ORDER BY ends_at`;
  rows.forEach(row=>result.set(row.user_id,mapRow(row)));
  return result;
}

export async function startMemberCdp(input:{userId:string;username:string;roleId:string;rankName:string;actorId:string;actorUsername:string;reason:string}){
  await completeExpired();
  const rank=getPatenteByRoleId(input.roleId);
  if(!rank||!rank.promovivel)throw new Error('A patente atual não participa do ciclo de CDP.');
  const setting=(await getCdpSettings()).find(item=>item.roleId===input.roleId);
  const days=setting?.days??rank.cdpDias;
  if(days===0)throw new Error('Esta patente não exige tempo de CDP para promoção.');
  const sql=db();
  const existing=await sql<Row[]>`SELECT * FROM cdp_records WHERE user_id=${input.userId} AND status='active' LIMIT 1`;
  if(existing[0])throw new Error('Este militar já possui uma CDP em andamento.');
  const startedAt=new Date();const endsAt=new Date(startedAt.getTime()+days*86_400_000);
  const rows=await sql<Row[]>`INSERT INTO cdp_records(id,user_id,username,role_id,rank_name,duration_days,status,started_at,ends_at,created_by_user_id,created_by_username,reason) VALUES(${randomUUID()},${input.userId},${input.username},${input.roleId},${input.rankName},${days},'active',${startedAt},${endsAt},${input.actorId},${input.actorUsername},${input.reason}) RETURNING *`;
  return mapRow(rows[0]);
}

export async function updateMemberCdp(recordId:string,action:'complete'|'cancel',actor:{id:string;username:string},reason:string){
  await ensureSchema();
  const status:CdpStatus=action==='complete'?'completed':'cancelled';
  const sql=db();
  const rows=action==='complete'
    ?await sql<Row[]>`UPDATE cdp_records SET status=${status},completed_at=now(),updated_at=now(),updated_by_user_id=${actor.id},updated_by_username=${actor.username},reason=CASE WHEN ${reason}='' THEN reason ELSE ${reason} END WHERE id=${recordId} AND status='active' RETURNING *`
    :await sql<Row[]>`UPDATE cdp_records SET status=${status},cancelled_at=now(),updated_at=now(),updated_by_user_id=${actor.id},updated_by_username=${actor.username},reason=CASE WHEN ${reason}='' THEN reason ELSE ${reason} END WHERE id=${recordId} AND status='active' RETURNING *`;
  if(!rows[0])throw new Error('A CDP já foi encerrada ou não existe.');
  return mapRow(rows[0]);
}

export async function getPromotionCdp(userId:string,currentRoleId:string){
  const rank=getPatenteByRoleId(currentRoleId);
  if(!rank)return null;
  const setting=(await getCdpSettings()).find(item=>item.roleId===currentRoleId);
  if((setting?.days??rank.cdpDias)===0)return null;
  if(!isDatabaseConfigured())throw new Error('A promoção exige CDP, mas o banco de dados ainda não está conectado.');
  await completeExpired();
  const rows=await db()<Row[]>`SELECT * FROM cdp_records WHERE user_id=${userId} AND role_id=${currentRoleId} AND status='completed' AND consumed_at IS NULL ORDER BY completed_at DESC LIMIT 1`;
  if(!rows[0])throw new Error(`A CDP de ${rank.nome} ainda não foi concluída. A promoção permanece bloqueada.`);
  return mapRow(rows[0]);
}

export async function consumePromotionCdp(recordId:string,targetRoleId:string){
  await ensureSchema();
  await db()`UPDATE cdp_records SET status='consumed',consumed_at=now(),consumed_for_role_id=${targetRoleId},updated_at=now() WHERE id=${recordId} AND status='completed'`;
}
