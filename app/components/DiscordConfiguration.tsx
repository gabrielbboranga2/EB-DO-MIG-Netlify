'use client';

import{useEffect,useState}from'react';

export function DiscordConfiguration({preview=false}:{preview?:boolean}){
  const[status,setStatus]=useState<{trainings:boolean;logs:boolean;database:boolean}|null>(preview?{trainings:true,logs:true,database:true}:null);
  useEffect(()=>{if(!preview)fetch('/api/integrations/status').then(response=>response.json()).then(data=>setStatus({trainings:Boolean(data.trainings),logs:Boolean(data.logs),database:Boolean(data.database)})).catch(()=>setStatus({trainings:false,logs:false,database:false}))},[preview]);
  const configured=status?.trainings;
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">SISTEMA</span><h2>Configurações</h2></div></div>
    <div className="secure-config"><div className="secure-config-icon">DC</div><div><span className="kicker">INTEGRAÇÃO PROTEGIDA</span><h3>Envio automático ao Discord</h3><p>O endereço do webhook fica guardado no servidor da Vercel. Instrutores e visitantes nunca conseguem visualizar ou copiar essa credencial.</p></div><span className={`config-status ${configured?'active':configured===false?'pending':'checking'}`}>{configured?'ATIVO':configured===false?'PENDENTE':'VERIFICANDO'}</span></div>
    <div className="env-instruction"><span>VARIÁVEIS NECESSÁRIAS</span><code>DISCORD_TRAININGS_WEBHOOK</code> <code>DISCORD_LOGS_WEBHOOK</code> <code>DATABASE_URL</code><p>{preview?'No site real, essas variáveis são cadastradas em Settings → Environment Variables na Vercel.':'Cadastre os dois webhooks e a conexão PostgreSQL na Vercel, depois faça um novo deploy.'}</p></div>
    <h3 className="integration-title">Status das integrações</h3><div className="records"><div className="record"><span className="record-avatar" style={{background:'#1a2a1a'}}>RB</span><div><b>Roblox OAuth</b><small>Identificação e comunidades oficiais</small></div><em style={{color:'var(--accent)'}}>ATIVO</em></div><div className="record"><span className="record-avatar" style={{background:'#1a1a2a'}}>TR</span><div><b>Provas de treinamento</b><small>Foto, instrutor, participantes e relatório</small></div><em>{status?.trainings?'ATIVO':status?'PENDENTE':'...'}</em></div><div className="record"><span className="record-avatar" style={{background:'#251f17'}}>LG</span><div><b>Canal logs site</b><small>CDP, treinos, UP, rebaixamento e gestão em massa</small></div><em>{status?.logs?'ATIVO':status?'PENDENTE':'...'}</em></div><div className="record"><span className="record-avatar" style={{background:'#172421'}}>DB</span><div><b>Banco PostgreSQL</b><small>CDPs e prazos persistentes na Vercel</small></div><em>{status?.database?'ATIVO':status?'PENDENTE':'...'}</em></div></div>
    <div className="security-note"><b>Importante</b><p>Nunca publique a URL do webhook no GitHub, em prints ou em campos visíveis do site. Se ela vazar, apague o webhook no Discord e crie outro.</p></div>
  </article></div>;
}
