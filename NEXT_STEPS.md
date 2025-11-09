# ?? AdamantFi - Próximos Passos Detalhados

**Data:** Janeiro 2025  
**Fase Atual:** FASE 1 - Verificação & Testing

---

## ?? **FASE 1: VERIFICAÇÃO & TESTING**

### **Objetivo:**
Garantir que o sistema multihop existente funciona corretamente antes de avançar.

### **Status:** ?? EM PROGRESSO

### **Checklist de Tarefas:**

#### **1.1 Análise de Código** ? COMPLETO
- [x] Revisar estrutura do repositório
- [x] Identificar todos os componentes multihop
- [x] Verificar configurações (ROUTER, MULTIHOP_ENABLED)
- [x] Documentar estado atual

#### **1.2 Preparação de Teste** ?? PRÓXIMO
- [ ] Verificar ambiente de desenvolvimento
- [ ] Configurar `.env.local` para testnet
- [ ] Instalar dependências (`pnpm install`)
- [ ] Build do projeto (`pnpm build`)

**Comandos:**
```bash
cd C:\Users\shuta\source\repos\AdamantFi-Monorepo
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Editar .env.local se necessário
pnpm build:web
pnpm dev:web
```

#### **1.3 Testes Funcionais** ? AGUARDANDO
- [ ] Conectar Keplr wallet à testnet
- [ ] Verificar viewing keys dos tokens
- [ ] Testar swap direto (sSCRT ? sATOM)
- [ ] Testar swap multihop (sATOM ? USDC.nbl)
- [ ] Verificar estimações de preço
- [ ] Verificar cálculo de gas
- [ ] Verificar min_receive

**Cenários de Teste:**

**A. Direct Swap**
```
Input: 1 sSCRT
Output: ? sATOM
Expected: Estimação aparece, swap executa com sucesso
```

**B. Multihop Swap**
```
Input: 1 sATOM
Path: sATOM ? sSCRT ? USDC.nbl (2 hops)
Expected: Route display mostra path, swap atómico via router
```

**C. Empty Pool**
```
Input: Selecionar par sem liquidez
Expected: "No liquidity" warning, botão swap desativado
```

**D. High Slippage**
```
Input: Grande quantidade
Expected: Warning de price impact alto
```

#### **1.4 Análise de Resultados** ? AGUARDANDO
- [ ] Documentar resultados dos testes
- [ ] Capturar screenshots/logs
- [ ] Identificar bugs ou issues
- [ ] Priorizar fixes necessários

#### **1.5 Fixes (se necessário)** ? AGUARDANDO
- [ ] Corrigir issues encontrados
- [ ] Re-testar após fixes
- [ ] Atualizar documentação

---

## ?? **FASE 2: SDK IMPLEMENTATION**

### **Objetivo:**
Implementar SDK completo para interagir com o contrato agregador.

### **Status:** ? AGUARDANDO FASE 1

### **Pré-requisitos:**
- Fase 1 completa e sistema multihop validado
- Especificação do contrato aggregator V5

### **Tarefas:**

#### **2.1 Estudar Contrato Aggregator**
- [ ] Ler `contracts/aggregator/README.md`
- [ ] Analisar `contracts/aggregator/src/msg.rs`
- [ ] Identificar todas as mensagens suportadas
- [ ] Documentar interface do contrato

#### **2.2 Definir Tipos TypeScript**
- [ ] Criar `packages/shared-types/src/aggregator.ts`
- [ ] Tipos para mensagens (InitMsg, HandleMsg, QueryMsg)
- [ ] Tipos para responses
- [ ] Tipos para routing paths

**Exemplo:**
```typescript
// packages/shared-types/src/aggregator.ts
export interface AggregatorHop {
  from_token: TokenInfo;
  pair_address: string;
  pair_code_hash: string;
}

export interface AggregatorRoute {
  hops: AggregatorHop[];
  expected_return?: string;
  to: string;
}

export interface AggregatorSwapMsg {
  route: AggregatorRoute;
  minimum_acceptable_amount: string;
}
```

#### **2.3 Implementar SDK**
- [ ] Implementar `packages/contract-sdk/src/aggregator.ts`

**Funções a implementar:**
```typescript
// Query functions
export async function queryAggregatorConfig(client: SecretNetworkClient, address: string): Promise<Config>
export async function querySimulateRoute(client: SecretNetworkClient, route: Route): Promise<SimulationResponse>

// Execute functions
export async function executeSwap(client: SecretNetworkClient, params: SwapParams): Promise<TxResponse>
export async function registerTokens(client: SecretNetworkClient, tokens: TokenInfo[]): Promise<TxResponse>
```

#### **2.4 Testes Unitários**
- [ ] Criar `packages/contract-sdk/tests/aggregator.test.ts`
- [ ] Testar query functions
- [ ] Testar execute functions
- [ ] Testar edge cases

#### **2.5 Documentação**
- [ ] JSDoc comments em todas as funções
- [ ] Criar `packages/contract-sdk/README.md`
- [ ] Exemplos de uso
- [ ] API reference

---

## ?? **FASE 3: AGGREGATOR INTEGRATION**

### **Objetivo:**
Migrar de router para aggregator V5, mantendo compatibilidade.

### **Status:** ? AGUARDANDO FASE 2

### **Tarefas:**

#### **3.1 Criar Camada de Execução**
- [ ] Criar `apps/web/utils/swap/aggregatorExecution.ts`
- [ ] Implementar `executeAggregatorSwap()`
- [ ] Suporte para direct e multihop
- [ ] Manter interface compatível com `multihopExecution.ts`

#### **3.2 Feature Flag**
- [ ] Adicionar `USE_AGGREGATOR` flag em `config/tokens.ts`
- [ ] Modificar `useSwapFormLean` para usar flag
- [ ] Permitir switch entre router/aggregator

```typescript
// config/tokens.ts
export const USE_AGGREGATOR = false; // Default: false para safety
export const AGGREGATOR = {
  contract_address: 'secret1...', // Quando deployado
  code_hash: '...',
};
```

#### **3.3 Comparação de Performance**
- [ ] Testar mesmos swaps com router vs aggregator
- [ ] Comparar gas usage
- [ ] Comparar execution time
- [ ] Comparar success rate
- [ ] Documentar diferenças

#### **3.4 Gradual Rollout**
- [ ] Testar aggregator em ambiente de dev
- [ ] Beta testing com flag
- [ ] Monitor métricas
- [ ] Full rollout se tudo OK

---

## ?? **FASE 4: ENHANCED FEATURES**

### **Objetivo:**
Melhorar routing, UI e adicionar features avançadas.

### **Status:** ? AGUARDANDO FASE 3

### **Tarefas:**

#### **4.1 Multi-Path Routing**
- [ ] Algoritmo para encontrar múltiplos paths
- [ ] Comparação de paths (price, gas, slippage)
- [ ] Seleção automática de best path
- [ ] UI para mostrar alternativas

#### **4.2 Advanced Routing**
- [ ] Suporte para >2 hops
- [ ] Routing via múltiplos intermediários (não só sSCRT)
- [ ] Cross-DEX routing (se aplicável)

#### **4.3 UI Enhancements**
- [ ] `MultihopStatusIndicator` component
- [ ] Route comparison view
- [ ] Advanced charts
- [ ] Transaction history

#### **4.4 Optimization**
- [ ] Pool data caching
- [ ] Batch queries
- [ ] Reduce re-renders
- [ ] Code splitting

---

## ?? **DECISÃO IMEDIATA NECESSÁRIA**

Antes de continuar, precisamos decidir:

### **Opção A: Testar Router Atual** (RECOMENDADO) ??
**Próximo passo:** Configurar ambiente e testar multihop
**Tempo:** 1-2 horas
**Risco:** Baixo
**Benefício:** Validar que tudo funciona antes de avançar

### **Opção B: Implementar SDK Aggregator** ??
**Próximo passo:** Estudar contrato e implementar SDK
**Tempo:** 2-3 dias
**Risco:** Médio (pode ter issues não descobertos no router)
**Benefício:** Avança diretamente para aggregator

### **Opção C: Melhorar UI Primeiro** ??
**Próximo passo:** Adicionar componentes visuais
**Tempo:** 1-2 dias
**Risco:** Médio (pode melhorar algo que não funciona)
**Benefício:** Melhor UX

---

## ?? **SETUP RÁPIDO PARA COMEÇAR**

### **1. Verificar Ambiente:**
```powershell
# Verificar Node.js version
node --version  # Should be >= 22.0.0

# Verificar pnpm
pnpm --version

# Se não tiver pnpm:
npm install -g pnpm
```

### **2. Install Dependencies:**
```powershell
cd C:\Users\shuta\source\repos\AdamantFi-Monorepo
pnpm install
```

### **3. Configure Environment:**
```powershell
# Copiar .env.example
cp apps/web/.env.example apps/web/.env.local

# Verificar configuração (já está em Pulsar-3 testnet)
cat apps/web/.env.local
```

### **4. Build & Run:**
```powershell
# Build
pnpm build:web

# Run dev server
pnpm dev:web

# Abrir browser em http://localhost:3000
```

### **5. Connect Keplr:**
- Instalar Keplr extension
- Adicionar Pulsar-3 testnet
- Obter test tokens
- Conectar à app

---

## ? **QUAL O PRÓXIMO PASSO?**

**Pergunta para ti:**

1. ? **Queres testar o router atual primeiro?** (setup ambiente + testes)
2. ?? **Queres implementar o SDK do aggregator?** (código novo)
3. ?? **Queres melhorar a UI?** (componentes visuais)
4. ?? **Queres estudar o contrato aggregator em detalhe?** (análise)
5. ?? **Outro objetivo específico?** (diz-me)

**Escolhe uma opção e vamos começar!** ??
