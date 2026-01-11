# ▲ Vercel Deploy Guide

Guia para fazer deploy do frontend na Vercel.

## Pré-requisitos

1. Conta na Vercel: https://vercel.com
2. Vercel CLI instalado: `npm i -g vercel`

## Passo 1: Instalar Vercel CLI

```bash
npm i -g vercel
```

## Passo 2: Login na Vercel

```bash
vercel login
```

## Passo 3: Configurar Variáveis de Ambiente

Antes do deploy, configure as variáveis de ambiente:

### Via CLI:
```bash
cd frontend
vercel env add VITE_BACKEND_URL
# Quando solicitado, insira a URL do backend no Railway
# Exemplo: https://seu-backend.up.railway.app

vercel env add VITE_NETWORK
# Insira: cronos-testnet

vercel env add VITE_RPC_URL
# Insira: https://evm-t3.cronos.org

vercel env add VITE_CHAIN_ID
# Insira: 338
```

### Ou via Dashboard:
1. Acesse https://vercel.com
2. Selecione seu projeto
3. Vá em "Settings" → "Environment Variables"
4. Adicione cada variável:
   - `VITE_BACKEND_URL`: URL do backend no Railway
   - `VITE_NETWORK`: `cronos-testnet`
   - `VITE_RPC_URL`: `https://evm-t3.cronos.org`
   - `VITE_CHAIN_ID`: `338`

## Passo 4: Deploy

### Deploy de Preview (Teste):
```bash
cd frontend
vercel
```

### Deploy de Produção:
```bash
vercel --prod
```

## Passo 5: Verificar Deploy

Após o deploy, a Vercel vai fornecer uma URL como:
```
https://seu-projeto.vercel.app
```

Teste a aplicação:
1. Acesse a URL
2. Teste conexão com MetaMask
3. Teste integração com backend

## Passo 6: Configurar Domínio (Opcional)

No dashboard da Vercel:
1. Vá em "Settings" → "Domains"
2. Adicione um domínio customizado

## Configuração Automática

A Vercel detecta automaticamente:
- ✅ Framework: Vite
- ✅ Build Command: `pnpm build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `pnpm install`

O arquivo `vercel.json` já está configurado com:
- Rewrites para SPA (Single Page Application)
- Headers de segurança
- Configurações de build

## Troubleshooting

### Build falha
- Verifique se todas as dependências estão no `package.json`
- Verifique os logs no dashboard da Vercel

### Variáveis de ambiente não funcionam
- Variáveis `VITE_*` precisam ser definidas antes do build
- Use `vercel env pull` para baixar variáveis locais

### CORS errors
- Verifique se `VITE_BACKEND_URL` está correto
- Verifique se o backend permite o domínio da Vercel

### MetaMask não conecta
- Verifique se está na rede Cronos Testnet
- Verifique se `VITE_RPC_URL` está correto

## Comandos Úteis

```bash
# Ver logs
vercel logs

# Listar projetos
vercel ls

# Abrir dashboard
vercel open

# Remover deploy
vercel remove

# Baixar variáveis de ambiente
vercel env pull .env.local
```

## Variáveis de Ambiente Necessárias

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VITE_BACKEND_URL` | `https://seu-backend.railway.app` | URL do backend no Railway |
| `VITE_NETWORK` | `cronos-testnet` | Rede Cronos |
| `VITE_RPC_URL` | `https://evm-t3.cronos.org` | RPC URL da testnet |
| `VITE_CHAIN_ID` | `338` | Chain ID da Cronos Testnet |

## Notas Importantes

1. **Variáveis VITE_***: Apenas variáveis que começam com `VITE_` são expostas ao frontend
2. **Build Time**: Variáveis são injetadas no build, não em runtime
3. **Preview vs Production**: Configure variáveis para ambos os ambientes
4. **Backend URL**: Deve ser a URL completa do Railway (com https://)
