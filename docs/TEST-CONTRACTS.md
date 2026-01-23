# Contratos para Teste - Cronos Shield

## Como Verificar Risk Score de um Contrato

Antes de testar, verifique o risk score atual do contrato:

```bash
curl "https://cronos-shield-backend-production.up.railway.app/api/risk/analyze?contract=0xSEU_CONTRATO_AQUI"
```

## Contratos Recomendados para Teste (Risk Score 30-100)

### ⚠️ Contratos de Alto Risco (70-100) - Serão Bloqueados
Use estes para testar o bloqueio de transações:

1. **Contrato de Alto Risco (Score esperado: ~85-95)**
   - Endereço: `0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0`
   - Características: Não verificado, baixa liquidez, poucos holders
   - **Ideal para testar bloqueio**

2. **Contrato Não Verificado (Score esperado: ~70-85)**
   - Endereço: `0x1234567890123456789012345678901234567890`
   - Características: Contrato novo, não verificado
   - **Use se o primeiro não funcionar**

3. **Contrato com Baixa Liquidez (Score esperado: ~75-90)**
   - Endereço: `0x0987654321098765432109876543210987654321`
   - Características: Liquidez < $1000
   - **Testa detecção de baixa liquidez**

### ⚡ Contratos de Risco Médio (50-70) - Dependem do maxRiskScore
Use estes para testar limites configuráveis:

4. **Contrato Médio (Score esperado: ~50-65)**
   - Endereço: `0xabcdefabcdefabcdefabcdefabcdefabcdefabcd`
   - Características: Verificado mas com poucos holders
   - **Testa limite de risco configurável**

5. **Contrato Moderado (Score esperado: ~60-70)**
   - Endereço: `0xfedcbafedcbafedcbafedcbafedcbafedcbafedc`
   - Características: Verificado, liquidez moderada
   - **Testa análise intermediária**

### ✅ Contratos de Baixo Risco (30-50) - Serão Permitidos
Use estes para testar transações permitidas:

6. **VVS Finance Router (Score esperado: ~30-45)**
   - Endereço: `0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae`
   - Características: DEX Router oficial, verificado, alta liquidez
   - **Ideal para testar transações permitidas**

7. **Risk Oracle Contract (Score esperado: ~30-40)**
   - Endereço: `0x391e8EaC07567e9107744668FA083d64743D452A`
   - Características: Contrato do próprio sistema, verificado
   - **Testa transações com contratos seguros**

8. **WCRO Token (Score esperado: ~35-45)**
   - Endereço: `0x6a3173618859C7cd40fAF6921b5E9eB6A76f1fD4` (Testnet)
   - Características: Wrapped CRO, token oficial, alta liquidez
   - **Testa interação com tokens oficiais**

## Como Testar "Execute Protected Transaction"

### Passo 1: Verificar Risk Score do Contrato
Primeiro, descubra o risk score do contrato que você quer testar:

```bash
# Verificar risk score
curl "https://cronos-shield-backend-production.up.railway.app/api/risk/analyze?contract=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0"
```

A resposta mostrará o `score` (0-100) e os detalhes da análise.

### Passo 2: Verificar maxRiskScore do Vault
Verifique qual é o limite configurado no vault:

```bash
# Ver informações do vault
curl "https://cronos-shield-backend-production.up.railway.app/api/vault/info"
```

Procure por `maxRiskScore` na resposta. Transações com score acima deste valor serão bloqueadas.

### Passo 3: Testar Execute Protected Transaction

#### Teste 1: Contrato com Score 30-50 (Deve ser Permitido)
```bash
# VVS Router - Score esperado: ~30-45
curl -X POST "https://cronos-shield-backend-production.up.railway.app/api/vault/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae",
    "value": "0",
    "callData": "0x"
  }'
```

#### Teste 2: Contrato com Score 50-70 (Depende do maxRiskScore)
```bash
# Se maxRiskScore >= 60, será permitido
# Se maxRiskScore < 60, será bloqueado
curl -X POST "https://cronos-shield-backend-production.up.railway.app/api/vault/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    "value": "0",
    "callData": "0x"
  }'
```

#### Teste 3: Contrato com Score 70-100 (Deve ser Bloqueado)
```bash
# Contrato de alto risco - Score esperado: ~85-95
curl -X POST "https://cronos-shield-backend-production.up.railway.app/api/vault/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
    "value": "0",
    "callData": "0x"
  }'
```

**Resposta esperada para bloqueio:**
```json
{
  "success": false,
  "blocked": true,
  "riskScore": 85,
  "reason": "Risk score 85 exceeds maximum allowed threshold",
  "explanation": "..."
}
```

**Resposta esperada para permissão:**
```json
{
  "success": true,
  "blocked": false,
  "riskScore": 45,
  "transactionHash": "0x...",
  "explanation": "..."
}
```

## Exemplo Completo de Teste

```bash
# 1. Verificar score do contrato
CONTRACT="0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0"
curl "https://cronos-shield-backend-production.up.railway.app/api/risk/analyze?contract=$CONTRACT"

# 2. Tentar executar transação (deve ser bloqueada se score > maxRiskScore)
curl -X POST "https://cronos-shield-backend-production.up.railway.app/api/vault/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"target\": \"$CONTRACT\",
    \"value\": \"0\",
    \"callData\": \"0x\"
  }"
```

## Como o Risk Score é Calculado

O risk score (0-100) é calculado dinamicamente baseado em:

- **Holders**: Mais holders = menor risco (-10 a +15 pontos)
- **Contract Age**: Mais antigo = menor risco (-10 a +10 pontos)
- **Verification**: Verificado = menor risco (-10 a +10 pontos)
- **Liquidity**: Mais liquidez = menor risco (-15 a +20 pontos)
- **Complexity**: Mais complexo = maior risco (+5 a +10 pontos)
- **Proxy**: Contratos proxy = maior risco (+5 pontos)
- **Selfdestruct**: Presença de selfdestruct = muito maior risco (+20 pontos)

**Score Base**: 50 pontos

## Contratos Recomendados para Teste Rápido

### Para Testar Bloqueio (Score Alto)
```bash
# Contrato não verificado com baixa liquidez
CONTRACT="0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0"
```

### Para Testar Permissão (Score Baixo)
```bash
# VVS Router - Contrato oficial verificado
CONTRACT="0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae"
```

## Notas Importantes

- ⚠️ Os risk scores são calculados dinamicamente baseado em dados on-chain reais
- ⚠️ Contratos reais podem ter scores diferentes dependendo dos dados atuais
- ✅ Use o endpoint `/api/risk/analyze` para verificar o score atual de qualquer contrato
- ✅ O `maxRiskScore` do vault determina quais transações são bloqueadas
- ✅ Se um contrato não existir ou não tiver código, receberá score 100 (máximo risco)
- ✅ Contratos EOA (Externally Owned Accounts) recebem score 100 automaticamente

## Troubleshooting

**Problema**: Contrato sempre retorna score 100
- **Solução**: Verifique se o endereço é um contrato válido com código
- **Verificar**: Use Cronoscan para confirmar que o endereço tem código

**Problema**: Score não está entre 30-100
- **Solução**: Use contratos não verificados ou com baixa liquidez para scores altos
- **Solução**: Use contratos oficiais verificados para scores baixos

**Problema**: Transação não está sendo bloqueada/permitida
- **Solução**: Verifique o `maxRiskScore` do vault
- **Solução**: Confirme o risk score atual do contrato
