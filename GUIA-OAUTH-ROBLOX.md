# Guia de aprovação do Roblox OAuth — EB DO MIG

## Valores para cadastrar no Creator Hub

- **Nome sugerido:** `EB DO MIG — Central Militar`
- **Categoria sugerida:** `Creation & Productivity Tools`
- **Entry Link:** `https://eb-do-mig.vercel.app/`
- **Privacy Policy URL:** `https://eb-do-mig.vercel.app/privacidade`
- **Terms of Service URL:** `https://eb-do-mig.vercel.app/termos`
- **Redirect/Callback URL:** `https://eb-do-mig.vercel.app/api/auth/roblox/callback`
- **Escopos OAuth:** somente `openid` e `profile`

Descrição sugerida:

> Painel interno de gestão do grupo EB DO MIG. A aplicação usa o OAuth da Roblox para identificar o usuário, confirmar sua participação e hierarquia nos grupos autorizados e exibir o efetivo das divisões. Não solicita nem armazena senhas da Roblox, não vende dados, não rastreia usuários e não usa dados para publicidade ou treinamento de inteligência artificial.

O nome precisa ser único. Se ele já estiver em uso, acrescente uma identificação legítima do grupo sem imitar uma aplicação oficial da Roblox.

## Variáveis na Vercel

Cadastre em **Project Settings → Environment Variables** para Production, Preview e Development, conforme necessário:

```text
ROBLOX_CLIENT_ID=<Client ID do aplicativo OAuth>
ROBLOX_CLIENT_SECRET=<Client Secret do aplicativo OAuth>
ROBLOX_API_KEY=<chave Open Cloud>
SESSION_SECRET=<valor aleatório forte com 64 ou mais caracteres>
ROBLOX_GROUP_ID=521106467
ROBLOX_DIVISION_GROUPS=319140811,34565583,729809284,886757353,710960394
SITE_URL=https://eb-do-mig.vercel.app
SUPPORT_EMAIL=<e-mail real da administração>
```

Depois de alterar variáveis, faça um novo deployment. Não use barra no final de `SITE_URL` e não exponha segredos no repositório ou no navegador.

## Permissões da chave Open Cloud

A chave deve pertencer ao responsável legítimo pelos grupos e permitir apenas a leitura de membros e cargos destes IDs:

- Exército: `521106467`
- Staff: `319140811`
- BFE: `34565583`
- CIE: `729809284`
- BAC: `886757353`
- BPE: `710960394`

O site atual usa a chave do servidor apenas para leitura. Não conceda escrita de cargos até existir um fluxo real de promoção/rebaixamento com confirmação e auditoria.

## Checklist antes de enviar para análise

- A conta responsável pelo aplicativo está com verificação de identidade concluída.
- O nome do aplicativo é único, a descrição explica a finalidade real e a miniatura tem pelo menos 150 × 150 px.
- Entry Link, Privacidade e Termos abrem por HTTPS sem exigir login e sem retornar erro.
- A Callback está cadastrada exatamente como acima, inclusive letras minúsculas e sem barra final.
- O aplicativo solicita somente `openid profile`.
- A Política de Privacidade informa dados coletados, finalidade, cookies, fornecedores, retenção, direitos e contato real.
- Os Termos explicam elegibilidade, conduta, ações administrativas e a independência em relação à Roblox.
- Em modo privado, não ultrapasse o limite de usuários de teste definido pela Roblox.
- Teste o fluxo completo em uma janela anônima antes do envio.
- Refaça a submissão somente depois que o deployment de produção estiver acessível em todos os links.

## Fluxo implementado

1. `/api/auth/roblox/start` cria `state`, PKCE S256 e redireciona para a autorização oficial.
2. A Roblox retorna para `/api/auth/roblox/callback`.
3. O servidor valida o estado, troca o código pelo token e consulta `userinfo`.
4. O servidor confirma a participação nos grupos pela Open Cloud.
5. A sessão assinada fica em cookie HTTP-only por até 24 horas.

O código de autorização não é reutilizado, o segredo permanece no servidor e a sessão temporária de OAuth expira em 10 minutos.
