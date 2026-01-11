#!/bin/bash

# Vercel Deploy Script
# Execute: bash deploy.sh

echo "═══════════════════════════════════════"
echo "▲ Vercel Deploy Script"
echo "═══════════════════════════════════════"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI não encontrado. Instalando..."
    npm i -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Não está logado na Vercel."
    echo "Execute: vercel login"
    exit 1
fi

echo "✅ Vercel CLI instalado e logado"
echo ""

echo "📋 Configurando variáveis de ambiente..."
echo ""
echo "⚠️  IMPORTANTE: Configure as variáveis de ambiente:"
echo ""
echo "Via CLI:"
echo "  vercel env add VITE_BACKEND_URL"
echo "  # Insira a URL do backend no Railway"
echo "  vercel env add VITE_NETWORK"
echo "  # Insira: cronos-testnet"
echo "  vercel env add VITE_RPC_URL"
echo "  # Insira: https://evm-t3.cronos.org"
echo "  vercel env add VITE_CHAIN_ID"
echo "  # Insira: 338"
echo ""
echo "Ou via Dashboard: https://vercel.com"
echo ""
read -p "Pressione Enter quando as variáveis estiverem configuradas..."

echo ""
echo "🚀 Fazendo deploy de produção..."
vercel --prod

echo ""
echo "✅ Deploy concluído!"
echo "📊 Acompanhe em: https://vercel.com"
