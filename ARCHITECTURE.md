# 🏗️ AdamantFi - Architecture Overview

**Visual guide to the system architecture**

---

## 📊 **HIGH-LEVEL ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Keplr)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js/React)                  │
│ ┌─────────────┐  ┌─────────────┐  ┌──────────────┐          │
│ │  SwapForm   │─▶│ TokenInput  │  │ RouteDisplay │          │
│ └─────────────┘  └─────────────┘  └──────────────┘          │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │         useSwapFormLean (Main Hook)                 │     │
│ │  • Token selection                                  │     │
│ │  • Amount input                                     │     │
│ │  • Estimation triggering                            │     │
│ │  • Swap execution                                   │     │
│ └─────────────────────────────────────────────────────┘     │
└──────────────┬───────────────────────┬──────────────────────┘
               │                       │
               ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │   ROUTING        │    │   CALCULATION    │
    │  (routing.ts)    │    │ (calculation.ts) │
    └──────────────────┘    └──────────────────┘
               │                       │
               └───────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │   EXECUTION          │
                │  (execution.ts)      │
                └──────────┬───────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              SMART CONTRACTS (Secret Network)               │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│ │   Router   │  │   Pairs    │  │ Aggregator │              │
│ │ (deployed) │  │ (5 pools)  │  │  (future)  │              │
│ └────────────┘  └────────────┘  └────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **SWAP FLOW - DETAILED**

### **Direct Swap Flow:**

```
User Input (1 sSCRT → ? sATOM)
        │
        ▼
┌──────────────────────┐
│ 1. findMultihopPath  │
│    Returns:          │
│    {                 │
│      isDirectPath: true
│      hops: [         │
│        {             │
│          fromToken: sSCRT
│          toToken: sATOM
│          pairContract: secret1nfx...
│        }             │
│      ]               │
│    }                 │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 2. calculateOutput   │
│    • Query pool data │
│    • Calculate AMM   │
│    • Return output   │
│    Result: 0.95 sATOM│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 3. executeSwap       │
│    • Format message  │
│    • Send to pair    │
│    • Direct swap     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   Pair Contract      │
│   (secret1nfx...)    │
│   Executes swap      │
└──────┬───────────────┘
       │
       ▼
    Result
```

### **Multihop Swap Flow:**

```
User Input (1 sATOM → ? USDC.nbl)
        │
        ▼
┌──────────────────────┐
│ 1. findMultihopPath  │
│    Returns:          │
│    {                 │
│      isDirectPath: false
│      totalHops: 2    │
│      hops: [         │
│        {             │
│          fromToken: sATOM
│          toToken: sSCRT
│          pairContract: secret1nfx...
│        },            │
│        {             │
│          fromToken: sSCRT
│          toToken: USDC.nbl
│          pairContract: secret1avs...
│        }             │
│      ]               │
│    }                 │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 2. calculateOutput   │
│    HOP 1:            │
│    • sATOM→sSCRT     │
│    • Output: 10 sSCRT│
│    HOP 2:            │
│    • sSCRT→USDC.nbl  │
│    • Output: 8 USDC  │
│    Total: 8 USDC     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 3. executeMultihop   │
│    • Build Route msg │
│    • Send to router  │
│    {                 │
│      hops: [...],    │
│      expected_return,│
│      to: user_addr   │
│    }                 │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   Router Contract    │
│   (secret1ysg...)    │
│                      │
│   Hop 1: sATOM→sSCRT │
│   Hop 2: sSCRT→USDC  │
│                      │
│   Atomic execution   │
└──────┬───────────────┘
       │
       ▼
    Result (8 USDC)
```

---

## 📦 **COMPONENT ARCHITECTURE**

### **Frontend Layers:**

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ SwapForm   │  │TokenInput  │  │RouteDisplay│         │
│  └────────────┘  └────────────┘  └────────────┘         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC                       │
│  ┌──────────────────────────────────────────┐            │
│  │        useSwapFormLean (Hook)            │            │
│  │  • State management                      │            │
│  │  • Estimation triggering                 │            │
│  │  • Swap execution orchestration          │            │
│  └──────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ routing  │  │calculation│ │execution │               │
│  │  .ts     │  │   .ts     │ │  .ts     │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Config   │  │  Store   │  │SecretJS  │               │
│  │ (tokens) │  │(swapStore│  │ Client   │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

### **State Management:**

```
┌─────────────────────────────────────────────────┐
│              Global State (Zustand)              │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ swapStore  │  │ tokenStore │  │ txStore   │  │
│  │            │  │            │  │           │  │
│  │ • inputs   │  │ • balances │  │ • pending │  │
│  │ • settings │  │ • prices   │  │ • result  │  │
│  └────────────┘  └────────────┘  └───────────┘  │
└─────────────────────────────────────────────────┘
            │                │                │
            ▼                ▼                ▼
      ┌─────────┐      ┌─────────┐      ┌─────────┐
      │  Forms  │      │ Displays│      │ Modals  │
      └─────────┘      └─────────┘      └─────────┘
```

---

## 🔗 **CONTRACT INTERACTION**

### **Router Contract Messages:**

```
┌─────────────────────────────────────────────────┐
│          Router Contract Interface               │
│  ┌─────────────────────────────────────────┐    │
│  │  HandleMsg::Receive {                   │    │
│  │    from: user_address,                  │    │
│  │    msg: Some(route_binary),             │    │
│  │    amount: input_amount                 │    │
│  │  }                                       │    │
│  │                                          │    │
│  │  Route {                                 │    │
│  │    hops: VecDeque<Hop> [                │    │
│  │      {                                   │    │
│  │        from_token: Snip20(...),         │    │
│  │        pair_address: "secret1...",      │    │
│  │        pair_code_hash: "..."            │    │
│  │      },                                  │    │
│  │      ...                                 │    │
│  │    ],                                    │    │
│  │    expected_return: Some(min_amount),   │    │
│  │    to: user_address                     │    │
│  │  }                                       │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### **Pair Contract Messages:**

```
┌─────────────────────────────────────────────────┐
│           Pair Contract Interface                │
│  ┌─────────────────────────────────────────┐    │
│  │  Cw20HookMsg::Swap {                    │    │
│  │    expected_return: Option<Uint128>,    │    │
│  │    belief_price: Option<Decimal>,       │    │
│  │    max_spread: Option<Decimal>,         │    │
│  │    to: Option<HumanAddr>                │    │
│  │  }                                       │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 🔢 **DATA FLOW**

### **Estimation Flow:**

```
User types "1" in amount input
        │
        ▼
    Debounce (300ms)
        │
        ▼
┌──────────────────┐
│  Capture values  │
│  • amount = "1"  │
│  • payToken      │
│  • receiveToken  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ findMultihopPath │
│  (routing.ts)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│calculateMultihop │
│ (calculation.ts) │
│                  │
│  For each hop:   │
│  1. getPoolData  │
│  2. calculateAMM │
│  3. accumulate   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Update State    │
│  • estimatedOut  │
│  • priceImpact   │
│  • txFee         │
│  • minReceive    │
│  • swapPath      │
└────────┬─────────┘
         │
         ▼
    UI Updates
```

### **Execution Flow:**

```
User clicks "Swap"
        │
        ▼
┌──────────────────┐
│   Validations    │
│  • Keplr connected
│  • Path exists   │
│  • Config valid  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│executeMultihopSwap
│  (execution.ts)  │
│                  │
│  If direct:      │
│  └─▶ executeDirect
│                  │
│  If multihop:    │
│  └─▶ executeRouter
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Format Message  │
│  • Convert types │
│  • Build Route   │
│  • Add slippage  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ SecretJS Client  │
│  tx.snip20.send  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Keplr Approval   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│Contract Execution│
└────────┬─────────┘
         │
         ▼
    TX Result
```

---

## 🗂️ **FILE ORGANIZATION**

```
apps/web/
│
├── components/
│   └── app/
│       └── Pages/
│           └── Swap/
│               ├── SwapForm/
│               │   └── SwapForm.tsx        # Main form
│               └── RouteDisplay.tsx        # Route visualization
│
├── hooks/
│   └── useSwapFormLean.ts                 # Main swap logic
│
├── utils/
│   └── swap/
│       ├── routing.ts                      # Path finding
│       ├── multihopCalculation.ts          # Output estimation
│       ├── multihopExecution.ts            # Swap execution
│       └── poolEstimation.ts               # Pool queries
│
├── config/
│   ├── tokens.ts                           # Token list & config
│   └── fees.ts                             # Gas & fees
│
├── store/
│   ├── swapStore.ts                        # Swap state
│   ├── tokenStore.ts                       # Token balances
│   └── txStore.ts                          # Transaction state
│
└── types/
    └── index.ts                            # TypeScript types
```

---

## 🔄 **ROUTING ALGORITHM**

### **Path Finding Logic:**

```
function findMultihopPath(fromToken, toToken):
    
    // Step 1: Check direct path
    directPair = LIQUIDITY_PAIRS.find(
        pair => (pair.token0 === fromToken && pair.token1 === toToken) ||
                (pair.token1 === fromToken && pair.token0 === toToken)
    )
    
    if directPair exists:
        return {
            isDirectPath: true,
            hops: [directHop],
            totalHops: 1
        }
    
    // Step 2: Check multihop via sSCRT
    if fromToken === "sSCRT" OR toToken === "sSCRT":
        return null  // Can't route via sSCRT if already using it
    
    // Step 3: Find path via sSCRT
    pairFromToSSCRT = find pair (fromToken ↔ sSCRT)
    pairSSCRTToTo = find pair (sSCRT ↔ toToken)
    
    if both pairs exist:
        return {
            isDirectPath: false,
            hops: [
                { fromToken → sSCRT, pair: pairFromToSSCRT },
                { sSCRT → toToken, pair: pairSSCRTToTo }
            ],
            totalHops: 2
        }
    
    return null  // No path found
```

---

## 💰 **FEE CALCULATION**

```
Fee Structure:

Direct Swap:
  Base TX Fee:     0.02 SCRT
  LP Fee:          0.5% of amount  (kept in pool)
  Gas Used:        ~300,000
  Total Cost:      ~0.02 SCRT + LP fees

Multihop Swap (2 hops):
  Base TX Fee:     0.03 SCRT per hop = 0.06 SCRT
  LP Fee Hop 1:    0.5% of amount
  LP Fee Hop 2:    0.5% of intermediate amount
  Gas Used:        ~700,000 (500k base + 200k per hop)
  Total Cost:      ~0.06 SCRT + LP fees (compounded)

Gas Limits:
  DIRECT_SWAP:          300,000
  MULTIHOP_BASE:        500,000
  MULTIHOP_PER_HOP:     200,000
  MAX_MULTIHOP:       1,500,000
```

---

## 🎯 **KEY DESIGN DECISIONS**

### **1. sSCRT as Single Intermediate**

**Why:**
- Highest liquidity on Secret Network
- Most pairs available
- Simplifies routing algorithm
- Proven to work

**Trade-off:**
- Limits routing options
- Misses potentially better paths
- Future: support multiple intermediates

### **2. Frontend Calculation**

**Why:**
- Instant feedback to user
- No contract calls for estimation
- Better UX

**Trade-off:**
- Less accurate than contract simulation
- Needs to mirror contract math
- Future: optional contract simulation

### **3. Router vs Direct**

**Why:**
- Router enables multihop atomic swaps
- Fallback to direct for single hop
- Feature flag for safety

**Trade-off:**
- Extra gas for router overhead
- More complex error handling
- Future: aggregator for better routing

### **4. Debounced Estimation**

**Why:**
- Prevents excessive calculations
- Better performance
- Cleaner UX

**Trade-off:**
- 300ms delay before estimation
- Race conditions need handling
- Future: optimize debounce time

---

## 🔮 **FUTURE ARCHITECTURE**

### **With Aggregator V5:**

```
User Input
    │
    ▼
Routing Engine
    │
    ├─▶ Router Contract (current)
    │
    └─▶ Aggregator V5 (future)
        │
        ├─▶ Find multiple paths
        ├─▶ Compare gas & slippage
        ├─▶ Select optimal route
        └─▶ Execute best path
            │
            ▼
        Result
```

### **Enhanced Routing:**

```
findBestRoute(fromToken, toToken):
    
    paths = [
        findDirectPath(),
        findMultihopViaSSCRT(),
        findMultihopViaOtherTokens(),
        findMultiDEXPath()
    ]
    
    for each path:
        calculate:
            • output amount
            • price impact
            • gas cost
            • total cost
    
    return path with best net output
```

---

## 📚 **REFERENCE**

### **Key Constants:**

```typescript
// config/tokens.ts
MULTIHOP_ENABLED = true
ROUTER.contract_address = "secret1ysgg..."
ROUTER.code_hash = "63ba73f..."

// config/fees.ts
DIRECT_SWAP_FEE = 0.02
MULTIHOP_SWAP_FEE_PER_HOP = 0.03
GAS_LIMITS.DIRECT_SWAP = 300000
GAS_LIMITS.MULTIHOP_BASE = 500000
```

### **Type Definitions:**

```typescript
// MultihopPath
interface MultihopPath {
  fromToken: string;
  toToken: string;
  hops: SwapHop[];
  totalHops: number;
  isDirectPath: boolean;
}

// SwapHop
interface SwapHop {
  fromToken: string;
  toToken: string;
  pairContract: string;
  pairSymbol: string;
}

// RouterHop (contract format)
interface RouterHop {
  from_token: RouterToken;
  pair_address: string;
  pair_code_hash: string;
}
```

---

**For implementation details:** See source code in `apps/web/utils/swap/`  
**For contract details:** See `contracts/secretswap/` and `contracts/aggregator/`
