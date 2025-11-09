# ?? Production vs Local Comparison Guide

**Objetivo:** Comparar app local com produção sem afetar nada

---

## ?? **ESTRATÉGIA SEGURA**

### **Princípio Fundamental:**
> **NUNCA mexer em produção antes de testar completamente local + testnet**

### **Fluxo de Trabalho:**
```
1. Local Development (Testnet) ? Desenvolvimento seguro
2. Compare with Production    ? Identificar diferenças
3. Test on Testnet            ? Validar mudanças
4. Gradual Production Deploy  ? Rollout controlado
```

---

## ?? **CHECKLIST DE COMPARAÇÃO**

### **1. URLs & Networks**

**Produção:**
```
URL: https://[tua-app-producao].com
Network: Secret-4 (mainnet)
Chain ID: secret-4
RPC: https://rpc.ankr.com/http/scrt_cosmos
```

**Local/Testnet:**
```
URL: http://localhost:3000
Network: Pulsar-3 (testnet)
Chain ID: pulsar-3
RPC: https://pulsar.rpc.secretnodes.com
```

### **2. Smart Contracts**

**Tabela de Comparação:**

| Component | Production (mainnet) | Testnet/Local |
|-----------|---------------------|---------------|
| Router | secret1... (mainnet) | secret1ysgg7h8x6... (testnet) |
| Factory | secret1... | secret1... |
| Pairs | 5+ pools | 5 pools configurados |
| Aggregator | ? (verificar se deployed) | Código disponível, não deployed |

**Action Items:**
- [ ] Obter addresses de produção
- [ ] Comparar com testnet
- [ ] Verificar se aggregator está em prod

### **3. Tokens & Pairs**

**Produção vs Local:**

```typescript
// Verificar em apps/web/config/tokens.ts

// Production (mainnet) - VERIFICAR
export const TOKENS_PRODUCTION = [
  // Lista completa de tokens em produção
  // Obter da app live
];

// Local/Testnet (pulsar-3) - JÁ CONFIGURADO
export const TOKENS_TESTNET = [
  { name: 'Secret Secret', symbol: 'sSCRT', ... },
  { name: 'Secret ATOM', symbol: 'sATOM', ... },
  { name: 'Silk Stablecoin', symbol: 'SILK', ... },
  { name: 'Secret Axelar WETH', symbol: 'ETH.axl', ... },
  { name: 'Secret Noble USDC', symbol: 'USDC.nbl', ... },
  { name: 'Secret Jackal', symbol: 'JKL', ... },
  { name: 'bonded ADMT', symbol: 'bADMT', ... },
];
```

**Checklist:**
- [ ] Comparar lista de tokens
- [ ] Verificar pairs disponíveis
- [ ] Identificar tokens únicos de prod
- [ ] Documentar diferenças

### **4. Features Disponíveis**

**Feature Comparison:**

| Feature | Production | Local/Testnet | Status |
|---------|-----------|---------------|--------|
| Direct Swaps | ? | ? | Matching |
| Multihop Swaps | ? | ? | Verify in prod |
| Staking | ? | ? | Verify |
| Pools | ? | ? | Compare pairs |
| Liquidity Add/Remove | ? | ? | Verify |
| Analytics | ? | ? | ? |

**Action Items:**
- [ ] Listar todas features em produção
- [ ] Testar cada feature localmente
- [ ] Documentar gaps
- [ ] Priorizar implementações

---

## ?? **PROCESSO DE COMPARAÇÃO**

### **Step 1: Documentar Produção**

**1.1 Aceder à App Live:**
```
1. Abrir browser
2. Ir para [URL produção]
3. Conectar Keplr (mainnet)
4. Explorar todas as páginas
```

**1.2 Criar Inventory:**

```markdown
# Production Feature Inventory

## Pages Available:
- [ ] Swap
- [ ] Pools
- [ ] Staking
- [ ] Analytics
- [ ] Other: ___________

## Swap Features:
- [ ] Direct swaps
- [ ] Multihop swaps (verificar!)
- [ ] Slippage settings
- [ ] Min receive
- [ ] Price impact
- [ ] Route visualization

## Tokens Available:
1. Token1
2. Token2
...

## Pairs Available:
1. Token1/Token2
2. Token2/Token3
...
```

**1.3 Screenshots:**
```
Tirar screenshots de:
- Homepage
- Swap page (empty state)
- Swap page (with estimation)
- Each feature
- Settings/config
```

### **Step 2: Testar Local**

**2.1 Correr App Local:**
```powershell
cd C:\Users\shuta\source\repos\AdamantFi-Monorepo
pnpm dev:web
```

**2.2 Comparar UI:**
```
Abrir lado-a-lado:
- Production (mainnet) - Browser 1
- Local (testnet) - Browser 2

Comparar:
- Layout
- Colors
- Components
- Features
- Flows
```

**2.3 Documentar Diferenças:**

```markdown
# Differences Found

## UI Differences:
- [ ] Different: ___________
- [ ] Different: ___________

## Feature Differences:
- [ ] Missing in local: ___________
- [ ] Extra in local: ___________

## Behavior Differences:
- [ ] Works differently: ___________
```

### **Step 3: Identificar Gaps**

**3.1 Features em Prod mas não em Local:**
```
Lista:
1. Feature X
2. Feature Y
3. ...

Priority:
High: ___________
Medium: ___________
Low: ___________
```

**3.2 Features em Local mas não em Prod:**
```
Lista:
1. Multihop (se não estiver em prod)
2. ...

Decision:
- Deploy to prod? Yes/No
- Keep in dev? Yes/No
```

---

## ??? **SAFETY PROCEDURES**

### **Antes de QUALQUER Deploy:**

**Checklist de Segurança:**

```markdown
## Pre-Deploy Safety Check

### Testing:
- [ ] Funciona 100% localmente
- [ ] Testado em testnet com swaps reais
- [ ] Edge cases testados
- [ ] Gas costs verificados
- [ ] No console errors
- [ ] No memory leaks

### Code:
- [ ] Code review completo
- [ ] Tests escritos (unit + integration)
- [ ] Linting passou
- [ ] Type checking passou
- [ ] Build production sem erros

### Configuration:
- [ ] Environment vars corretos
- [ ] Contract addresses verificados
- [ ] Feature flags em place
- [ ] Rollback plan documentado

### Backup:
- [ ] Backup de produção atual
- [ ] Config atual salvo
- [ ] Rollback tested
- [ ] Emergency contacts ready

### Monitoring:
- [ ] Logs configurados
- [ ] Error tracking ready
- [ ] Analytics ready
- [ ] Alerts configurados
```

---

## ?? **DEPLOY STRATEGY (QUANDO PRONTO)**

### **Opção 1: Feature Flags** ? RECOMENDADO

```typescript
// config/features.ts
export const FEATURES = {
  MULTIHOP_ENABLED: process.env.NEXT_PUBLIC_ENABLE_MULTIHOP === 'true',
  AGGREGATOR_ENABLED: process.env.NEXT_PUBLIC_ENABLE_AGGREGATOR === 'true',
  NEW_UI: process.env.NEXT_PUBLIC_NEW_UI === 'true',
};

// Uso:
if (FEATURES.MULTIHOP_ENABLED) {
  // Show multihop option
} else {
  // Hide or disable
}
```

**Vantagens:**
- ? Deploy sem ativar
- ? Enable gradualmente
- ? Rollback instantâneo (só mudar env var)
- ? A/B testing possível

### **Opção 2: Gradual Rollout**

```
Phase 1: Internal Testing
  - Deploy com feature flags OFF
  - Enable para teu próprio wallet
  - Test em produção

Phase 2: Beta Users
  - Enable para lista whitelist
  - Monitor issues
  - Gather feedback

Phase 3: Limited Rollout
  - Enable para 10% users
  - Monitor metrics
  - Adjust if needed

Phase 4: Full Rollout
  - Enable para 100%
  - Keep monitoring
  - Ready to rollback
```

### **Opção 3: Parallel Deployment**

```
Keep both versions:
- v1.adamantfi.com (current, stable)
- v2.adamantfi.com (new, testing)

Users can choose version
Gradual migration based on feedback
```

---

## ?? **MONITORING PLAN**

### **Metrics to Track:**

**Technical:**
```
- Swap success rate
- Gas usage (average & max)
- Execution time
- Error rate
- Contract call failures
```

**User Behavior:**
```
- Direct swap usage
- Multihop swap usage
- Token pair popularity
- Slippage settings
- Bounce rate on errors
```

**Business:**
```
- Total volume
- Unique users
- Transactions per day
- Average swap size
- User retention
```

---

## ?? **DEVELOPMENT WORKFLOW**

### **Dia-a-Dia:**

```
Morning:
1. Pull latest from main
2. Check if prod changed
3. Update local if needed

Development:
1. Work on local (testnet)
2. Test extensively
3. Document changes

Before Push:
1. Run all tests
2. Build production
3. Check diffs
4. Update docs

After Push:
1. Test on testnet
2. Monitor for issues
3. Ready for prod review
```

---

## ?? **DOCUMENTATION TO CREATE**

### **Files Needed:**

```
1. PRODUCTION_CONFIG.md
   - Current production setup
   - Contract addresses
   - Environment variables
   - Feature list

2. TESTNET_CONFIG.md
   - Testnet setup
   - Test contracts
   - Test tokens
   - Faucets

3. DEPLOYMENT_GUIDE.md
   - Step-by-step deploy
   - Rollback procedures
   - Emergency contacts
   - Monitoring setup

4. CHANGE_LOG.md
   - All changes made
   - Version history
   - Migration notes
```

---

## ? **READY FOR PRODUCTION?**

### **Checklist Final:**

```markdown
## Production Readiness

### Code Quality:
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No console.logs in prod code
- [ ] Error boundaries in place
- [ ] Loading states everywhere

### Testing:
- [ ] 100% features tested locally
- [ ] All swaps tested on testnet
- [ ] Edge cases handled
- [ ] Error scenarios tested
- [ ] Gas optimized

### Safety:
- [ ] Feature flags implemented
- [ ] Rollback plan tested
- [ ] Monitoring configured
- [ ] Backup taken
- [ ] Emergency plan ready

### Documentation:
- [ ] Code documented
- [ ] User guide updated
- [ ] Deployment guide ready
- [ ] Changelog updated

### Approval:
- [ ] Code review passed
- [ ] Security review done
- [ ] Stakeholders approved
- [ ] Users notified (if needed)
```

---

## ?? **IMMEDIATE ACTION PLAN**

### **Today:**

1. **Setup Local Environment** (30 min)
   - Follow [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md)
   - Get app running locally
   - Connect Keplr testnet

2. **Document Production** (1 hour)
   - Access live app
   - Take screenshots
   - List all features
   - Note all tokens/pairs

3. **Compare** (30 min)
   - Side-by-side comparison
   - Document differences
   - Create priority list

### **This Week:**

4. **Test Extensively Local** (2-3 days)
   - Every feature
   - Every edge case
   - Document findings

5. **Test on Testnet** (1-2 days)
   - Real swaps
   - Real gas costs
   - Real user flow

### **Next Week:**

6. **Plan Production Deploy** (if needed)
   - Feature flags
   - Gradual rollout
   - Monitoring
   - Docs

---

**??? Remember: Safety First! Test everything locally before touching production!**

**?? Questions? Check:**
- [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md)
- [NEXT_STEPS.md](./NEXT_STEPS.md)
- [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)
