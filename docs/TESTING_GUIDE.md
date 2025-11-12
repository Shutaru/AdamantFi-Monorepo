# ?? TESTES - ShadeSwap Routing

## Teste Rápido (Browser Console)

1. **Abre a app:**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Vai para:** http://localhost:3000

3. **Abre DevTools Console** (F12)

4. **Vai à página de Swap**

5. **Seleciona tokens:**
   - From: SILK
   - To: OSMO

6. **Verifica logs na consola:**
   ```
   ?? Loading pools from Factory contract...
   ? Factory response received
   ?? Parsing 150 pairs from factory...
   ? Built graph: 45 unique tokens, 150 pools
      Token secret1fl44... has 8 pool(s)   ? SILK
      Token secret1k0jn... has 42 pool(s)  ? sSCRT
      Token secret1zwwe... has 12 pool(s)  ? OSMO
   
   ?? ShadeSwap Router: SILK ? OSMO
   ?? DFS: Finding path from secret1fl44... to secret1zwwe...
   ? Found path with 2 hop(s)
      Hop 1: secret1abc... (SILK/sSCRT pool)
      Hop 2: secret1def... (sSCRT/OSMO pool)
   ? Best path: 2 hops
   ```

---

## Teste com Script

```bash
cd apps/web
npx ts-node scripts/test-routing.ts
```

**Output esperado:**
```
?? Testing ShadeSwap Routing with Contract Addresses

============================================================
?? Test: SILK ? OSMO
============================================================

?? Querying Factory for pairs (start=0, limit=300)...
? Factory response received
?? Parsing 150 pairs from factory...
? Built graph: 45 unique tokens, 150 pools
   Token secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd has 8 pool(s)
   Token secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek has 42 pool(s)
   
?? ShadeSwap Router: SILK ? OSMO
?? Using cached pools graph
?? DFS: Finding path from secret1fl44... to secret1zwwe...
? Found path with 2 hop(s)
   Hop 1: Pool secret1abc...
   Hop 2: Pool secret1def...
? Best path: 2 hops

? SUCCESS!
   Input: 1000000 SILK
   Output: 0 OSMO
   Route: secret1abc... ? secret1def...
   Path length: 2 hop(s)

============================================================
?? Test: SILK ? USDC
============================================================

?? ShadeSwap Router: SILK ? USDC
?? Using cached pools graph
?? DFS: Finding path from secret1fl44... to secret1h6z0...
? Found path with 1 hop(s)
   Hop 1: Pool secret1xyz...
? Best path: 1 hop

? SUCCESS!
   Input: 1000000 SILK
   Output: 0 USDC
   Route: secret1xyz...
   Path length: 1 hop(s)

============================================================
?? Testing complete!
============================================================
```

---

## Debug: Verificar Factory Query

Se quiser testar APENAS a query ao Factory:

```bash
cd apps/web
npx ts-node -e "
import { SecretNetworkClient } from 'secretjs';
import { BatchQueryService } from './services/dex/ShadeSwapBatchQuery';

const client = new SecretNetworkClient({
  url: 'https://lcd.mainnet.secretsaturn.net',
  chainId: 'secret-4',
});

const batch = new BatchQueryService(client);

batch.queryFactoryPairs({ startingIndex: 0, limit: 10 })
  .then(pairs => {
    console.log('\n? Got', pairs.length, 'pairs\n');
    pairs.slice(0, 3).forEach((pair, i) => {
      console.log(\`\${i + 1}. Pool:\`, pair.pairContract.address);
      console.log(\`   Token0:\`, pair.token0Contract.address);
      console.log(\`   Token1:\`, pair.token1Contract.address);
      console.log(\`   Stable:\`, pair.isStable);
      console.log(\`   Enabled:\`, pair.isEnabled);
      console.log('');
    });
  })
  .catch(console.error);
"
```

**Output esperado:**
```
?? Querying Factory for pairs (start=0, limit=10)...
? Factory response received
?? Parsing 10 pairs from factory...

? Got 10 pairs

1. Pool: secret1abc...
   Token0: secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd
   Token1: secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek
   Stable: false
   Enabled: true

2. Pool: secret1def...
   Token0: secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek
   Token1: secret1zwwealwm0pcl9cul4nt6f38dsy6vzplw8lp3qg
   Stable: false
   Enabled: true

3. Pool: secret1ghi...
   Token0: secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd
   Token1: secret1h6z05y90gwm4sqxzhz4pkyp36cna9xtp7q0urv
   Stable: false
   Enabled: true
```

---

## Troubleshooting

### ? "Factory query failed: unknown request"

**Causa:** Mensagem da query está incorreta

**Verificar:**
```typescript
// ShadeSwapBatchQuery.ts linha ~75
query: {
  list_a_m_m_pairs: {  // ? Com underscores: a_m_m
    pagination: {
      start: startingIndex,
      limit,
    },
  },
}
```

**Fix:** Garantir que está `list_a_m_m_pairs` (não `listAMMPairs` ou `list_amm_pairs`)

---

### ? "No routing path found"

**Causa:** Tokens não têm contract addresses no TokenRegistry

**Verificar:**
```typescript
// TokenRegistry deve ter:
{
  symbol: 'SILK',
  contractAddress: 'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd',  // ? Obrigatório
  shadeSwapUuid: 'e39060e0-628d-4238-9366-a4c8778fb10a',  // ?? Opcional
}
```

**Fix:** Adicionar `contractAddress` para todos os tokens

---

### ? "Token not in graph"

**Causa 1:** Token não tem pools no ShadeSwap  
**Solução:** Verificar em https://app.shadeswap.io se token tem liquidity

**Causa 2:** Pool está desabilitado (`isEnabled: false`)  
**Solução:** Normal, router ignora pools desabilitados automaticamente

---

### ?? "Output amount is 0"

**Causa:** Quote calculation ainda não implementado (TODO)

**Solução:** Fase 2 - implementar cálculo de output com simulação de swaps

**Status atual:**
- ? Routing funciona (encontra paths)
- ? Graph building funciona
- ? DFS funciona
- ? Quote calculation (próximo passo)

---

## Logs Esperados (Success Case)

### Primeiro load (sem cache):
```
?? Loading pools from Factory contract...
?? Querying Factory for pairs (start=0, limit=300)...
? Factory response received
?? Parsing 150 pairs from factory...
? Built graph: 45 unique tokens, 150 pools
   Token secret1fl44... has 8 pool(s)
   Token secret1k0jn... has 42 pool(s)
   Token secret1zwwe... has 12 pool(s)
   Token secret1h6z0... has 15 pool(s)
   Token secret1vnjck... has 3 pool(s)
```

### Loads subsequentes (com cache):
```
?? Using cached pools graph
```

### Routing bem-sucedido:
```
?? ShadeSwap Router: SILK ? OSMO
?? DFS: Finding path from secret1fl44... to secret1zwwe...
? Found path with 2 hop(s)
   Hop 1: secret1abc...
   Hop 2: secret1def...
? Best path: 2 hops
```

---

## Next Steps (depois de funcionar)

1. **Implementar Quote Calculation**
   - Query each pool for simulate_swap
   - Calculate output amount per hop
   - Calculate total output

2. **Add Price Impact**
   - Compare spot price vs execution price
   - Show slippage percentage

3. **Multi-Path Comparison**
   - Find top 3 best paths
   - Compare outputs
   - Recommend best route

4. **Cache Optimization**
   - TTL para pools (5 minutos)
   - Invalidate on swap execution
   - Background refresh

---

**Data:** 2024  
**Status:** ? Routing implementado | ? Quote calculation TODO
