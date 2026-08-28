import type{Metadata}from'next';
import Link from'next/link';
import{ContactBlock,LegalPage}from'../components/LegalPage';

export const metadata:Metadata={title:'Termos de Serviço | EB DO MIG',description:'Condições de uso da Central Militar EB DO MIG.'};

export default function Termos(){
  return <LegalPage eyebrow="DOCUMENTO PÚBLICO" title="Termos de Serviço" summary="Condições para acessar e utilizar a Central Militar do grupo EB DO MIG.">
    <section><h2>1. Aceitação</h2><p>Ao acessar a Central Militar, você concorda com estes Termos e com a <Link href="/privacidade">Política de Privacidade</Link>. Se não concordar, não autorize o login nem utilize o painel.</p></section>
    <section><h2>2. Sobre o serviço</h2><p>A Central Militar é uma ferramenta independente de gestão do grupo Roblox EB DO MIG, número 521106467, e de suas divisões. Ela consulta participação, cargos e perfis públicos para autenticação, organização do efetivo, capacitação e auditoria interna.</p></section>
    <section><h2>3. Elegibilidade e conta</h2><ul><li>Você deve possuir uma conta Roblox válida e observar os termos e regras da plataforma;</li><li>o acesso interno depende da participação no grupo e das permissões associadas à patente;</li><li>você é responsável por proteger sua conta e encerrar a sessão em dispositivos compartilhados;</li><li>não informe sua senha Roblox ao EB DO MIG. O login ocorre somente na página oficial de autorização da Roblox.</li></ul></section>
    <section><h2>4. Uso permitido</h2><p>O painel deve ser usado exclusivamente para atividades legítimas do grupo. É proibido tentar burlar permissões, acessar dados sem autorização, interferir no serviço, falsificar registros, explorar falhas, automatizar abuso ou usar informações de membros para assédio, discriminação, publicidade ou finalidade externa ao grupo.</p></section>
    <section><h2>5. Ações administrativas</h2><p>Usuários autorizados podem registrar treinamentos e outras ações administrativas conforme a hierarquia. Quando funções que alteram cargos forem habilitadas, cada ação deverá respeitar as permissões do grupo e poderá ser auditada. A interface não concede autoridade além daquela reconhecida pela administração e pela Roblox.</p></section>
    <section><h2>6. Suspensão e encerramento</h2><p>O acesso pode ser limitado ou encerrado em caso de violação destes Termos, das regras do grupo, de risco à segurança ou de perda da condição de membro. O usuário também pode encerrar sua sessão a qualquer momento.</p></section>
    <section><h2>7. Disponibilidade</h2><p>Buscamos manter o serviço disponível e correto, mas integrações externas, manutenção ou falhas podem causar indisponibilidade temporária. Recursos podem ser alterados ou descontinuados quando necessário para segurança ou operação do grupo.</p></section>
    <section><h2>8. Propriedade e relação com a Roblox</h2><p>Roblox, seus nomes, marcas e serviços pertencem aos respectivos titulares. A Central Militar EB DO MIG é uma aplicação independente e não representa endosso, propriedade ou operação oficial da Roblox Corporation.</p></section>
    <section><h2>9. Alterações</h2><p>Estes Termos poderão ser atualizados. Alterações relevantes serão refletidas nesta página com uma nova data de atualização. O uso após a publicação representa aceitação da versão vigente.</p></section>
    <section><h2>10. Contato</h2><ContactBlock/></section>
  </LegalPage>;
}
