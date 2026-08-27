'use client';
import{useEffect,useState,useCallback}from'react';
const nav=['Visão geral','Militares','Capacitação · CDP','Treinamentos','Promoções · UP','Rebaixamentos','Registros'];
const DIVISION_SIGLAS=['EXÉRCITO','STAFF','BFE','CIE','BAC','BPE'];
const DIVISION_ICONS:Record<string,string>={'EXÉRCITO':'♟','STAFF':'♛','BFE':'◆','CIE':'◎','BAC':'⚔','BPE':'盾'};
const EVENT_ICONS:Record<string,string>={'promocao':'↑','rebaixamento':'↓','treino':'◆','verificacao':'ZR','login':'◎'};
type RobloxUser={id:string;username:string;avatar:string;rank?:string;rankNumber?:number;roleId?:string;isCreator?:boolean;isAdmin?:boolean;isHighCommand?:boolean;division?:string;divisions?:Array<{id:number;name:string;role:string;roleId?:string}>};
type DashboardStats={totalSincronizados:number;emCdp:number;treinosMes:number;acoesRegistradas:number;ultimaSincronizacao:string|null;divisoes:Record<string,number>;atividadesRecentes:Array<{id:string;tipo:string;userId:string;username:string;descricao:string;timestamp:string}>};

export default function Home(){
  const[active,setActive]=useState('Visão geral');
  const[modal,setModal]=useState(false);
  const[user,setUser]=useState<RobloxUser|null|undefined>(undefined);
  const[stats,setStats]=useState<DashboardStats|null>(null);
  const[searchQuery,setSearchQuery]=useState('');
  const[searchResults,setSearchResults]=useState<Array<{userId:string;username:string;rankName:string;division:string}>>([]);

  useEffect(()=>{fetch('/api/auth/me').then(r=>r.json()).then(x=>setUser(x.user)).catch(()=>setUser(null))},[]);

  useEffect(()=>{
    if(user){
      fetch('/api/dashboard/stats').then(r=>r.json()).then(setStats).catch(()=>null);
    }
  },[user]);

  const doSearch=useCallback(async(q:string)=>{
    if(q.length<2){setSearchResults([]);return}
    try{
      const r=await fetch(`/api/militares/search?q=${encodeURIComponent(q)}`);
      const d=await r.json();
      setSearchResults(d.members||[]);
    }catch{setSearchResults([])}
  },[]);

  if(user===undefined)return<div className="auth-loading">EB DO MIG</div>;
  if(user===null)return<LoginPage/>;

  const displayStats:[string,string,string][]=stats?[
    ['Militares sincronizados',String(stats.totalSincronizados),stats.ultimaSincronizacao?`Último sync: ${new Date(stats.ultimaSincronizacao).toLocaleDateString('pt-BR')}`:'Aguardando sincronização'],
    ['Em capacitação',String(stats.emCdp),'CDP ativo'],
    ['Treinos realizados',String(stats.treinosMes),'Este mês'],
    ['Ações registradas',String(stats.acoesRegistradas),'Total no sistema']
  ]:[
    ['Militares sincronizados','—','Aguardando sincronização'],['Em capacitação','—','Nenhum CDP ativo'],['Treinos realizados','—','Nenhum registro'],['Ações registradas','—','Aguardando dados']
  ];

  const divisionCounts=DIVISION_SIGLAS.map(s=>[s,String(stats?.divisoes[s]||0)]as[string,string]);

  return<main className="shell">
<aside className="sidebar"><div className="brand"><span className="brand-mark">M</span><div><b>EB DO MIG</b><small>Central Militar</small></div></div><nav><p className="nav-label">COMANDO</p>{nav.map((x,i)=><button key={x} className={'nav-item '+(active===x?'active':'')} onClick={()=>setActive(x)}><span>{['⌂','♟','◷','◆','↑','↓','▤'][i]}</span>{x}</button>)}<p className="nav-label">ADMINISTRAÇÃO</p>{(user.isAdmin?['Painel do criador','Configurações']:['Configurações']).map((x,i)=><button key={x} className={'nav-item '+(active===x?'active':'')} onClick={()=>setActive(x)}><span>{user.isAdmin?(i?'⚙':'♛'):'⚙'}</span>{x}</button>)}</nav><div className="sidebar-foot"><i/><div><b>Sistemas operacionais</b><small>Roblox · sincronizado</small></div></div></aside>
<section className="content"><header className="topbar"><button className="search" onClick={()=>{setActive('Militares');setTimeout(()=>(document.querySelector('.workspace-search input')as HTMLInputElement)?.focus(),100)}}>⌕ <span>Buscar militar, patente ou registro...</span><kbd>⌘ K</kbd></button><a className="user" href="/api/auth/logout" title="Sair"><img className="avatar" src={user.avatar} alt={`Avatar Roblox de ${user.username}`}/><div><b>{user.username}</b><small>{user.rank||'Roblox conectado'}</small></div><span>⌄</span></a></header>
<div className="page"><div className="eyebrow">— CENTRAL DE COMANDO · {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()}</div><div className="hero"><div><h1>{active}</h1><p>Bem-vindo, {user.username}. {user.rank||''}</p></div><div>{user.isAdmin&&<button className="secondary" onClick={()=>setModal(true)}>Consultar militar</button>}<button className="primary" onClick={()=>setModal(true)}>＋ Nova ação</button></div></div>
{active==='Visão geral'?<><div className="stats">{displayStats.map(([l,v,d],i)=><article className="stat" key={l}><div><span>{l}</span><i>{['♟','◷','◆','▤'][i]}</i></div><strong>{v}</strong><small>{d}</small></article>)}</div>
<div className="main-grid"><article className="panel activity"><PanelHead tag="TEMPO REAL" title="Atividade recente" action="Ver todos →"/><div className="timeline">{stats?.atividadesRecentes?.length?stats.atividadesRecentes.map((ev)=>{const icon=EVENT_ICONS[ev.tipo]||'◎';const timeAgo=getTimeAgo(ev.timestamp);return<div className="event" key={ev.id}><span className="event-icon">{icon}</span><div><b>{ev.username}</b><p>{ev.descricao}</p><small>{timeAgo}</small></div><em>{ev.tipo.toUpperCase()}</em></div>}):<EmptyState text="As ações reais aparecerão após a sincronização com o Roblox."/>}</div></article>
<aside className="right"><article className="panel"><PanelHead tag="CAPACITAÇÃO" title="CDP ativo" action="Ver painel"/><EmptyState text={stats?.emCdp?`${stats.emCdp} militares em capacitação`:'Nenhuma capacitação ativa'}/></article><article className="panel quick"><span className="kicker">ACESSO RÁPIDO</span><h2>Ações de comando</h2><div>{[['↑','Realizar UP'],['◆','Novo treino'],['◷','Criar CDP'],['⌕','Consultar']].map(([i,t])=><button key={t} onClick={()=>setModal(true)}><i>{i}</i><b>{t}</b></button>)}</div></article></aside></div>
<article className="panel divisions"><PanelHead tag="ORGANIZAÇÃO" title="Divisões configuradas" action={`○ ${divisionCounts.reduce((a,[,c])=>a+parseInt(c),0)} membros`}/><div className="division-list">{divisionCounts.map(([n,c])=><div className="division" key={n}><b>{n}</b><small>{c} membros</small><div><i style={{width:`${Math.min(100,parseInt(c)*4)}%`}}/></div></div>)}</div></article></>:<WorkspaceView active={active} user={user} stats={stats} onAction={()=>setModal(true)} onSearch={doSearch} searchResults={searchResults}/>}</div></section>{modal&&<ActionModal close={()=>setModal(false)} user={user}/>}</main>}

function PanelHead({tag,title,action}:{tag:string,title:string,action:string}){return<div className="panel-head"><div><span className="kicker">{tag}</span><h2>{title}</h2></div><button>{action}</button></div>}
function EmptyState({text}:{text:string}){return<div className="empty-state"><span>◇</span><b>Nenhum dado disponível</b><p>{text}</p></div>}
function getTimeAgo(timestamp:string):string{
  const diff=Date.now()-new Date(timestamp).getTime();
  const mins=Math.floor(diff/60000);
  if(mins<1)return'Agora';
  if(mins<60)return`há ${mins}min`;
  const hours=Math.floor(mins/60);
  if(hours<24)return`há ${hours}h`;
  const days=Math.floor(hours/24);
  return`há ${days}d`;
}

function LoginPage(){
  const[loginError,setLoginError]=useState('');
  useEffect(()=>{const params=new URLSearchParams(window.location.search);const err=params.get('login');if(err)setLoginError(err==='nogroup'?'Você não pertence ao grupo EB DO MIG':'Erro ao fazer login: '+err)},[]);
  return<main className="login-page"><div className="login-particles"><div className="login-particle" style={{left:'15%',background:'var(--accent)',boxShadow:'0 0 5px var(--accent)',animationDelay:'0s'}}/><div className="login-particle" style={{left:'35%',background:'var(--accent)',boxShadow:'0 0 5px var(--accent)',animationDelay:'4s'}}/><div className="login-particle" style={{left:'60%',background:'var(--accent)',boxShadow:'0 0 5px var(--accent)',animationDelay:'7s'}}/><div className="login-particle" style={{left:'82%',background:'var(--accent)',boxShadow:'0 0 5px var(--accent)',animationDelay:'2.5s'}}/><div className="login-particle" style={{left:'48%',background:'var(--gold)',boxShadow:'0 0 5px var(--gold)',animationDelay:'9.5s'}}/></div><section className="login-card"><span className="corner-tl"/><span className="corner-tr"/><span className="corner-bl"/><span className="corner-br"/><img className="login-emblem" src="/og.png" alt="EB DO MIG"/><span className="login-kicker">⚡ Sistema do Exército Brasileiro</span><h1>Acesso à<br/><strong>Central Militar</strong></h1><p>EB DO MIG · Sistema de gestão e capacitação</p>{loginError&&<div className="login-error">{loginError==='nogroup'?'Você não pertence ao grupo EB DO MIG no Roblox. Solicite ingresso no grupo para acessar o sistema.':loginError}</div>}<a className="login-roblox" href="/api/auth/roblox/start"><span>🎮</span> Entrar com Roblox</a><div className="login-security">🔒 Acesso restrito <i/> OAuth Roblox</div><small>Ao continuar, sua patente e suas divisões serão verificadas na comunidade oficial.</small></section><footer>EB DO MIG · GRUPO 521106467</footer></main>}

function MilitaresView({user}:{user:RobloxUser}){
  const[members,setMembers]=useState<Array<{userId:string;username:string;rankName:string;division:string;avatar:string}>>([]);
  const[query,setQuery]=useState('');
  const[division,setDivision]=useState('');
  useEffect(()=>{fetch(`/api/militares/search${query||division?`?q=${query}&division=${division}`:''}`).then(r=>r.json()).then(d=>setMembers(d.members||[])).catch(()=>setMembers([]))},[query,division]);
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">EFETIVO</span><h2>Consulta de militares</h2></div></div><label className="workspace-search">⌕ <input placeholder="Pesquisar por nome, ID ou patente" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="division-tabs">{DIVISION_SIGLAS.map(s=><button key={s} className={division===s?'active':''} onClick={()=>setDivision(division===s?'':s)}>{s}</button>)}</div><div className="records">{members.length>0?members.map(m=><div className="record" key={m.userId}><img className="record-avatar" src={m.avatar||''} alt="" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/><div><b>{m.username}</b><small>{m.rankName} · {m.division}</small></div><em>{m.userId}</em></div>):<EmptyState text="Nenhum militar encontrado. Execute a sincronização primeiro."/>}</div></article><aside className="panel help"><span className="kicker">CONTROLE SEGURO</span><h2>Permissões preparadas</h2><p>Todas as ações serão validadas conforme a patente, CDP ativo e cargo do responsável.</p><ul><li>Login oficial Roblox</li><li>Registros permanentes</li><li>Regras no servidor</li></ul></aside></div>}

function WorkspaceView({active,user,onAction,stats}:{
  active:string;
  user:RobloxUser;
  stats:DashboardStats|null;
  onAction:()=>void;
  onSearch:(q:string)=>void;
  searchResults:Array<{userId:string;username:string;rankName:string;division:string}>;
}){
  if(active==='Militares')return<MilitaresView user={user}/>;
  const cfg:Record<string,[string,string,string[]]>={
  'Capacitação · CDP':['CAPACITAÇÃO','CDPs em andamento',[]],
  'Treinamentos':['ACADEMIA','Treinos de patente',[]],
  'Promoções · UP':['CARREIRA','Promoções militares',[]],
  'Rebaixamentos':['DISCIPLINA','Relatórios de rebaixamento',[]],
  'Registros':['AUDITORIA','Registros protegidos',[]],
  'Painel do criador':['ACESSO MÁXIMO','Painel do criador',['Patentes e hierarquia','Divisões e grupos Roblox','Permissões e integrações']],
  'Configurações':['SISTEMA','Configurações',['Integração Roblox · Configurada','Discord e webhooks · Aguardando canal','Segurança e permissões · Preparadas']]};
  const[tag,title,rows]=cfg[active]||cfg.Militares;
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">{tag}</span><h2>{title}</h2></div><button className="primary" onClick={onAction}>＋ Nova ação</button></div><label className="workspace-search">⌕ <input placeholder="Pesquisar por nome, ID ou patente"/></label><div className="records">{rows.length?rows.map((row,i)=><button key={row}><span className="record-avatar">{row.slice(0,2).toUpperCase()}</span><div><b>{row.split(' · ')[0]}</b><small>{row.split(' · ').slice(1).join(' · ')}</small></div><em>{i===1?'EM ANDAMENTO':'ATIVO'}</em><strong>→</strong></button>):<EmptyState text="Os registros aparecerão aqui quando a integração estiver ativa."/>}</div></article><aside className="panel help"><span className="kicker">CONTROLE SEGURO</span><h2>Permissões preparadas</h2><p>Todas as ações serão validadas conforme a patente, CDP ativo e cargo do responsável.</p><ul><li>Login oficial Roblox</li><li>Registros permanentes</li><li>Regras no servidor</li></ul></aside></div>}

function ActionModal({close,user}:{close:()=>void;user:RobloxUser}){
  const[done,setDone]=useState(false);
  return<div className="modal-wrap" role="dialog" aria-modal="true"><button className="scrim" onClick={close} aria-label="Fechar"/><div className="modal">{done?<><span className="success">✓</span><h2>Ação preparada</h2><p>O fluxo foi aberto com sucesso. A alteração real será enviada ao Roblox após a conexão das credenciais.</p><button className="close filled" onClick={close}>Concluir</button></>:<><span className="kicker">NOVA OPERAÇÃO</span><h2>Selecione uma ação</h2><p>A permissão e o CDP serão verificados novamente antes da confirmação.</p>{(user.isAdmin?['↑ Realizar promoção / UP','◆ Registrar treinamento','◷ Iniciar capacitação · CDP','↓ Registrar rebaixamento']:['◆ Registrar treinamento','◷ Iniciar capacitação · CDP']).map(x=><button key={x} onClick={()=>setDone(true)}>{x}<span>→</span></button>)}<button className="close" onClick={close}>Cancelar</button></>}</div></div>}
