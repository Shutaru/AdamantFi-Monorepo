/**
 * Fetch all tokens from ShadeSwap GraphQL to build token UUID mapping
 */

import { writeFileSync } from 'fs';

const SHADESWAP_GRAPHQL_ENDPOINT = 'https://prodv1.securesecrets.org/graphql';

const TOKENS_QUERY = `
  query getTokens {
    tokens {
      id
      contractAddress
      symbol
      name
    }
  }
`;

async function fetchShadeSwapTokens() {
  try {
    console.log('?? Fetching ShadeSwap tokens...\n');

    const response = await fetch(SHADESWAP_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: TOKENS_QUERY,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error('? GraphQL errors:', JSON.stringify(errors, null, 2));
      return;
    }

    if (!data?.tokens) {
      console.error('? No tokens data received');
      return;
    }

    console.log(`? Found ${data.tokens.length} tokens\n`);
    
    // Build mapping: contract_address ? UUID
    const mapping: Record<string, string> = {};
    for (const token of data.tokens) {
      if (token.contractAddress && token.id) {
        mapping[token.contractAddress] = token.id;
      }
    }

    // Generate TypeScript file
    const tsContent = `/**
 * ShadeSwap Token UUID Mapping
 * Auto-generated from ShadeSwap GraphQL API
 * 
 * Maps Secret Network contract addresses to ShadeSwap internal UUIDs
 * Required for querying specific pools via ShadeSwap GraphQL
 */

export const SHADESWAP_TOKEN_UUID_MAP: Record<string, string> = ${JSON.stringify(mapping, null, 2)}

// Reverse mapping for convenience
export const SHADESWAP_UUID_TO_ADDRESS_MAP: Record<string, string> = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(mapping).map(([addr, uuid]) => [uuid, addr])
  ),
  null,
  2
)};
`;

    writeFileSync('apps/web/config/shadeswap-tokens.ts', tsContent);
    console.log('? Token mapping saved to: apps/web/config/shadeswap-tokens.ts\n');
    
    console.log(`?? Mapped ${Object.keys(mapping).length} tokens`);
    console.log('\n?? Sample mappings:');
    const samples = Object.entries(mapping).slice(0, 5);
    for (const [addr, uuid] of samples) {
      const token = data.tokens.find((t: any) => t.id === uuid);
      console.log(`  ${token.symbol.padEnd(15)} ${addr.substring(0, 20)}... ? ${uuid.substring(0, 8)}...`);
    }

  } catch (error) {
    console.error('? Error:', error);
  }
}

fetchShadeSwapTokens();
