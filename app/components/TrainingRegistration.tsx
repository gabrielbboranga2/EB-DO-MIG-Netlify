'use client';
/* eslint-disable @next/next/no-img-element -- Local object URLs from the proof file cannot use next/image. */

import{ChangeEvent,FormEvent,KeyboardEvent,useEffect,useMemo,useState}from'react';
import{TRAINING_COMMUNITIES,TRAINING_RULES,TrainingCommunity}from'@/lib/training-rules';
const MAX_FILE_SIZE=8*1024*1024;
const ALLOWED_TYPES=['image/jpeg','image/png','image/webp'];

type Props={instructor:string;instructorRank?:number;instructorRole?:string;membershipRanks?:Array<{sigla:string;rank:number;role?:string}>;preview?:boolean};

export function TrainingRegistration({instructor,instructorRank=0,instructorRole='',membershipRanks=[],preview=false}:Props){
  const[community,setCommunity]=useState<TrainingCommunity>('EXÉRCITO');
  const[training,setTraining]=useState(TRAINING_RULES['EXÉRCITO'][0].id);
  const[participantInput,setParticipantInput]=useState('');
  const[participants,setParticipants]=useState<string[]>(preview?['gabribor-sola']:[]);
  const[observation,setObservation]=useState('');
  const[proof,setProof]=useState<File|null>(null);
  const[proofUrl,setProofUrl]=useState('');
  const[error,setError]=useState('');
  const[status,setStatus]=useState<'editing'|'sending'|'done'>('editing');
  const[receipt,setReceipt]=useState('');
  const options=TRAINING_RULES[community];
  const effectiveRank=community==='EXÉRCITO'?instructorRank:(membershipRanks.find(item=>item.sigla===community)?.rank||(preview?instructorRank:0));
  const effectiveRole=community==='EXÉRCITO'?instructorRole:(membershipRanks.find(item=>item.sigla===community)?.role||'');
  const selectedRule=options.find(rule=>rule.id===training)||options[0];
  const isEligible=effectiveRank>=selectedRule.minInstructorRank;
  const eligibleCount=options.filter(rule=>effectiveRank>=rule.minInstructorRank).length;
  const canSubmit=participants.length>0&&!!training&&isEligible&&observation.trim().length>=10&&!!proof&&status!=='sending';

  useEffect(()=>()=>{if(proofUrl)URL.revokeObjectURL(proofUrl)},[proofUrl]);
  const summary=useMemo(()=>`${participants.length} ${participants.length===1?'participante':'participantes'}`,[participants.length]);

  function changeCommunity(next:TrainingCommunity){
    const rank=next==='EXÉRCITO'?instructorRank:(membershipRanks.find(item=>item.sigla===next)?.rank||(preview?instructorRank:0));
    const firstAllowed=TRAINING_RULES[next].find(rule=>rank>=rule.minInstructorRank)||TRAINING_RULES[next][0];
    setCommunity(next);setTraining(firstAllowed.id);setError('');setStatus('editing');
  }
  function addParticipants(){
    const candidates=participantInput.split(/[\s,;]+/).map(value=>value.trim()).filter(Boolean);
    if(!candidates.length)return;
    const valid=candidates.filter(value=>/^[A-Za-z0-9_]{3,20}$/.test(value));
    const merged=Array.from(new Set([...participants,...valid])).slice(0,15);
    setParticipants(merged);setParticipantInput('');setStatus('editing');
    setError(valid.length!==candidates.length?'Um ou mais usernames foram ignorados por estarem em formato inválido.':'');
  }
  function participantKeyDown(event:KeyboardEvent<HTMLInputElement>){
    if(event.key==='Enter'||event.key===','){event.preventDefault();addParticipants()}
  }
  function chooseProof(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0]||null;
    setError('');setStatus('editing');
    if(!file){setProof(null);setProofUrl('');return}
    if(!ALLOWED_TYPES.includes(file.type)){setError('Use uma imagem JPG, PNG ou WEBP.');event.target.value='';return}
    if(file.size>MAX_FILE_SIZE){setError('A foto deve ter no máximo 8 MB.');event.target.value='';return}
    if(proofUrl)URL.revokeObjectURL(proofUrl);
    setProof(file);setProofUrl(URL.createObjectURL(file));
  }
  async function submit(event:FormEvent){
    event.preventDefault();setError('');
    if(!canSubmit){setError('Preencha o treinamento, participantes, relatório e anexe a foto obrigatória.');return}
    setStatus('sending');
    if(preview){
      await new Promise(resolve=>setTimeout(resolve,700));
      setReceipt(`DEMO-${Date.now().toString().slice(-6)}`);setStatus('done');return;
    }
    try{
      const body=new FormData();
      body.set('community',community);body.set('training',selectedRule.id);body.set('participants',JSON.stringify(participants));
      body.set('observation',observation.trim());body.set('proof',proof as File);
      const response=await fetch('/api/trainings',{method:'POST',body});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Não foi possível enviar o registro.');
      setReceipt(data.messageId||`TREINO-${Date.now().toString().slice(-6)}`);setStatus('done');
    }catch(caught){setError(caught instanceof Error?caught.message:'Não foi possível enviar o registro.');setStatus('editing')}
  }
  function reset(){
    setParticipants(preview?['gabribor-sola']:[]);setParticipantInput('');setObservation('');setProof(null);setProofUrl('');setReceipt('');setError('');setStatus('editing');
  }

  if(status==='done')return<div className="training-success panel"><span className="training-success-mark">✓</span><span className="kicker">REGISTRO CONCLUÍDO</span><h2>Treinamento documentado</h2><p>{preview?'A simulação foi concluída. Nenhuma mensagem real foi enviada.':'A foto e o relatório foram enviados automaticamente ao canal do Discord.'}</p><div className="training-receipt"><div><small>PROTOCOLO</small><b>{receipt}</b></div><div><small>COMUNIDADE</small><b>{community}</b></div><div><small>EFETIVO</small><b>{summary}</b></div><div><small>PROVA</small><b>ANEXADA</b></div></div><button type="button" className="secondary" onClick={reset}>Registrar outro treinamento</button></div>;

  return<form className="training-workflow" onSubmit={submit}>
    <div className="training-heading"><div><span className="kicker">ACADEMIA · REGISTRO OPERACIONAL</span><h1>Registrar treinamento</h1><p>Documente a atividade e encaminhe a prova ao Discord em um único fluxo.</p></div><span className={`integration-pill ${preview?'preview':''}`}><i/>{preview?'SIMULAÇÃO SEGURA':'ENVIO AUTOMÁTICO'}</span></div>
    <section className="panel instructor-overview"><div className="instructor-summary"><span className="instructor-seal">IN</span><div><span className="kicker">INSTRUTOR</span><h2>{instructor}</h2><p>{eligibleCount} de {options.length} treinamentos liberados em {community}</p></div><div className="instructor-metric"><strong>{eligibleCount}</strong><small>LIBERADOS</small></div></div><div className="training-rule-head"><div><span className="kicker">TREINOS QUE VOCÊ PODE CONDUZIR</span><h3>Elegibilidade por patente</h3></div><small>Cargo atual: {effectiveRole||`nível ${effectiveRank}`}</small></div><div className="training-rule-grid">{options.map(rule=>{const allowed=effectiveRank>=rule.minInstructorRank;return<button type="button" key={rule.id} className={`${training===rule.id?'selected ':''}${allowed?'allowed':'locked'}`} onClick={()=>allowed&&setTraining(rule.id)} aria-disabled={!allowed}><span className="training-rule-code">{rule.code}</span><div><b>{rule.name}</b><p>{rule.result}</p><small>{allowed?'LIBERADO':`Exige ${rule.minInstructorRole}`}</small></div><em>{allowed?'✓':'🔒'}</em></button>})}</div></section>
    <div className="training-layout"><section className="panel training-form-panel">
      <div className="form-section"><div className="form-section-head"><span>01</span><div><b>Comunidade e instrução</b><small>Selecione onde o treinamento foi realizado.</small></div></div><div className="community-picker">{TRAINING_COMMUNITIES.map(item=><button type="button" key={item} className={community===item?'active':''} onClick={()=>changeCommunity(item)}>{item}</button>)}</div><label className="field-label" htmlFor="training-type">Tipo de treinamento</label><select id="training-type" value={training} onChange={event=>setTraining(event.target.value)}>{options.map(rule=><option key={rule.id} value={rule.id} disabled={effectiveRank<rule.minInstructorRank}>{rule.name}{effectiveRank<rule.minInstructorRank?` — exige ${rule.minInstructorRole}`:''}</option>)}</select>{!isEligible&&<div className="training-lock-note">Seu cargo atual não pode conduzir este treinamento. Patente mínima: <b>{selectedRule.minInstructorRole}</b>.</div>}</div>
      <div className="form-section"><div className="form-section-head"><span>02</span><div><b>Militares participantes</b><small>Adicione de 1 a 15 usernames do Roblox.</small></div><em>{participants.length}/15</em></div><div className="participant-entry"><input aria-label="Username do participante" placeholder="Ex.: gabribor-sola" value={participantInput} onChange={event=>setParticipantInput(event.target.value)} onKeyDown={participantKeyDown}/><button type="button" className="secondary" onClick={addParticipants} disabled={!participantInput.trim()||participants.length>=15}>Adicionar</button></div>{participants.length>0&&<div className="participant-chips">{participants.map(name=><span key={name}>{name}<button type="button" aria-label={`Remover ${name}`} onClick={()=>setParticipants(current=>current.filter(item=>item!==name))}>×</button></span>)}</div>}</div>
      <div className="form-section"><div className="form-section-head"><span>03</span><div><b>Relatório do instrutor</b><small>Registre o desempenho e qualquer ocorrência relevante.</small></div></div><textarea aria-label="Relatório do treinamento" rows={5} maxLength={1000} placeholder="Descreva como foi o treinamento, desempenho dos participantes e observações..." value={observation} onChange={event=>setObservation(event.target.value)}/><small className="char-count">{observation.length}/1000 · mínimo de 10 caracteres</small></div>
      <div className="form-section proof-section"><div className="form-section-head"><span>04</span><div><b>Prova fotográfica obrigatória</b><small>Foto dos jogadores em formação de cunha com a bandeira do Brasil visível ao fundo.</small></div><em>OBRIGATÓRIO</em></div><label className={`proof-uploader ${proof?'has-file':''}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseProof}/>{proofUrl?<img src={proofUrl} alt="Prévia da prova do treinamento"/>:<span className="proof-icon">IMG</span>}<div><b>{proof?proof.name:'Selecionar foto da cunha'}</b><small>{proof?`${(proof.size/1024/1024).toFixed(2)} MB · pronta para envio`:'JPG, PNG ou WEBP · máximo 8 MB'}</small></div><strong>{proof?'Trocar':'Anexar'}</strong></label></div>
      {error&&<div className="training-error" role="alert">{error}</div>}
      <button className="primary training-submit" type="submit" disabled={!canSubmit}>{status==='sending'?'Enviando ao Discord...':preview?'Concluir simulação':'Registrar e enviar ao Discord'}</button>
    </section><aside className="panel training-summary"><span className="kicker">CONFERÊNCIA</span><h2>Resumo do registro</h2><dl><div><dt>Instrutor</dt><dd>{instructor}</dd></div><div><dt>Comunidade</dt><dd>{community}</dd></div><div><dt>Treinamento</dt><dd>{selectedRule.name}</dd></div><div><dt>Patente mínima</dt><dd>{selectedRule.minInstructorRole}</dd></div><div><dt>Participantes</dt><dd>{summary}</dd></div><div><dt>Prova da cunha</dt><dd className={proof?'ready':''}>{proof?'Pronta':'Pendente'}</dd></div></dl><div className="discord-route"><span>DC</span><div><b>Destino automático</b><small>{preview?'Discord simulado no preview':'Canal de treinamentos do Discord'}</small></div></div><p className="proof-guidance"><b>A foto precisa comprovar o treino.</b> Confirme a formação em cunha, os jogadores visíveis e a bandeira brasileira ao fundo antes de enviar.</p></aside></div>
    <section className="panel instructor-history"><div className="training-rule-head"><div><span className="kicker">HISTÓRICO DE SESSÕES</span><h3>Meus treinamentos</h3></div><small>{preview?'3 SESSÕES DEMONSTRATIVAS':'NOVOS REGISTROS APARECERÃO AQUI'}</small></div>{preview?<div className="history-table"><div className="history-row header"><span>Treinamento</span><span>Comunidade</span><span>Participantes</span><span>Data</span></div>{[['Treinamento de Praças','EXÉRCITO','8','Hoje, 14:30'],['Treinamento de Graduados','EXÉRCITO','5','Ontem, 19:10'],['Policiamento ostensivo','BPE','6','24/08, 16:45']].map(row=><div className="history-row" key={row.join('-')}>{row.map(value=><span key={value}>{value}</span>)}</div>)}</div>:<div className="history-empty"><span>TR</span><div><b>Nenhuma sessão registrada nesta visualização</b><p>Após a conexão do banco de dados, o histórico permanente aparecerá aqui.</p></div></div>}</section>
  </form>;
}
