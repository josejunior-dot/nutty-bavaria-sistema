# Guia de Deploy — Nutty Bavaria Sistema

Deploy gratuito usando Neon + Render + Vercel.

| Componente | Plataforma | Custo |
|------------|-----------|-------|
| Banco de Dados | Neon | Gratis |
| Backend (API) | Render | Gratis |
| Frontend | Vercel | Gratis |

---

## Passo 1: Banco de Dados (Neon)

1. Acesse **https://neon.tech** e crie uma conta (pode usar GitHub)
2. Clique em **"New Project"**
3. Configure:
   - **Project name:** `nutty-bavaria`
   - **Database name:** `nutty_bavaria`
   - **Region:** `US East (Ohio)` (ou o mais proximo)
4. Clique em **"Create Project"**
5. Na tela seguinte, copie a **Connection String** que aparece. Ela tera este formato:
   ```
   postgresql://neondb_owner:SENHA@ep-xxxx.us-east-2.aws.neon.tech/nutty_bavaria?sslmode=require
   ```
6. **GUARDE ESSA URL** — voce vai usar no proximo passo

### Popular o banco com dados iniciais

Apos criar o banco, voce precisa rodar as migrations e o seed. Isso sera feito automaticamente pelo Render no passo 2, mas se quiser fazer manualmente:

```bash
cd backend
DATABASE_URL="sua-url-do-neon" npx prisma migrate deploy
DATABASE_URL="sua-url-do-neon" npx tsx prisma/seed.ts
```

---

## Passo 2: Backend (Render)

1. Acesse **https://render.com** e crie uma conta (pode usar GitHub)
2. Clique em **"New +"** > **"Web Service"**
3. Conecte seu repositorio GitHub: `josejunior-dot/nutty-bavaria-sistema`
4. Configure:
   - **Name:** `nutty-bavaria-api`
   - **Region:** `Oregon (US West)`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** `Free`
5. Em **"Environment Variables"**, adicione:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | (cole a URL do Neon do passo 1) |
   | `JWT_SECRET` | `nutty-bavaria-prod-secret-2026` |
   | `JWT_REFRESH_SECRET` | `nutty-bavaria-refresh-secret-2026` |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | (deixe vazio por agora, voce vai preencher no passo 3) |

6. Clique em **"Create Web Service"**
7. Aguarde o deploy (3-5 minutos)
8. Quando concluir, copie a **URL do servico**, ex: `https://nutty-bavaria-api.onrender.com`

### Popular o banco (primeira vez)

Apos o primeiro deploy, o Render roda as migrations automaticamente. Para popular com dados de demonstracao:

1. No painel do Render, va em **"Shell"** (aba do servico)
2. Execute:
   ```bash
   npx tsx prisma/seed.ts
   ```
   Ou, do seu computador:
   ```bash
   cd backend
   DATABASE_URL="sua-url-do-neon" npx tsx prisma/seed.ts
   ```

---

## Passo 3: Frontend (Vercel)

1. Acesse **https://vercel.com** e crie uma conta (pode usar GitHub)
2. Clique em **"Add New..."** > **"Project"**
3. Importe o repositorio: `josejunior-dot/nutty-bavaria-sistema`
4. Configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** clique em **"Edit"** e selecione `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Em **"Environment Variables"**, adicione:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://nutty-bavaria-api.onrender.com/api` |

   (use a URL do Render do passo 2, adicionando `/api` no final)

6. Clique em **"Deploy"**
7. Aguarde o deploy (1-2 minutos)
8. Quando concluir, copie a **URL do frontend**, ex: `https://nutty-bavaria.vercel.app`

---

## Passo 4: Conectar CORS

Agora que voce tem a URL do frontend, volte ao **Render**:

1. Acesse o servico `nutty-bavaria-api`
2. Va em **"Environment"**
3. Edite a variavel `CORS_ORIGIN` e coloque a URL do Vercel:
   ```
   https://nutty-bavaria.vercel.app
   ```
4. Clique em **"Save Changes"**
5. O Render vai reiniciar automaticamente

---

## Passo 5: Testar

1. Abra a URL do Vercel no navegador (ex: `https://nutty-bavaria.vercel.app`)
2. Faca login com:
   - **Email:** `franqueador@nutty.com`
   - **Senha:** `123456`
3. Navegue pelo sistema normalmente

Voce pode acessar de **qualquer computador ou celular** usando essa URL.

---

## Resumo das URLs

Apos o deploy, voce tera:

| Servico | URL |
|---------|-----|
| Frontend | `https://nutty-bavaria.vercel.app` (ou similar) |
| Backend API | `https://nutty-bavaria-api.onrender.com` |
| Banco de Dados | Neon Dashboard em `https://console.neon.tech` |

---

## Notas Importantes

### Plano Gratuito do Render
- O servico **"adormece"** apos 15 minutos sem uso
- A primeira requisicao apos dormir demora **30-60 segundos** para acordar
- Para evitar isso, voce pode usar o plano pago ($7/mes) ou um servico de ping como UptimeRobot

### Plano Gratuito do Neon
- 0.5 GB de armazenamento
- Branch de desenvolvimento separado (opcional)
- Mais que suficiente para operacao normal

### Plano Gratuito do Vercel
- Sem limitacoes para uso pessoal/comercial pequeno
- Deploy automatico a cada push no GitHub
- CDN global (rapido de qualquer lugar)

### Deploy Automatico
- Cada `git push` no branch `master` dispara automaticamente:
  - Rebuild no Render (backend)
  - Rebuild no Vercel (frontend)
- Nao precisa fazer nada manualmente apos a configuracao inicial

---

## Solucao de Problemas

### "Network Error" ao fazer login
- Verifique se a variavel `VITE_API_URL` no Vercel esta correta
- Verifique se `CORS_ORIGIN` no Render contem a URL do Vercel

### Backend demora para responder
- Normal no plano gratuito do Render (cold start de 30-60s)
- Aguarde e tente novamente

### "Prisma migrate" falha no deploy
- Verifique se a `DATABASE_URL` no Render esta correta
- Verifique se o banco Neon esta ativo

### Dados de demonstracao nao aparecem
- Execute o seed manualmente (ver Passo 2)
