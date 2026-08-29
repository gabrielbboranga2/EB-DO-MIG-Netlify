'use client';
import{useState,useEffect}from'react';
import{DashboardShell,EmptyState,PanelHead}from'../components/DashboardShell';
import{TrainingRegistration}from'../components/TrainingRegistration';
import{DiscordConfiguration}from'../components/DiscordConfiguration';
import{RankChangeWorkflow}from'../components/RankChangeWorkflow';
import{CdpMemberControl,CdpPersonalStatus,CdpSettingsManager,ClientCdp}from'../components/CdpSystem';
import{BulkRankManager}from'../components/BulkRankManager';
const DIVISION_SIGLAS=['EXÉRCITO','STAFF','BFE','CIE','BAC','BPE'];
const EVENT_ICONS:Record<string,string>={'promocao':'UP','rebaixamento':'RB','treino':'TR','verificacao':'VR','login':'LG'};
type Stats={totalSincronizados:number;emCdp:number;treinosMes:number;acoesRegistradas:number;ultimaSincronizacao:string|null;divisoes:Record<string,number>;atividadesRecentes:Array<{id:string;tipo:string;userId:string;username:string;descricao:string;timestamp:string;relativeLabel?:string}>};

const MOCK_STATS:Stats={
  totalSincronizados:108,
  emCdp:0,
  treinosMes:24,
  acoesRegistradas:138,
  ultimaSincronizacao:'2026-08-28T12:00:00.000Z',
  divisoes:{'EXÉRCITO':108,STAFF:12,BFE:18,CIE:9,BAC:14,BPE:21},
  atividadesRecentes:[
    {id:'1',tipo:'promocao',userId:'102',username:'Sgt. Silva',descricao:'Promovido para Terceiro Sargento',timestamp:'2026-08-28T11:52:00.000Z',relativeLabel:'há 8min'},
    {id:'2',tipo:'treino',userId:'225',username:'Ten. Rocha',descricao:'Treino de navegação concluído · BFE',timestamp:'2026-08-28T11:05:00.000Z',relativeLabel:'há 55min'},
    {id:'3',tipo:'verificacao',userId:'390',username:'Sistema',descricao:'Sincronização do efetivo concluída',timestamp:'2026-08-28T09:00:00.000Z',relativeLabel:'há 3h'},
  ],
};

export default function Preview(){
  const[active,setActive]=useState('Visão geral');
  const[stats,setStats]=useState<Stats>(MOCK_STATS);
  useEffect(()=>{fetch('/api/dashboard/stats').then(r=>r.json()).then(data=>{if(data?.divisoes&&Array.isArray(data.atividadesRecentes))setStats(data)}).catch(()=>null)},[]);

  const pages:Record<string,()=>React.ReactElement>={
    'Visão geral':()=><VisaoGeral stats={stats}/>,
    'Militares':()=><MilitaresView/>,
    'Hierarquia':()=><HierarchyView/>,
    'Capacitação · CDP':()=><CapacitacaoView/>,
    'Treinamentos':()=><TreinamentosView/>,
    'Promoções · UP':()=><PromocoesView/>,
    'Rebaixamentos':()=><RebaixamentosView/>,
    'Registros':()=><RegistrosView/>,
    'Painel do criador':()=><PainelCriadorView/>,
    'Configurações':()=><ConfiguracoesView/>,
  };

  return <DashboardShell active={active} onNavigate={setActive} username="ComandanteEB" rank="[CR] Criador" isAdmin preview>
    <div className="eyebrow">CENTRAL DE COMANDO <i/> DADOS DEMONSTRATIVOS</div>
    {pages[active]?.()}
  </DashboardShell>;
}

function VisaoGeral({stats}:{stats:Stats}){
  const ds:[string,string,string][]=stats?[
    ['Militares sincronizados',String(stats.totalSincronizados),stats.ultimaSincronizacao?`Último sync: ${new Date(stats.ultimaSincronizacao).toLocaleDateString('pt-BR')}`:'Aguardando sync'],
    ['Em capacitação',String(stats.emCdp),'CDP ativo'],['Treinos realizados',String(stats.treinosMes),'Este mês'],['Ações registradas',String(stats.acoesRegistradas),'Total']
  ]:[['Militares sincronizados','—','—'],['Em capacitação','—','—'],['Treinos realizados','—','—'],['Ações registradas','—','—']];
  const divs=DIVISION_SIGLAS.map(s=>[s,String(stats.divisoes?.[s]||0)]as[string,string]);
  return<><div className="hero"><div><h1>Visão geral</h1><p>Bem-vindo ao centro de operações do EB DO MIG.</p></div><div className="hero-status preview"><i/>AMBIENTE DEMONSTRATIVO</div></div>
<div className="stats">{ds.map(([l,v,d],i)=><article className="stat" key={l}><div><span>{l}</span><i>{String(i+1).padStart(2,'0')}</i></div><strong>{v}</strong><small>{d}</small></article>)}</div>
<div className="main-grid"><article className="panel activity"><PanelHead tag="TEMPO REAL" title="Atividade recente"/><div className="timeline">{stats?.atividadesRecentes?.length?stats.atividadesRecentes.map(ev=><div className="event" key={ev.id}><span className="event-icon">{EVENT_ICONS[ev.tipo]||'EV'}</span><div><b>{ev.username}</b><p>{ev.descricao}</p><small>{ev.relativeLabel||getTimeAgo(ev.timestamp)}</small></div><em>{ev.tipo.toUpperCase()}</em></div>):<EmptyState text="Ações reais aparecerão após sincronização."/>}</div></article>
<aside className="right"><article className="panel"><PanelHead tag="CAPACITAÇÃO" title="CDP ativo"/>{stats?.emCdp?<div className="compact-metric"><strong>{stats.emCdp}</strong><span>militares em capacitação</span><small>Acompanhamento em andamento</small></div>:<EmptyState text="Nenhuma CDP ativa"/>}</article></aside></div>
<article className="panel divisions"><PanelHead tag="ORGANIZAÇÃO" title="Divisões" action={`TOTAL · ${divs.reduce((a,[,c])=>a+parseInt(c),0)} VÍNCULOS`}/><div className="division-list">{divs.map(([n,c])=><div className="division" key={n}><b>{n}</b><small>{c} membros</small><div><i style={{width:`${Math.min(100,parseInt(c)*4)}%`}}/></div></div>)}</div></article></>}

function MilitaresView(){
  const[query,setQuery]=useState('');
  const[division,setDivision]=useState('');
  type PreviewMember={userId:string;username:string;displayName:string;rankName:string;division:string;divisions:string[];roleId:string;cdpActive:boolean;cdpStartedAt:string|null;cdpEndsAt:string|null;cdpRecordId?:string|null};
  const[selected,setSelected]=useState<PreviewMember|null>(null);
  const[members,setMembers]=useState<PreviewMember[]>([
    {userId:'102481',username:'SgtSilva',displayName:'Silva',rankName:'[3º SGT] Terceiro Sargento',division:'EXÉRCITO · BFE',divisions:['EXÉRCITO','BFE'],roleId:'808768016',cdpActive:false,cdpStartedAt:null,cdpEndsAt:null},
    {userId:'208315',username:'RochaComando',displayName:'Rocha',rankName:'[1º TEN] Primeiro Tenente',division:'EXÉRCITO · BAC',divisions:['EXÉRCITO','BAC'],roleId:'808600018',cdpActive:false,cdpStartedAt:null,cdpEndsAt:null},
    {userId:'391027',username:'CostaBPE',displayName:'Costa',rankName:'[CB] Cabo',division:'EXÉRCITO · BPE',divisions:['EXÉRCITO','BPE'],roleId:'808664027',cdpActive:false,cdpStartedAt:null,cdpEndsAt:null},
    {userId:'485921',username:'IntelMIG',displayName:'Inteligência MIG',rankName:'[2º SGT] Segundo Sargento',division:'EXÉRCITO · CIE',divisions:['EXÉRCITO','CIE'],roleId:'807586006',cdpActive:false,cdpStartedAt:null,cdpEndsAt:null},
    {userId:'512804',username:'StaffMIG',displayName:'Equipe MIG',rankName:'Administrador',division:'STAFF',divisions:['STAFF'],roleId:'808546027',cdpActive:false,cdpStartedAt:null,cdpEndsAt:null},
    {userId:'640219',username:'RecrutaMIG',displayName:'Novo Recruta',rankName:'[REC] Recruta',division:'EXÉRCITO',divisions:['EXÉRCITO'],roleId:'808360028',cdpActive:false,cdpStartedAt:null,cdpEndsAt:null},
  ]);
  const counts=Object.fromEntries(DIVISION_SIGLAS.map(sigla=>[sigla,members.filter(member=>member.divisions.includes(sigla)).length]));
  const filtered=members.filter(member=>(!division||member.divisions.includes(division))&&(!query||`${member.username} ${member.displayName} ${member.userId} ${member.rankName}`.toLowerCase().includes(query.toLowerCase())));
  const changeDivision=(next:string)=>{setDivision(next==='TODOS'?'':next);setSelected(null)};
  const updateCdp=(record:ClientCdp|null)=>{const active=record?.status==='active';const patch={cdpActive:active,cdpStartedAt:active?record.startedAt:null,cdpEndsAt:active?record.endsAt:null,cdpRecordId:active?record.id:null};setMembers(current=>current.map(member=>member.userId===selected?.userId?{...member,...patch}:member));setSelected(current=>current?{...current,...patch}:current)};
  return<div className="workspace-grid roster-layout"><article className="panel workspace"><div className="workspace-toolbar roster-toolbar"><div><span className="kicker">EFETIVO DEMONSTRATIVO</span><h2>Integrantes das comunidades</h2><p>Representação do painel conectado aos seis grupos oficiais.</p></div><div className="roster-total"><strong>{filtered.length}</strong><span>{query?'resultados':division?'integrantes':'militares únicos'}</span></div></div>
<label className="workspace-search"><span className="search-code" aria-hidden="true">BUSCA</span><input placeholder="Nome, ID ou patente" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null)}}/></label>
<div className="division-tabs roster-tabs">{['TODOS',...DIVISION_SIGLAS].map(s=><button type="button" key={s} className={(s==='TODOS'&&!division)||division===s?'active':''} onClick={()=>changeDivision(s)}><span>{s}</span><small>{s==='TODOS'?members.length:counts[s]}</small></button>)}</div>
<div className="roster-context"><span><i/>ROBLOX OPEN CLOUD</span><small>{filtered.length} {filtered.length===1?'integrante encontrado':'integrantes encontrados'}</small></div>
<div className="records roster-records">{filtered.length?filtered.map(member=><button type="button" key={member.userId} className={selected?.userId===member.userId?'selected':''} onClick={()=>setSelected(member)}><span className="record-avatar-shell"><span>{member.username.slice(0,2).toUpperCase()}</span></span><div><b>{member.username}</b><span className="display-name">{member.displayName}</span><small>{member.rankName} · {member.division}</small></div><span className="record-side"><span className={`cdp-chip ${member.cdpActive?'active':'inactive'}`}>{member.cdpActive?'EM CDP':'FORA DA CDP'}</span><em>ID: {member.userId}</em></span></button>):<EmptyState title="Nenhum militar encontrado" text="Tente outro nome, patente ou comunidade."/>}</div></article>
{selected?<aside className="panel member-detail roster-detail"><div className="member-header"><span className="member-avatar avatar-fallback">{selected.username.slice(0,2).toUpperCase()}</span><div><b>{selected.username}</b><small>{selected.displayName}</small><small>{selected.rankName}</small><small>Comunidades: {selected.division}</small><small>ID: {selected.userId}</small></div></div><CdpMemberControl key={selected.userId} member={selected} canManage preview onChange={updateCdp}/><a className="member-profile-link" href={`https://www.roblox.com/users/${selected.userId}/profile`} target="_blank" rel="noreferrer">Abrir perfil no Roblox ↗</a></aside>:<aside className="panel help roster-help"><span className="kicker">COMUNIDADES CONECTADAS</span><h2>Selecione um integrante</h2><p>Clique em um registro para conferir patente, comunidades e situação da CDP.</p><div className="community-summary">{DIVISION_SIGLAS.map(sigla=><div key={sigla}><span>{sigla}</span><b>{counts[sigla]}</b></div>)}</div><div className="initial-cdp-note"><i/>Todos começam fora da CDP</div></aside>}</div>}

function HierarchyView(){
  const[selected,setSelected]=useState('EXÉRCITO');
  const[query,setQuery]=useState('');
  const[groups,setGroups]=useState<Array<{groupId:number;sigla:string;name:string;roles:Array<{id:string;rank:number;name:string}>}>>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  useEffect(()=>{fetch('/api/hierarquia').then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);return data}).then(data=>setGroups(data.groups||[])).catch(()=>setError('Não foi possível consultar os cargos atuais no Roblox.')).finally(()=>setLoading(false))},[]);
  const group=groups.find(item=>item.sigla===selected)||groups[0];
  const roles=(group?.roles||[]).filter(role=>!query||role.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return<div className="hierarchy-page"><div className="hero hierarchy-hero"><div><span className="kicker">ESTRUTURA OFICIAL</span><h1>Hierarquia militar</h1><p>Cargos atuais carregados diretamente das seis comunidades no Roblox.</p></div><div className="hero-status preview"><i/>DADOS REAIS · PREVIEW</div></div><article className="panel hierarchy-panel"><div className="workspace-toolbar"><div><span className="kicker">COMUNIDADE</span><h2>{group?.name||selected}</h2></div><span className="panel-meta">{loading?'SINCRONIZANDO':`${roles.length} CARGOS`}</span></div><div className="division-tabs hierarchy-tabs">{DIVISION_SIGLAS.map(sigla=><button type="button" key={sigla} className={selected===sigla?'active':''} onClick={()=>{setSelected(sigla);setQuery('')}}>{sigla}</button>)}</div><label className="workspace-search"><span className="search-code" aria-hidden="true">BUSCA</span><input placeholder="Buscar cargo ou patente" value={query} onChange={event=>setQuery(event.target.value)}/></label>{loading?<EmptyState title="Sincronizando hierarquia" text="Consultando os cargos atuais no Roblox..."/>:error?<EmptyState title="Hierarquia indisponível" text={error}/>:<div className="hierarchy-list">{roles.map((role,index)=><article className="hierarchy-role" key={role.id}><span className="hierarchy-order">#{String(role.rank).padStart(3,'0')}</span><div><b>{role.name}</b><small>{selected} · cargo oficial da comunidade</small></div><em>{index===0?'TOPO':index===roles.length-1?'BASE':'ATIVO'}</em></article>)}</div>}</article></div>}

function CapacitacaoView(){
  return<CdpPersonalStatus user={{id:'391027',username:'gabribor-sola',rank:'[SLD] Soldado'}} preview/>}

function TreinamentosView(){return<TrainingRegistration instructor="gabribor-sola" instructorRank={9} instructorRole="[ASP] Aspirante a Oficial" membershipRanks={[{sigla:'STAFF',rank:4,role:'[ADM] Administrador'},{sigla:'BFE',rank:4,role:'[BFE] OFICIAL'},{sigla:'CIE',rank:4,role:'[CIE] OFICIAL'},{sigla:'BAC',rank:4,role:'[BAC] OFICIAL'},{sigla:'BPE',rank:4,role:'[BPE] OFICIAL'}]} preview/>}

function PromocoesView(){
  return <RankChangeWorkflow mode="promotion" preview/>;
}

function RebaixamentosView(){
  return <RankChangeWorkflow mode="demotion" preview/>;
}

function RegistrosView(){
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">AUDITORIA</span><h2>Registros</h2></div></div>
<EmptyState text="Faça login como criador para ver os registros do Discord."/></article></div>}

function PainelCriadorView(){
  const[tab,setTab]=useState<'cdp'|'patentes'|'massa'|'treinos'>('cdp');
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">ACESSO MÁXIMO</span><h2>Painel do Criador</h2></div></div>
<div className="division-tabs">{[{k:'cdp',l:'CDP por Patente'},{k:'patentes',l:'Patentes e Hierarquia'},{k:'massa',l:'Gestão em massa'},{k:'treinos',l:'Treinamentos'}].map(t=><button key={t.k} className={tab===t.k?'active':''} onClick={()=>setTab(t.k as typeof tab)}>{t.l}</button>)}</div>
{tab==='cdp'&&<CdpConfigView/>}
{tab==='patentes'&&<PatentesConfigView/>}
{tab==='massa'&&<BulkRankManager previewMode/>}
{tab==='treinos'&&<TreinosConfigView/>}
</article></div>}

function CdpConfigView(){return<CdpSettingsManager preview/>}

function PatentesConfigView(){
  const[patentes,setPatentes]=useState([
    {sigla:'REC',nome:'Recruta',cat:'Praças'},{sigla:'SLD',nome:'Soldado',cat:'Praças'},
    {sigla:'CB',nome:'Cabo',cat:'Praças'},{sigla:'3° SGT',nome:'Terceiro Sargento',cat:'Graduados'},
    {sigla:'2° SGT',nome:'Segundo Sargento',cat:'Graduados'},{sigla:'1° SGT',nome:'Primeiro Sargento',cat:'Graduados'},
    {sigla:'ST',nome:'Sub-tenente',cat:'Graduados'},{sigla:'CT',nome:'Cadete',cat:'Oficiais'},
    {sigla:'ASP',nome:'Aspirante a Oficial',cat:'Oficiais'},{sigla:'2° TEN',nome:'Segundo Tenente',cat:'Oficiais'},
    {sigla:'1° TEN',nome:'Primeiro Tenente',cat:'Oficiais'},{sigla:'CAP',nome:'Capitão',cat:'Oficiais'},
    {sigla:'MAJ',nome:'Major',cat:'Oficiais Alta'},{sigla:'TEN-CEL',nome:'Tenente Coronel',cat:'Oficiais Alta'},
    {sigla:'CEL',nome:'Coronel',cat:'Oficiais Alta'},{sigla:'GEN BDA',nome:'General de Brigada',cat:'Generais'},
    {sigla:'GEN DV',nome:'General de Divisão',cat:'Generais'},{sigla:'GEN EX',nome:'General de Exército',cat:'Generais'},
    {sigla:'EM',nome:'Elite Militar',cat:'Elite'},{sigla:'ES',nome:'Elite Secreta',cat:'Elite'},
    {sigla:'ER',nome:'Elite Real',cat:'Elite'},{sigla:'SCMT',nome:'Subcomandante',cat:'Comando'},
    {sigla:'CMT',nome:'Comandante',cat:'Comando'},
  ]);
  const[addMode,setAddMode]=useState(false);
  const[sigla,setSigla]=useState('');
  const[nome,setNome]=useState('');
  const add=()=>{if(!sigla.trim()||!nome.trim())return;setPatentes(current=>[...current,{sigla:sigla.trim().toUpperCase(),nome:nome.trim(),cat:'Praças'}]);setSigla('');setNome('');setAddMode(false)};
  return<><h3 style={{margin:'12px 0',color:'var(--text)'}}>Hierarquia de Patentes — Exército</h3>
<button type="button" className="primary" style={{marginBottom:12}} onClick={()=>setAddMode(current=>!current)}>{addMode?'Cancelar':'＋ Adicionar patente'}</button>
{addMode&&<div className="add-form"><input aria-label="Sigla da patente" placeholder="Sigla" value={sigla} onChange={e=>setSigla(e.target.value)}/><input aria-label="Nome da patente" placeholder="Nome completo" value={nome} onChange={e=>setNome(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/><button type="button" className="primary" disabled={!sigla.trim()||!nome.trim()} onClick={add}>Adicionar</button></div>}
<div className="records">{patentes.map(p=><div className="record" key={p.sigla}><span className="record-avatar">{p.sigla.slice(0,3)}</span><div><b>[{p.sigla}] {p.nome}</b><small>{p.cat}</small></div><em>ATIVA</em></div>)}</div></>}

function TreinosConfigView(){
  const[treinos,setTreinos]=useState(['Tiro ao alvo','Navegação terrestre','Primeiros socorros','Combate corpo a corpo','Instruções de rádio','Marcha de resistência']);
  const[novo,setNovo]=useState('');
  const add=()=>{if(!novo.trim())return;setTreinos(current=>[...current,novo.trim()]);setNovo('')};
  return<><h3 style={{margin:'12px 0',color:'var(--text)'}}>Treinamentos do Exército</h3>
<div className="add-form-inline"><input aria-label="Nome do novo treinamento" placeholder="Nome do novo treino" value={novo} onChange={e=>setNovo(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/><button type="button" className="primary" disabled={!novo.trim()} onClick={add}>＋ Adicionar</button></div>
<div className="records">{treinos.map((t,index)=><div className="record" key={`${t}-${index}`}><span className="record-avatar">TR</span><div><b>{t}</b><small>Treino obrigatório</small></div><button type="button" className="danger-btn-sm" aria-label={`Remover ${t}`} onClick={()=>setTreinos(current=>current.filter((_,itemIndex)=>itemIndex!==index))}>Remover</button></div>)}</div></>}

function ConfiguracoesView(){
  return<DiscordConfiguration preview/>}

function getTimeAgo(ts:string):string{const d=Date.now()-new Date(ts).getTime();const m=Math.floor(d/60000);if(m<1)return'Agora';if(m<60)return`há ${m}min`;const h=Math.floor(m/60);if(h<24)return`há ${h}h`;return`há ${Math.floor(h/24)}d`}
