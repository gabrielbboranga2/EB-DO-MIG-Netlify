export interface Divisao{
  id:number;
  nome:string;
  sigla:string;
 groupId:number;
}

export const DIVISOES:Divisao[]=[
  {id:1,nome:'Exército Brasileiro do Mig',sigla:'EXÉRCITO',groupId:521106467},
  {id:2,nome:'Staff',sigla:'STAFF',groupId:319140811},
  {id:3,nome:'Rota Forças Especiais',sigla:'BFE',groupId:34565583},
  {id:4,nome:'Centro De Inteligência Do Exército',sigla:'CIE',groupId:729809284},
  {id:5,nome:'Batalhão De Ações De Comandos',sigla:'BAC',groupId:886757353},
  {id:6,nome:'Batalhão De Polícia Do Exército',sigla:'BPE',groupId:710960394},
];

export const DIVISION_IDS=new Set(DIVISOES.map(d=>d.groupId));

export function getDivisaoByGroupId(groupId:number):Divisao|undefined{
  return DIVISOES.find(d=>d.groupId===groupId);
}

export function getDivisaoBySigla(sigla:string):Divisao|undefined{
  return DIVISOES.find(d=>d.sigla===sigla);
}

export function isMainGroup(groupId:number):boolean{
  return groupId===521106467;
}
