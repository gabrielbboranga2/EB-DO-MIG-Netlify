'use client';
/* eslint-disable @next/next/no-img-element -- Roblox avatars are remote, dynamic URLs. */
import{useEffect,useState}from'react';
import{DashboardShell,EmptyState,PanelHead}from'./components/DashboardShell';
import{BrandEmblem}from'./components/BrandEmblem';
import{TrainingRegistration}from'./components/TrainingRegistration';
import{DiscordConfiguration}from'./components/DiscordConfiguration';
import{RankChangeWorkflow}from'./components/RankChangeWorkflow';
const DIVISION_SIGLAS=['EXÉRCITO','STAFF','BFE','CIE','BAC','BPE'];
const EVENT_ICONS:Record<string,string>={'promocao':'UP','rebaixamento':'RB','treino':'TR','verificacao':'VR','login':'LG'};
type RobloxUser={id:string;username:string;avatar:string;rank?:string;rankNumber?:number;roleId?:string;isCreator?:boolean;isAdmin?:boolean;isHighCommand?:boolean;division?:string;divisions?:Array<{id:number;name:string;role:string;roleId?:string}>};
type DashboardStats={totalSincronizados:number;emCdp:number;treinosMes:number;acoesRegistradas:number;ultimaSincronizacao:string|null;divisoes:Record<string,number>;atividadesRecentes:Array<{id:string;tipo:string;userId:string;username:string;descricao:string;timestamp:string}>};
type Member={userId:string;username:string;displayName:string;rankName:string;division:string;divisions:string[];avatar:string;roleId:string;rankNumber:number;cdpActive:boolean;cdpStartedAt:string|null;cdpEndsAt:string|null};
type HierarchyGroup={groupId:number;sigla:string;name:string;roles:Array<{id:string;name:string;rank:number}>};

function isDashboardStats(value:unknown):value is DashboardStats{
  if(!value||typeof value!=='object')return false;
  const data=value as Partial<DashboardStats>;
  return typeof data.totalSincronizados==='number'&&typeof data.emCdp==='number'&&
    typeof data.treinosMes==='number'&&typeof data.acoesRegistradas==='number'&&
    !!data.divisoes&&Array.isArray(data.atividadesRecentes);
}

export default function Home(){
  const[active,setActive]=useState('Visão geral');
  const[user,setUser]=useState<RobloxUser|null|undefined>(undefined);
  const[stats,setStats]=useState<DashboardStats|null>(null);

  useEffect(()=>{fetch('/api/auth/me').then(r=>r.json()).then(x=>setUser(x.user)).catch(()=>setUser(null))},[]);
  useEffect(()=>{if(user)fetch('/api/dashboard/stats').then(r=>r.json()).then(data=>{if(isDashboardStats(data))setStats(data)}).catch(()=>null)},[user]);

  if(user===undefined)return<div className="auth-loading"><BrandEmblem size={72} decorative priority/><b>EB DO MIG</b><small>Inicializando Central Militar</small></div>;
  if(user===null)return<LoginPage/>;

  const pages:Record<string,()=>React.ReactElement>={
    'Visão geral':()=><VisaoGeral user={user} stats={stats}/>,
    'Militares':()=><MilitaresView/>,
    'Hierarquia':()=><HierarchyView/>,
    'Capacitação · CDP':()=><CapacitacaoView user={user}/>,
    'Treinamentos':()=><TreinamentosView user={user}/>,
    'Promoções · UP':()=><PromocoesView/>,
    'Rebaixamentos':()=><RebaixamentosView/>,
    'Registros':()=><RegistrosView user={user}/>,
    'Painel do criador':()=><PainelCriadorView/>,
    'Configurações':()=><ConfiguracoesView/>,
  };

  return <DashboardShell active={active} onNavigate={setActive} username={user.username} rank={user.rank||'Membro'} avatar={user.avatar} isAdmin={user.isAdmin}>
    <div className="eyebrow">CENTRAL DE COMANDO <i/> {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()}</div>
    {pages[active]?.()}
  </DashboardShell>;
}

function VisaoGeral({user,stats}:{user:RobloxUser;stats:DashboardStats|null}){
  const displayStats:[string,string,string][]=stats?[
    ['Militares sincronizados',String(stats.totalSincronizados),stats.ultimaSincronizacao?`Último sync: ${new Date(stats.ultimaSincronizacao).toLocaleDateString('pt-BR')}`:'Aguardando sync'],
    ['Em capacitação',String(stats.emCdp),'CDP ativo'],
    ['Treinos realizados',String(stats.treinosMes),'Este mês'],
    ['Ações registradas',String(stats.acoesRegistradas),'Total']
  ]:[['Militares sincronizados','—','—'],['Em capacitação','—','—'],['Treinos realizados','—','—'],['Ações registradas','—','—']];
  const divs=DIVISION_SIGLAS.map(s=>[s,String(stats?.divisoes?.[s]||0)]as[string,string]);
  return<><div className="hero"><div><h1>Visão geral</h1><p>Bem-vindo, {user.username}. {user.rank||''}</p></div><div className="hero-status"><i/>OPEN CLOUD CONECTADA</div></div>
<div className="stats">{displayStats.map(([l,v,d],i)=><article className="stat" key={l}><div><span>{l}</span><i>{String(i+1).padStart(2,'0')}</i></div><strong>{v}</strong><small>{d}</small></article>)}</div>
<div className="main-grid"><article className="panel activity"><PanelHead tag="TEMPO REAL" title="Atividade recente"/><div className="timeline">{stats?.atividadesRecentes?.length?stats.atividadesRecentes.map(ev=><div className="event" key={ev.id}><span className="event-icon">{EVENT_ICONS[ev.tipo]||'EV'}</span><div><b>{ev.username}</b><p>{ev.descricao}</p><small>{getTimeAgo(ev.timestamp)}</small></div><em>{ev.tipo.toUpperCase()}</em></div>):<EmptyState text="Ações reais aparecerão após sincronização."/>}</div></article>
<aside className="right"><article className="panel"><PanelHead tag="CAPACITAÇÃO" title="CDP ativo"/>{stats?.emCdp?<div className="compact-metric"><strong>{stats.emCdp}</strong><span>militares em capacitação</span><small>Acompanhamento em andamento</small></div>:<EmptyState text="Nenhuma CDP ativa"/>}</article></aside></div>
<article className="panel divisions"><PanelHead tag="ORGANIZAÇÃO" title="Divisões" action={`TOTAL · ${divs.reduce((a,[,c])=>a+parseInt(c),0)} VÍNCULOS`}/><div className="division-list">{divs.map(([n,c])=><div className="division" key={n}><b>{n}</b><small>{c} membros</small><div><i style={{width:`${Math.min(100,parseInt(c)*4)}%`}}/></div></div>)}</div></article></>}

function MilitaresView(){
  const[members,setMembers]=useState<Member[]>([]);
  const[query,setQuery]=useState('');
  const[division,setDivision]=useState('');
  const[selected,setSelected]=useState<Member|null>(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const[page,setPage]=useState(1);
  const[total,setTotal]=useState(0);
  const[rosterTotal,setRosterTotal]=useState(0);
  const[totalPages,setTotalPages]=useState(1);
  const[counts,setCounts]=useState<Record<string,number>>({});
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>{
      setLoading(true);setError('');
      fetch(`/api/militares/search?q=${encodeURIComponent(query)}&division=${encodeURIComponent(division)}&page=${page}`,{signal:controller.signal})
        .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'Falha na consulta');return data})
        .then(data=>{setMembers(data.members||[]);setTotal(data.total||0);setRosterTotal(data.rosterTotal||0);setTotalPages(data.totalPages||1);setCounts(data.counts||{})})
        .catch(fetchError=>{if(fetchError.name!=='AbortError'){setMembers([]);setTotal(0);setError('Não foi possível carregar os grupos do Roblox. Verifique a chave Open Cloud na Vercel.')}})
        .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    },300);
    return()=>{clearTimeout(timer);controller.abort()};
  },[query,division,page]);
  const changeDivision=(next:string)=>{setDivision(next==='TODOS'?'':next);setPage(1);setSelected(null)};
  return<div className="workspace-grid roster-layout"><article className="panel workspace"><div className="workspace-toolbar roster-toolbar"><div><span className="kicker">EFETIVO REAL</span><h2>Integrantes das comunidades</h2><p>Dados sincronizados com os seis grupos oficiais no Roblox.</p></div><div className="roster-total"><strong>{loading?'—':total}</strong><span>{query?'resultados':division?'integrantes':'militares únicos'}</span></div></div>
<label className="workspace-search"><span className="search-code" aria-hidden="true">BUSCA</span><input placeholder="Nome, ID ou patente" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);setSelected(null)}}/></label>
<div className="division-tabs roster-tabs">{['TODOS',...DIVISION_SIGLAS].map(s=><button type="button" key={s} className={(s==='TODOS'&&!division)||(division===s)?'active':''} onClick={()=>changeDivision(s)}><span>{s}</span><small>{s==='TODOS'?rosterTotal:(counts[s]??'—')}</small></button>)}</div>
<div className="roster-context"><span><i/>ROBLOX OPEN CLOUD</span><small>{loading?'Atualizando integrantes...':`${total} ${total===1?'integrante encontrado':'integrantes encontrados'}`}</small></div>
<div className="records roster-records">{loading?<EmptyState title="Sincronizando efetivo" text="Consultando os grupos oficiais do Roblox..."/>:members.length?members.map(m=><button type="button" key={m.userId} className={selected?.userId===m.userId?'selected':''} onClick={()=>setSelected(m)}><span className="record-avatar-shell"><span>{m.username.slice(0,2).toUpperCase()}</span>{m.avatar&&<img src={m.avatar} alt="" onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>}</span><div><b>{m.username}</b>{m.displayName&&m.displayName!==m.username&&<span className="display-name">{m.displayName}</span>}<small>{m.rankName} · {m.division}</small></div><span className="record-side"><span className={`cdp-chip ${m.cdpActive?'active':'inactive'}`}>{m.cdpActive?'EM CDP':'FORA DA CDP'}</span><em>ID: {m.userId}</em></span></button>):<EmptyState title={error?'Sincronização indisponível':'Nenhum militar encontrado'} text={error||'Tente outro nome, patente ou comunidade.'}/>}</div>
{!loading&&!error&&totalPages>1&&<div className="roster-pagination"><button type="button" disabled={page<=1} onClick={()=>setPage(current=>Math.max(1,current-1))}>← Anterior</button><span>Página <b>{page}</b> de <b>{totalPages}</b></span><button type="button" disabled={page>=totalPages} onClick={()=>setPage(current=>Math.min(totalPages,current+1))}>Próxima →</button></div>}</article>
{selected?<aside className="panel member-detail roster-detail"><div className="member-header"><span className="member-avatar avatar-fallback">{selected.username.slice(0,2).toUpperCase()}{selected.avatar&&<img src={selected.avatar} alt="" onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>}</span><div><b>{selected.username}</b>{selected.displayName&&selected.displayName!==selected.username&&<small>{selected.displayName}</small>}<small>{selected.rankName}</small><small>Comunidades: {selected.division}</small><small>ID: {selected.userId}</small></div></div><div className={`member-cdp-status ${selected.cdpActive?'active':'inactive'}`}><span>CDP</span><b>{selected.cdpActive?'Em andamento':'Não está em CDP'}</b><small>{selected.cdpActive?'Capacitação ativa':'Nenhum ciclo de capacitação iniciado'}</small></div><a className="member-profile-link" href={`https://www.roblox.com/users/${selected.userId}/profile`} target="_blank" rel="noreferrer">Abrir perfil no Roblox ↗</a></aside>:<aside className="panel help roster-help"><span className="kicker">COMUNIDADES CONECTADAS</span><h2>Selecione um integrante</h2><p>Clique em um registro para conferir patente, comunidades e situação da CDP.</p><div className="community-summary">{DIVISION_SIGLAS.map(sigla=><div key={sigla}><span>{sigla}</span><b>{counts[sigla]??'—'}</b></div>)}</div><div className="initial-cdp-note"><i/>Todos começam fora da CDP</div></aside>}</div>}

function HierarchyView(){
  const[groups,setGroups]=useState<HierarchyGroup[]>([]);
  const[selected,setSelected]=useState('EXÉRCITO');
  const[query,setQuery]=useState('');
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  useEffect(()=>{fetch('/api/hierarquia').then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);return data}).then(data=>setGroups(data.groups||[])).catch(()=>setError('Não foi possível consultar os cargos. Verifique a chave Open Cloud.')).finally(()=>setLoading(false))},[]);
  const group=groups.find(item=>item.sigla===selected)||groups[0];
  const roles=(group?.roles||[]).filter(role=>!query||role.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return<div className="hierarchy-page"><div className="hero hierarchy-hero"><div><span className="kicker">ESTRUTURA OFICIAL</span><h1>Hierarquia militar</h1><p>Cargos carregados diretamente das comunidades do EB DO MIG.</p></div><div className="hero-status"><i/>6 COMUNIDADES</div></div><article className="panel hierarchy-panel"><div className="workspace-toolbar"><div><span className="kicker">COMUNIDADE</span><h2>{group?.name||'Hierarquia das comunidades'}</h2></div><span className="panel-meta">{loading?'SINCRONIZANDO':`${roles.length} CARGOS`}</span></div><div className="division-tabs hierarchy-tabs">{DIVISION_SIGLAS.map(sigla=><button type="button" key={sigla} className={selected===sigla?'active':''} onClick={()=>{setSelected(sigla);setQuery('')}}>{sigla}</button>)}</div><label className="workspace-search"><span className="search-code" aria-hidden="true">BUSCA</span><input placeholder="Buscar cargo ou patente" value={query} onChange={event=>setQuery(event.target.value)}/></label>{loading?<EmptyState title="Sincronizando hierarquia" text="Consultando os cargos oficiais no Roblox..."/>:error?<EmptyState title="Hierarquia indisponível" text={error}/>:<div className="hierarchy-list">{roles.map((role,index)=><article className="hierarchy-role" key={role.id}><span className="hierarchy-order">#{String(role.rank).padStart(3,'0')}</span><div><b>{role.name}</b><small>{group.sigla} · ordem oficial do grupo</small></div><em>{index===0?'TOPO':index===roles.length-1?'BASE':'ATIVO'}</em></article>)}</div>}</article></div>}

function CapacitacaoView({user}:{user:RobloxUser}){
  const[cdpStatus,setCdpStatus]=useState<{active:boolean;fim?:string}|null>(null);
  useEffect(()=>{fetch('/api/dashboard/stats').then(r=>r.json()).then(d=>{setCdpStatus({active:d.emCdp>0})}).catch(()=>setCdpStatus({active:false}))},[]);
  const timeLeft=cdpStatus?.active?'2h 34min restantes':'';
  return<div className="workspace-grid"><article className="panel capacitacao-panel"><div className="capacitacao-card"><img className="capacitacao-avatar" src={user.avatar||''} alt="" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><h2>{user.username}</h2><small>{user.rank||'Membro'}</small><div className={'cdp-status '+(cdpStatus?.active?'active':'done')}><span className="cdp-icon">{cdpStatus?.active?'◷':'✓'}</span><div><b>{cdpStatus?.active?'Sua CDP está em andamento':'Sua CDP acabou'}</b>{cdpStatus?.active&&<small>{timeLeft}</small>}</div></div></div></article><aside className="panel help"><span className="kicker">CAPACITAÇÃO</span><h2>Sobre a CDP</h2><p>A Capacitação de Desenvolvimento Pessoal é obrigatória para progressão de patente.</p><ul><li>Cada patente tem um tempo mínimo de CDP</li><li>Após completar, o militar fica elegível para promoção</li><li>O instrutor registra o treino no sistema</li></ul></aside></div>}

function TreinamentosView({user}:{user:RobloxUser}){return<TrainingRegistration instructor={user.username}/>}

function PromocoesView(){
  return<RankChangeWorkflow mode="promotion"/>}

function RebaixamentosView(){
  return<RankChangeWorkflow mode="demotion"/>}

function RegistrosView({user}:{user:RobloxUser}){
  const logs=[
    {tipo:'LOGIN',user:'MigFireeee',desc:'Login realizado via OAuth',time:'há 5min'},
    {tipo:'PROMOÇÃO',user:'bielboranga',desc:'Sgt. Silva → 3° Tenente',time:'há 1h'},
    {tipo:'TREINO',user:'isaacpedii',desc:'Treino de tiro — BFE — 8 participantes',time:'há 3h'},
    {tipo:'SYNC',user:'Sistema',desc:'Sincronização automática — 108 membros',time:'há 6h'},
  ];
  if(!user.isCreator)return<div className="workspace-grid"><article className="panel workspace"><EmptyState text="Acesso restrito ao criador."/></article></div>;
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">AUDITORIA</span><h2>Registros</h2></div></div>
<div className="records">{logs.map((l,i)=><div className="record" key={i}><span className="record-avatar">{l.tipo[0]}</span><div><b>{l.tipo}</b><small>{l.user} — {l.desc}</small></div><em>{l.time}</em></div>)}</div>
<p style={{color:'var(--muted)',fontSize:12,marginTop:12}}>Conecte os canais do Discord em Configurações para ver logs em tempo real.</p></article></div>}

function PainelCriadorView(){
  const[tab,setTab]=useState<'cdp'|'patentes'|'treinos'>('cdp');
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">ACESSO MÁXIMO</span><h2>Painel do Criador</h2></div></div>
<div className="division-tabs">{[{k:'cdp',l:'CDP por Patente'},{k:'patentes',l:'Patentes e Hierarquia'},{k:'treinos',l:'Treinamentos'}].map(t=><button key={t.k} className={tab===t.k?'active':''} onClick={()=>setTab(t.k as typeof tab)}>{t.l}</button>)}</div>
{tab==='cdp'&&<CdpConfigView/>}
{tab==='patentes'&&<PatentesConfigView/>}
{tab==='treinos'&&<TreinosConfigView/>}
</article></div>}

function CdpConfigView(){
  const[ranks,setRanks]=useState([
    {sigla:'REC',nome:'Recruta',dias:0},{sigla:'SLD',nome:'Soldado',dias:1},{sigla:'CB',nome:'Cabo',dias:2},
    {sigla:'3° SGT',nome:'Terceiro Sargento',dias:3},{sigla:'2° SGT',nome:'Segundo Sargento',dias:4},
    {sigla:'1° SGT',nome:'Primeiro Sargento',dias:5},{sigla:'ST',nome:'Sub-tenente',dias:6},
    {sigla:'CT',nome:'Cadete',dias:7},{sigla:'ASP',nome:'Aspirante a Oficial',dias:8},
    {sigla:'2° TEN',nome:'Segundo Tenente',dias:9},{sigla:'1° TEN',nome:'Primeiro Tenente',dias:10},
    {sigla:'CAP',nome:'Capitão',dias:11},{sigla:'MAJ',nome:'Major',dias:12},
    {sigla:'TEN-CEL',nome:'Tenente Coronel',dias:13},{sigla:'CEL',nome:'Coronel',dias:14},
    {sigla:'GEN BDA',nome:'General de Brigada',dias:15},{sigla:'GEN DV',nome:'General de Divisão',dias:16},
    {sigla:'GEN EX',nome:'General de Exército',dias:17},
  ]);
  const divTab='EXÉRCITO';
  const[saved,setSaved]=useState(false);
  const updateDias=(idx:number,dias:number)=>{const r=[...ranks];r[idx].dias=dias;setRanks(r);setSaved(false)};
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000)};
  return<div><h3 style={{margin:'12px 0',color:'var(--text)'}}>Tempo de CDP por patente — {divTab}</h3>
<div className="cdp-config-list">{ranks.map((r,i)=><div className="cdp-config-row" key={r.sigla}><span className="cdp-sigla">[{r.sigla}]</span><span className="cdp-nome">{r.nome}</span><label className="cdp-input"><input type="number" min={0} max={30} value={r.dias} onChange={e=>updateDias(i,parseInt(e.target.value)||0)}/><small>dias</small></label></div>)}</div>
{saved?<div className="action-success"><span>✓</span><b>Salvo!</b></div>:<button className="primary" style={{marginTop:12}} onClick={save}>Salvar alterações</button>}</div>}

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
  const[categoria,setCategoria]=useState('Praças');
  const addPatente=()=>{
    const cleanSigla=sigla.trim().toUpperCase();
    const cleanNome=nome.trim();
    if(!cleanSigla||!cleanNome)return;
    setPatentes(current=>[...current,{sigla:cleanSigla,nome:cleanNome,cat:categoria}]);
    setSigla('');setNome('');setCategoria('Praças');setAddMode(false);
  };
  return<><h3 style={{margin:'12px 0',color:'var(--text)'}}>Hierarquia de Patentes — Exército</h3>
<button type="button" className="primary" style={{marginBottom:12}} onClick={()=>setAddMode(!addMode)}>{addMode?'Cancelar':'＋ Adicionar patente'}</button>
{addMode&&<div className="add-form"><input aria-label="Sigla da patente" placeholder="Sigla (ex: 2° GEN)" value={sigla} onChange={e=>setSigla(e.target.value)}/><input aria-label="Nome da patente" placeholder="Nome completo" value={nome} onChange={e=>setNome(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPatente()}/><select aria-label="Categoria da patente" value={categoria} onChange={e=>setCategoria(e.target.value)}><option>Praças</option><option>Graduados</option><option>Oficiais</option><option>Oficiais Alta</option><option>Generais</option><option>Elite</option><option>Comando</option></select><button type="button" className="primary" onClick={addPatente} disabled={!sigla.trim()||!nome.trim()}>Adicionar</button></div>}
<div className="records">{patentes.map(p=><div className="record" key={p.sigla}><span className="record-avatar">{p.sigla.slice(0,3)}</span><div><b>[{p.sigla}] {p.nome}</b><small>{p.cat}</small></div><em>ATIVA</em></div>)}</div></>}

function TreinosConfigView(){
  const[treinos,setTreinos]=useState(['Tiro ao alvo','Navegação terrestre','Primeiros socorros','Combate corpo a corpo','Instruções de rádio','Marcha de resistência']);
  const[novo,setNovo]=useState('');
  const add=()=>{if(!novo)return;setTreinos([...treinos,novo]);setNovo('')};
  const remove=(idx:number)=>setTreinos(treinos.filter((_,i)=>i!==idx));
  return<><h3 style={{margin:'12px 0',color:'var(--text)'}}>Treinamentos do Exército</h3>
<div className="add-form-inline"><input placeholder="Nome do novo treino" value={novo} onChange={e=>setNovo(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/><button className="primary" onClick={add}>＋ Adicionar</button></div>
<div className="records">{treinos.map((t,i)=><div className="record" key={t}><span className="record-avatar">TR</span><div><b>{t}</b><small>Treino obrigatório</small></div><button type="button" className="danger-btn-sm" onClick={()=>remove(i)}>Remover</button></div>)}</div></>}

function ConfiguracoesView(){
  return<DiscordConfiguration/>}

function getTimeAgo(ts:string):string{const d=Date.now()-new Date(ts).getTime();const m=Math.floor(d/60000);if(m<1)return'Agora';if(m<60)return`há ${m}min`;const h=Math.floor(m/60);if(h<24)return`há ${h}h`;return`há ${Math.floor(h/24)}d`}

function LoginPage(){
  const[err,setErr]=useState('');
  useEffect(()=>{
    const code=new URLSearchParams(window.location.search).get('login');
    const messages:Record<string,string>={
      cancelled:'A autorização foi cancelada. Você pode tentar novamente quando quiser.',
      invalid:'A sessão de login expirou ou não pôde ser validada. Inicie o acesso novamente.',
      config:'A integração com o Roblox ainda não está configurada corretamente.',
      token:'O Roblox não aceitou o código de autorização. Tente entrar novamente.',
      profile:'Não foi possível carregar seu perfil público do Roblox.',
      nogroup:'Sua conta não pertence ao grupo EB DO MIG no Roblox.',
      service:'O Roblox não respondeu como esperado. Aguarde um instante e tente novamente.',
    };
    if(code){const timer=setTimeout(()=>setErr(messages[code]||'Não foi possível concluir o login.'),0);return()=>clearTimeout(timer)}
  },[]);
  return <main className="login-page">
    <section className="login-intro">
      <div className="login-brand"><BrandEmblem size={64} decorative priority/><div><b>EB DO MIG</b><small>Central Militar</small></div></div>
      <div>
        <span className="login-kicker">SISTEMA INTERNO DE COMANDO</span>
        <h1>Gestão clara.<br/><strong>Comando em ordem.</strong></h1>
        <p>Efetivo, capacitação e registros reunidos em um único painel para a administração do grupo.</p>
      </div>
      <ul className="login-features">
        <li><span>01</span>Patentes e divisões sincronizadas</li>
        <li><span>02</span>Histórico de ações centralizado</li>
        <li><span>03</span>Acesso conforme a hierarquia</li>
      </ul>
    </section>

    <section className="login-card">
      <div className="login-card-head"><BrandEmblem size={52} decorative priority/><div><small>ACESSO RESTRITO</small><b>Identificação militar</b></div></div>
      <h2>Entre na Central</h2>
      <p>Use sua conta do Roblox para validar sua patente e permissões.</p>
      {err&&<div className="login-error" role="alert">{err}</div>}
      <a className="login-roblox" href="/api/auth/roblox/start"><span className="roblox-glyph" aria-hidden="true"/>Continuar com Roblox</a>
      <div className="login-security"><span aria-hidden="true">✓</span> Autenticação segura via OAuth</div>
      <small>Nenhuma senha é armazenada pelo EB DO MIG.</small>
      <div className="login-links"><a href="/privacidade">Privacidade</a><a href="/termos">Termos de Serviço</a><a href="/preview">Ver demonstração</a></div>
    </section>

    <footer>EB DO MIG <i/> GRUPO 521106467</footer>
  </main>;
}
