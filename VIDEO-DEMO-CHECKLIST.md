# 🎬 Video Demo Checklist - Cronos Shield

## ✅ Pre-Gravação

### Links Funcionais
- [x] Frontend: https://frontend-seven-mu-53.vercel.app
- [x] Backend: https://cronos-shield-backend-production.up.railway.app
- [x] API Docs: https://cronos-shield-backend-production.up.railway.app/api-doc
- [x] Health Check: https://cronos-shield-backend-production.up.railway.app/health

### Preparação Técnica
- [x] MetaMask configurado com Cronos Testnet
- [x] devUSDC.e tokens para pagamentos x402 (mint do faucet se necessário)
- [x] CRO tokens para transações (mint do faucet se necessário)
- [x] Contratos deployados e endereços atualizados

### Contratos Deployados
- [x] RiskOracle: `0x391e8EaC07567e9107744668FA083d64743D452A`
- [x] ShieldedVault: `0x858f3A33AFDFA6Be341809710885ccF6071Dc364`

### Endereços de Teste
- [x] Contrato de alto risco para teste: `0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0`
- [x] Contrato seguro para teste: `0x391e8EaC07567e9107744668FA083d64743D452A` (RiskOracle)

---

## 🎥 Script do Vídeo (7-8 minutos)

### 1. Introdução (0:00 - 0:30)
- [ ] Apresentar o projeto: "Cronos Shield - AI-powered security layer"
- [ ] Mostrar landing page
- [ ] Explicar os 4 módulos principais:
  - Risk Oracle
  - Shielded Vaults
  - CEX-DEX Synergy
  - Observability Dashboard

### 2. Risk Oracle (0:30 - 2:00)
- [ ] Navegar para página `/risk`
- [ ] Conectar MetaMask (se necessário)
- [ ] Inserir endereço de contrato de alto risco: `0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0`
- [ ] Clicar em "Analyze Risk"
- [ ] Mostrar popup x402 payment no MetaMask
- [ ] Confirmar pagamento
- [ ] Mostrar resultado:
  - Risk Score (alto, ex: 85/100)
  - Proof of Risk
  - Detalhes (liquidity, contract age, holders, etc.)
  - **AI Explanation** (novo!)
- [ ] Testar com contrato seguro (RiskOracle): `0x391e8EaC07567e9107744668FA083d64743D452A`
- [ ] Mostrar score baixo e explicação

### 3. Shielded Vaults (2:00 - 3:30)
- [ ] Navegar para página `/vaults`
- [ ] Mostrar balance atual (se houver)
- [ ] Fazer um **Deposit**:
  - Inserir valor (ex: 0.1 CRO)
  - Clicar em "Deposit"
  - Confirmar transação no MetaMask
  - Mostrar balance atualizado
- [ ] Mostrar **Transaction History**
- [ ] Tentar **Protected Transaction** para contrato de alto risco:
  - Endereço: `0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0`
  - Valor: 0.01 CRO
  - Clicar em "Execute Protected Transaction"
  - Mostrar x402 payment
  - **Mostrar que a transação foi BLOQUEADA**
  - **Mostrar AI Explanation do bloqueio** (novo!)
- [ ] Mostrar que aparece no "Blocked Transactions"

### 4. CEX-DEX Synergy (3:30 - 5:00)
- [ ] Navegar para página `/divergence`
- [ ] Mostrar dropdown com pares disponíveis (dinâmico da API)
- [ ] Selecionar par (ex: ETH-USDT)
- [ ] Clicar em "Analyze Divergence"
- [ ] Mostrar x402 payment
- [ ] Confirmar pagamento
- [ ] Mostrar resultados:
  - CEX Price (Crypto.com)
  - DEX Price (VVS Finance)
  - Divergence Percentage
  - Arbitrage Recommendation
- [ ] Explicar que preços atualizam automaticamente (REST API polling a cada 30s)
- [ ] Mostrar que WebSocket está implementado mas não ativo em produção (documentado)

### 5. Observability Dashboard (5:00 - 6:00)
- [ ] Navegar para página `/dashboard`
- [ ] Mostrar **Real-time Metrics**:
  - Total Payments
  - Risk Analyses
  - Blocked Transactions
  - Total Deposits
- [ ] Mostrar **Decision Log**:
  - Explicar que cada decisão é logada
  - Mostrar tradução human-readable
  - Mostrar timestamps
- [ ] Mostrar **Blocked Transactions**:
  - Listar transações bloqueadas
  - Mostrar razões e explicações

### 6. Developer Tools (6:00 - 7:00)
- [ ] Mostrar **API Documentation** (Swagger):
  - Abrir: https://cronos-shield-backend-production.up.railway.app/api-doc
  - Mostrar endpoints disponíveis
  - Mostrar schemas
- [ ] Mostrar **SDK**:
  - Abrir `sdk/README.md` ou mostrar código
  - Explicar como usar
- [ ] Mencionar **MCP Server**:
  - Explicar que AI assistants podem usar como ferramentas
  - Mencionar 8 tools disponíveis

### 7. Conclusão (7:00 - 7:30)
- [ ] Recap dos 4 módulos principais
- [ ] Destacar integração x402 (monetização)
- [ ] Destacar integração Crypto.com Exchange (dados reais)
- [ ] Destacar AI-powered explanations
- [ ] Mencionar alinhamento com 4 tracks do hackathon:
  - Main Track (Best Overall)
  - Agentic Finance
  - Crypto.com X Cronos
  - Dev Tooling
- [ ] Call to action: "Teste você mesmo no link..."

---

## 🎯 Pontos-Chave para Destacar

### Durante o Vídeo
1. **x402 Payments**: Sempre mostrar o fluxo de pagamento quando aparecer
2. **AI Explanations**: Destacar as explicações em português/inglês
3. **Real Data**: Enfatizar que usa dados reais (Crypto.com API, on-chain)
4. **Resilience**: Mencionar fallback automático (WebSocket → REST API)
5. **Developer-Friendly**: SDK, MCP Server, API Docs completos

### Não Esquecer
- ✅ Tudo funciona via REST API (WebSocket é otimização futura)
- ✅ Sistema demonstra resiliência com fallback automático
- ✅ AI explanations em todas as decisões importantes
- ✅ Integração completa com Crypto.com Exchange (dados reais)
- ✅ SDK e MCP Server prontos para desenvolvedores

---

## 📝 Notas Importantes

### Se Algo Não Funcionar
- **WebSocket**: Não se preocupar, sistema funciona perfeitamente com REST API
- **MetaMask**: Se não conectar, explicar que precisa estar no Cronos Testnet
- **Tokens**: Se faltar tokens, mencionar que pode mint do faucet
- **API lenta**: Explicar que é testnet e pode ter latência

### Timing
- **Total**: 7-8 minutos ideal
- **Máximo**: 10 minutos (se precisar explicar mais)
- **Mínimo**: 5 minutos (versão rápida)

---

## ✅ Checklist Final Antes de Gravar

- [ ] Todos os links funcionam
- [ ] MetaMask configurado e conectado
- [ ] Tokens disponíveis (devUSDC.e e CRO)
- [ ] Backend rodando e saudável (health check)
- [ ] Frontend atualizado e funcionando
- [ ] Contratos deployados
- [ ] Script revisado
- [ ] Tela limpa (sem notificações, abas desnecessárias)
- [ ] Áudio testado
- [ ] Gravação de tela configurada

---

**Boa sorte com a gravação! 🎬**
