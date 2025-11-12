# ShadeSwap Full Integration Implementation Guide

## ?? Goal
Implement complete ShadeSwap Router integration using the actual contract code from the cloned repositories.

## ?? Repository Structure
```
C:\Users\shuta\source\repos\
??? shade/                    # Shade Protocol contracts
??? shadeswap/               # ShadeSwap DEX contracts ?
??? ShadeSwap-frontend/      # ShadeSwap frontend
```

## ?? What We Found

### ShadeSwap Router Contract Structure

**Location**: `shadeswap/contracts/router/`

**Key Files**:
- `src/contract.rs` - Main contract logic
- `packages/shadeswap-shared/src/msg.rs` - Message definitions

**Message Structures**:

```rust
// QUERY: Simulate swap
pub enum QueryMsg {
    SwapSimulation {
        offer: TokenAmount,
        path: Vec<Hop>,
        exclude_fee: Option<bool>,
    },
}

// EXECUTE: Perform swap via SNIP20 Receive
pub enum InvokeMsg {
    SwapTokensForExact {
        path: Vec<Hop>,
        expected_return: Option<Uint128>,
        recipient: Option<String>,
    },
}

// Supporting structures
pub struct Hop {
    pub addr: String,        // AMM Pair contract address
    pub code_hash: String,   // AMM Pair code hash
}

pub struct TokenAmount {
    pub token: TokenType,
    pub amount: Uint128
}

pub enum TokenType {
    CustomToken {
        contract_addr: Addr,
        token_code_hash: String,
    },
    NativeToken {
        denom: String,
    },
}
```

## ? What's Implemented

Created `ShadeSwapRouterAdapter.ts` with:
- ? Correct message types from actual contract
- ? `getQuote()` using `swap_simulation` query
- ? `executeSwap()` using SNIP20 Receive interface
- ? Gas estimation based on hop count

## ? What's Missing (TODO)

### 1. ShadeSwap Router Contract Details

**Need to find:**
```typescript
const SHADESWAP_ROUTER = {
  address: 'secret1???',  // ? What's the mainnet address?
  code_hash: '???',       // ? What's the code hash?
};
```

**How to find**:
```bash
# Option A: Check ShadeSwap frontend config
cd ..\ShadeSwap-frontend
grep -r "router" src/config/
grep -r "secret1" src/config/

# Option B: Check deployment scripts in shadeswap repo
cd ..\shadeswap
grep -r "router" scripts/
grep -r "mainnet" scripts/

# Option C: Query ShadeSwap GraphQL
curl -X POST https://graph.shade.fi/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ config { router { address code_hash } } }"}'
```

### 2. Routing Path Builder

**Current status**: Placeholder that throws error

**What's needed**:
Build the `path: Vec<Hop>` array that represents the routing through AMM pairs.

**Three options**:

#### Option A: Use ShadeSwap GraphQL API (RECOMMENDED)
```typescript
async buildRoutingPath(fromToken: string, toToken: string): Promise<Hop[]> {
  // Query ShadeSwap GraphQL for optimal path
  const query = `
    query GetRoute($from: String!, $to: String!) {
      route(from: $from, to: $to) {
        hops {
          pair {
            address
            codeHash
          }
        }
      }
    }
  `;

  const response = await fetch('https://graph.shade.fi/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { from: fromToken, to: toToken },
    }),
  });

  const data = await response.json();
  return data.data.route.hops.map(h => ({
    addr: h.pair.address,
    code_hash: h.pair.codeHash,
  }));
}
```

#### Option B: Query Factory Contract
```typescript
async buildRoutingPath(fromToken: string, toToken: string): Promise<Hop[]> {
  // 1. Query Factory for all pairs
  const pairs = await this.client.query.compute.queryContract({
    contract_address: SHADESWAP_FACTORY.address,
    code_hash: SHADESWAP_FACTORY.code_hash,
    query: { get_pairs: {} },
  });

  // 2. Build graph of token connections
  // 3. Run path-finding algorithm (BFS/Dijkstra)
  // 4. Return optimal path as Hop[]
}
```

#### Option C: Hardcoded Common Paths
```typescript
async buildRoutingPath(fromToken: string, toToken: string): Promise<Hop[]> {
  // Hardcode common routing paths
  const COMMON_PATHS: Record<string, Record<string, Hop[]>> = {
    [SSCRT_ADDRESS]: {
      [OSMO_ADDRESS]: [
        {
          addr: 'secret1abc...', // sSCRT/SILK pair
          code_hash: '...',
        },
        {
          addr: 'secret1def...', // SILK/stOSMO pair
          code_hash: '...',
        },
        {
          addr: 'secret1ghi...', // stOSMO/OSMO pair
          code_hash: '...',
        },
      ],
    },
  };

  const key = `${fromToken}_${toToken}`;
  if (COMMON_PATHS[fromToken]?.[toToken]) {
    return COMMON_PATHS[fromToken][toToken];
  }

  throw new Error(`No known path for ${fromToken} ? ${toToken}`);
}
```

### 3. Token Code Hash Resolution

**Current issue**: Need code hash for every token

**Solution**: Create token registry with code hashes

```typescript
// apps/web/config/shadeswap.ts
export const SHADESWAP_TOKEN_CODE_HASHES: Record<string, string> = {
  'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek': 'af74387e...', // sSCRT
  'secret1zwwealwm0pcl9cul4nt6f38dsy6vzplw8lp3qg': '638a3e1d...', // OSMO
  // Add all tokens...
};

// Or query on-demand:
async getTokenCodeHash(address: string): Promise<string> {
  const response = await this.client.query.compute.contractInfo(address);
  return response.code_hash;
}
```

## ?? Step-by-Step Implementation

### Step 1: Find Router Contract Address & Code Hash

```bash
# Search in ShadeSwap frontend
cd ..\ShadeSwap-frontend
code . # Open in VS Code
# Look for: src/config/, src/constants/, src/contracts/

# Or search in terminal
grep -r "router" . --include="*.ts" --include="*.js" --include="*.json"
```

**Expected to find**:
```json
{
  "router": {
    "address": "secret1pjhdug87nxzv0esxasmeyfsucaj98pw4334wyc",
    "code_hash": "xxxx"
  }
}
```

### Step 2: Implement Path Building

**Choose Option A (GraphQL)**:

1. Test GraphQL query:
```bash
curl -X POST https://graph.shade.fi/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ pairs { token0 { symbol contract_address } token1 { symbol contract_address } contract_address } }"}'
```

2. Implement in TypeScript:
```typescript
async buildRoutingPath(from: string, to: string): Promise<Hop[]> {
  const pairsResponse = await fetch('https://graph.shade.fi/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{
        pairs {
          token0 { contract_address }
          token1 { contract_address }
          contract_address
          code_hash
        }
      }`,
    }),
  });

  const { data } = await pairsResponse.json();
  const pairs = data.pairs;

  // Build graph and find path (BFS/Dijkstra)
  const path = findShortestPath(pairs, from, to);
  
  return path.map(pairAddress => ({
    addr: pairAddress,
    code_hash: pairs.find(p => p.contract_address === pairAddress).code_hash,
  }));
}
```

### Step 3: Create Token Code Hash Registry

```typescript
// apps/web/config/shadeswap.ts
export const SHADESWAP_CONFIG = {
  router: {
    address: 'secret1pjhdug87nxzv0esxasmeyfsucaj98pw4334wyc',
    code_hash: 'FOUND_IN_STEP_1',
  },
  factory: {
    address: 'secret1???',
    code_hash: 'secret1???',
  },
  tokens: {
    'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek': {
      symbol: 'sSCRT',
      code_hash: 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e',
    },
    'secret1zwwealwm0pcl9cul4nt6f38dsy6vzplw8lp3qg': {
      symbol: 'OSMO',
      code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    },
    // ... more tokens
  },
};
```

### Step 4: Update ShadeSwapRouterAdapter

```typescript
import { SHADESWAP_CONFIG } from '@/config/shadeswap';

export class ShadeSwapRouterAdapter extends BaseDEXAdapter {
  private readonly router = SHADESWAP_CONFIG.router;
  
  private async buildTokenType(tokenAddress: string): Promise<TokenType> {
    const tokenConfig = SHADESWAP_CONFIG.tokens[tokenAddress];
    if (!tokenConfig) {
      throw new Error(`Token ${tokenAddress} not in ShadeSwap registry`);
    }

    return {
      custom_token: {
        contract_addr: tokenAddress,
        token_code_hash: tokenConfig.code_hash,
      },
    };
  }
}
```

### Step 5: Enable in LiquidityAggregator

```typescript
// apps/web/services/dex/LiquidityAggregator.ts
import { ShadeSwapRouterAdapter } from './adapters/ShadeSwapRouterAdapter';

private initializeAdapters() {
  this.adapters = [
    new SecretSwapAdapter(this.client),
    new ShadeSwapRouterAdapter(this.client), // ? Use Router adapter
  ];
}
```

### Step 6: Test

```typescript
// Test quote
const aggregator = new LiquidityAggregator();
const quote = await aggregator.getAggregatedQuote({
  inputToken: SSCRT_ADDRESS,
  outputToken: OSMO_ADDRESS,
  inputAmount: '1000000', // 1 sSCRT
});

console.log('Quote:', quote);

// Test swap (with small amount!)
const swap = await aggregator.executeSwap({
  route: quote.bestQuote.route,
  recipient: 'secret1your-address',
});

console.log('Swap:', swap);
```

## ?? Finding Contract Addresses

### Method 1: ShadeSwap Frontend Config

```bash
cd ..\ShadeSwap-frontend
find . -name "*.ts" -o -name "*.json" | xargs grep -l "router\|factory"
```

### Method 2: ShadeSwap Docs

Check: https://docs.shadeprotocol.io/shade-protocol/shadeswap/contracts

### Method 3: Secret Network Explorer

1. Go to https://www.mintscan.io/secret
2. Search for "shade" or "shadeswap"
3. Look for Router contract

### Method 4: Ask in Discord

ShadeSwap Discord: https://discord.gg/shadeprotocol

## ?? Success Criteria

- [ ] Router address and code hash found
- [ ] Routing path building works for sSCRT ? OSMO
- [ ] Quote simulation returns accurate values
- [ ] Swap execution completes successfully
- [ ] No errors in console
- [ ] User sees real ShadeSwap quotes in UI

## ?? Testing Checklist

- [ ] Test quote for sSCRT ? OSMO
- [ ] Test quote for sSCRT ? SILK
- [ ] Test quote for direct pairs
- [ ] Test quote for multihop (3+ hops)
- [ ] Test swap with small amount (0.01 SCRT)
- [ ] Compare quote with ShadeSwap UI
- [ ] Verify gas estimates are reasonable
- [ ] Check error handling

## ?? Go-Live Checklist

- [ ] All tests passing
- [ ] Quotes match ShadeSwap UI (±1%)
- [ ] Swaps execute successfully
- [ ] Gas estimates accurate
- [ ] Error messages user-friendly
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to production

## ?? Resources

- **ShadeSwap Contracts**: `..\shadeswap\contracts\`
- **ShadeSwap Frontend**: `..\ShadeSwap-frontend\`
- **ShadeSwap Docs**: https://docs.shadeprotocol.io/
- **Secret Network**: https://docs.scrt.network/
- **GraphQL**: https://graph.shade.fi/graphql

## ?? Tips

1. **Start small**: Test with 0.01 SCRT first
2. **Compare**: Always compare with ShadeSwap UI
3. **Log everything**: Console.log all steps
4. **Cache wisely**: Cache routing paths (1 hour)
5. **Error handling**: Catch all contract errors
6. **Gas buffer**: Add 20% to estimated gas

---

**Ready to implement?** Start with Step 1! ??
