# ?? ShadeSwap Integration - Current Status & Next Steps

## ?? Current State

### ? What We Have

1. **Complete understanding of ShadeSwap contracts** from cloned repo
2. **Message structures** reverse-engineered from Rust code
3. **ShadeSwapRouterAdapter** skeleton implementation
4. **Token OSMO** added to config
5. **LiquidityAggregator** ready to use ShadeSwap

### ? What We Need

1. **ShadeSwap Router mainnet address** ?
2. **ShadeSwap Router code hash** ?
3. **Routing logic** (how to build `path: Vec<Hop>`)
4. **Token code hashes** for all supported tokens

## ?? Where to Find Missing Info

### Option 1: ShadeSwap Official Documentation

Visit: https://docs.shadeprotocol.io/shade-protocol/shadeswap/contracts

Look for:
- Router contract address on mainnet
- Factory contract address  
- Code hashes

### Option 2: ShadeSwap GraphQL Explorer

Visit: https://graph.shade.fi/

Try querying:
```graphql
{
  config {
    router {
      address
      codeHash
    }
    factory {
      address
      codeHash
    }
  }
}
```

### Option 3: Secret Network Explorer

1. Go to: https://www.mintscan.io/secret
2. Search for "shadeswap router"
3. Click on contract
4. Copy address and code hash

### Option 4: Ask ShadeSwap Team

Discord: https://discord.gg/shadeprotocol
- #dev-general channel
- Ask: "What's the mainnet Router contract address and code hash?"

### Option 5: Check app.shadeprotocol.io

1. Open: https://app.shadeprotocol.io/swap
2. Open browser DevTools (F12)
3. Go to Network tab
4. Perform a swap simulation
5. Look for contract query calls
6. Copy addresses and code hashes from requests

## ?? Implementation Checklist

### Phase 1: Get Contract Addresses (15 min)

- [ ] Find Router address via one of methods above
- [ ] Find Router code hash
- [ ] Find Factory address (optional, for routing)
- [ ] Find Factory code hash (optional)

Update in code:
```typescript
// apps/web/config/shadeswap.ts
export const SHADESWAP_CONFIG = {
  router: {
    address: 'secret1???', // FILL THIS
    code_hash: '???',       // FILL THIS
  },
};
```

### Phase 2: Implement Routing (30-60 min)

Choose ONE of these approaches:

#### A. Use ShadeSwap GraphQL (EASIEST) ?
```typescript
async buildRoutingPath(from: string, to: string): Promise<Hop[]> {
  const response = await fetch('https://graph.shade.fi/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `{
        pairs {
          token0 { contract_address }
          token1 { contract_address }
          contract_address
          code_hash
        }
      }`
    }),
  });

  const pairs = await response.json();
  // Build graph and find path using BFS
  return findPath(pairs, from, to);
}
```

#### B. Hardcode Common Paths (FASTEST)
```typescript
const PATHS: Record<string, Hop[]> = {
  'sSCRT_OSMO': [
    { addr: 'secret1...', code_hash: '...' }, // sSCRT/SILK
    { addr: 'secret1...', code_hash: '...' }, // SILK/OSMO
  ],
};
```

#### C. Query Factory Contract (COMPLETE)
```typescript
// Query all pairs from Factory
// Build routing graph
// Use Dijkstra's algorithm
```

### Phase 3: Test (30 min)

```typescript
// Test 1: Simple quote
const quote = await aggregator.getQuote({
  inputToken: SSCRT,
  outputToken: OSMO,
  inputAmount: '1000000', // 1 SCRT
});
console.log('Expected:', quote.route.expectedOutput);

// Test 2: Compare with ShadeSwap UI
// Go to app.shadeprotocol.io and swap 1 SCRT ? OSMO
// Compare output values (should be ±1%)

// Test 3: Small swap
const swap = await aggregator.executeSwap({
  route: quote.route,
  recipient: YOUR_ADDRESS,
});
console.log('TX:', swap.txHash);
```

### Phase 4: Polish (15 min)

- [ ] Add error handling
- [ ] Add loading states in UI
- [ ] Update documentation
- [ ] Add console logs for debugging

## ?? Quick Start (If You Want To Get It Working NOW)

### The Absolute Fastest Way:

1. **Go to app.shadeprotocol.io/swap**
2. **Open DevTools** (F12) ? Network tab
3. **Try to swap sSCRT ? OSMO**
4. **Find the contract query** in Network tab
5. **Copy the contract address** from request
6. **Paste into code**:

```typescript
// apps/web/services/dex/adapters/ShadeSwapAdapter.ts
const SHADESWAP_ROUTER = {
  address: 'PASTE_HERE', // From DevTools
  code_hash: 'PASTE_HERE', // From DevTools
};
```

7. **For routing**, use GraphQL or hardcode one path:

```typescript
private async buildRoutingPath(from: string, to: string): Promise<Hop[]> {
  // HACK: Hardcode sSCRT ? OSMO path
  if (from === SSCRT_ADDRESS && to === OSMO_ADDRESS) {
    return [
      { addr: 'SSCRT_OSMO_PAIR_ADDRESS', code_hash: 'PAIR_CODE_HASH' },
    ];
  }
  throw new Error('Path not supported yet');
}
```

8. **Test it!**

## ?? Need Help?

If you get stuck, you can:

1. **Check the actual frontend code**
   - There must be a React/TypeScript frontend somewhere
   - Search for: `shade-app`, `shadeswap-ui`, `shade-frontend`

2. **Ask in Discord**
   - ShadeSwap: https://discord.gg/shadeprotocol
   - Secret Network: https://discord.gg/secret-network

3. **Check this doc**
   - https://docs.shadeprotocol.io/

## ?? Pro Tips

1. **Start with one pair**: sSCRT ? OSMO
2. **Use DevTools**: Best way to find contract addresses
3. **Test with tiny amounts**: 0.01 SCRT first!
4. **Compare with UI**: Always verify against ShadeSwap's own UI
5. **Cache everything**: Routing paths, token info, etc.

## ?? Success Looks Like

When it's working, you should see:

```
Console:
?? ADAMANTFI AGGREGATOR
?? Analyzing swap: 1000000 ? best output
????????????????????????????????????????
?? Checking AdamantFi for liquidity...
??  AdamantFi: No liquidity available
?? Checking ShadeSwap for liquidity...
? ShadeSwap simulation:
   Return: 950000
   Total fee: 3000
   LP fee: 2500
   DAO fee: 500
? ShadeSwap: 950000 (0.30% impact)

?? Available pools: 1

?? Best pool: ShadeSwap ? 950000

????????????????????????????????????????
? RESULT: Using SINGLE pool (ShadeSwap)
   Output: 950000
   Reason: Only one pool available
????????????????????????????????????????
```

## ?? Files You Need to Edit

```
1. apps/web/config/shadeswap.ts (CREATE)
   - Router address & code hash
   - Token code hashes

2. apps/web/services/dex/adapters/ShadeSwapRouterAdapter.ts (COMPLETE)
   - Implement buildRoutingPath()
   - Add actual router config

3. apps/web/services/dex/LiquidityAggregator.ts (UPDATE)
   - Replace ShadeSwapAdapter with ShadeSwapRouterAdapter

4. Test!
```

## ?? Time Estimate

- **Minimum** (hardcode everything): 30 minutes
- **Recommended** (use GraphQL): 1-2 hours  
- **Complete** (query Factory, full routing): 4-6 hours

---

**Ready?** Start by finding the Router address! ??

The fastest way: Open app.shadeprotocol.io in DevTools and watch the Network tab!
