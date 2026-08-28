'use client';

import{useEffect,useState}from'react';

export function DiscordConfiguration({preview=false}:{preview?:boolean}){
  const[configured,setConfigured]=useState<boolean|null>(preview?true:null);
  useEffect(()=>{if(!preview)fetch('/api/integrations/status').then(response=>response.json()).then(data=>setConfigured(Boolean(data.trainings))).catch(()=>setConfigured(false))},[preview]);
  return<div className="workspace-grid"><article className="panel workspace"><div className="workspace-toolbar"><div><span className="kicker">SISTEMA</span><h2>Configurações</h2></div></div>
    <div className="secure-config"><div className="secure-config-icon">DC</div><div><span className="kicker">INTEGRAÇÃO PROTEGIDA</span><h3>Envio automático ao Discord</h3><p>O endereço do webhook fica guardado no servidor da Vercel. Instrutores e visitantes nunca conseguem visualizar ou copiar essa credencial.</p></div><span className={`config-status ${configured?'active':configured===false?'pending':'checking'}`}>{configured?'ATIVO':configured===false?'PENDENTE':'VERIFICANDO'}</span></div>
    <div className="env-instruction"><span>VARIÁVEL NECESSÁRIA</span><code>DISCORD_TRAININGS_WEBHOOK</code><p>{preview?'No site real, essa variável é cadastrada em Settings → Environment Variables na Vercel.':'Cadastre a URL do webhook nesta variável em Settings → Environment Variables e faça um novo deploy.'}</p></div>
    <h3 className="integration-title">Status das integrações</h3><div className="records"><div className="record"><span className="record-avatar" style={{background:'#1a2a1a'}}>RB</span><div><b>Roblox OAuth</b><small>Identificação e comunidades oficiais</small></div><em style={{color:'var(--accent)'}}>ATIVO</em></div><div className="record"><span className="record-avatar" style={{background:'#1a1a2a'}}>DC</span><div><b>Provas de treinamento</b><small>Foto, instrutor, participantes e relatório</small></div><em>{configured?'ATIVO':configured===false?'PENDENTE':'...'}</em></div></div>
    <div className="security-note"><b>Importante</b><p>Nunca publique a URL do webhook no GitHub, em prints ou em campos visíveis do site. Se ela vazar, apague o webhook no Discord e crie outro.</p></div>
  </article></div>;
}
