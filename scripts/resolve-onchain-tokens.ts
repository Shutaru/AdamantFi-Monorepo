import { SecretNetworkClient } from 'secretjs';
import { ShadeSwapGraphQLAdapter } from '../apps/web/services/dex/adapters/ShadeSwapGraphQLAdapter';

async function main() {
  const client = new SecretNetworkClient({ url: 'https://rpc.ankr.com/http/scrt_cosmos', chainId: 'secret-4' });
  const adapter = new ShadeSwapGraphQLAdapter(client as any);

  console.log('Running on-chain resolver for ShadeSwap pools...');
  const mapping = await adapter.resolveTokensOnchain();

  console.log('\nResolved mapping (UUID -> contract / symbol / decimals):');
  for (const [uuid, info] of mapping.entries()) {
    console.log(`- ${uuid} -> ${info.contractAddress || 'N/A'} | ${info.symbol || info.name || 'N/A'} | decimals=${info.decimals ?? 'N/A'}`);
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
