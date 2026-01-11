#!/bin/bash

# Railway Deploy Script
# Execute: bash deploy.sh

echo "═══════════════════════════════════════"
echo "🚂 Railway Deploy Script"
echo "═══════════════════════════════════════"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI não encontrado. Instalando..."
    npm i -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "⚠️  Não está logado no Railway."
    echo "Execute: railway login"
    exit 1
fi

echo "✅ Railway CLI instalado e logado"
echo ""

# Initialize if needed
if [ ! -f "railway.toml" ]; then
    echo "📦 Inicializando projeto Railway..."
    railway init --name cronos-shield-backend
fi

echo "📋 Configurando variáveis de ambiente..."
echo ""
echo "⚠️  IMPORTANTE: Configure as variáveis de ambiente:"
echo ""
echo "Via CLI:"
echo "  railway variables set NODE_ENV=production"
echo "  railway variables set FRONTEND_URL=https://seu-app.vercel.app"
echo "  railway variables set NETWORK=cronos-testnet"
echo "  railway variables set RPC_URL=https://evm-t3.cronos.org"
echo "  railway variables set CHAIN_ID=338"
echo "  railway variables set MERCHANT_ADDRESS=0xae4f37223108F0d328877bb2cD8A0dC60D51d8ad"
echo "  railway variables set PRIVATE_KEY=0xSuaChavePrivada"
echo "  railway variables set PRICE_BASE_UNITS=1000000"
echo "  railway variables set RISK_ORACLE_CONTRACT_ADDRESS=0x391e8EaC07567e9107744668FA083d64743D452A"
echo "  railway variables set SHIELDED_VAULT_ADDRESS=0x7CAEb67281D063698A4732Ea1a4f1Fd7E48308FA"
echo ""
echo "Ou via Dashboard: https://railway.app"
echo ""
read -p "Pressione Enter quando as variáveis estiverem configuradas..."

echo ""
echo "🚀 Fazendo deploy..."
railway up

echo ""
echo "✅ Deploy iniciado!"
echo "📊 Acompanhe em: https://railway.app"
