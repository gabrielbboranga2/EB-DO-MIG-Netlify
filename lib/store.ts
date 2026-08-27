import{readFileSync,writeFileSync,existsSync}from'fs';
import{join}from'path';

const DATA_DIR=process.env.VERCEL?'/tmp':join(process.cwd(),'.data');
const MEMBERS_FILE=join(DATA_DIR,'members.json');
const AUDIT_FILE=join(DATA_DIR,'audit.json');

export interface Member{
  userId:string;
  username:string;
  avatar:string;
  rankName:string;
  rankNumber:number;
  roleId:string;
  division:string;
  divisionRole:string;
  lastSync:string;
  joinedAt:string;
  cdpActive:boolean;
  cdpInicio:string|null;
  cdpFim:string|null;
}

export interface AuditLog{
  id:string;
  tipo:'promocao'|'rebaixamento'|'treino'|'verificacao'|'login';
  userId:string;
  username:string;
  descricao:string;
  timestamp:string;
  autorId?:string;
  autorUsername?:string;
}

function ensureDir(){
  if(!existsSync(DATA_DIR)){
    const{mkdirSync}=require('fs');
    mkdirSync(DATA_DIR,{recursive:true});
  }
}

export function getMembers():Member[]{
  ensureDir();
  if(!existsSync(MEMBERS_FILE))return[];
  try{return JSON.parse(readFileSync(MEMBERS_FILE,'utf8'))}catch{return[]}
}

export function saveMembers(members:Member[]){
  ensureDir();
  writeFileSync(MEMBERS_FILE,JSON.stringify(members,null,2));
}

export function getMember(userId:string):Member|undefined{
  return getMembers().find(m=>m.userId===userId);
}

export function upsertMember(data:Partial<Member>&{userId:string}):Member{
  const members=getMembers();
  const idx=members.findIndex(m=>m.userId===data.userId);
  const now=new Date().toISOString();
  if(idx>=0){
    members[idx]={...members[idx],...data,lastSync:now};
  }else{
    members.push({...data,lastSync:now,joinedAt:now,cdpActive:false,cdpInicio:null,cdpFim:null}as Member);
  }
  saveMembers(members);
  return members[idx>=0?idx:members.length-1];
}

export function getAuditLogs(limit?:number):AuditLog[]{
  ensureDir();
  if(!existsSync(AUDIT_FILE))return[];
  try{
    const logs:AuditLog[]=JSON.parse(readFileSync(AUDIT_FILE,'utf8'));
    return limit?logs.slice(-limit):logs;
  }catch{return[]}
}

export function addAuditLog(log:Omit<AuditLog,'id'|'timestamp'>){
  ensureDir();
  const logs=getAuditLogs();
  logs.push({...log,id:crypto.randomUUID(),timestamp:new Date().toISOString()});
  writeFileSync(AUDIT_FILE,JSON.stringify(logs,null,2));
}

export function getStats(){
  const members=getMembers();
  const logs=getAuditLogs();
  const now=new Date();
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
  const treinosMes=logs.filter(l=>l.tipo==='treino'&&l.timestamp>=monthStart).length;
  const emCdp=members.filter(m=>m.cdpActive).length;
  const lastSync=members.length>0?members.reduce((a,b)=>a.lastSync>b.lastSync?a:b).lastSync:null;
  const divisions:Record<string,number>={};
  members.forEach(m=>{divisions[m.division]=(divisions[m.division]||0)+1});
  return{
    totalSincronizados:members.length,
    emCdp,
    treinosMes,
    acoesRegistradas:logs.length,
    ultimaSincronizacao:lastSync,
    divisoes:divisions,
    atividadesRecentes:logs.slice(-10).reverse()
  };
}
