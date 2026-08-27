'use client';
import{useState,useEffect}from'react';
import Link from'next/link';
const nav=['Visão geral','Militares','Capacitação · CDP','Treinamentos','Promoções · UP','Rebaixamentos','Registros'];
type Stats={totalSincronizados:number;emCdp:number;treinosMes:number;acoesRegistradas:number;ultimaSincronizacao:string|null;divisoes:Record<string,number>;atividadesRecentes:unknown[]};

export default function Preview(){
  const[active,setActive]=useState('Visão geral');
  const[stats,setStats]=useState<Stats|null>(null);
  const goToLogin=()=>window.location.href='/';

  useEffect(()=>{fetch('/api/dashboard/stats').then(r=>r.json()).then(setStats).catch(()=>null)},[]);

  const displayStats:[string,string,string][]=stats?[
    ['Militares sincronizados',String(stats.totalSincronizados),stats.ultimaSincronizacao?`Último sync: ${new Date(stats.ultimaSincronizacao).toLocaleDateString('pt-BR')}`:'Aguardando sincronização'],
    ['Em capacitação',String(stats.emCdp),'CDP ativo'],
    ['Treinos realizados',String(stats.treinosMes),'Este mês'],
    ['Ações registradas',String(stats.acoesRegistradas),'Total no sistema']
  ]:[
    ['Militares sincronizados','—','Carregando...'],['Em capacitação','—','—'],['Treinos realizados','—','—'],['Ações registradas','—','—']
  ];

  const divisions=[['EXÉRCITO',String(stats?.divisoes['EXÉRCITO']||0)],['STAFF',String(stats?.divisoes['STAFF']||0)],['BFE',String(stats?.divisoes['BFE']||0)],['CIE',String(stats?.divisoes['CIE']||0)],['BAC',String(stats?.divisoes['BAC']||0)],['BPE',String(stats?.divisoes['BPE']||0)]] as[string,string][];
  const totalDiv=divisions.reduce((a,[,c])=>a+parseInt(c||'0'),0);

  return<main className="shell">
<aside className="sidebar"><div className="brand"><span className="brand-mark">M</span><div><b>EB DO MIG</b><small>Central Militar</small></div></div><nav><p className="nav-label">COMANDO</p>{nav.map((x,i)=><button key={x} className={'nav-item '+(active===x?'active':'')} onClick={()=>setActive(x)}><span>{['⌂','♟','◷','◆','↑','↓','▤'][i]}</span>{x}</button>)}<p className="nav-label">ADMINISTRAÇÃO</p>{['Painel do criador','Configurações'].map((x,i)=><button key={x} className={'nav-item '+(active===x?'active':'')} onClick={()=>setActive(x)}><span>{i?'⚙':'♛'}</span>{x}</button>)}</nav><div className="sidebar-foot"><i/><div><b>Sistemas operacionais</b><small>Roblox · sincronizado</small></div></div></aside>
<section className="content"><header className="topbar"><button className="search" onClick={()=>setActive('Militares')}>⌕ <span>Buscar militar, patente ou registro...</span><kbd>⌘ K</kbd></button><Link className="user" href="/" title="Fazer login"><div style={{width:34,height:34,borderRadius:8,background:'#1a2a1a',display:'grid',placeItems:'center',color:'var(--accent)',fontSize:12,fontWeight:700}}>CE</div><div><b>ComandanteEB</b><small>[CR] Criador</small></div><span>⌄</span></Link></header>
<div className="page"><div className="eyebrow">— MODO PREVIEW · <a href="/" style={{color:'var(--accent)',textDecoration:'underline'}}>FAÇA LOGIN PARA USAR</a></div><div className="hero"><div><h1>{active}</h1><p>Bem-vindo ao centro de operações do EB DO MIG.</p></div><div><Link href="/" className="primary" style={{textDecoration:'none'}}>🔑 Fazer login com Roblox</Link></div></div>
{active==='Visão geral'?<><div className="stats">{displayStats.map(([l,v,d],i)=><article className="stat" key={l}><div><span>{l}</span><i>{['♟','◷','◆','▤'][i]}</i></div><strong>{v}</strong><small>{d}</small></article>)}</div>
<div className="main-grid"><article className="panel activity"><PanelHead tag="TEMPO REAL" title="Atividade recente" action="Ver todos →"/><div className="timeline"><EmptyState text="As ações reais aparecerão após a sincronização."/></div></article>
<aside className="right"><article className="panel"><PanelHead tag="CAPACITAÇÃO" title="CDP ativo" action="Ver painel"/><EmptyState text={stats?.emCdp?`${stats.emCdp} militares em capacitação`:'Nenhuma capacitação ativa'}/></article><article className="panel quick"><span className="kicker">ACESSO RÁPIDO</span><h2>Ações de comando</h2><div>{[['↑','Realizar UP'],['◆','Novo treino'],['◷','Criar CDP'],['⌕','Consultar']].map(([i,t])=><button key={t} onClick={goToLogin}><i>{i}</i><b>{t}</b></button>)}</div></article></aside></div>
<article className="panel divisions"><PanelHead tag="ORGANIZAÇÃO" title="Divisões configuradas" action={`○ ${totalDiv} membros`}/><div className="division-list">{divisions.map(([n,c])=><div className="division" key={n}><b>{n}</b><small>{c} membros</small><div><i style={{width:`${Math.min(100,parseInt(c||'0')*4)}%`}}/></div></div>)}</div></article></>:<WorkspaceView active={active} onAction={goToLogin}/>}</div></section></main>}

function PanelHead({tag,title,action}:{tag:string,title:string,action:string}){return<div className="panel-head"><div><span className="kicker">{tag}</span><h2>{title}</h2></div><button>{action}</button></div>}
function EmptyState({text}:{text:string}){return<div className="empty-state"><span>◇</span><b>Nenhum dado disponível</b><p>{text}</p></div>}
function WorkspaceView({active,onAction}:{active:string,onAction:()=>void}){const cfg:Record<string,[string,string,string[]]>={
'Militares':['EFETIVO','Consulta de militares',[]],
'Capacitação · CDP':['CAPACITAÇÃO','CDPs em andamento',[]],
'Treinamentos':['ACADEMIA','Treinos de patente',[]],
'Promoções · UP':['CARREIRA','Promoções militares',[]],
'Rebaixamentos':['DISCIPLINA','Relatórios de rebaixamento',[]],
'Registros':['AUDITORIA','Registros protegidos',[]],
'Painel do criador':['ACESSO MÁXIMO','Painel do criador',['Patentes e hierarquia','Divisões e grupos Roblox','Permissões e integrações']],
'Configurações':['SISTEMA','Configurações',['Integração Roblox · Configurada','Discord e webhooks · Aguardando canal','Segurança e permissões · Preparadas']]};const[tag,title,rows]=cfg[active]||cfg.Militares;return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">{tag}</span><h2>{title}</h2></div><button className="primary" onClick={onAction}>＋ Nova ação</button></div><label className="workspace-search">⌕ <input placeholder="Pesquisar por nome, ID ou patente"/></label><div className="records">{rows.length?rows.map((row,i)=><button key={row}><span className="record-avatar">{row.slice(0,2).toUpperCase()}</span><div><b>{row.split(' · ')[0]}</b><small>{row.split(' · ').slice(1).join(' · ')}</small></div><em>{i===1?'EM ANDAMENTO':'ATIVO'}</em><strong>→</strong></button>):<EmptyState text="Os registros aparecerão aqui quando a integração estiver ativa."/>}</div></article><aside className="panel help"><span className="kicker">CONTROLE SEGURO</span><h2>Permissões preparadas</h2><p>Todas as ações serão validadas conforme a patente, CDP ativo e cargo do responsável.</p><ul><li>Login oficial Roblox</li><li>Registros permanentes</li><li>Regras no servidor</li></ul></aside></div>}
