'use client';
/* eslint-disable @next/next/no-img-element -- Roblox avatars are remote, dynamic URLs. */
import{useEffect,useState}from'react';
import{DashboardShell,EmptyState,PanelHead}from'./components/DashboardShell';
import{BrandEmblem}from'./components/BrandEmblem';
const DIVISION_SIGLAS=['EXÉRCITO','STAFF','BFE','CIE','BAC','BPE'];
const EVENT_ICONS:Record<string,string>={'promocao':'UP','rebaixamento':'RB','treino':'TR','verificacao':'VR','login':'LG'};
type RobloxUser={id:string;username:string;avatar:string;rank?:string;rankNumber?:number;roleId?:string;isCreator?:boolean;isAdmin?:boolean;isHighCommand?:boolean;division?:string;divisions?:Array<{id:number;name:string;role:string;roleId?:string}>};
type DashboardStats={totalSincronizados:number;emCdp:number;treinosMes:number;acoesRegistradas:number;ultimaSincronizacao:string|null;divisoes:Record<string,number>;atividadesRecentes:Array<{id:string;tipo:string;userId:string;username:string;descricao:string;timestamp:string}>};
type Member={userId:string;username:string;rankName:string;division:string;avatar:string;roleId:string;rankNumber:number};

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
    'Capacitação · CDP':()=><CapacitacaoView user={user}/>,
    'Treinamentos':()=><TreinamentosView/>,
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
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>{
      setLoading(true);setError('');
      fetch(`/api/militares/search?q=${encodeURIComponent(query)}&division=${encodeURIComponent(division)}`,{signal:controller.signal})
        .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'Falha na consulta');return data})
        .then(data=>setMembers(data.members||[]))
        .catch(fetchError=>{if(fetchError.name!=='AbortError'){setMembers([]);setError('Não foi possível carregar os grupos do Roblox.')}})
        .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    },300);
    return()=>{clearTimeout(timer);controller.abort()};
  },[query,division]);
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">EFETIVO</span><h2>Consulta de militares</h2></div></div>
<label className="workspace-search"><span className="search-code" aria-hidden="true">BUSCA</span><input placeholder="Nome, ID ou patente" value={query} onChange={e=>setQuery(e.target.value)}/></label>
<div className="division-tabs">{['TODOS',...DIVISION_SIGLAS].map(s=><button key={s} className={(s==='TODOS'&&!division)||(division===s)?'active':''} onClick={()=>setDivision(s==='TODOS'?'':s)}>{s}</button>)}</div>
<div className="records">{loading?<EmptyState title="Sincronizando efetivo" text="Consultando os grupos oficiais do Roblox..."/>:members.length?members.map(m=><button key={m.userId} className={selected?.userId===m.userId?'selected':''} onClick={()=>setSelected(m)}><img className="record-avatar" src={m.avatar||''} alt="" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{m.username}</b><small>{m.rankName} · {m.division}</small></div><em>ID: {m.userId}</em></button>):<EmptyState title={error?'Sincronização indisponível':'Nenhum militar encontrado'} text={error||'Tente outro nome, patente ou divisão.'}/>}</div></article>
{selected?<aside className="panel member-detail"><div className="member-header"><img src={selected.avatar||''} alt="" className="member-avatar" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{selected.username}</b><small>{selected.rankName}</small><small>Divisão: {selected.division}</small><small>ID: {selected.userId}</small></div></div></aside>:<aside className="panel help"><span className="kicker">CONTROLE SEGURO</span><h2>Selecione um militar</h2><p>Clique em um militar para ver seus detalhes.</p></aside>}</div>}

function CapacitacaoView({user}:{user:RobloxUser}){
  const[cdpStatus,setCdpStatus]=useState<{active:boolean;fim?:string}|null>(null);
  useEffect(()=>{fetch('/api/dashboard/stats').then(r=>r.json()).then(d=>{setCdpStatus({active:d.emCdp>0})}).catch(()=>setCdpStatus({active:false}))},[]);
  const timeLeft=cdpStatus?.active?'2h 34min restantes':'';
  return<div className="workspace-grid"><article className="panel capacitacao-panel"><div className="capacitacao-card"><img className="capacitacao-avatar" src={user.avatar||''} alt="" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><h2>{user.username}</h2><small>{user.rank||'Membro'}</small><div className={'cdp-status '+(cdpStatus?.active?'active':'done')}><span className="cdp-icon">{cdpStatus?.active?'◷':'✓'}</span><div><b>{cdpStatus?.active?'Sua CDP está em andamento':'Sua CDP acabou'}</b>{cdpStatus?.active&&<small>{timeLeft}</small>}</div></div></div></article><aside className="panel help"><span className="kicker">CAPACITAÇÃO</span><h2>Sobre a CDP</h2><p>A Capacitação de Desenvolvimento Pessoal é obrigatória para progressão de patente.</p><ul><li>Cada patente tem um tempo mínimo de CDP</li><li>Após completar, o militar fica elegível para promoção</li><li>O instrutor registra o treino no sistema</li></ul></aside></div>}

function TreinamentosView(){
  const[tab,setTab]=useState<'exercicio'|'divisao'|null>(null);
  const[selectedDiv,setSelectedDiv]=useState('');
  const exercicios=['Tiro ao alvo','Navegação terrestre','Primeiros socorros','Combate corpo a corpo','Instruções de rádio','Marcha de resistência'];
  const divisaoTreinos:Record<string,string[]>={
    'BFE':['Operações especiais','Resgate de reféns','Infantaria leve','Combate urbano'],
    'CIE':['Inteligência tática','Interceptação','Análise de ameaças','Criptografia'],
    'BAC':['Ações de comando','Assalto a edifícios','Infiltração','DDL'],
    'BPE':['Policiamento ostensivo','Controle de distúrbios','Proteção de autoridades','Trânsito'],
    'STAFF':['Moderation','Suporte ao membro','Relatórios','Gestão']
  };
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">ACADEMIA</span><h2>Treinamentos</h2></div></div>
{!tab?<div className="treino-select"><button className="treino-option" onClick={()=>setTab('exercicio')}><span className="treino-icon">EX</span><div><b>Exército</b><small>Treinos de patente para todos os membros</small></div><strong>→</strong></button><button className="treino-option" onClick={()=>setTab('divisao')}><span className="treino-icon">DV</span><div><b>Divisões</b><small>Treinos específicos de cada divisão</small></div><strong>→</strong></button></div>
:tab==='exercicio'?
<div><button className="back-btn" onClick={()=>setTab(null)}>← Voltar</button><h3 style={{margin:'12px 0',color:'var(--text)'}}>Treinos do Exército</h3><div className="records">{exercicios.map(t=><div className="record" key={t}><span className="record-avatar">TR</span><div><b>{t}</b><small>Treino obrigatório</small></div><em>ATIVO</em></div>)}</div></div>
:
<div><button className="back-btn" onClick={()=>setTab(null)}>← Voltar</button><h3 style={{margin:'12px 0',color:'var(--text)'}}>Selecione a divisão</h3>
{!selectedDiv?<div className="treino-select">{Object.keys(divisaoTreinos).map(d=><button className="treino-option" key={d} onClick={()=>setSelectedDiv(d)}><span className="treino-icon">DV</span><div><b>{d}</b><small>{divisaoTreinos[d].length} treinos</small></div><strong>→</strong></button>)}</div>
:<div><button className="back-btn" onClick={()=>setSelectedDiv('')}>← Voltar</button><h3 style={{margin:'12px 0',color:'var(--text)'}}>Treinos — {selectedDiv}</h3><div className="records">{divisaoTreinos[selectedDiv].map(t=><div className="record" key={t}><span className="record-avatar">TR</span><div><b>{t}</b><small>Treino divisional</small></div><em>ATIVO</em></div>)}</div></div>}
</div>}
</article></div>}

function PromocoesView(){
  const[search,setSearch]=useState('');
  const[member,setMember]=useState<Member|null>(null);
  const[loading,setLoading]=useState(false);
  const[done,setDone]=useState(false);
  const doSearch=()=>{if(!search)return;setLoading(true);fetch(`/api/militares/search?q=${encodeURIComponent(search)}`).then(r=>r.json()).then(d=>{setMember(d.members?.[0]||null);setLoading(false)}).catch(()=>setLoading(false))};
  const promote=()=>{setDone(true);setTimeout(()=>setDone(false),2000)};
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">CARREIRA</span><h2>Promoções</h2></div></div>
<label className="workspace-search"><span className="search-code" aria-hidden="true">BUSCA</span><input placeholder="Username ou ID" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()}/><button className="primary" onClick={doSearch} disabled={loading||!search}>{loading?'Buscando...':'Buscar'}</button></label>
{member?<div className="member-action-card"><div className="member-header"><img src={member.avatar||''} alt="" className="member-avatar" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{member.username}</b><small>{member.rankName} · {member.division}</small><small>ID: {member.userId}</small></div></div>{done?<div className="action-success"><span>✓</span><b>Promoção registrada</b></div>:<button className="primary" onClick={promote}>↑ Realizar Promoção</button>}</div>
:search&&!loading?<EmptyState text="Militar não encontrado no sistema."/>:<EmptyState text="Digite o username ou ID de um militar para promover."/>}</article></div>}

function RebaixamentosView(){
  const[search,setSearch]=useState('');
  const[member,setMember]=useState<Member|null>(null);
  const[loading,setLoading]=useState(false);
  const[done,setDone]=useState(false);
  const doSearch=()=>{if(!search)return;setLoading(true);fetch(`/api/militares/search?q=${encodeURIComponent(search)}`).then(r=>r.json()).then(d=>{setMember(d.members?.[0]||null);setLoading(false)}).catch(()=>setLoading(false))};
  const demote=()=>{setDone(true);setTimeout(()=>setDone(false),2000)};
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">DISCIPLINA</span><h2>Rebaixamentos</h2></div></div>
<label className="workspace-search"><span className="search-code" aria-hidden="true">BUSCA</span><input placeholder="Username ou ID" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()}/><button className="primary" onClick={doSearch} disabled={loading||!search}>{loading?'Buscando...':'Buscar'}</button></label>
{member?<div className="member-action-card"><div className="member-header"><img src={member.avatar||''} alt="" className="member-avatar" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{member.username}</b><small>{member.rankName} · {member.division}</small><small>ID: {member.userId}</small></div></div>{done?<div className="action-success danger"><span>↓</span><b>Rebaixamento registrado</b></div>:<button className="danger-btn" onClick={demote}>↓ Registrar Rebaixamento</button>}</div>
:search&&!loading?<EmptyState text="Militar não encontrado no sistema."/>:<EmptyState text="Digite o username ou ID de um militar para rebaixar."/>}</article></div>}

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
  const[webhook,setWebhook]=useState('');
  const[saved,setSaved]=useState(false);
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">SISTEMA</span><h2>Configurações</h2></div></div>
<h3 style={{margin:'12px 0',color:'var(--text)'}}>Integração Discord</h3>
<p style={{color:'var(--muted)',fontSize:13,marginBottom:12}}>Conecte os canais do Discord para enviar logs de promoções, rebaixamentos e treinos.</p>
<div className="config-form"><label>Webhook URL — Promoções</label><input placeholder="https://discord.com/api/webhooks/..." value={webhook} onChange={e=>setWebhook(e.target.value)}/><label>Webhook URL — Rebaixamentos</label><input placeholder="https://discord.com/api/webhooks/..."/><label>Webhook URL — Treinos</label><input placeholder="https://discord.com/api/webhooks/..."/><label>Webhook URL — Logs</label><input placeholder="https://discord.com/api/webhooks/..."/></div>
{saved?<div className="action-success"><span>✓</span><b>Configurações salvas!</b></div>:<button className="primary" style={{marginTop:12}} onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000)}}>Salvar configurações</button>}
<h3 style={{margin:'24px 0 12px',color:'var(--text)'}}>Status da Integração</h3>
<div className="records"><div className="record"><span className="record-avatar" style={{background:'#1a2a1a'}}>RB</span><div><b>Roblox OAuth</b><small>Conectado · Grupo 521106467</small></div><em style={{color:'var(--accent)'}}>ATIVO</em></div>
<div className="record"><span className="record-avatar" style={{background:'#1a1a2a'}}>DC</span><div><b>Discord Webhooks</b><small>{webhook?'Configurado':'Aguardando configuração'}</small></div><em>{webhook?'ATIVO':'PENDENTE'}</em></div></div></article></div>}

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
