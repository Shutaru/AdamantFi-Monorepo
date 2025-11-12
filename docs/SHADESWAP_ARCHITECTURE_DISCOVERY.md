# ?? DESCOBERTA IMPORTANTE: ShadeSwap Architecture

## ? O Que Pensávamos

ShadeSwap usa um **Router contract** central como UniswapV2/PancakeSwap:
```
User ? Router Contract ? AMM Pairs ? Result
```

## ? Como ShadeSwap REALMENTE Funciona

ShadeSwap usa **pools individuais** sem Router central:
```
User ? GraphQL API (descobrir pools) ? AMM Pair Contract direto ? Result
```

---

## ?? Arquitetura Real do ShadeSwap

### 1. GraphQL API para Discovery

**Endpoint**: `https://graph.shade.fi/graphql`

**Query para buscar pools**:
```graphql
query getPools($ids: [String!]) {
  pools(query: {ids: $ids}) {
    id
    contractAddress       # ? Pool contract address
    codeHash             # ? Pool code hash
    token0Id
    token0Amount
    token1Id
    token1Amount
    daoFee
    lpFee
    isEnabled
    liquidityUsd
  }
}
```

**Response** (exemplo):
```json
{
  "pools": [
    {
      "contractAddress": "secret1xj2vyl0xy5evex5j7dcs700ppncmqz4fzxdfh5",
      "codeHash": "e88165353d5d7e7847f2c84134c3f7871b2eee684ffac9fcf8d99a4da39dc2f2",
      "token0Id": "e39060e0-628d-4238-9366-a4c8778fb10a",
      "token0Amount": "36324864",
      "token1Id": "8376b453-b90c-4ae7-bdd0-9e442f8b7266",
      "token1Amount": "24120092835",
      "daoFee": "0.0001",
      "lpFee": "0.0029",
      "isEnabled": true,
      "liquidityUsd": 103.87
    }
  ]
}
```

### 2. Direct Pool Contract Queries

Depois de descobrir o pool via GraphQL, fazemos query **diretamente no pool contract**:

```typescript
await client.query.compute.queryContract({
  contract_address: 'secret1xj2vyl0xy5evex5j7dcs700ppncmqz4fzxdfh5', // Pool address
  code_hash: 'e88165353d5d7e7847f2c84134c3f7871b2eee684ffac9fcf8d99a4da39dc2f2',
  query: {
    // Query específica do pool (simulation, reserves, etc)
  }
});
```

### 3. RPC Endpoint

**ShadeSwap usa RPC próprio**: `https://shade-api.lavenderfive.com`

Diferente do endpoint padrão do Secret Network!

---

## ?? Novo Fluxo Correto

### Para Swap sSCRT ? OSMO:

```
1. Query GraphQL API
   ?? Buscar pools que têm sSCRT e OSMO
   ?? Retorna: pool addresses, code hashes, reserves

2. Se encontrar pool direto sSCRT/OSMO:
   ?? Query pool contract para simular swap
   ?? Retorna: expected output, price impact, fees

3. Se NÃO encontrar pool direto:
   ?? Procurar path: sSCRT ? SILK ? OSMO (por exemplo)
   ?? Query cada pool na rota
   ?? Calcular output total

4. Executar swap:
   ?? Enviar SNIP20 Send para POOL contract (não Router!)
   ?? Pool executa swap
   ?? Retorna tokens
```

---

## ?? O Que Precisamos Implementar

### 1. GraphQL Pool Discovery

```typescript
async function discoverPools(token0: string, token1: string) {
  const query = `
    query getPools {
      pools(query: {}) {
        contractAddress
        codeHash
        token0Id
        token1Id
        token0Amount
        token1Amount
        isEnabled
      }
    }
  `;

  const response = await fetch('https://graph.shade.fi/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  
  // Filter pools that match our tokens
  return data.pools.filter(pool =>
    (pool.token0Id === token0 && pool.token1Id === token1) ||
    (pool.token0Id === token1 && pool.token1Id === token0)
  );
}
```

### 2. Pool Contract Simulation

```typescript
async function simulateSwap(poolAddress: string, offerAmount: string) {
  const query = {
    swap_simulation: {
      offer_asset: {
        info: {
          token: {
            contract_addr: inputToken,
            token_code_hash: tokenCodeHash,
          }
        },
        amount: offerAmount,
      }
    }
  };

  const result = await client.query.compute.queryContract({
    contract_address: poolAddress, // Pool direto, não Router!
    code_hash: poolCodeHash,
    query,
  });

  return result.return_amount;
}
```

### 3. Multi-hop Routing

```typescript
async function findBestRoute(fromToken: string, toToken: string) {
  // 1. Get ALL pools from GraphQL
  const allPools = await getAllPools();

  // 2. Build graph of token connections
  const graph = buildTokenGraph(allPools);

  // 3. Find shortest path (BFS)
  const path = findShortestPath(graph, fromToken, toToken);

  // 4. Return pool addresses in path
  return path.map(hop => hop.poolAddress);
}
```

---

## ?? Correções Necessárias

### ? Já Corrigido

1. **Import path** no `TokenRegistry.ts`:
   ```typescript
   // ? ERRADO
   import { ShadeSwapRouterAdapter } from './dex/adapters/ShadeSwapRouterAdapter';
   
   // ? CORRETO
   import { ShadeSwapRouterAdapter } from '@/services/dex/adapters/ShadeSwapRouterAdapter';
   ```

2. **ShadeSwap config** atualizado com endpoints corretos

### ? Ainda Precisa Fazer

1. **Reescrever `ShadeSwapRouterAdapter`** para usar GraphQL + Pool contracts
2. **Implementar pool discovery** via GraphQL
3. **Implementar swap simulation** nos pool contracts
4. **Implementar routing** multi-hop se necessário

---

## ?? Comparação: Arquiteturas

### AdamantFi (SecretSwap)
```
User ? Router Contract ? Pair Contracts ? Result
       ?
     Query Router directly
```

### ShadeSwap
```
User ? GraphQL API ? Pool Contracts ? Result
       ?                ?
     Discovery      Direct queries
```

### Diferenças Principais

| Aspecto | AdamantFi | ShadeSwap |
|---------|-----------|-----------|
| Discovery | Query Router/Factory | GraphQL API |
| Routing | Router contract | Client-side (BFS) |
| Simulation | Router.simulate_swap | Pool.swap_simulation |
| Execution | Router.swap | Pool.swap |
| RPC | Standard Secret | shade-api.lavenderfive.com |

---

## ?? Próximos Passos

### Passo 1: Test GraphQL API (5 min)

```bash
curl -X POST https://graph.shade.fi/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ pools(query: {}) { contractAddress token0Id token1Id } }"}'
```

### Passo 2: Map Token IDs (10 min)

ShadeSwap usa UUIDs para tokens (não addresses!):
- `token0Id`: `"e39060e0-628d-4238-9366-a4c8778fb10a"`
- Precisamos mapear: UUID ? Contract Address

### Passo 3: Rewrite Adapter (30-60 min)

Criar `ShadeSwapGraphQLAdapter` que:
1. Query GraphQL para pools
2. Map token IDs para addresses
3. Find routing paths
4. Simulate swaps nos pools
5. Execute swaps

---

## ?? Por Que Isso Importa

**Antes** (pensamento errado):
- ? Tentávamos query Router contract inexistente
- ? "unknown request" errors
- ? Não funcionava

**Agora** (entendimento correto):
- ? Query GraphQL para descobrir pools
- ? Query pool contracts diretamente
- ? Vai funcionar!

---

**Conclusão**: Precisamos reescrever o adapter para usar a arquitetura correta do ShadeSwap (GraphQL + direct pool queries ao invés de Router contract).

Tempo estimado: 1-2 horas para implementação completa. ??
