# ShadeSwap Integration - Final Status

## Status Atual: FUNCIONANDO (Modo Estimativa)

### O Que Funciona

- ShadeSwap adapter está integrado
- Retorna quotes (estimativas conservadoras)
- Não quebra a aplicação
- Fallback funciona corretamente

### Por Que Estamos em Modo Estimativa

O GraphQL do ShadeSwap está **offline** ou **inacessível**:

```
request to https://graph.shade.fi/graphql failed
reason: getaddrinfo ENOTFOUND graph.shade.fi
```

Isso significa:
- Domínio não resolve DNS
- Servidor offline
- Bloqueado por firewall/rede

### Solução Atual

Criamos uma versão **simplificada** do adapter que:

1. Tenta usar `/api/shadeswap/tokens` (também falha mas gracefully)
2. Retorna estimativa conservadora de 98% do input
3. Não quebra o app se ShadeSwap estiver offline

### Quote Atual

```typescript
// Input: 49.769808 sSCRT
// Estimate: 48.774 OSMO (98% do input)
// Real (via ShadeSwap UI): 95.643 OSMO

// Diferença: ~50% erro!
```

**Por quê tão errado?**
- Estimativa assume mesm

o valor entre tokens
- Ignora diferença de preço real
- sSCRT vale ~$0.21, OSMO vale ~$0.11
- Ratio real é ~1:2, não 1:1

## Próximos Passos

### Opção 1: Esperar GraphQL Voltar

Quando `graph.shade.fi` voltar online:
- Adapter já está pronto
- Só descomentar código GraphQL
- Quotes serão precisos

### Opção 2: Usar Outro Endpoint

ShadeSwap pode ter outro endpoint:
- Verificar docs: https://docs.shadeprotocol.io
- Perguntar no Discord
- Verificar frontend deles

### Opção 3: Desabilitar ShadeSwap

Se não precisar por enquanto:

```typescript
// LiquidityAggregator.ts
private initializeAdapters() {
  this.adapters = [
    new SecretSwapAdapter(this.client),
    // new ShadeSwapGraphQLAdapter(this.client), // Disabled
  ];
}
```

### Opção 4: Hardcode Ratios Conhecidos

Adicionar ratios conhecidos de preço:

```typescript
const KNOWN_PRICE_RATIOS: Record<string, Record<string, number>> = {
  'sSCRT_OSMO': 2.0, // 1 sSCRT = 2 OSMO (aproximado)
  'sSCRT_SILK': 1.0,
  // etc...
};

// Usar no cálculo:
const ratio = KNOWN_PRICE_RATIOS[`${from}_${to}`] || 1.0;
const estimatedOutput = inputAmount * BigInt(ratio * 98) / BigInt(100);
```

## Arquivos Finais

```
apps/web/
??? pages/api/shadeswap/
?   ??? graphql.ts                 Proxy API (pronto mas GraphQL offline)
?   ??? tokens.ts                  Token list (também offline)
??? services/dex/adapters/
?   ??? ShadeSwapGraphQLAdapter.ts Adapter simplificado (estimativas)
??? config/
?   ??? shadeswap.ts               Config com tokens conhecidos
??? docs/
    ??? (vários documentos)        Documentação completa
```

## Resumo

**Estado**: FUNCIONANDO mas com estimativas imprecisas

**Causa**: GraphQL do ShadeSwap offline

**Impacto**: Quotes ShadeSwap mostram ~50% erro

**Solução Temporária**: Estimativas conservadoras

**Solução Permanente**: Aguardar GraphQL voltar ou encontrar endpoint alternativo

## Recomendação

**Para produção AGORA**: Desabilitar ShadeSwap adapter (Opção 3)

**Para desenvolvimento**: Manter habilitado mas com aviso ao usuário

**Para futuro**: Re-habilitar quando GraphQL voltar online

---

**Status**: PARCIALMENTE FUNCIONAL  
**Data**: 2025-01-XX  
**Blocker**: ShadeSwap GraphQL offline
