import Link from 'next/link';
import type{ReactNode}from'react';
import{BrandEmblem}from'./BrandEmblem';

export function LegalPage({eyebrow,title,summary,children}:{eyebrow:string;title:string;summary:string;children:ReactNode}){
  return <main className="legal-page">
    <header className="legal-topbar">
      <Link className="legal-brand" href="/" aria-label="Voltar à Central Militar">
        <BrandEmblem size={48} decorative priority/><div><b>EB DO MIG</b><small>Central Militar</small></div>
      </Link>
      <nav aria-label="Documentos legais"><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></nav>
    </header>
    <article className="legal-document">
      <div className="legal-heading"><span>{eyebrow}</span><h1>{title}</h1><p>{summary}</p><small>Última atualização: 28 de agosto de 2026</small></div>
      <div className="legal-copy">{children}</div>
      <footer className="legal-footer"><p>EB DO MIG · Grupo Roblox 521106467</p><Link href="/">Voltar à Central</Link></footer>
    </article>
  </main>;
}

export function ContactBlock(){
  const email=process.env.SUPPORT_EMAIL?.trim();
  return <>
    <p>Para dúvidas, correções ou pedidos sobre dados pessoais, fale com a administração pelo grupo oficial do EB DO MIG no Roblox{email?' ou pelo e-mail informado abaixo':'.'}</p>
    <p><a href="https://www.roblox.com/communities/521106467" target="_blank" rel="noreferrer">Grupo oficial EB DO MIG no Roblox</a></p>
    {email&&<p><a href={`mailto:${email}`}>{email}</a></p>}
  </>;
}
