# EB DO MIG — Central Militar

Projeto Next.js publicado na Vercel em `https://eb-do-mig.vercel.app`.

## Testar localmente

1. Instale o Node.js 22.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local` e preencha as credenciais.
4. Execute `npm run dev` e abra `http://localhost:3000`.

## Publicar na Vercel

O repositório está preparado para a detecção automática do Next.js pela Vercel. Use estas opções no projeto `eb-do-mig`:

- **Framework Preset:** Next.js
- **Root Directory:** `.`
- **Build Command:** `npm run build`
- **Output Directory:** padrão automático do Next.js
- **Install Command:** `npm install` ou padrão automático
- **Node.js:** 22.x

O arquivo `.env.local` funciona somente no computador e não é enviado. Cadastre os mesmos valores em **Project Settings → Environment Variables**, marque **Production** e faça um novo deployment.

Variáveis obrigatórias:

- `ROBLOX_CLIENT_ID`: identificador do aplicativo OAuth.
- `ROBLOX_CLIENT_SECRET`: segredo do aplicativo OAuth.
- `ROBLOX_API_KEY`: chave Open Cloud com leitura dos seis grupos.
- `SESSION_SECRET`: valor aleatório com pelo menos 64 caracteres.
- `ROBLOX_GROUP_ID`: `521106467`.
- `ROBLOX_DIVISION_GROUPS`: `319140811,34565583,729809284,886757353,710960394`.
- `SITE_URL`: `https://eb-do-mig.vercel.app`, sem barra final.

`SUPPORT_EMAIL` e os webhooks do Discord são opcionais, embora um e-mail real seja recomendado para a análise do OAuth. Nunca envie `.env.local`, Client Secret, API Key, Session Secret ou webhooks para o GitHub.

O efetivo e as patentes são consultados diretamente na Roblox Open Cloud. O projeto não depende de arquivos gravados durante a execução, pois o sistema de arquivos das funções da Vercel não deve ser usado como armazenamento permanente.

## Roblox OAuth

Consulte `GUIA-OAUTH-ROBLOX.md` para copiar os links exatos, configurar o aplicativo e revisar os itens antes de enviar para aprovação.
