# EB DO MIG — versão para Vercel

Esta pasta contém o projeto completo em Next.js. Conecte o repositório completo à Vercel para que as rotas de login funcionem.

## Testar no computador

1. Instale o Node.js 22.
2. Abra um terminal nesta pasta.
3. Execute `npm install`.
4. Copie `.env.example` para `.env.local` e preencha as credenciais.
5. Execute `npm run dev` e abra `http://localhost:3000`.

## Publicar na Vercel

1. Crie um repositório no GitHub e envie todo o conteúdo desta pasta.
2. Na Vercel, escolha **Add New Project → Import an existing project**.
3. Conecte o repositório do GitHub.
4. A Vercel detecta o Next.js automaticamente — não precisa de configuração extra.
5. Antes de publicar, abra **Project Settings → Environment Variables** e cadastre as variáveis listadas em `.env.example`.
6. Depois que a Vercel gerar o endereço final (ex: `https://eb-do-mig-netlify.vercel.app`), atualize o aplicativo OAuth do Roblox com a URL `https://eb-do-mig-netlify.vercel.app/api/auth/roblox/callback`.

## Variáveis obrigatórias

- `ROBLOX_CLIENT_ID`: identificador do aplicativo OAuth.
- `ROBLOX_CLIENT_SECRET`: segredo do aplicativo OAuth.
- `ROBLOX_API_KEY`: chave Open Cloud com `group:read` e `group:write`.
- `SESSION_SECRET`: texto aleatório com pelo menos 64 caracteres.
- `ROBLOX_GROUP_ID`: use `521106467`.
- `NEXT_PUBLIC_SITE_URL`: endereço final fornecido pela Vercel, sem barra no final.

Webhooks do Discord são opcionais e podem ser adicionados depois.

## Segurança

Nunca envie `.env.local`, Client Secret, API Key ou webhooks para o GitHub. O `.gitignore` já protege arquivos `.env*`, preservando apenas o exemplo sem valores.
