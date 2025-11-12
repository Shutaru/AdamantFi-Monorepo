# ShadeSwap Integration Guide

## Current Status: DISABLED ?

ShadeSwap adapter is currently disabled because we don't have the token UUID mapping required to query specific pools.

## Why It's Disabled

ShadeSwap uses **internal UUIDs** to identify tokens, not contract addresses:

```typescript
// GraphQL returns:
{
  pools: [
    {
      id: "pool-uuid-123",
      token0Id: "token-uuid-abc",  // ? NOT a contract address!
      token1Id: "token-uuid-def",  // ? NOT a contract address!
      token0Amount: "1000000",
      token1Amount: "2000000",
    }
  ]
}
```

Without the mapping `contract_address ? UUID`, we **cannot** filter pools for specific token pairs.

## What We Tried (and Failed)

### ? Attempt 1: Use "Largest Pool"
```typescript
// BAD: Uses random largest pool, not the specific pair we need
const largestPool = pools.sort((a, b) => 
  BigInt(a.token0Amount) * BigInt(a.token1Amount) > 
  BigInt(b.token0Amount) * BigInt(b.token1Amount) ? -1 : 1
)[0];
```

**Problem**: For sSCRT/OSMO, this might return SILK/USDC pool instead!

### ? Attempt 2: Average of Top 5 Pools
```typescript
// BAD: Average of random pools makes no sense
const avgRatio = pools.slice(0, 5).reduce((sum, p) => 
  sum + (Number(p.token1Amount) / Number(p.token0Amount)), 0
) / 5;
```

**Problem**: Averaging SILK/USDC + ATOM/OSMO + ETH/SCRT ratios = **NONSENSE**

### ? Attempt 3: Match by token0/token1 addresses
```typescript
// BAD: GraphQL doesn't return contract addresses!
const matchingPool = pools.find(p => 
  p.token0 === inputTokenAddress && 
  p.token1 === outputTokenAddress
);
```

**Problem**: `token0` and `token1` fields **don't exist** - only `token0Id` and `token1Id` (UUIDs)

## How to Fix It Properly

### Step 1: Get Token UUID Mapping

Query ShadeSwap GraphQL for tokens:

```graphql
query getTokens {
  tokens {
    id             # UUID like "token-abc-123"
    address        # Contract address like "secret1k0jntykt..."
    symbol
    decimals
  }
}
```

Build a mapping:

```typescript
const TOKEN_UUID_MAP: Record<string, string> = {
  'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek': 'uuid-sscrt-xxx',
  'secret1zwwealwm0pcl9cul4nt6f38dsy6vzplw8lp3qg': 'uuid-osmo-yyy',
  'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd': 'uuid-silk-zzz',
  // ... etc
};
```

### Step 2: Query Specific Pool

```typescript
const inputUUID = TOKEN_UUID_MAP[request.inputToken];
const outputUUID = TOKEN_UUID_MAP[request.outputToken];

const query = `
  query getPool($token0Id: String!, $token1Id: String!) {
    pools(query: { 
      token0Id: $token0Id, 
      token1Id: $token1Id 
    }) {
      token0Amount
      token1Amount
      contractAddress
    }
  }
`;

const { data } = await fetch('/api/shadeswap/graphql', {
  method: 'POST',
  body: JSON.stringify({ 
    query, 
    variables: { token0Id: inputUUID, token1Id: outputUUID } 
  }),
});

const pool = data.pools[0]; // Now this is the CORRECT pool!
```

### Step 3: Calculate with Correct Pool

```typescript
const reserve0 = new BigNumber(pool.token0Amount);
const reserve1 = new BigNumber(pool.token1Amount);

// Constant product formula
const amountInWithFee = inputAmount.multipliedBy(0.997); // 0.3% fee
const numerator = amountInWithFee.multipliedBy(reserve1);
const denominator = reserve0.plus(amountInWithFee);
const outputAmount = numerator.dividedBy(denominator);
```

## Alternative: Use ShadeSwap Router Contract

Instead of GraphQL, query the **Router contract** directly:

```typescript
const simulation = await client.query.compute.queryContract({
  contract_address: SHADESWAP_ROUTER_V2,
  code_hash: SHADESWAP_ROUTER_CODE_HASH,
  query: {
    swap_simulation: {
      offer: {
        token: {
          custom_token: {
            contract_addr: inputTokenAddress,
            token_code_hash: inputTokenCodeHash,
          }
        },
        amount: inputAmount.toString(),
      },
      path: [/* routing hops */],
    }
  }
});

const expectedOutput = simulation.result.return_amount;
```

**Pros**:
- ? Returns EXACT expected output
- ? Handles multi-hop routing automatically
- ? No need for UUID mapping

**Cons**:
- ? Need to know pool contract addresses
- ? Need to construct routing path
- ? More complex setup

## TODO: Reactivate ShadeSwap

1. [ ] Get token UUID mapping from ShadeSwap GraphQL
2. [ ] Store mapping in `config/shadeswap.ts`
3. [ ] Update `ShadeSwapGraphQLAdapter` to use UUIDs for filtering
4. [ ] OR implement Router contract querying
5. [ ] Test with real token pairs (sSCRT/OSMO, sSCRT/SILK, etc)
6. [ ] Re-enable in `LiquidityAggregator.ts`

## Current Workaround

For now, **only AdamantFi (SecretSwap)** is active. This works perfectly for:
- ? sSCRT/sATOM
- ? sSCRT/SILK
- ? sSCRT/ETH.axl
- ? sSCRT/USDC.nbl
- ? sSCRT/JKL

Once we have ShadeSwap working, the aggregator will automatically:
1. Query **both** DEXs
2. Compare prices
3. Route through the **cheaper** one
4. Save users money! ??

