const GRAPHQL = 'https://prodv1.securesecrets.org/graphql';

async function gql(query: string, variables: any = {}) {
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

async function fetchTokens() {
  const q = `query getTokens{ tokens { id symbol name contractAddress } }`;
  const d = await gql(q);
  return d.tokens || [];
}

async function fetchPools() {
  const q = `query getPools{ pools { id contractAddress token0Id token1Id token0Amount token1Amount lpFee daoFee isEnabled } }`;
  const d = await gql(q);
  return d.pools || [];
}

function fuzzy(t: any) {
  if (!t) return false;
  const s = (t.symbol || '').toLowerCase();
  const n = (t.name || '').toLowerCase();
  return s.includes('osmo') || n.includes('osmo') || s.includes('.osmo') || n.includes('osmosis') || s.includes('osmosis');
}

// calculate swap output like ShadeSwap adapter
function calcSwapOutput(pool: any, inputTokenId: string, outputTokenId: string, inputAmount: bigint): bigint | null {
  try {
    const inputIsToken0 = pool.token0Id === inputTokenId;
    const reserveIn = BigInt(inputIsToken0 ? pool.token0Amount || '0' : pool.token1Amount || '0');
    const reserveOut = BigInt(inputIsToken0 ? pool.token1Amount || '0' : pool.token0Amount || '0');
    if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) return null;
    const lpFee = parseFloat(pool.lpFee || '0.003');
    const daoFee = parseFloat(pool.daoFee || '0');
    const totalFee = lpFee + daoFee;
    const feeBps = Math.floor(totalFee * 10000);
    const amountInWithFee = (inputAmount * BigInt(10000 - feeBps)) / BigInt(10000);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    if (denominator === BigInt(0)) return null;
    const output = numerator / denominator;
    return output;
  } catch {
    return null;
  }
}

// BFS up to maxHops, return routes with output
function findRoutes(pools: any[], inputId: string, outputId: string, inputAmountStr: string, maxHops = 3) {
  const inputAmount = BigInt(inputAmountStr);
  // build adjacency: tokenId -> [{pool, neighbor}]
  const graph = new Map();
  for (const p of pools) {
    if (!graph.has(p.token0Id)) graph.set(p.token0Id, []);
    if (!graph.has(p.token1Id)) graph.set(p.token1Id, []);
    graph.get(p.token0Id).push({ pool: p, neighbor: p.token1Id });
    graph.get(p.token1Id).push({ pool: p, neighbor: p.token0Id });
  }

  const routes = [];
  const queue = [ { current: inputId, path: [], amount: inputAmount, visited: new Set([inputId]) } ];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.current === outputId && cur.path.length > 0) {
      routes.push({ path: cur.path.slice(), outputAmount: cur.amount });
      continue;
    }
    if (cur.path.length >= maxHops) continue;
    const neighbors = graph.get(cur.current) || [];
    for (const nb of neighbors) {
      if (cur.visited.has(nb.neighbor)) continue;
      const out = calcSwapOutput(nb.pool, cur.current, nb.neighbor, cur.amount);
      if (!out || out === BigInt(0)) continue;
      const newPath = cur.path.concat([{ poolAddress: nb.pool.contractAddress, from: cur.current, to: nb.neighbor }]);
      const newVisited = new Set(cur.visited);
      newVisited.add(nb.neighbor);
      queue.push({ current: nb.neighbor, path: newPath, amount: out, visited: newVisited });
    }
  }
  return routes;
}

(async () => {
  try {
    console.log('Fetching tokens...');
    const tokens = await fetchTokens();
    console.log(`tokens: ${tokens.length}`);
    console.log('Fetching pools...');
    const pools = await fetchPools();
    console.log(`pools: ${pools.length}`);

    // find candidates
    const candidates = tokens.filter(fuzzy);
    console.log(`candidates by fuzzy match: ${candidates.length}`);
    candidates.forEach((c: any) => console.log(`  id=${c.id} sym=${c.symbol} name=${c.name} contract=${c.contractAddress}`));

    // also include tokens whose symbol contains '.osmo' or name contains 'Osmosis' etc.
    const extra = tokens.filter(t => ((t.symbol||'').toLowerCase().includes('.osmo') || (t.symbol||'').toLowerCase().includes('osmos')));
    for (const e of extra) if (!candidates.find(c=>c.id===e.id)) candidates.push(e);

    // dedupe
    const uniq = Array.from(new Map(candidates.map((t:any)=>[t.id,t])).values());

    if (uniq.length === 0) {
      console.log('No direct candidates found. Will also try top tokens by pool frequency.');
      const freq = new Map();
      for (const p of pools) {
        freq.set(p.token0Id, (freq.get(p.token0Id)||0)+1);
        freq.set(p.token1Id, (freq.get(p.token1Id)||0)+1);
      }
      const top = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,40).map(x=>x[0]);
      for (const id of top) {
        const meta = tokens.find(t=>t.id===id);
        if (meta) uniq.push(meta);
      }
    }

    // set SILK UUID
    const SILK = 'e39060e0-628d-4238-9366-a4c8778fb10a';
    const inputAmount = '1000000'; // 1 token with 6 decimals

    const results = [];
    for (const cand of uniq) {
      const candId = cand.id;
      const poolsWithCand = pools.filter(p=>p.token0Id===candId || p.token1Id===candId);
      if (poolsWithCand.length === 0) continue;
      console.log(`\nTesting candidate ${candId} (${cand.symbol || cand.name}) - pools: ${poolsWithCand.length}`);
      const routes = findRoutes(pools, SILK, candId, inputAmount, 3);
      if (routes.length === 0) {
        console.log('  No route found');
        continue;
      }
      // get best route by output amount
      routes.sort((a,b)=> (BigInt(b.outputAmount) > BigInt(a.outputAmount) ? 1 : -1));
      const best = routes[0];
      console.log(`  Best output: ${best.outputAmount.toString()} (raw units)`);
      console.log(`  Hops: ${best.path.length}`);
      best.path.forEach((h:any,i:number)=> console.log(`    ${i+1}. ${h.from.substring(0,8)} -> ${h.to.substring(0,8)} via ${h.poolAddress}`));
      results.push({ candidate: cand, best });
    }

    if (results.length === 0) {
      console.log('\nNo viable routes found from SILK to any OSMO candidates.');
    } else {
      console.log('\nSummary of best routes:');
      results.sort((a,b)=> (BigInt(b.best.outputAmount) > BigInt(a.best.outputAmount) ? 1 : -1));
      results.forEach(r=>{
        console.log(`  -> ${r.candidate.symbol || r.candidate.name} (${r.candidate.id}) => output ${r.best.outputAmount.toString()} hops ${r.best.path.length}`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
