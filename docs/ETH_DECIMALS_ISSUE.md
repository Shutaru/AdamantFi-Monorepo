# ETH Display Problem - Decimals Issue

## Problem

ETH values show as **2772535445 ETH** instead of **0.0027 ETH**

## Root Cause

ETH.axl has **18 decimals**, not 6!

```
Raw value: 2772535445164669 (wei)
With 18 decimals: 0.002772535445164669 ETH ?
With 6 decimals: 2772535445.164669 ETH ? (WRONG!)
```

## Where to Fix

The issue is in the **UI display logic**, not in the swap calculation!

### File: Token Config

Check `apps/web/config/tokens.ts`:

```typescript
{
  symbol: 'ETH.axl',
  decimals: 6, // ? WRONG! Should be 18
}
```

Should be:

```typescript
{
  symbol: 'ETH.axl',
  decimals: 18, // ? CORRECT!
}
```

### Files to Check

1. **Token Display**: Components that show token amounts
2. **Token Config**: `config/tokens.ts` or `config/shadeswap.ts`
3. **Form Inputs**: Where user enters amounts

## How to Verify

1. Check ETH.axl decimals in config
2. Update to 18
3. Refresh page
4. Should show `0.0027 ETH` instead of `2772535445 ETH`

## Quick Test

```typescript
const rawAmount = '2772535445164669';
const decimals = 18;
const displayAmount = Number(rawAmount) / (10 ** decimals);
console.log(displayAmount); // 0.002772535445164669 ?
```

