/**
 * Test ShadeSwap Routing with Contract Addresses
 * 
 * This script verifies that:
 * 1. Factory query returns pools with contract addresses
 * 2. Graph is built correctly with addresses
 * 3. DFS finds paths between tokens
 */

import { SecretNetworkClient } from 'secretjs';
import { ShadeSwapRouterAdapter } from '../apps/web/services/dex/adapters/ShadeSwapRouterAdapter';

// Test tokens (using REAL contract addresses)
const TOKENS = {
  SILK: {
    symbol: 'SILK',
    contractAddress: 'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd',
    decimals: 6,
  },
  sSCRT: {
    symbol: 'sSCRT',
    contractAddress: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek',
    decimals: 6,
  },
  OSMO: {
    symbol: 'OSMO',
    contractAddress: 'secret1zwwealwm0pcl9cul4nt6f38dsy6vzplw8lp3qg',
    decimals: 6,
  },
  USDC: {
    symbol: 'USDC',
    contractAddress: 'secret1h6z05y90gwm4sqxzhz4pkyp36cna9xtp7q0urv',
    decimals: 6,
  },
};

async function testRouting() {
  console.log('?? Testing ShadeSwap Routing with Contract Addresses\n');

  // Initialize client
  const client = new SecretNetworkClient({
    url: 'https://lcd.mainnet.secretsaturn.net',
    chainId: 'secret-4',
  });

  const router = new ShadeSwapRouterAdapter(client);

  // Test cases
  const tests = [
    { from: TOKENS.SILK, to: TOKENS.OSMO, amount: '1000000' },
    { from: TOKENS.SILK, to: TOKENS.USDC, amount: '1000000' },
    { from: TOKENS.sSCRT, to: TOKENS.OSMO, amount: '1000000' },
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`?? Test: ${test.from.symbol} ? ${test.to.symbol}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const quote = await router.getQuote({
        inputToken: test.from as any,
        outputToken: test.to as any,
        inputAmount: test.amount,
      });

      console.log('\n? SUCCESS!');
      console.log(`   Input: ${test.amount} ${test.from.symbol}`);
      console.log(`   Output: ${quote.outputAmount} ${test.to.symbol}`);
      console.log(`   Route: ${quote.route}`);
      console.log(`   Path length: ${quote.path.length} hop(s)`);
      
    } catch (error: any) {
      console.error('\n? FAILED!');
      console.error(`   Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('?? Testing complete!');
  console.log('='.repeat(60));
}

// Run tests
testRouting().catch(console.error);
