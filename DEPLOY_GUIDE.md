# 🚀 Guia Completo de Deploy

Guia passo a passo para fazer deploy do Cronos Shield em produção.

## 📋 Pré-requisitos

- ✅ Conta no Railway: https://railway.app
- ✅ Conta na Vercel: https://vercel.com
- ✅ Railway CLI instalado: `npm i -g @railway/cli`
- ✅ Vercel CLI instalado: `npm i -g vercel`

## 🚂 FASE 1: Deploy do Backend (Railway)

### Passo 1: Login no Railway

```bash
cd backend
railway login
```

Isso abrirá o navegador para autenticação.

### Passo 2: Inicializar Projeto

```bash
railway init
```

Escolha:
- Create a new project
- Nome: `cronos-shield-backend`

### Passo 3: Configurar Variáveis de Ambiente

Execute os comandos abaixo (substitua valores se necessário):

```bash
railway variables set NODE_ENV=production
railway variables set NETWORK=cronos-testnet
railway variables set RPC_URL=https://evm-t3.cronos.org
railway variables set CHAIN_ID=338
railway variables set MERCHANT_ADDRESS=0xae4f37223108F0d328877bb2cD8A0dC60D51d8ad
railway variables set PRIVATE_KEY=0x167aba8cfccb28aa97cf0ccfc3161dfa7928d5da7c98c7b85d69db9840b0c3e9
railway variables set PRICE_BASE_UNITS=1000000
railway variables set RISK_ORACLE_CONTRACT_ADDRESS=0x391e8EaC07567e9107744668FA083d64743D452A
railway variables set SHIELDED_VAULT_ADDRESS=0x7CAEb67281D063698A4732Ea1a4f1Fd7E48308FA
railway variables set SWAGGER_ENABLED=true
```

**⚠️ IMPORTANTE:** `PUBLIC_RESOURCE_URL` e `FRONTEND_URL` serão configurados depois do deploy.

### Passo 4: Fazer Deploy

```bash
railway up
```

Aguarde o deploy completar. Anote a URL fornecida (ex: `https://cronos-shield-backend.up.railway.app`).

### Passo 5: Configurar URL Pública

Após o deploy, configure:

```bash
railway variables set PUBLIC_RESOURCE_URL=https://SUA-URL-RAILWAY.up.railway.app
```

---

## ▲ FASE 2: Deploy do Frontend (Vercel)

### Passo 1: Login na Vercel (se necessário)

```bash
cd frontend
vercel login
```

### Passo 2: Configurar Variáveis de Ambiente

**⚠️ IMPORTANTE:** Use a URL do backend do Railway obtida na Fase 1.

```bash
vercel env add VITE_BACKEND_URL production
# Quando solicitado, insira: https://SUA-URL-RAILWAY.up.railway.app

vercel env add VITE_NETWORK production
# Insira: cronos-testnet

vercel env add VITE_RPC_URL production
# Insira: https://evm-t3.cronos.org

vercel env add VITE_CHAIN_ID production
# Insira: 338
```

### Passo 3: Fazer Deploy

```bash
vercel --prod
```

Aguarde o deploy completar. Anote a URL fornecida (ex: `https://cronos-shield.vercel.app`).

---

## 🔄 FASE 3: Finalizar Configuração

### Atualizar FRONTEND_URL no Railway

```bash
cd backend
railway variables set FRONTEND_URL=https://SUA-URL-VERCEL.vercel.app
```

Isso permite que o backend aceite requisições do frontend (CORS).

---

## ✅ Verificação

### Testar Backend

```bash
curl https://SUA-URL-RAILWAY.up.railway.app/health
```

Deve retornar: `{"status":"ok"}`

### Testar Frontend

1. Acesse: `https://SUA-URL-VERCEL.vercel.app`
2. Conecte MetaMask
3. Teste as funcionalidades

### Testar Swagger

Acesse: `https://SUA-URL-RAILWAY.up.railway.app/api-docs`

---

## 🐛 Troubleshooting

### Backend não inicia

- Verifique logs: `railway logs`
- Verifique se todas as variáveis estão configuradas
- Verifique se `PRIVATE_KEY` está correto

### CORS errors

- Verifique se `FRONTEND_URL` está configurado no Railway
- Verifique se a URL do frontend está correta

### Frontend não conecta ao backend

- Verifique se `VITE_BACKEND_URL` está correto
- Verifique se o backend está rodando
- Verifique console do navegador (F12)

---

## 📝 URLs Importantes

Após o deploy, você terá:

- **Backend API**: `https://seu-backend.up.railway.app`
- **Swagger Docs**: `https://seu-backend.up.railway.app/api-docs`
- **Frontend**: `https://seu-app.vercel.app`

---

## 🎉 Pronto!

Seu Cronos Shield está em produção! 🚀
