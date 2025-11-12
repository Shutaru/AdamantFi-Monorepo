# ShadeJS SDK - TODAS as Descobertas

## ?? Estrutura do Repo

```
shadejs/
??? src/
?   ??? contracts/
?   ?   ??? definitions/
?   ?   ?   ??? swap.ts          ? Mensagens de swap
?   ?   ?   ??? batchQuery.ts    ? Batch queries
?   ?   ?   ??? snip20.ts        ? SNIP20 tokens
?   ?   ??? services/
?   ??? lib/
?   ?   ??? swap/
?   ?       ??? v2/
?   ?       ?   ??? routerV2.ts           ? Router principal
?   ?       ?   ??? swapCalculationsV2.ts ? Cálculos de swap
?   ?       ?   ??? routeCalculator/
?   ?       ?       ??? SwapRoutesCalculator.ts  ? PathFinding!
?   ?       ?       ??? calculateSingle.ts
?   ??? types/
?       ??? contracts/
?           ??? swap/
?               ??? model.ts     ? Tipos Path, PathV2, etc
?               ??? response.ts
```

---

## ? COMPONENTES CHAVE

### 1. Router Contract Messages

**Arquivo**: `src/contracts/definitions/swap.ts`

```typescript
// Swap usando Router (V1)
function msgSwap({
  routerContractAddress,
  routerCodeHash,
  sendAmount,
  minExpectedReturnAmount,
  path,  // ? Array de Hops!
})

// Swap usando Router V2
function msgSwapV2({
  snip20ContractAddress,
  snip20CodeHash,
  routerContractAddress,
  routerCodeHash,
  sendAmount,
  minExpectedReturnAmount,
  path,  // ? PathV2[] com mais info
})
```

**Path Format**:
```typescript
type Path = {
  poolContractAddress: string,
  poolCodeHash: string,
}

type PathV2 = Path & {
  pair: Contract[],  // Token pair info
  poolType: SwapType,  // CONSTANT_PRODUCT ou STABLE
  stableOracleKeys?: [string, string] | null,
}
```

---

### 2. Swap Calculations (Local - Sem Contract!)

**Arquivo**: `src/lib/swap/v2/swapCalculationsV2.ts`

Eles calculam LOCALMENTE os outputs usando constant product:

```typescript
// Constant Product Swap (token0 ? token1)
function constantProductSwapToken0for1({
  token0LiquidityAmount,  // Reserve in
  token1LiquidityAmount,  // Reserve out
  token0InputAmount,      // Input amount
  fee,                    // Fee (e.g. 0.003 = 0.3%)
})

// Formula:
// output = reserve1 - (reserve0 * reserve1) / (reserve0 + input)
// realOutput = output - (output * fee)
```

**Reverse Swap** (calcular input dado output):
```typescript
function constantProductReverseSwapToken0for1({
  token0LiquidityAmount,
  token1LiquidityAmount,
  token1OutputAmount,  // Desired output
  fee,
})
// Calcula quanto precisa de input para ter esse output!
```

**Price Impact**:
```typescript
function constantProductPriceImpactToken0for1({
  token0LiquidityAmount,
  token1LiquidityAmount,
  token0InputAmount,
})
// Retorna price impact em decimal (e.g. 0.015 = 1.5%)
```

---

### 3. Route Calculator (PathFinding!)

**Arquivo**: `src/lib/swap/v2/routeCalculator/SwapRoutesCalculator.ts`

```typescript
class SwapRoutesCalculator {
  // Construtor recebe pools e tokens
  constructor(
    batchPairsInfo: BatchPairsInfo,
    tokens: Record<string, Contract>
  )

  // Encontra TODOS os caminhos possíveis
  getPossiblePaths({
    startingTokenAddress,
    endingTokenAddress,
    maxHops,
  }): string[][]  // Retorna array de paths

  // Calcula routes com outputs
  calculateRoutes({
    inputTokenAmount,
    startingTokenAddress,
    endingTokenAddress,
    maxHops,
    isReverse,
  }): RouteV2[]  // Paths ordenados por melhor output!
}
```

**Como funciona internamente**:
- Usa **DFS iterativo** (Depth-First Search) com stack
- Explora vizinhos de cada token
- Evita ciclos (não visita mesmo pool duas vezes)
- Calcula output de cada path encontrado
- Retorna ordenado por melhor output

---

### 4. Get Best Routes

**Arquivo**: `src/lib/swap/v2/routerV2.ts`

```typescript
function getRoutes({
  inputTokenAmount,
  startingTokenAddress,
  endingTokenAddress,
  maxHops,
  maxRoutes = Number.MAX_SAFE_INTEGER,
  isReverse = false,
  swapRoutesCalculator,
}): RouteV2[]
```

**Retorna routes ordenados por**:
1. **Highest output** (mais output)
2. **Lowest fees** (se outputs iguais)
3. **Lowest price impact** (se fees iguais)

---

## ?? COMO ELES FAZEM UM SWAP COMPLETO

### Passo 1: Buscar Pools

```typescript
// Via GraphQL ou BatchQuery contract
const batchPairsInfo = await fetchAllPools();
```

### Passo 2: Criar Calculator

```typescript
const calculator = new SwapRoutesCalculator(
  batchPairsInfo,
  tokensConfig
);
```

### Passo 3: Encontrar Rotas

```typescript
const routes = getRoutes({
  inputTokenAmount: BigNumber('49769808'),  // 49.769808 sSCRT
  startingTokenAddress: 'secret1k0j...',    // sSCRT
  endingTokenAddress: 'secret1zww...',      // OSMO
  maxHops: 4,
  swapRoutesCalculator: calculator,
});

// routes[0] é a melhor rota!
const bestRoute = routes[0];

console.log(bestRoute.path);
// [
//   { poolContractAddress: 'secret1...', ... },  // sSCRT/SILK
//   { poolContractAddress: 'secret1...', ... },  // SILK/stOSMO  
//   { poolContractAddress: 'secret1...', ... },  // stOSMO/OSMO
// ]

console.log(bestRoute.quoteOutputAmount.toString());
// "93139054"  ? Output em raw (93.139054 OSMO)
```

### Passo 4: Executar Swap via Router

```typescript
const swapMsg = msgSwapV2({
  snip20ContractAddress: 'secret1k0j...',  // sSCRT
  snip20CodeHash: '...',
  routerContractAddress: 'secret1nrn...',  // Router V2
  routerCodeHash: '...',
  sendAmount: '49769808',
  minExpectedReturnAmount: bestRoute.quoteOutputAmount
    .multipliedBy(0.995)  // 0.5% slippage
    .toFixed(0),
  path: bestRoute.path,
});

// Executar via secretjs
await client.tx.broadcast(...);
```

---

## ?? O QUE PODEMOS COPIAR EXATAMENTE

### Opção 1: Usar Router Contract (MELHOR!)

```typescript
// 1. Buscar pools do GraphQL
const pools = await fetchPoolsGraphQL();

// 2. Criar calculator
const calculator = new SwapRoutesCalculator(pools, tokens);

// 3. Encontrar melhor rota
const routes = getRoutes({
  inputTokenAmount,
  startingTokenAddress,
  endingTokenAddress,
  maxHops: 4,
  swapRoutesCalculator: calculator,
});

// 4. Usar Router contract para simular
const simulation = await client.query.compute.queryContract({
  contract_address: ROUTER_V2,
  code_hash: ROUTER_V2_HASH,
  query: {
    swap_simulation: {
      offer: {
        token: { custom_token: { contract_addr, token_code_hash } },
        amount: inputAmount
      },
      path: routes[0].path.map(p => ({
        addr: p.poolContractAddress,
        code_hash: p.poolCodeHash
      })),
      exclude_fee: false
    }
  }
});

// simulation.result.return_amount ? OUTPUT REAL!
```

### Opção 2: Calcular Localmente (Mais Rápido!)

```typescript
// Usar as funções de swapCalculationsV2.ts
import { constantProductSwapToken0for1 } from 'shadejs';

let currentAmount = inputAmount;

for (const hop of route.path) {
  const pool = pools.find(p => p.contractAddress === hop.poolContractAddress);
  
  const output = constantProductSwapToken0for1({
    token0LiquidityAmount: BigNumber(pool.token0Amount),
    token1LiquidityAmount: BigNumber(pool.token1Amount),
    token0InputAmount: currentAmount,
    fee: BigNumber(0.003),  // 0.3%
  });
  
  currentAmount = output;
}

console.log(currentAmount.toString());  // Final output!
```

---

## ?? PRÓXIMOS PASSOS PARA IMPLEMENTAR

1. **Copiar SwapRoutesCalculator** do ShadeJS para o nosso projeto
2. **Copiar swapCalculationsV2** functions
3. **Buscar pools do GraphQL** (já temos)
4. **Implementar getRoutes()** function
5. **Usar Router V2 contract** para quotes reais

**OU** (mais simples):

Instalar ShadeJS como dependency e usar direto!

```bash
npm install @shadeprotocol/shadejs
```

---

## ?? Addresses dos Contratos

Do Shade Contract Registry:

```typescript
const SHADESWAP_CONTRACTS = {
  factory: {
    address: 'secret1ja0hcwvy76grqkpgwznxukgd7t8a8anmmx05pp',
    code_hash: '2ad4ed2a4a45fd6de3daca9541ba82c26bb66c76d1c3540de39b509abd26538e',
  },
  routerV2: {
    address: 'secret1nrnh30ant2dplrlvqjgmddg4fntllwlm0pnhss',
    code_hash: 'd13768344dfa03118f2ae8f4cf7e114dbad722ba8dd93a67f1f024441a07991a',
  },
  batchQueryRouter: {
    address: 'secret15mkmad8ac036v4nrpcc7nk8wyr578egt077syt',
    code_hash: '1c7e86ba4fdb6760e70bf08a7df7f44b53eb0b23290e3e69ca96140810d4f432',
  },
};
```

---

## ? CONCLUSÃO

**ShadeJS tem TUDO o que precisamos!**

- ? Path finding (SwapRoutesCalculator)
- ? Swap calculations (local, sem contract!)
- ? Router messages
- ? Types corretos
- ? Testes completos

**Podemos literalmente copiar o código deles ou usar como library!** ??

