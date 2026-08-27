'use client';
import{useEffect,useState,useCallback}from'react';
const DIVISION_SIGLAS=['EXÉRCITO','STAFF','BFE','CIE','BAC','BPE'];
const EVENT_ICONS:Record<string,string>={'promocao':'↑','rebaixamento':'↓','treino':'◆','verificacao':'ZR','login':'◎'};
type RobloxUser={id:string;username:string;avatar:string;rank?:string;rankNumber?:number;roleId?:string;isCreator?:boolean;isAdmin?:boolean;isHighCommand?:boolean;division?:string;divisions?:Array<{id:number;name:string;role:string;roleId?:string}>};
type DashboardStats={totalSincronizados:number;emCdp:number;treinosMes:number;acoesRegistradas:number;ultimaSincronizacao:string|null;divisoes:Record<string,number>;atividadesRecentes:Array<{id:string;tipo:string;userId:string;username:string;descricao:string;timestamp:string}>};
type Member={userId:string;username:string;rankName:string;division:string;avatar:string;roleId:string;rankNumber:number};

export default function Home(){
  const[active,setActive]=useState('Visão geral');
  const[user,setUser]=useState<RobloxUser|null|undefined>(undefined);
  const[stats,setStats]=useState<DashboardStats|null>(null);

  useEffect(()=>{fetch('/api/auth/me').then(r=>r.json()).then(x=>setUser(x.user)).catch(()=>setUser(null))},[]);
  useEffect(()=>{if(user)fetch('/api/dashboard/stats').then(r=>r.json()).then(setStats).catch(()=>null)},[user]);

  if(user===undefined)return<div className="auth-loading">EB DO MIG</div>;
  if(user===null)return<LoginPage/>;

  const pages:Record<string,()=>React.ReactElement>={
    'Visão geral':()=><VisaoGeral user={user} stats={stats}/>,
    'Militares':()=><MilitaresView/>,
    'Capacitação · CDP':()=><CapacitacaoView user={user}/>,
    'Treinamentos':()=><TreinamentosView user={user}/>,
    'Promoções · UP':()=><PromocoesView user={user}/>,
    'Rebaixamentos':()=><RebaixamentosView user={user}/>,
    'Registros':()=><RegistrosView user={user}/>,
    'Painel do criador':()=><PainelCriadorView/>,
    'Configurações':()=><ConfiguracoesView/>,
  };

  return<main className="shell">
<aside className="sidebar"><div className="brand"><span className="brand-mark">M</span><div><b>EB DO MIG</b><small>Central Militar</small></div></div><nav><p className="nav-label">COMANDO</p>{['Visão geral','Militares','Capacitação · CDP','Treinamentos','Promoções · UP','Rebaixamentos','Registros'].map((x,i)=><button key={x} className={'nav-item '+(active===x?'active':'')} onClick={()=>setActive(x)}><span>{['⌂','♟','◷','◆','↑','↓','▤'][i]}</span>{x}</button>)}<p className="nav-label">ADMINISTRAÇÃO</p>{(user.isAdmin?['Painel do criador','Configurações']:['Configurações']).map((x,i)=><button key={x} className={'nav-item '+(active===x?'active':'')} onClick={()=>setActive(x)}><span>{user.isAdmin?(i?'⚙':'♛'):'⚙'}</span>{x}</button>)}</nav><div className="sidebar-foot"><i/><div><b>Sistemas operacionais</b><small>Roblox · sincronizado</small></div></div></aside>
<section className="content"><header className="topbar"><div className="user-info"><img className="avatar" src={user.avatar} alt="" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{user.username}</b><small>{user.rank||''}</small></div></div><a className="logout-btn" href="/api/auth/logout" title="Sair">Sair</a></header>
<div className="page"><div className="eyebrow">— CENTRAL DE COMANDO · {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()}</div>{pages[active]?.()}</div></section></main>}

function VisaoGeral({user,stats}:{user:RobloxUser;stats:DashboardStats|null}){
  const displayStats:[string,string,string][]=stats?[
    ['Militares sincronizados',String(stats.totalSincronizados),stats.ultimaSincronizacao?`Último sync: ${new Date(stats.ultimaSincronizacao).toLocaleDateString('pt-BR')}`:'Aguardando sync'],
    ['Em capacitação',String(stats.emCdp),'CDP ativo'],
    ['Treinos realizados',String(stats.treinosMes),'Este mês'],
    ['Ações registradas',String(stats.acoesRegistradas),'Total']
  ]:[['Militares sincronizados','—','—'],['Em capacitação','—','—'],['Treinos realizados','—','—'],['Ações registradas','—','—']];
  const divs=DIVISION_SIGLAS.map(s=>[s,String(stats?.divisoes[s]||0)]as[string,string]);
  return<><div className="hero"><div><h1>Visão geral</h1><p>Bem-vindo, {user.username}. {user.rank||''}</p></div></div>
<div className="stats">{displayStats.map(([l,v,d],i)=><article className="stat" key={l}><div><span>{l}</span><i>{['♟','◷','◆','▤'][i]}</i></div><strong>{v}</strong><small>{d}</small></article>)}</div>
<div className="main-grid"><article className="panel activity"><PanelHead tag="TEMPO REAL" title="Atividade recente"/><div className="timeline">{stats?.atividadesRecentes?.length?stats.atividadesRecentes.map(ev=><div className="event" key={ev.id}><span className="event-icon">{EVENT_ICONS[ev.tipo]||'◎'}</span><div><b>{ev.username}</b><p>{ev.descricao}</p><small>{getTimeAgo(ev.timestamp)}</small></div><em>{ev.tipo.toUpperCase()}</em></div>):<EmptyState text="Ações reais aparecerão após sincronização."/>}</div></article>
<aside className="right"><article className="panel"><PanelHead tag="CAPACITAÇÃO" title="CDP ativo"/><EmptyState text={stats?.emCdp?`${stats.emCdp} militares em capacitação`:'Nenhuma CDP ativa'}/></article></aside></div>
<article className="panel divisions"><PanelHead tag="ORGANIZAÇÃO" title="Divisões" action={`○ ${divs.reduce((a,[,c])=>a+parseInt(c),0)} membros`}/><div className="division-list">{divs.map(([n,c])=><div className="division" key={n}><b>{n}</b><small>{c} membros</small><div><i style={{width:`${Math.min(100,parseInt(c)*4)}%`}}/></div></div>)}</div></article></>}

function MilitaresView(){
  const[members,setMembers]=useState<Member[]>([]);
  const[query,setQuery]=useState('');
  const[division,setDivision]=useState('');
  const[selected,setSelected]=useState<Member|null>(null);
  useEffect(()=>{fetch(`/api/militares/search?q=${encodeURIComponent(query)}&division=${division}`).then(r=>r.json()).then(d=>setMembers(d.members||[])).catch(()=>setMembers([]))},[query,division]);
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">EFETIVO</span><h2>Consulta de militares</h2></div></div>
<label className="workspace-search">⌕ <input placeholder="Buscar por nome, ID ou patente" value={query} onChange={e=>setQuery(e.target.value)}/></label>
<div className="division-tabs">{['TODOS',...DIVISION_SIGLAS].map(s=><button key={s} className={(s==='TODOS'&&!division)||(division===s)?'active':''} onClick={()=>setDivision(s==='TODOS'?'':s)}>{s}</button>)}</div>
<div className="records">{members.length?members.map(m=><button key={m.userId} className={selected?.userId===m.userId?'selected':''} onClick={()=>setSelected(m)}><img className="record-avatar" src={m.avatar||''} alt="" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{m.username}</b><small>{m.rankName} · {m.division}</small></div><em>ID: {m.userId}</em></button>):<EmptyState text="Nenhum militar encontrado. Execute a sincronização primeiro."/>}</div></article>
{selected?<aside className="panel member-detail"><div className="member-header"><img src={selected.avatar||''} alt="" className="member-avatar" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{selected.username}</b><small>{selected.rankName}</small><small>Divisão: {selected.division}</small><small>ID: {selected.userId}</small></div></div></aside>:<aside className="panel help"><span className="kicker">CONTROLE SEGURO</span><h2>Selecione um militar</h2><p>Clique em um militar para ver seus detalhes.</p></aside>}</div>}

function CapacitacaoView({user}:{user:RobloxUser}){
  const[cdpStatus,setCdpStatus]=useState<{active:boolean;fim?:string}|null>(null);
  useEffect(()=>{fetch('/api/dashboard/stats').then(r=>r.json()).then(d=>{setCdpStatus({active:d.emCdp>0})}).catch(()=>setCdpStatus({active:false}))},[]);
  const timeLeft=cdpStatus?.active?'2h 34min restantes':'';
  return<div className="workspace-grid"><article className="panel capacitacao-panel"><div className="capacitacao-card"><img className="capacitacao-avatar" src={user.avatar||''} alt="" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><h2>{user.username}</h2><small>{user.rank||'Membro'}</small><div className={'cdp-status '+(cdpStatus?.active?'active':'done')}><span className="cdp-icon">{cdpStatus?.active?'◷':'✓'}</span><div><b>{cdpStatus?.active?'Sua CDP está em andamento':'Sua CDP acabou'}</b>{cdpStatus?.active&&<small>{timeLeft}</small>}</div></div></div></article><aside className="panel help"><span className="kicker">CAPACITAÇÃO</span><h2>Sobre a CDP</h2><p>A Capacitação de Desenvolvimento Pessoal é obrigatória para progressão de patente.</p><ul><li>Cada patente tem um tempo mínimo de CDP</li><li>Após completar, o militar fica elegível para promoção</li><li>O instrutor registra o treino no sistema</li></ul></aside></div>}

function TreinamentosView({user}:{user:RobloxUser}){
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
{!tab?<div className="treino-select"><button className="treino-option" onClick={()=>setTab('exercicio')}><span className="treino-icon">♟</span><div><b>Exército</b><small>Treinos de patente para todos os membros</small></div><strong>→</strong></button><button className="treino-option" onClick={()=>setTab('divisao')}><span className="treino-icon">◆</span><div><b>Divisões</b><small>Treinos específicos de cada divisão</small></div><strong>→</strong></button></div>
:tab==='exercicio'?
<div><button className="back-btn" onClick={()=>setTab(null)}>← Voltar</button><h3 style={{margin:'12px 0',color:'var(--text)'}}>Treinos do Exército</h3><div className="records">{exercicios.map(t=><div className="record" key={t}><span className="record-avatar">◆</span><div><b>{t}</b><small>Treino obrigatório</small></div><em>ATIVO</em></div>)}</div></div>
:
<div><button className="back-btn" onClick={()=>setTab(null)}>← Voltar</button><h3 style={{margin:'12px 0',color:'var(--text)'}}>Selecione a divisão</h3>
{!selectedDiv?<div className="treino-select">{Object.keys(divisaoTreinos).map(d=><button className="treino-option" key={d} onClick={()=>setSelectedDiv(d)}><span className="treino-icon">◆</span><div><b>{d}</b><small>{divisaoTreinos[d].length} treinos</small></div><strong>→</strong></button>)}</div>
:<div><button className="back-btn" onClick={()=>setSelectedDiv('')}>← Voltar</button><h3 style={{margin:'12px 0',color:'var(--text)'}}>Treinos — {selectedDiv}</h3><div className="records">{divisaoTreinos[selectedDiv].map(t=><div className="record" key={t}><span className="record-avatar">◆</span><div><b>{t}</b><small>Treino divisional</small></div><em>ATIVO</em></div>)}</div></div>}
</div>}
</article></div>}

function PromocoesView({user}:{user:RobloxUser}){
  const[search,setSearch]=useState('');
  const[member,setMember]=useState<Member|null>(null);
  const[loading,setLoading]=useState(false);
  const[done,setDone]=useState(false);
  const doSearch=()=>{if(!search)return;setLoading(true);fetch(`/api/militares/search?q=${encodeURIComponent(search)}`).then(r=>r.json()).then(d=>{setMember(d.members?.[0]||null);setLoading(false)}).catch(()=>setLoading(false))};
  const promote=()=>{setDone(true);setTimeout(()=>setDone(false),2000)};
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">CARREIRA</span><h2>Promoções</h2></div></div>
<label className="workspace-search">⌕ <input placeholder="Buscar por username ou ID" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()}/><button className="primary" onClick={doSearch} disabled={loading||!search}>{loading?'Buscando...':'Buscar'}</button></label>
{member?<div className="member-action-card"><div className="member-header"><img src={member.avatar||''} alt="" className="member-avatar" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{member.username}</b><small>{member.rankName} · {member.division}</small><small>ID: {member.userId}</small></div></div>{done?<div className="action-success"><span>✓</span><b>Promoção registrada</b></div>:<button className="primary" onClick={promote}>↑ Realizar Promoção</button>}</div>
:search&&!loading?<EmptyState text="Militar não encontrado no sistema."/>:<EmptyState text="Digite o username ou ID de um militar para promover."/>}</article></div>}

function RebaixamentosView({user}:{user:RobloxUser}){
  const[search,setSearch]=useState('');
  const[member,setMember]=useState<Member|null>(null);
  const[loading,setLoading]=useState(false);
  const[done,setDone]=useState(false);
  const doSearch=()=>{if(!search)return;setLoading(true);fetch(`/api/militares/search?q=${encodeURIComponent(search)}`).then(r=>r.json()).then(d=>{setMember(d.members?.[0]||null);setLoading(false)}).catch(()=>setLoading(false))};
  const demote=()=>{setDone(true);setTimeout(()=>setDone(false),2000)};
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">DISCIPLINA</span><h2>Rebaixamentos</h2></div></div>
<label className="workspace-search">⌕ <input placeholder="Buscar por username ou ID" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()}/><button className="primary" onClick={doSearch} disabled={loading||!search}>{loading?'Buscando...':'Buscar'}</button></label>
{member?<div className="member-action-card"><div className="member-header"><img src={member.avatar||''} alt="" className="member-avatar" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{member.username}</b><small>{member.rankName} · {member.division}</small><small>ID: {member.userId}</small></div></div>{done?<div className="action-success danger"><span>↓</span><b>Rebaixamento registrado</b></div>:<button className="danger-btn" onClick={demote}>↓ Registrar Rebaixamento</button>}</div>
:search&&!loading?<EmptyState text="Militar não encontrado no sistema."/>:<EmptyState text="Digite o username ou ID de um militar para rebaixar."/>}</article></div>}

function RegistrosView({user}:{user:RobloxUser}){
  if(!user.isCreator)return<div className="workspace-grid"><article className="panel workspace"><EmptyState text="Acesso restrito ao criador."/></article></div>;
  const[logs]=useState([
    {tipo:'LOGIN',user:'MigFireeee',desc:'Login realizado via OAuth',time:'há 5min'},
    {tipo:'PROMOÇÃO',user:'bielboranga',desc:'Sgt. Silva → 3° Tenente',time:'há 1h'},
    {tipo:'TREINO',user:'isaacpedii',desc:'Treino de tiro — BFE — 8 participantes',time:'há 3h'},
    {tipo:'SYNC',user:'Sistema',desc:'Sincronização automática — 108 membros',time:'há 6h'},
  ]);
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
  const[divTab,setDivTab]=useState('EXÉRCITO');
  const[saved,setSaved]=useState(false);
  const updateDias=(idx:number,dias:number)=>{const r=[...ranks];r[idx].dias=dias;setRanks(r);setSaved(false)};
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000)};
  return<div><h3 style={{margin:'12px 0',color:'var(--text)'}}>Tempo de CDP por patente — {divTab}</h3>
<div className="cdp-config-list">{ranks.map((r,i)=><div className="cdp-config-row" key={r.sigla}><span className="cdp-sigla">[{r.sigla}]</span><span className="cdp-nome">{r.nome}</span><label className="cdp-input"><input type="number" min={0} max={30} value={r.dias} onChange={e=>updateDias(i,parseInt(e.target.value)||0)}/><small>dias</small></label></div>)}</div>
{saved?<div className="action-success"><span>✓</span><b>Salvo!</b></div>:<button className="primary" style={{marginTop:12}} onClick={save}>Salvar alterações</button>}</div>}

function PatentesConfigView(){
  const[patentes]=useState([
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
  return<><h3 style={{margin:'12px 0',color:'var(--text)'}}>Hierarquia de Patentes — Exército</h3>
<button className="primary" style={{marginBottom:12}} onClick={()=>setAddMode(!addMode)}>{addMode?'Cancelar':'＋ Adicionar patente'}</button>
{addMode&&<div className="add-form"><input placeholder="Sigla (ex: 2° GEN)"/><input placeholder="Nome completo"/><select><option>Praças</option><option>Graduados</option><option>Oficiais</option><option>Oficiais Alta</option><option>Generais</option><option>Elite</option><option>Comando</option></select><button className="primary">Adicionar</button></div>}
<div className="records">{patentes.map(p=><div className="record" key={p.sigla}><span className="record-avatar">{p.sigla.slice(0,3)}</span><div><b>[{p.sigla}] {p.nome}</b><small>{p.cat}</small></div><em>EDITAR</em></div>)}</div></>}

function TreinosConfigView(){
  const[treinos,setTreinos]=useState(['Tiro ao alvo','Navegação terrestre','Primeiros socorros','Combate corpo a corpo','Instruções de rádio','Marcha de resistência']);
  const[novo,setNovo]=useState('');
  const add=()=>{if(!novo)return;setTreinos([...treinos,novo]);setNovo('')};
  const remove=(idx:number)=>setTreinos(treinos.filter((_,i)=>i!==idx));
  return<><h3 style={{margin:'12px 0',color:'var(--text)'}}>Treinamentos do Exército</h3>
<div className="add-form-inline"><input placeholder="Nome do novo treino" value={novo} onChange={e=>setNovo(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/><button className="primary" onClick={add}>＋ Adicionar</button></div>
<div className="records">{treinos.map((t,i)=><div className="record" key={t}><span className="record-avatar">◆</span><div><b>{t}</b><small>Treino obrigatório</small></div><button className="danger-btn-sm" onClick={()=>remove(i)}>✕</button></div>)}</div></>}

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

function PanelHead({tag,title,action}:{tag:string;title:string;action?:string}){return<div className="panel-head"><div><span className="kicker">{tag}</span><h2>{title}</h2></div>{action&&<button>{action}</button>}</div>}
function EmptyState({text}:{text:string}){return<div className="empty-state"><span>◇</span><b>Nenhum dado disponível</b><p>{text}</p></div>}
function getTimeAgo(ts:string):string{const d=Date.now()-new Date(ts).getTime();const m=Math.floor(d/60000);if(m<1)return'Agora';if(m<60)return`há ${m}min`;const h=Math.floor(m/60);if(h<24)return`há ${h}h`;return`há ${Math.floor(h/24)}d`}

function LoginPage(){
  const[err,setErr]=useState('');
  useEffect(()=>{const e=new URLSearchParams(window.location.search).get('login');if(e)setErr(e==='nogroup'?'Você não pertence ao grupo EB DO MIG.':'Erro: '+e)},[]);
  return<main className="login-page"><div className="login-particles"><div className="login-particle" style={{left:'15%',background:'var(--accent)',boxShadow:'0 0 5px var(--accent)',animationDelay:'0s'}}/><div className="login-particle" style={{left:'35%',background:'var(--accent)',boxShadow:'0 0 5px var(--accent)',animationDelay:'4s'}}/><div className="login-particle" style={{left:'60%',background:'var(--accent)',boxShadow:'0 0 5px var(--accent)',animationDelay:'7s'}}/><div className="login-particle" style={{left:'82%',background:'var(--accent)',boxShadow:'0 0 5px var(--accent)',animationDelay:'2.5s'}}/><div className="login-particle" style={{left:'48%',background:'var(--gold)',boxShadow:'0 0 5px var(--gold)',animationDelay:'9.5s'}}/></div><section className="login-card"><span className="corner-tl"/><span className="corner-tr"/><span className="corner-bl"/><span className="corner-br"/><img className="login-emblem" src="/og.png" alt="EB DO MIG"/><span className="login-kicker">⚡ Sistema do Exército Brasileiro</span><h1>Acesso à<br/><strong>Central Militar</strong></h1><p>EB DO MIG · Sistema de gestão e capacitação</p>{err&&<div className="login-error">{err==='nogroup'?'Você não pertence ao grupo EB DO MIG no Roblox.':err}</div>}<a className="login-roblox" href="/api/auth/roblox/start"><span>🎮</span> Entrar com Roblox</a><div className="login-security">🔒 Acesso restrito <i/> OAuth Roblox</div><small>Ao continuar, sua patente e suas divisões serão verificadas.</small></section><footer>EB DO MIG · GRUPO 521106467</footer></main>}
