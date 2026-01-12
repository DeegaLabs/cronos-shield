# 🔧 Configuração de Variáveis no Railway

## ⚠️ ERRO: MERCHANT_ADDRESS não encontrado

O backend está falhando porque as variáveis de ambiente não estão configuradas.

## 📋 Solução: Configurar via Dashboard

### Passo 1: Acessar Dashboard

1. Acesse: https://railway.app/project/db1521c2-719c-4d3d-9237-a26758954409
2. Clique no serviço (cronos-shield-backend)
3. Vá na aba **"Variables"**

### Passo 2: Adicionar Variáveis

Adicione **TODAS** as variáveis abaixo (uma por uma):

```
NODE_ENV=production
NETWORK=cronos-testnet
RPC_URL=https://evm-t3.cronos.org
CHAIN_ID=338
MERCHANT_ADDRESS=0xae4f37223108F0d328877bb2cD8A0dC60D51d8ad
PRIVATE_KEY=0x167aba8cfccb28aa97cf0ccfc3161dfa7928d5da7c98c7b85d69db9840b0c3e9
PRICE_BASE_UNITS=1000000
PUBLIC_RESOURCE_URL=https://cronos-shield-backend-production.up.railway.app
RISK_ORACLE_CONTRACT_ADDRESS=0x391e8EaC07567e9107744668FA083d64743D452A
SHIELDED_VAULT_ADDRESS=0x7CAEb67281D063698A4732Ea1a4f1Fd7E48308FA
SWAGGER_ENABLED=true
FRONTEND_URL=https://frontend-seven-mu-53.vercel.app
```

### Passo 3: Verificar

Após adicionar todas as variáveis:
1. O Railway vai reiniciar automaticamente
2. Aguarde alguns segundos
3. Verifique os logs: `railway logs`
4. Teste: `curl https://cronos-shield-backend-production.up.railway.app/health`

## 🔍 Verificar Variáveis Configuradas

No dashboard, você deve ver todas as variáveis listadas na aba "Variables".

## ⚡ Alternativa: Via CLI (após linkar serviço)

Se conseguir linkar o serviço:

```bash
cd backend
railway service  # Seleciona o serviço
railway variables --set "MERCHANT_ADDRESS=0xae4f37223108F0d328877bb2cD8A0dC60D51d8ad"
railway variables --set "PRIVATE_KEY=0x167aba8cfccb28aa97cf0ccfc3161dfa7928d5da7c98c7b85d69db9840b0c3e9"
# ... e assim por diante
```

## ✅ Após Configurar

O backend deve iniciar corretamente e você verá nos logs:
```
🚀 Cronos Shield Backend
📍 Server running on http://0.0.0.0:PORT
```
