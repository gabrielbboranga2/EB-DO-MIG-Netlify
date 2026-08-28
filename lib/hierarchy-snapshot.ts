import{DIVISOES}from'./divisoes-mig';
import type{LiveGroupHierarchy}from'./roblox';

const VERIFIED_AT='2026-08-28';
const ROLE_SPECS:Record<string,string>={
  'EXÉRCITO':'255|[CR] Criador;109|[M-PT] Monitor de patente;108|[RESP-STF] Responsável Staff;107|[DRT-G] Diretor-Geral;106|[DRT] Diretor;105|[V-DRT] Vice-Diretor;104|[T-MOD] Trial-moderador;103|[MOD] Moderador;102|[SUP] Suporte;101|[HLP] Helper;100|[INF] Influencer;27|[PRES] Presidente;26|[VP] Vice Presidente;25|[MAR] Marechal;24|[CMD] Comandante;23|[SCMT] Sub comandante;22|[ER] Elite Real;21|[ES] Elite Secreta;20|[EM] Elite Militar;19|[GEN EX] General de Exército;18|[GEN DV] General de Divisão;17|[GEN BDA] General de Brigada;16|[ADM] Administrador;15|[CEL] Coronel;14|[TEN-CEL] Tenente Coronel;13|[MAJ] Major;12|[CAP] Capitão;11|[1° TEN] Primeiro Tenente;10|[2° TEN] Segundo Tenente;9|[ASP] Aspirante a Oficial;8|[CT] Cadete;7|[ST] Sub-tenente;6|[1° SGT] Primeiro Sargento;5|[2° SGT] Segundo Sargento;4|[3° SGT] Terceiro Sargento;3|[CB] Cabo;2|[SLD] Soldado;1|[REC] Recruta;1|Membro;0|Visitante',
  'STAFF':'254|[CR] CRIADORES;244|[RESP-STFF] RESPONSAVEL STAFF;8|[DRT-G] Diretor-Geral;7|[DR] Diretor;6|[V-DRT] VICE DIRETOR;5|[ADM-G] Administrador Geral;4|[ADM] Administrador;3|[MOD] MODERADOR;2|[SUP] SUPORTE;1|[HLP] HELPER;0|Visitante',
  'BFE':'251|[RESP-D] RESPONSAVEL DIVISIONAL;10|[BFE] Criador;9|[BFE] DONO;8|[BFE] SUPERVISOR-GERAL;7|[BFE] SUPERVISOR;6|[BFE] COMANDANTE;5|[BFE] SUB-COMANDANTE;4|[BFE] ALTO-ESCALÃO;4|[BFE] OFICIAL;3|[BFE] GRADUADO;2|[BFE] PRAÇAS;1|[BFE] CANDIDATO;1|Membro;0|Visitante',
  'CIE':'255|[RESP-D] RESPONSAVEL DIVISIONAL;244|[CIE] DONO;9|[CIE] SUPERVISOR-GERAL;8|[CIE] SUPERVISOR;7|[CIE] COMANDANTE;6|[CIE] SUB-COMANDANTE;5|[CIE] ALTO-ESCALÃO;4|[CIE] OFICIAL;3|[CIE] GRADUADO;2|[CIE] PRAÇAS;1|[CIE] CANDIDATO;0|Visitante',
  'BAC':'255|[RESP-D] RESPONSAVEL DIVISIONAL;244|[BAC] DONO;9|[BAC] SUPERVISOR-GERAL;8|[BAC] SUPERVISOR;7|[BAC] COMANDANTE;6|[BAC] SUB-COMANDANTE;5|[BAC] ALTO-ESCALÃO;4|[BAC] OFICIAL;3|[BAC] GRADUADO;2|[BAC] PRAÇAS;1|[BAC] CANDIDATO;0|Visitante',
  'BPE':'255|[RESP-D] RESPONSAVEL DIVISIONAL;244|[BPE] DONO;9|[BPE] SUPERVISOR-GERAL;8|[BPE] SUPERVISOR;7|[BPE] COMANDANTE;6|[BPE] SUB-COMANDANTE;5|[BPE] ALTO-ESCALÃO;4|[BPE] OFICIAL;3|[BPE] GRADUADO;2|[BPE] PRAÇAS;1|[BPE] CANDIDATO;0|Visitante',
};

export function getHierarchySnapshot():LiveGroupHierarchy[]{
  return DIVISOES.map(group=>({groupId:group.groupId,sigla:group.sigla,name:group.nome,roles:(ROLE_SPECS[group.sigla]||'').split(';').filter(Boolean).map((spec,index)=>{const separator=spec.indexOf('|');return{id:`snapshot-${group.groupId}-${index}`,rank:Number(spec.slice(0,separator)),name:spec.slice(separator+1)}})}));
}

export{VERIFIED_AT as HIERARCHY_SNAPSHOT_DATE};
