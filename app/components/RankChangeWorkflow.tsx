'use client';

import{useState}from'react';

const GROUPS=[{sigla:'EXÉRCITO',id:521106467},{sigla:'STAFF',id:319140811},{sigla:'BFE',id:34565583},{sigla:'CIE',id:729809284},{sigla:'BAC',id:886757353},{sigla:'BPE',id:710960394}];
type Mode='promotion'|'demotion';
type Change={groupId:number;community:string;userId:string;direction:Mode;current:{id:string;name:string;rank:number};target:{id:string;name:string;rank:number}};
type FoundMember={userId:string;username:string;avatar?:string};

export function RankChangeWorkflow({mode,preview=false}:{mode:Mode;preview?:boolean}){
  const isPromotion=mode==='promotion';
  const[community,setCommunity]=useState(GROUPS[0]);
  const[search,setSearch]=useState(preview?'gabribor-sola':'');
  const[member,setMember]=useState<FoundMember|null>(null);
  const[change,setChange]=useState<Change|null>(null);
  const[reason,setReason]=useState('');
  const[step,setStep]=useState<'search'|'review'|'confirm'|'done'>('search');
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');

  async function lookup(){
    if(!search.trim())return;setLoading(true);setError('');setChange(null);setStep('search');
    try{
      if(preview){
        const demo={userId:'391027',username:search.trim()};setMember(demo);
        setChange({groupId:community.id,community:community.sigla,userId:demo.userId,direction:mode,current:isPromotion?{id:'808360028',name:'[REC] Recruta',rank:1}:{id:'807380036',name:'[SLD] Soldado',rank:2},target:isPromotion?{id:'807380036',name:'[SLD] Soldado',rank:2}:{id:'808360028',name:'[REC] Recruta',rank:1}});setStep('review');return;
      }
      const memberResponse=await fetch(`/api/militares/search?q=${encodeURIComponent(search.trim())}`);const memberData=await memberResponse.json();
      if(!memberResponse.ok||!memberData.members?.[0])throw new Error(memberData.error||'Militar não encontrado nas comunidades.');
      const found=memberData.members[0]as FoundMember;setMember(found);
      const response=await fetch('/api/ranks/change',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({userId:found.userId,groupId:community.id,direction:mode,confirm:false})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível calcular o próximo cargo.');setChange(data.change);setStep('review');
    }catch(caught){setMember(null);setError(caught instanceof Error?caught.message:'Não foi possível consultar o militar.')}finally{setLoading(false)}
  }
  async function apply(){
    if(!change||reason.trim().length<5)return;
    if(preview){setStep('done');return}
    setLoading(true);setError('');
    try{const response=await fetch('/api/ranks/change',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({userId:change.userId,groupId:change.groupId,direction:mode,confirm:true,targetRoleId:change.target.id,reason:reason.trim()})});const data=await response.json();if(!response.ok)throw new Error(data.error||'O Roblox não confirmou a alteração.');setChange(data.change);setStep('done')}
    catch(caught){setError(caught instanceof Error?caught.message:'Não foi possível alterar a patente.');setStep('review')}finally{setLoading(false)}
  }
  function reset(){setMember(null);setChange(null);setReason('');setError('');setStep('search');if(!preview)setSearch('')}

  return<div className="rank-workflow"><div className="training-heading"><div><span className="kicker">{isPromotion?'CARREIRA · UP':'DISCIPLINA · REBAIXAMENTO'}</span><h1>{isPromotion?'Promover militar':'Rebaixar militar'}</h1><p>A alteração é calculada usando a hierarquia atual da comunidade.</p></div><span className={`integration-pill ${preview?'preview':''}`}><i/>{preview?'SIMULAÇÃO SEGURA':'ROBLOX OPEN CLOUD'}</span></div>
    {step==='done'&&change&&member?<div className={`panel rank-done ${isPromotion?'':'danger'}`}><span className="rank-done-mark">{isPromotion?'↑':'↓'}</span><span className="kicker">ALTERAÇÃO CONCLUÍDA</span><h2>{member.username}</h2><p>{preview?'Simulação concluída; nenhum cargo real foi alterado.':'O Roblox confirmou a atualização da patente.'}</p><div className="rank-transition compact"><div><small>ANTERIOR</small><b>{change.current.name}</b></div><span>→</span><div><small>NOVO CARGO</small><b>{change.target.name}</b></div></div><button type="button" className="secondary" onClick={reset}>Fazer outra alteração</button></div>:
    <div className="rank-layout"><section className="panel rank-main"><div className="form-section-head"><span>01</span><div><b>Comunidade</b><small>Escolha o grupo em que o cargo será alterado.</small></div></div><div className="community-picker">{GROUPS.map(group=><button type="button" key={group.id} className={community.id===group.id?'active':''} onClick={()=>{setCommunity(group);setMember(null);setChange(null);setStep('search');setError('')}}>{group.sigla}</button>)}</div>
      <div className="form-section-head rank-search-head"><span>02</span><div><b>Localizar militar</b><small>Username ou ID exato do Roblox.</small></div></div><label className="workspace-search rank-search"><span className="search-code">BUSCA</span><input placeholder="Username ou ID" value={search} onChange={event=>{setSearch(event.target.value);setMember(null);setChange(null);setStep('search')}} onKeyDown={event=>event.key==='Enter'&&lookup()}/><button type="button" className="primary" disabled={!search.trim()||loading} onClick={lookup}>{loading?'Consultando...':'Verificar patente'}</button></label>
      {error&&<div className="training-error rank-error" role="alert">{error}</div>}
      {member&&change&&<div className="rank-review"><div className="rank-member"><span>{member.username.slice(0,2).toUpperCase()}</span><div><b>{member.username}</b><small>{community.sigla} · ID {member.userId}</small></div><em>LOCALIZADO</em></div><div className="rank-transition"><div><small>CARGO ATUAL</small><b>{change.current.name}</b><em>nível {change.current.rank}</em></div><span>{isPromotion?'↑':'↓'}</span><div><small>{isPromotion?'PRÓXIMO CARGO':'CARGO INFERIOR'}</small><b>{change.target.name}</b><em>nível {change.target.rank}</em></div></div><label className="field-label" htmlFor={`${mode}-reason`}>Motivo da alteração</label><textarea id={`${mode}-reason`} rows={4} maxLength={500} placeholder={isPromotion?'Ex.: Concluiu o treinamento e cumpriu os requisitos...':'Ex.: Medida disciplinar conforme registro...'} value={reason} onChange={event=>setReason(event.target.value)}/>{step==='confirm'?<div className={`rank-confirm ${isPromotion?'':'danger'}`}><b>Confirme a alteração {preview?'simulada':'real'}</b><p>{preview?'O preview não modifica o Roblox.':'Ao confirmar, a patente será alterada imediatamente na comunidade.'}</p><div><button type="button" className="secondary" onClick={()=>setStep('review')}>Voltar</button><button type="button" className={isPromotion?'primary':'danger-btn'} disabled={loading} onClick={apply}>{loading?'Alterando...':isPromotion?'Confirmar UP':'Confirmar rebaixamento'}</button></div></div>:<button type="button" className={isPromotion?'primary training-submit rank-submit':'danger-btn training-submit rank-submit'} disabled={reason.trim().length<5} onClick={()=>setStep('confirm')}>Revisar e continuar</button>}</div>}
    </section><aside className="panel training-summary rank-guidance"><span className="kicker">SEGURANÇA</span><h2>Alteração em duas etapas</h2><ol><li><span>1</span>O site consulta o cargo atual.</li><li><span>2</span>Calcula o cargo seguinte na comunidade.</li><li><span>3</span>Exige motivo e confirmação.</li><li><span>4</span>O servidor solicita a alteração ao Roblox.</li></ol><div className="proof-guidance"><b>Permissão necessária</b>A chave Open Cloud deve possuir <code>group:write</code> para cada comunidade.</div></aside></div>}
  </div>;
}
