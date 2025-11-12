# ShadeSwap Integration Guide

## Current Status

?? **WORKING** - Basic integration complete for quote aggregation

## What Works Now

? **Token list fetching** via `/api/shadeswap/tokens`  
? **Liquidity checking** - Verifies if ShadeSwap has pair available  
? **Quote estimation** - Returns conservative estimate (2% slippage baseline)  
? **Aggregator integration** - Shows ShadeSwap as option when AdamantFi doesn't have pair  
? **Caching** - Tokens cached for 1 minute to reduce API calls  

## What Doesn't Work Yet

? **Precise quote calculation** - Uses 2% slippage estimate instead of actual contract simulation  
? **Swap execution** - Throws error directing user to ShadeSwap UI  
? **Pool information** - ShadeSwap pool details not available via API  

## How It Works Now

When user tries to swap sSCRT ? OSMO:

```
1. LiquidityAggregator queries both adapters
   ?? SecretSwapAdapter (AdamantFi)
   ?  ?? ? No pair for sSCRT/OSMO
   ?
   ?? ShadeSwapAdapter
      ?? ? Checks /api/shadeswap/tokens
      ?? ? Finds both OSMO and sSCRT supported
      ?? ? Returns conservative estimate (~2% slippage)

2. Result: quotes.length === 1 (ShadeSwap quote available)
3. User sees: Quote from ShadeSwap with estimated output
4. User clicks Swap ? Error message with ShadeSwap URL
```

## Current Implementation

### Quote Estimation

```typescript
// Conservative estimate: 98% of input (2% slippage)
const estimatedOutput = (inputAmount * BigInt(98)) / BigInt(100);

// Price impact: Fixed 2.5% estimate
const priceImpact = 2.5;

// Fee: Assume 0.3%
const fee = (inputAmount * BigInt(30)) / BigInt(10000);
```

**Why Conservative?**

- Better to under-promise and over-deliver
- ShadeSwap routing can be complex (multi-hop)
- Actual price impact depends on liquidity depth
- User sees ShadeSwap as "available but not optimal" option

### Execution Flow

```typescript
async executeSwap(request: SwapRequest): Promise<SwapResponse> {
  throw new Error(
    'ShadeSwap swaps are not yet integrated. ' +
    'Please use https://app.shadeprotocol.io/swap to complete this trade.'
  );
}
```

**User Experience:**

1. User sees quote from ShadeSwap
2. User clicks "Swap"
3. Error modal shows with link to ShadeSwap
4. User can copy link or click to open ShadeSwap

## Next Steps for Full Integration

### Phase 1: Accurate Quotes (High Priority)

Need to query ShadeSwap Router for actual quotes:

```typescript
// Option A: Use ShadeSwap REST API (if it exists)
const response = await fetch('https://api.shadeprotocol.io/swap/quote', {
  method: 'POST',
  body: JSON.stringify({
    offer_asset: request.inputToken,
    ask_asset: request.outputToken,
    offer_amount: request.inputAmount,
  }),
});

// Option B: Query ShadeSwap Router contract directly
const quote = await this.client.query.compute.queryContract({
  contract_address: SHADESWAP_ROUTER,
  code_hash: SHADESWAP_ROUTER_CODE_HASH,
  query: {
    simulate_swap: {
      offer: {
        token: request.inputToken,
        amount: request.inputAmount,
      },
      ask: request.outputToken,
    }
  },
});
```

**Research Needed:**

- [ ] Find ShadeSwap Router contract address
- [ ] Understand query message format
- [ ] Test with small amounts on mainnet

### Phase 2: Swap Execution (Medium Priority)

Implement actual swap transaction building:

```typescript
async executeSwap(request: SwapRequest): Promise<SwapResponse> {
  const swapMsg = {
    swap: {
      offer: {
        token: request.route.inputToken,
        amount: request.route.inputAmount,
      },
      expected_return: request.route.minimumOutput,
      to: request.recipient,
    }
  };

  const tx = await this.client.tx.compute.executeContract({
    contract_address: SHADESWAP_ROUTER,
    code_hash: SHADESWAP_ROUTER_CODE_HASH,
    sender: request.recipient,
    msg: swapMsg,
  });

  return {
    success: true,
    txHash: tx.transactionHash,
  };
}
```

### Phase 3: Pool Information (Low Priority)

Query detailed pool data for better UX:

- Actual reserves
- Trading volume
- Fee tiers
- Liquidity depth

## Testing Checklist

- [x] Token list API returns ShadeSwap tokens
- [x] ShadeSwapAdapter checks if tokens are supported
- [x] Quote returns valid estimate
- [x] Aggregator includes ShadeSwap in comparison
- [ ] Quote is accurate (within 1% of actual)
- [ ] Swap execution works end-to-end
- [ ] Error handling for failed swaps
- [ ] Gas estimation is accurate

## Known Limitations

1. **Quote Accuracy**: 2% baseline may be too conservative or too optimistic
2. **No Multi-Hop Visibility**: Doesn't show if ShadeSwap routes through multiple hops
3. **No Execution**: User must go to ShadeSwap UI to complete swap
4. **Cache Invalidation**: 1-minute cache may show stale data if liquidity changes rapidly

## Workarounds

For users who want to complete OSMO swaps now:

1. **See quote in AdamantFi**: ? Now works! Shows ShadeSwap as available option
2. **Get estimate**: ? Conservative estimate shown
3. **Complete swap**: Go to https://app.shadeprotocol.io/swap
4. **Future**: Swap execution will be integrated (Phase 2)

## Resources

- ShadeSwap Docs: https://docs.shadeprotocol.io/
- ShadeSwap App: https://app.shadeprotocol.io/swap
- ShadeSwap API: Currently using GraphQL endpoint via `/api/shadeswap/tokens`
- Secret Network Docs: https://docs.scrt.network/

## Recent Changes

### 2025-01-XX

- ? Implemented basic ShadeSwapAdapter with liquidity checking
- ? Added token caching (1 minute TTL)
- ? Integrated with LiquidityAggregator
- ? Conservative quote estimation (2% slippage baseline)
- ? User can see ShadeSwap quotes in aggregator
