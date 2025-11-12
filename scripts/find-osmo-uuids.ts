const GRAPHQL = 'https://prodv1.securesecrets.org/graphql';

async function queryGraphQL(query: string, variables: any = {}) {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function fetchAllTokens(limit = 500) {
  const q = `query getTokens($limit:Int,$offset:Int){ tokens(limit:$limit, start_after:$offset){ id symbol name contractAddress } }`;
  // Note: some GraphQL variants may not support start_after; try single fetch first
  const data = await queryGraphQL(q, { limit, offset: 0 }).catch(async () => {
    // fallback: request without pagination
    const q2 = `query getTokens{ tokens { id symbol name contractAddress } }`;
    const d2 = await queryGraphQL(q2);
    return d2;
  });

  // data.tokens may be present
  return data.tokens || [];
}

async function fetchAllPools() {
  const q = `query getPools{ pools { id contractAddress token0Id token1Id token0Amount token1Amount isEnabled } }`;
  const data = await queryGraphQL(q);
  return data.pools || [];
}

function fuzzyMatchOsmo(t: any) {
  if (!t) return false;
  const parts = [t.symbol || '', t.name || ''].map((s: string) => s.toLowerCase());
  return parts.some((s: string) => s.includes('osmo') || s.includes('osm') || s.includes('osmos'));
}

(async () => {
  try {
    console.log('?? Fetching tokens from ShadeSwap GraphQL...');
    const tokens = await fetchAllTokens();
    console.log(`  tokens fetched: ${tokens.length}`);

    console.log('?? Fetching pools from ShadeSwap GraphQL...');
    const pools = await fetchAllPools();
    console.log(`  pools fetched: ${pools.length}`);

    // Build token map by id
    const tokenById = new Map<string, any>();
    for (const t of tokens) tokenById.set(t.id, t);

    // Find token candidates by fuzzy matching
    const candidates = tokens.filter(fuzzyMatchOsmo);

    console.log(`\n?? Tokens with symbol/name fuzzy-matching "osmo"/"osm": ${candidates.length}`);
    for (const t of candidates) {
      // count pools containing this token id
      const count = pools.filter(p => p.token0Id === t.id || p.token1Id === t.id).length;
      console.log(`  - id=${t.id} symbol=${t.symbol || 'N/A'} name=${t.name || 'N/A'} contract=${t.contractAddress || 'N/A'} pools=${count}`);
    }

    // Also try to detect via pools by inspecting token ids that appear many times and checking their token metadata
    console.log('\n?? Top tokens by pool appearance (top 20):');
    const freq = new Map<string, number>();
    for (const p of pools) {
      freq.set(p.token0Id, (freq.get(p.token0Id) || 0) + 1);
      freq.set(p.token1Id, (freq.get(p.token1Id) || 0) + 1);
    }
    const top = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 50);

    for (const [id, cnt] of top) {
      const meta = tokenById.get(id) || { symbol: 'N/A', name: 'N/A', contractAddress: 'N/A' };
      console.log(`  - ${id} | pools=${cnt} | symbol=${meta.symbol || 'N/A'} | name=${meta.name || 'N/A'} | contract=${meta.contractAddress || 'N/A'}`);
    }

    // If there were no direct fuzzy matches, display tokens whose id might be OSMO by manual heuristics
    if (candidates.length === 0) {
      console.log('\n?? No direct fuzzy matches found. Showing tokens with "osm" substring in symbol/name (fuzzy):');
      const fuzzy = tokens.filter(t => {
        const s = (t.symbol || '').toLowerCase();
        const n = (t.name || '').toLowerCase();
        return s.includes('osm') || n.includes('osm');
      });
      for (const t of fuzzy) {
        const count = pools.filter(p => p.token0Id === t.id || p.token1Id === t.id).length;
        console.log(`  - id=${t.id} symbol=${t.symbol} name=${t.name} contract=${t.contractAddress} pools=${count}`);
      }
    }

    console.log('\n? Done. If you see candidate UUID(s) above, pass them and I will search pools and attempt routing tests.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
