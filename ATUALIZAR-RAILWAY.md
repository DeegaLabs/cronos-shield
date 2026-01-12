# 🔧 Atualizar Build Command no Railway

## ⚠️ IMPORTANTE: Atualizar Build Command

O Railway ainda está usando `npm install && npm run build`, mas precisamos usar `pnpm`.

## 📋 Passo a Passo

### 1. Acessar Dashboard do Railway

1. Acesse: https://railway.app/project/db1521c2-719c-4d3d-9237-a26758954409
2. Clique no serviço **cronos-shield-backend**

### 2. Ir para Settings

1. Clique na aba **"Settings"** (Configurações)
2. Role até a seção **"Build & Deploy"**

### 3. Atualizar Build Command

1. Encontre o campo **"Custom Build Command"**
2. **Substitua** o comando atual:
   ```
   npm install && npm run build
   ```
   
   **Por:**
   ```
   npm install -g pnpm@8.15.0 && pnpm install && pnpm run build
   ```

3. Clique em **"Save"** ou **"Update"**

### 4. Atualizar Start Command (se necessário)

1. No mesmo local, verifique o **"Start Command"**
2. Deve ser:
   ```
   pnpm start
   ```
   
   Se estiver `npm start`, altere para `pnpm start`

### 5. Fazer Redeploy

Após salvar:

1. Vá na aba **"Deployments"**
2. Clique nos **3 pontos** (⋯) do último deploy
3. Selecione **"Redeploy"**
   
   OU
   
   Faça um novo commit/push para trigger automático

## ✅ Verificação

Após o redeploy, verifique os logs:

1. Vá na aba **"Deployments"**
2. Clique no deploy mais recente
3. Veja os logs - deve aparecer:
   ```
   ✓ pnpm install
   ✓ pnpm run build
   ```

## 🔍 Comando Correto

**Build Command:**
```bash
npm install -g pnpm@8.15.0 && pnpm install && pnpm run build
```

**Start Command:**
```bash
pnpm start
```

## 📝 Nota

- `npm install -g pnpm@8.15.0` instala uma versão específica do pnpm globalmente (mais confiável que corepack no Railway)
- O `package.json` agora inclui `"packageManager": "pnpm@8.15.0"` para garantir consistência
- O arquivo `.npmrc` foi adicionado para configurações do pnpm
- O arquivo `railway.json` já está atualizado, mas o Railway pode estar usando configuração manual do dashboard
- Após atualizar, o Railway usará pnpm em todos os próximos deploys

## 🔄 Alternativas se ainda houver erro

Se o erro persistir, tente estas alternativas no Build Command:

**Opção 1 (recomendada):**
```bash
npm install -g pnpm@8.15.0 && pnpm install && pnpm run build
```

**Opção 2 (usando npx):**
```bash
npx pnpm@8.15.0 install && npx pnpm@8.15.0 run build
```

**Opção 3 (curl direto):**
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh - && export PNPM_HOME="/root/.local/share/pnpm" && export PATH="$PNPM_HOME:$PATH" && pnpm install && pnpm run build
```
