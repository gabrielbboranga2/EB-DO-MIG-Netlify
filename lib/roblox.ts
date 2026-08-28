import{DIVISOES}from'./divisoes-mig';
import{getPatenteByRoleId}from'./patentes';

export interface LiveMember{
  userId:string;
  username:string;
  displayName:string;
  rankName:string;
  division:string;
  divisions:string[];
  avatar:string;
  roleId:string;
  rankNumber:number;
  cdpActive:boolean;
  cdpStartedAt:string|null;
  cdpEndsAt:string|null;
}

export interface UserGroupMembership{
  sigla:string;
  groupId:number;
  roleId:string;
  roleName:string;
  rankNumber:number;
}

export interface LiveGroupRole{
  id:string;
  name:string;
  rank:number;
}

export interface LiveGroupHierarchy{
  groupId:number;
  sigla:string;
  name:string;
  roles:LiveGroupRole[];
}

type GroupMembership={path?:string;user?:string;role?:string;roles?:string[]};
type GroupRole={id?:string;path?:string;displayName?:string;rank?:number};
type PublicGroupRole={id:number;name:string;rank:number};
type GroupData={sigla:string;groupId:number;memberships:GroupMembership[];roles:Map<string,GroupRole>};

const CACHE_TTL=60_000;
let rosterCache:{expires:number;members:LiveMember[]}|null=null;
let rosterRequest:Promise<LiveMember[]>|null=null;
let hierarchyCache:{expires:number;groups:LiveGroupHierarchy[]}|null=null;
let hierarchyRequest:Promise<LiveGroupHierarchy[]>|null=null;

export interface RankChangeResult{
  groupId:number;
  community:string;
  userId:string;
  direction:'promotion'|'demotion';
  current:{id:string;name:string;rank:number};
  target:{id:string;name:string;rank:number};
}

export async function getLiveRoster():Promise<LiveMember[]>{
  if(rosterCache&&rosterCache.expires>Date.now())return rosterCache.members;
  if(rosterRequest)return rosterRequest;
  rosterRequest=loadRoster().then(members=>{
    rosterCache={members,expires:Date.now()+CACHE_TTL};
    rosterRequest=null;
    return members;
  }).catch(error=>{rosterRequest=null;throw error});
  return rosterRequest;
}

export async function getLiveHierarchies():Promise<LiveGroupHierarchy[]>{
  if(hierarchyCache&&hierarchyCache.expires>Date.now())return hierarchyCache.groups;
  if(hierarchyRequest)return hierarchyRequest;
  hierarchyRequest=loadHierarchies().then(groups=>{
    hierarchyCache={groups,expires:Date.now()+CACHE_TTL};
    hierarchyRequest=null;
    return groups;
  }).catch(error=>{hierarchyRequest=null;throw error});
  return hierarchyRequest;
}

export async function getUserGroupMemberships(userId:string):Promise<UserGroupMembership[]>{
  const apiKey=process.env.ROBLOX_API_KEY?.trim();
  if(!apiKey)throw new Error('ROBLOX_API_KEY não configurada.');
  const memberships=await Promise.all(DIVISOES.map(async division=>{
    const membership=await getGroupMembershipForUser(division.groupId,userId,apiKey);
    if(!membership)return null;
    const roleId=resourceId(membership.role)||resourceId(membership.roles?.at(-1));
    if(!roleId)return null;
    const roles=await listGroupRoles(division.groupId,apiKey);
    const role=roles.get(roleId);
    return{
      sigla:division.sigla,
      groupId:division.groupId,
      roleId,
      roleName:role?.displayName||'Membro',
      rankNumber:role?.rank||0,
    } satisfies UserGroupMembership;
  }));
  return memberships.filter((membership):membership is UserGroupMembership=>membership!==null);
}

async function loadRoster():Promise<LiveMember[]>{
  const apiKey=process.env.ROBLOX_API_KEY?.trim();
  if(!apiKey)throw new Error('ROBLOX_API_KEY não configurada.');

  const groups=await Promise.all(DIVISOES.map(async division=>{
    const[memberships,roles]=await Promise.all([
      listGroupMemberships(division.groupId,apiKey),
      listGroupRoles(division.groupId,apiKey),
    ]);
    return{sigla:division.sigla,groupId:division.groupId,memberships,roles} satisfies GroupData;
  }));

  const users=new Map<string,{memberships:Array<{group:GroupData;membership:GroupMembership}>}>();
  for(const group of groups){
    for(const membership of group.memberships){
      const userId=resourceId(membership.user);
      if(!userId)continue;
      const current=users.get(userId)||{memberships:[]};
      current.memberships.push({group,membership});
      users.set(userId,current);
    }
  }

  const userIds=[...users.keys()];
  const[profiles,avatars]=await Promise.all([fetchProfiles(userIds),fetchAvatars(userIds)]);

  return userIds.map(userId=>{
    const entries=users.get(userId)!.memberships;
    const mainEntry=entries.find(entry=>entry.group.sigla==='EXÉRCITO')||entries[0];
    const roleId=resourceId(mainEntry.membership.role)||resourceId(mainEntry.membership.roles?.at(-1))||'';
    const role=mainEntry.group.roles.get(roleId);
    const patente=getPatenteByRoleId(roleId);
    const divisions=entries.map(entry=>entry.group.sigla);
    const operationalDivisions=divisions.filter(division=>division!=='EXÉRCITO');
    const profile=profiles.get(userId);
    return{
      userId,
      username:profile?.name||`Usuário ${userId}`,
      displayName:profile?.displayName||profile?.name||`Usuário ${userId}`,
      rankName:patente?`[${patente.sigla}] ${patente.nome}`:role?.displayName||'Membro',
      division:operationalDivisions.join(' · ')||'EXÉRCITO',
      divisions,
      avatar:avatars.get(userId)||'',
      roleId,
      rankNumber:role?.rank??patente?.ordem??0,
      cdpActive:false,
      cdpStartedAt:null,
      cdpEndsAt:null,
    };
  }).sort((left,right)=>right.rankNumber-left.rankNumber||left.username.localeCompare(right.username,'pt-BR'));
}

export async function previewRankChange(userId:string,groupId:number,direction:'promotion'|'demotion'):Promise<RankChangeResult>{
  const apiKey=process.env.ROBLOX_API_KEY?.trim();
  if(!apiKey)throw new Error('ROBLOX_API_KEY não configurada.');
  const division=DIVISOES.find(item=>item.groupId===groupId);
  if(!division)throw new Error('Comunidade inválida.');
  const membership=await getGroupMembershipForUser(groupId,userId,apiKey);
  if(!membership)throw new Error('Este usuário não pertence à comunidade selecionada.');
  const currentId=resourceId(membership.role)||resourceId(membership.roles?.at(-1));
  if(!currentId)throw new Error('Não foi possível identificar o cargo atual.');
  const hierarchy=(await getLiveHierarchies()).find(group=>group.groupId===groupId);
  if(!hierarchy)throw new Error('Hierarquia indisponível.');
  const currentIndex=hierarchy.roles.findIndex(role=>role.id===currentId);
  if(currentIndex<0)throw new Error('O cargo atual não existe mais na hierarquia.');
  const targetIndex=direction==='promotion'?currentIndex-1:currentIndex+1;
  const current=hierarchy.roles[currentIndex];
  const target=hierarchy.roles[targetIndex];
  if(!target)throw new Error(direction==='promotion'?'O militar já está no cargo mais alto.':'O militar já está no cargo mais baixo.');
  return{groupId,community:division.sigla,userId,direction,current,target};
}

export async function applyRankChange(userId:string,groupId:number,direction:'promotion'|'demotion',expectedTargetRoleId:string):Promise<RankChangeResult>{
  const apiKey=process.env.ROBLOX_API_KEY?.trim();
  if(!apiKey)throw new Error('ROBLOX_API_KEY não configurada.');
  const change=await previewRankChange(userId,groupId,direction);
  if(change.target.id!==expectedTargetRoleId)throw new Error('A hierarquia mudou. Revise a alteração antes de confirmar.');
  const membershipId=userId;
  const base=`https://apis.roblox.com/cloud/v2/groups/${groupId}/memberships/${membershipId}`;
  const assign=await fetch(`${base}:assignRole`,{method:'POST',headers:{'x-api-key':apiKey,'content-type':'application/json'},body:JSON.stringify({role:`groups/${groupId}/roles/${change.target.id}`}),cache:'no-store'});
  if(!assign.ok)throw new Error(await robloxWriteError(assign,'O Roblox recusou a atribuição do novo cargo.'));
  const unassign=await fetch(`${base}:unassignRole`,{method:'POST',headers:{'x-api-key':apiKey,'content-type':'application/json'},body:JSON.stringify({role:`groups/${groupId}/roles/${change.current.id}`}),cache:'no-store'});
  if(!unassign.ok)throw new Error(await robloxWriteError(unassign,'O novo cargo foi atribuído, mas o cargo anterior não pôde ser removido.'));
  rosterCache=null;hierarchyCache=null;
  return change;
}

async function robloxWriteError(response:Response,fallback:string){
  try{const data=await response.json()as{message?:string;error?:{message?:string}};return data.error?.message||data.message||`${fallback} Código ${response.status}.`}catch{return`${fallback} Código ${response.status}.`}
}

async function loadHierarchies():Promise<LiveGroupHierarchy[]>{
  return Promise.all(DIVISOES.map(async division=>{
    const response=await fetch(`https://groups.roblox.com/v1/groups/${division.groupId}/roles`,{cache:'no-store'});
    if(!response.ok)throw new Error(`Falha ao consultar cargos públicos do grupo ${division.groupId} (${response.status}).`);
    const data=await response.json()as{roles?:PublicGroupRole[]};
    return{
      groupId:division.groupId,
      sigla:division.sigla,
      name:division.nome,
      roles:(data.roles||[]).map(role=>({id:String(role.id),name:role.name||'Cargo sem nome',rank:role.rank||0})).sort((left,right)=>right.rank-left.rank||left.name.localeCompare(right.name,'pt-BR')),
    };
  }));
}

async function listGroupMemberships(groupId:number,apiKey:string):Promise<GroupMembership[]>{
  const memberships:GroupMembership[]=[];
  let pageToken='';
  do{
    const url=new URL(`https://apis.roblox.com/cloud/v2/groups/${groupId}/memberships`);
    url.searchParams.set('maxPageSize','100');
    if(pageToken)url.searchParams.set('pageToken',pageToken);
    const response=await fetch(url,{headers:{'x-api-key':apiKey},cache:'no-store'});
    if(!response.ok)throw new Error(`Falha ao consultar membros do grupo ${groupId} (${response.status}).`);
    const data=await response.json()as{groupMemberships?:GroupMembership[];nextPageToken?:string};
    memberships.push(...(data.groupMemberships||[]));
    pageToken=data.nextPageToken||'';
  }while(pageToken);
  return memberships;
}

async function getGroupMembershipForUser(groupId:number,userId:string,apiKey:string):Promise<GroupMembership|null>{
  const url=new URL(`https://apis.roblox.com/cloud/v2/groups/${groupId}/memberships`);
  url.searchParams.set('maxPageSize','1');
  url.searchParams.set('filter',`user == 'users/${userId}'`);
  const response=await fetch(url,{headers:{'x-api-key':apiKey},cache:'no-store'});
  if(!response.ok)throw new Error(`Falha ao verificar o grupo ${groupId} (${response.status}).`);
  const data=await response.json()as{groupMemberships?:GroupMembership[]};
  return data.groupMemberships?.[0]||null;
}

async function listGroupRoles(groupId:number,apiKey:string):Promise<Map<string,GroupRole>>{
  const roles=new Map<string,GroupRole>();
  let pageToken='';
  do{
    const url=new URL(`https://apis.roblox.com/cloud/v2/groups/${groupId}/roles`);
    url.searchParams.set('maxPageSize','100');
    if(pageToken)url.searchParams.set('pageToken',pageToken);
    const response=await fetch(url,{headers:{'x-api-key':apiKey},cache:'no-store'});
    if(!response.ok)throw new Error(`Falha ao consultar patentes do grupo ${groupId} (${response.status}).`);
    const data=await response.json()as{groupRoles?:GroupRole[];nextPageToken?:string};
    for(const role of data.groupRoles||[]){const id=role.id||resourceId(role.path);if(id)roles.set(id,role)}
    pageToken=data.nextPageToken||'';
  }while(pageToken);
  return roles;
}

async function fetchProfiles(userIds:string[]):Promise<Map<string,{name:string;displayName:string}>>{
  const profiles=new Map<string,{name:string;displayName:string}>();
  await Promise.all(chunk(userIds,100).map(async ids=>{
    if(!ids.length)return;
    const response=await fetch('https://users.roblox.com/v1/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({userIds:ids.map(Number),excludeBannedUsers:false}),cache:'no-store'});
    if(!response.ok)return;
    const data=await response.json()as{data?:Array<{id:number;name:string;displayName:string}>};
    for(const profile of data.data||[])profiles.set(String(profile.id),{name:profile.name,displayName:profile.displayName});
  }));
  return profiles;
}

async function fetchAvatars(userIds:string[]):Promise<Map<string,string>>{
  const avatars=new Map<string,string>();
  await Promise.all(chunk(userIds,100).map(async ids=>{
    if(!ids.length)return;
    const url=new URL('https://thumbnails.roblox.com/v1/users/avatar-headshot');
    url.searchParams.set('userIds',ids.join(','));
    url.searchParams.set('size','150x150');
    url.searchParams.set('format','Png');
    url.searchParams.set('isCircular','false');
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)return;
    const data=await response.json()as{data?:Array<{targetId:number;imageUrl?:string}>};
    for(const avatar of data.data||[])if(avatar.imageUrl)avatars.set(String(avatar.targetId),avatar.imageUrl);
  }));
  return avatars;
}

function resourceId(path?:string):string{
  return path?.split('/').filter(Boolean).at(-1)||'';
}

function chunk<T>(items:T[],size:number):T[][]{
  const result:T[][]=[];
  for(let index=0;index<items.length;index+=size)result.push(items.slice(index,index+size));
  return result;
}
