# 🚂 Railway Deploy Guide

Guia para fazer deploy do backend no Railway.

## Pré-requisitos

1. Conta no Railway: https://railway.app
2. Railway CLI instalado: `npm i -g @railway/cli`

## Passo 1: Instalar Railway CLI

```bash
npm i -g @railway/cli
```

## Passo 2: Login no Railway

```bash
railway login
```

## Passo 3: Inicializar Projeto

```bash
cd backend
railway init
```

Isso vai:
- Criar um novo projeto no Railway (ou conectar a um existente)
- Criar arquivo `railway.toml` com configurações

## Passo 4: Configurar Variáveis de Ambiente

Configure as variáveis de ambiente no Railway:

### Via CLI:
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set FRONTEND_URL=https://seu-app.vercel.app
railway variables set NETWORK=cronos-testnet
railway variables set RPC_URL=https://evm-t3.cronos.org
railway variables set CHAIN_ID=338
railway variables set MERCHANT_ADDRESS=0xSeuEndereco
railway variables set PRIVATE_KEY=0xSuaChavePrivada
railway variables set PRICE_BASE_UNITS=1000000
railway variables set PUBLIC_RESOURCE_URL=https://seu-backend.railway.app
railway variables set RISK_ORACLE_CONTRACT_ADDRESS=0x391e8EaC07567e9107744668FA083d64743D452A
railway variables set SHIELDED_VAULT_ADDRESS=0x7CAEb67281D063698A4732Ea1a4f1Fd7E48308FA
railway variables set SWAGGER_ENABLED=true
```

### Ou via Dashboard:
1. Acesse https://railway.app
2. Selecione seu projeto
3. Vá em "Variables"
4. Adicione cada variável manualmente

## Passo 5: Deploy

```bash
railway up
```

Ou para deploy específico:

```bash
railway deploy
```

## Passo 6: Verificar Deploy

Após o deploy, o Railway vai fornecer uma URL como:
```
https://seu-projeto.up.railway.app
```

Teste o health check:
```bash
curl https://seu-projeto.up.railway.app/health
```

## Passo 7: Configurar Domínio (Opcional)

No dashboard do Railway:
1. Vá em "Settings"
2. Clique em "Generate Domain"
3. Ou configure um domínio customizado

## Troubleshooting

### Build falha
- Verifique se todas as dependências estão no `package.json`
- Verifique os logs: `railway logs`

### Port não encontrado
- Railway define `PORT` automaticamente
- Não precisa configurar manualmente

### CORS errors
- Verifique se `FRONTEND_URL` está correto
- Deve ser a URL do frontend na Vercel

### Variáveis não encontradas
- Verifique se todas as variáveis foram configuradas
- Use `railway variables` para listar

## Comandos Úteis

```bash
# Ver logs
railway logs

# Ver variáveis
railway variables

# Abrir dashboard
railway open

# Ver status
railway status
```
