export interface Patente{
  roleId:string;
  nome:string;
  sigla:string;
  ordem:number;
  cdpDias:number;
  categoria:'praca'|'graduado'|'oficial'|'oficial_alta'|'general'|'elite'|'comando'|'staff';
  promovivel:boolean;
}

export const PATENTES:Patente[]=[
  // PRAÇAS
  {roleId:'808360028',nome:'Recruta',sigla:'REC',ordem:1,cdpDias:0,categoria:'praca',promovivel:true},
  {roleId:'807380036',nome:'Soldado',sigla:'SLD',ordem:2,cdpDias:1,categoria:'praca',promovivel:true},
  {roleId:'808664027',nome:'Cabo',sigla:'CB',ordem:3,cdpDias:2,categoria:'praca',promovivel:true},
  // GRADUADOS
  {roleId:'808768016',nome:'Terceiro Sargento',sigla:'3° SGT',ordem:4,cdpDias:3,categoria:'graduado',promovivel:true},
  {roleId:'807586006',nome:'Segundo Sargento',sigla:'2° SGT',ordem:5,cdpDias:4,categoria:'graduado',promovivel:true},
  {roleId:'808672021',nome:'Primeiro Sargento',sigla:'1° SGT',ordem:6,cdpDias:5,categoria:'graduado',promovivel:true},
  {roleId:'807600025',nome:'Sub-tenente',sigla:'ST',ordem:7,cdpDias:6,categoria:'graduado',promovivel:true},
  // OFICIAIS
  {roleId:'808476008',nome:'Cadete',sigla:'CT',ordem:8,cdpDias:7,categoria:'oficial',promovivel:true},
  {roleId:'807968016',nome:'Aspirante a Oficial',sigla:'ASP',ordem:9,cdpDias:8,categoria:'oficial',promovivel:true},
  {roleId:'807316021',nome:'Segundo Tenente',sigla:'2° TEN',ordem:10,cdpDias:9,categoria:'oficial',promovivel:true},
  {roleId:'808600018',nome:'Primeiro Tenente',sigla:'1° TEN',ordem:11,cdpDias:10,categoria:'oficial',promovivel:true},
  {roleId:'808906015',nome:'Capitão',sigla:'CAP',ordem:12,cdpDias:11,categoria:'oficial',promovivel:true},
  // OFICIAIS ALTA PATENTE
  {roleId:'808546029',nome:'Major',sigla:'MAJ',ordem:13,cdpDias:12,categoria:'oficial_alta',promovivel:true},
  {roleId:'808550021',nome:'Tenente Coronel',sigla:'TEN-CEL',ordem:14,cdpDias:13,categoria:'oficial_alta',promovivel:true},
  {roleId:'808720009',nome:'Coronel',sigla:'CEL',ordem:15,cdpDias:14,categoria:'oficial_alta',promovivel:true},
  // GENERAIS
  {roleId:'807207025',nome:'General de Brigada',sigla:'GEN BDA',ordem:16,cdpDias:15,categoria:'general',promovivel:true},
  {roleId:'808548018',nome:'General de Divisão',sigla:'GEN DV',ordem:17,cdpDias:16,categoria:'general',promovivel:true},
  {roleId:'807864034',nome:'General de Exército',sigla:'GEN EX',ordem:18,cdpDias:17,categoria:'general',promovivel:true},
  // ELITE
  {roleId:'807650018',nome:'Elite Militar',sigla:'EM',ordem:19,cdpDias:0,categoria:'elite',promovivel:false},
  {roleId:'807706020',nome:'Elite Secreta',sigla:'ES',ordem:20,cdpDias:0,categoria:'elite',promovivel:false},
  {roleId:'807380035',nome:'Elite Real',sigla:'ER',ordem:21,cdpDias:0,categoria:'elite',promovivel:false},
  // COMANDO
  {roleId:'807942018',nome:'Subcomandante',sigla:'SCMT',ordem:22,cdpDias:0,categoria:'comando',promovivel:false},
  {roleId:'808710014',nome:'Comandante',sigla:'CMT',ordem:23,cdpDias:0,categoria:'comando',promovivel:false},
  // STAFF (não promovíveis pelo sistema)
  {roleId:'808600017',nome:'Sócio',sigla:'SC',ordem:24,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'807976018',nome:'Influencer',sigla:'INF',ordem:25,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'807914044',nome:'Helper',sigla:'HLP',ordem:26,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'808432019',nome:'Moderador',sigla:'MOD',ordem:27,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'808204030',nome:'Trial-Moderator',sigla:'TR',ordem:28,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'808546027',nome:'Administrador',sigla:'ADM',ordem:29,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'808416010',nome:'Administrador Geral',sigla:'ADM-G',ordem:30,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'807678010',nome:'Supervisor',sigla:'SUP',ordem:31,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'808464049',nome:'Diretor',sigla:'DR',ordem:32,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'808212031',nome:'Diretor-Geral',sigla:'DR-G',ordem:33,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'808710013',nome:'Vice Presidente',sigla:'VP',ordem:34,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'807784020',nome:'Presidente',sigla:'PRES',ordem:35,cdpDias:0,categoria:'staff',promovivel:false},
  // CRIADORES (rank 253-255, acima de tudo)
  {roleId:'808432025',nome:'Developer',sigla:'DEV',ordem:36,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'808710012',nome:'Sub Criador',sigla:'SCR',ordem:37,cdpDias:0,categoria:'staff',promovivel:false},
  {roleId:'808700015',nome:'Criador',sigla:'CR',ordem:38,cdpDias:0,categoria:'comando',promovivel:false},
];

export function getPatenteByRoleId(roleId:string):Patente|undefined{
  return PATENTES.find(p=>p.roleId===roleId);
}

export function getPatenteByRank(rankNumber:number):Patente|undefined{
  return PATENTES.find(p=>p.ordem===rankNumber);
}

export function getProximaPatente(currentRoleId:string):Patente|undefined{
  const current=getPatenteByRoleId(currentRoleId);
  if(!current||!current.promovivel)return undefined;
  return PATENTES.find(p=>p.ordem===current.ordem+1);
}

export function canPromote(roleId:string):boolean{
  const p=getPatenteByRoleId(roleId);
  if(!p)return false;
  return p.promovivel&&p.ordem>=8;
}

export function canAdmin(roleId:string):boolean{
  const p=getPatenteByRoleId(roleId);
  if(!p)return false;
  return p.ordem>=16||p.categoria==='staff';
}

export function isAltoComando(roleId:string):boolean{
  const p=getPatenteByRoleId(roleId);
  if(!p)return false;
  return p.ordem>=19||p.categoria==='comando';
}
