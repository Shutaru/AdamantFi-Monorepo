# ?? Local Development Setup - AdamantFi

**Objetivo:** Correr aplicação localmente sem afetar produção

---

## ?? **PRÉ-REQUISITOS**

### **Software Necessário:**
```powershell
# Verificar Node.js (>= 22.0.0)
node --version

# Verificar pnpm
pnpm --version

# Se não tiver pnpm:
npm install -g pnpm
```

### **Keplr Wallet:**
- Extension instalada
- Wallet criada/importada
- Pronta para testar

---

## ?? **SETUP PASSO-A-PASSO**

### **1. Clonar Repositório (se ainda não tens)**

```powershell
# Já tens em C:\Users\shuta\source\repos\AdamantFi-Monorepo
cd C:\Users\shuta\source\repos\AdamantFi-Monorepo
```

### **2. Instalar Dependências**

```powershell
# Install all packages (apps + packages)
pnpm install

# Verificar instalação
ls node_modules
```

**Tempo:** ~5 minutos  
**Output esperado:** Sem erros, `node_modules/` criado

---

### **3. Configurar Ambiente LOCAL**

```powershell
# Copiar exemplo de configuração
cp apps/web/.env.example apps/web/.env.local

# Editar para LOCAL DEVELOPMENT
notepad apps/web/.env.local
```

**Configuração LOCAL (.env.local):**

```bash
# ========================================
# LOCAL DEVELOPMENT - TESTNET
# ========================================

# Testnet Pulsar-3 (SAFE - não afeta produção)
NEXT_PUBLIC_CHAIN_ID=pulsar-3
NEXT_PUBLIC_LCD_URL=https://pulsar.lcd.secretnodes.com
NEXT_PUBLIC_RPC_URL=https://pulsar.rpc.secretnodes.com

# Enable environment-based configuration
NEXT_PUBLIC_USE_ENV_STAKING_CONFIG=true

# ========================================
# MULTIHOP CONFIGURATION
# ========================================

# Router já deployed em testnet
# Usar este para testes locais
# Address: secret1ysgg7h8x6ukax0phkqmeaq2t8kljg2cuymjuc4
# Hash: 63ba73f63ec43c4778c0a613398a7e95f500f67715dcd50bc1d5eca0ce3360ee

# ========================================
# DESENVOLVIMENTO LOCAL
# ========================================

# Port (opcional, default: 3000)
# PORT=3001

# Debug mode (opcional)
# DEBUG=true
# NODE_ENV=development
```

**?? IMPORTANTE:**
- ? Usar **Pulsar-3** (testnet) para desenvolvimento local
- ? **NUNCA** usar mainnet credentials em `.env.local`
- ? Adicionar `.env.local` ao `.gitignore` (já deve estar)

---

### **4. Verificar Configuração de Tokens**

```powershell
# Abrir ficheiro de configuração
code apps/web/config/tokens.ts
```

**Verificar:**
```typescript
// Deve estar assim (testnet):
export const ROUTER = {
  contract_address: 'secret1ysgg7h8x6ukax0phkqmeaq2t8kljg2cuymjuc4',
  code_hash: '63ba73f63ec43c4778c0a613398a7e95f500f67715dcd50bc1d5eca0ce3360ee',
};

export const MULTIHOP_ENABLED = true; // ? Enabled para testar
```

**?? NOTA:** Se isto estiver apontado para mainnet, criar uma variante para testnet!

---

### **5. Build da Aplicação**

```powershell
# Build completo (pode demorar 2-3 min)
pnpm build:web

# Ou build incremental (mais rápido)
pnpm build
```

**Output esperado:**
```
> web@0.1.0 build
> next build

? Creating an optimized production build
? Compiled successfully
? Collecting page data
? Generating static pages (X/X)
? Finalizing page optimization

Page                              Size     First Load JS
? ? /                            X kB          XX kB
? ? /404                         X kB          XX kB
? ? /swap                        X kB          XX kB
...
```

**Se houver erros:**
```powershell
# Limpar e reinstalar
rm -rf node_modules
rm -rf .next
pnpm install
pnpm build:web
```

---

### **6. Iniciar Dev Server**

```powershell
# Start development server
pnpm dev:web
```

**Output esperado:**
```
> web@0.1.0 dev
> next dev

- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- info  Loaded env from C:\...\AdamantFi-Monorepo\apps\web\.env.local
- event compiled client and server successfully
```

**? SUCESSO!** Aplicação a correr em http://localhost:3000

---

### **7. Conectar Keplr (Testnet)**

1. **Abrir http://localhost:3000**

2. **Conectar Keplr:**
   - Click no botão de connect wallet
   - Aprovar conexão
   - **VERIFICAR:** Keplr deve mostrar "Pulsar-3" (testnet)

3. **Obter Test Tokens:**
   - Faucet: https://faucet.pulsar.scrttestnet.com/
   - Pedir SCRT
   - Aguardar ~30 segundos
   - Verificar balance no Keplr

4. **Set Viewing Keys (se necessário):**
   - Na app, ir para cada token
   - Click "Set Viewing Key"
   - Aprovar no Keplr

---

## ?? **TESTAR LOCALMENTE**

### **Test 1: UI Básica**

**Checklist:**
- [ ] Homepage carrega
- [ ] Swap page carrega
- [ ] Tokens aparecem nos dropdowns
- [ ] Pode digitar valores
- [ ] Estimação funciona
- [ ] Sem erros na console

### **Test 2: Direct Swap (Local)**

**Cenário:**
```
Input: 0.1 sSCRT
Output: ? sATOM
```

**Passos:**
1. Selecionar sSCRT ? sATOM
2. Digitar "0.1"
3. **VERIFICAR:** Estimação aparece
4. **VERIFICAR:** Route display mostra "Direct"
5. **VERIFICAR:** Price impact calculado
6. (OPCIONAL) Click "Swap" para testar execução

**Expected:**
- ? Estimação rápida (<1s)
- ? Route correto
- ? Sem erros

### **Test 3: Multihop Swap (Local)**

**Cenário:**
```
Input: 0.1 sATOM
Output: ? USDC.nbl
Path: sATOM ? sSCRT ? USDC.nbl
```

**Passos:**
1. Selecionar sATOM ? USDC.nbl
2. Digitar "0.1"
3. **VERIFICAR:** Route mostra "2 hops"
4. **VERIFICAR:** Path visualization correto
5. (OPCIONAL) Executar swap

**Expected:**
- ? Route multihop identificado
- ? Cálculo correto
- ? UI mostra path

---

## ?? **DEBUG & TROUBLESHOOTING**

### **Ver Logs em Tempo Real:**

```powershell
# Logs do Next.js (terminal onde corre dev:web)
# Watching...

# Logs do browser
# F12 ? Console
```

**Logs úteis:**
```javascript
// Verificar se multihop está ativado
console.log('MULTIHOP_ENABLED:', MULTIHOP_ENABLED);

// Ver routing path
console.log('Swap Path:', swapPath);

// Ver estimação
console.log('Estimated Output:', estimatedOutput);
```

### **Problemas Comuns:**

**1. Port 3000 já em uso:**
```powershell
# Usar outra porta
PORT=3001 pnpm dev:web
```

**2. Build errors:**
```powershell
# Clear cache
rm -rf .next
rm -rf node_modules/.cache
pnpm build:web
```

**3. Keplr não conecta:**
- Verificar se está em Pulsar-3
- Desconectar e reconectar
- Refresh da página

**4. "No liquidity" em testnet:**
- Alguns pools podem não ter liquidez
- Testar com outros pares
- Verificar se tokens têm balance

---

## ?? **COMPARAR COM PRODUÇÃO**

### **Ver App em Produção:**

1. **Aceder à app live:**
   - URL: [URL da tua app em produção]
   - Network: Secret-4 (mainnet)

2. **Comparar funcionalidades:**
   - [ ] Mesmos tokens disponíveis?
   - [ ] Mesmas features?
   - [ ] UI similar?
   - [ ] Routing igual?

3. **Identificar diferenças:**
   - Documentar o que está diferente
   - Criar lista de features em produção
   - Planear integração local

---

## ?? **PRÓXIMOS PASSOS**

### **Depois de local funcionar:**

1. **Testar em Testnet (Pulsar-3):**
   - Executar swaps reais
   - Verificar gas costs
   - Testar edge cases

2. **Comparar com Produção:**
   - Identificar gaps
   - Documentar features
   - Planear updates

3. **Preparar Deploy Seguro:**
   - Feature flags
   - Gradual rollout
   - Monitoring

---

## ?? **SAFETY CHECKLIST**

**Antes de fazer QUALQUER alteração:**

- [ ] ? Tudo funciona localmente
- [ ] ? Testado em testnet
- [ ] ? Comparado com produção
- [ ] ? Features novas têm feature flags
- [ ] ? Rollback plan preparado
- [ ] ? Backup de configuração atual
- [ ] ? Monitoring em place

**NUNCA:**
- ? Fazer deploy direto para produção
- ? Testar com contratos de produção
- ? Usar mainnet keys em dev
- ? Alterar contratos sem backup

---

## ?? **HELP & RESOURCES**

**Se precisares de ajuda:**

1. **Logs úteis:**
   - Browser console (F12)
   - Terminal onde corre dev server
   - Network tab (verificar calls)

2. **Documentação:**
   - [QUICK_START.md](./QUICK_START.md)
   - [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [NEXT_STEPS.md](./NEXT_STEPS.md)

3. **Testnet Resources:**
   - Faucet: https://faucet.pulsar.scrttestnet.com/
   - Explorer: https://testnet.ping.pub/secret/
   - RPC: https://pulsar.rpc.secretnodes.com

---

## ? **SUCCESS CRITERIA**

**Local development está OK quando:**

- ? App corre sem erros em localhost:3000
- ? Conecta com Keplr (testnet)
- ? Estimações funcionam
- ? Direct swaps testáveis
- ? Multihop swaps testáveis
- ? UI responsiva
- ? Sem erros na console
- ? Logs fazem sentido

**Próximo passo:** Testar swaps reais em testnet! ??

---

**Made with ?? for safe development**
