'use client';
/* eslint-disable @next/next/no-img-element -- Roblox avatars are remote, dynamic URLs. */

import{useEffect,useState,type ReactNode}from'react';
import Link from'next/link';
import{BrandEmblem}from'./BrandEmblem';

const COMMAND_NAV=[
  {label:'Visão geral',code:'VG'},
  {label:'Militares',code:'EF'},
  {label:'Capacitação · CDP',code:'CD'},
  {label:'Treinamentos',code:'TR'},
  {label:'Promoções · UP',code:'UP'},
  {label:'Rebaixamentos',code:'RB'},
  {label:'Registros',code:'RG'},
];

const ADMIN_NAV=[
  {label:'Painel do criador',code:'PC'},
  {label:'Configurações',code:'CF'},
];

type DashboardShellProps={
  active:string;
  onNavigate:(page:string)=>void;
  username:string;
  rank:string;
  avatar?:string;
  isAdmin?:boolean;
  preview?:boolean;
  children:ReactNode;
};

export function DashboardShell({active,onNavigate,username,rank,avatar,isAdmin=false,preview=false,children}:DashboardShellProps){
  const[menuOpen,setMenuOpen]=useState(false);
  const adminItems=isAdmin?ADMIN_NAV:ADMIN_NAV.slice(1);
  const initials=username.split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase()||'EB';
  const navigate=(page:string)=>{onNavigate(page);setMenuOpen(false)};

  useEffect(()=>{
    if(!menuOpen)return;
    const previousOverflow=document.body.style.overflow;
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setMenuOpen(false)};
    document.body.style.overflow='hidden';
    window.addEventListener('keydown',closeOnEscape);
    return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',closeOnEscape)};
  },[menuOpen]);

  return <div className="shell">
    <header className="mobile-bar">
      <div className="mobile-brand"><BrandEmblem size={42} decorative priority/><div><b>EB DO MIG</b><small>{active}</small></div></div>
      <button type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="dashboard-navigation" onClick={()=>setMenuOpen(current=>!current)}>
        <span aria-hidden="true"><i/><i/></span>{menuOpen?'Fechar':'Menu'}
      </button>
    </header>

    <aside id="dashboard-navigation" className={`sidebar${menuOpen?' open':''}`}>
      <div className="brand">
        <BrandEmblem size={58} decorative priority/>
        <div className="brand-copy"><b>EB DO MIG</b><small>Central Militar</small></div>
      </div>

      <nav aria-label="Navegação principal">
        <p className="nav-label">COMANDO</p>
        <div className="nav-group">{COMMAND_NAV.map(item=><NavButton key={item.label} item={item} active={active} onNavigate={navigate}/>)}</div>
        <p className="nav-label">ADMINISTRAÇÃO</p>
        <div className="nav-group">{adminItems.map(item=><NavButton key={item.label} item={item} active={active} onNavigate={navigate}/>)}</div>
      </nav>

      <div className="sidebar-foot"><i aria-hidden="true"/><div><b>{preview?'Ambiente de demonstração':'Sistemas operacionais'}</b><small>{preview?'Dados seguros para teste':'Roblox sincronizado'}</small></div></div>
      <div className="sidebar-mobile-account">
        <AccountIdentity username={username} rank={rank} avatar={avatar} initials={initials}/>
        {preview?<Link className="login-btn" href="/">Fazer login</Link>:<a className="logout-btn" href="/api/auth/logout">Sair</a>}
      </div>
    </aside>

    {menuOpen&&<button type="button" className="sidebar-overlay" aria-label="Fechar menu" onClick={()=>setMenuOpen(false)}/>}

    <section className="content">
      <header className="topbar">
        <div className="topbar-context"><small>SEÇÃO ATUAL</small><b>{active}</b></div>
        <div className="topbar-actions">
          <AccountIdentity username={username} rank={rank} avatar={avatar} initials={initials}/>
          {preview?<Link className="login-btn" href="/">Fazer login</Link>:<a className="logout-btn" href="/api/auth/logout">Sair</a>}
        </div>
      </header>

      <main className="page">
        {preview&&<div className="preview-banner"><span>PREVIEW INTERATIVO</span><p>Explore a interface com dados demonstrativos.</p><Link href="/">Acessar sistema</Link></div>}
        {children}
      </main>
    </section>
  </div>;
}

function AccountIdentity({username,rank,avatar,initials}:{username:string;rank:string;avatar?:string;initials:string}){
  return <div className="user-info">
    {avatar?<img className="avatar" src={avatar} alt="" onError={event=>{event.currentTarget.style.display='none'}}/>:<span className="avatar-fallback" aria-hidden="true">{initials}</span>}
    <div><b>{username}</b><small>{rank}</small></div>
  </div>;
}

function NavButton({item,active,onNavigate}:{item:{label:string;code:string};active:string;onNavigate:(page:string)=>void}){
  const selected=active===item.label;
  return <button type="button" className={`nav-item${selected?' active':''}`} aria-current={selected?'page':undefined} onClick={()=>onNavigate(item.label)}>
    <span aria-hidden="true">{item.code}</span><b>{item.label}</b>
  </button>;
}

export function PanelHead({tag,title,action}:{tag:string;title:string;action?:string}){
  return <div className="panel-head"><div><span className="kicker">{tag}</span><h2>{title}</h2></div>{action&&<span className="panel-meta">{action}</span>}</div>;
}

export function EmptyState({text,title='Nenhum dado disponível'}:{text:string;title?:string}){
  return <div className="empty-state"><span aria-hidden="true">—</span><b>{title}</b><p>{text}</p></div>;
}
