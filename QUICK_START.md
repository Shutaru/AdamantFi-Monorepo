# ? AdamantFi - Quick Start Guide

**Objetivo:** Configurar e testar o multihop swap em 30 minutos!

---

## ?? **SETUP RÁPIDO (10 min)**

### **1. Verificar Requisitos**

```powershell
# Node.js >= 22.0.0
node --version

# pnpm package manager
pnpm --version

# Se não tiver pnpm:
npm install -g pnpm
```

### **2. Instalar Dependências**

```powershell
# Navegar para o projeto
cd C:\Users\shuta\source\repos\AdamantFi-Monorepo

# Instalar todas as dependências
pnpm install
```

**Tempo:** ~5 minutos

### **3. Configurar Environment**

```powershell
# Copiar configuração de exemplo
cp apps/web/.env.example apps/web/.env.local

# Verificar configuração (opcional)
cat apps/web/.env.local
```

**Configuração padrão:**
- ? Testnet: Pulsar-3
- ? Router: Configurado
- ? Multihop: Enabled

### **4. Build do Projeto**

```powershell
# Build da aplicação web
pnpm build:web

# Ou build de tudo
pnpm build
```

**Tempo:** ~2-3 minutos

### **5. Iniciar Dev Server**

```powershell
# Iniciar servidor de desenvolvimento
pnpm dev:web
```

**Output esperado:**
```
> web@0.1.0 dev
> next dev

- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

**? Setup completo!** Abrir http://localhost:3000

---

## ?? **CONECTAR KEPLR (5 min)**

### **1. Instalar Keplr**

Se ainda não tens:
- Chrome: https://chrome.google.com/webstore (procurar "Keplr")
- Seguir processo de instalação
- Criar wallet ou importar existente

### **2. Adicionar Pulsar-3 Testnet**

A app deve adicionar automaticamente, mas se precisar:

1. Abrir Keplr
2. Click no nome da chain (topo)
3. Scroll até "Pulsar-3" ou adicionar custom chain

**Chain Info:**
```json
{
  "chainId": "pulsar-3",
  "chainName": "Secret Testnet",
  "rpc": "https://pulsar.rpc.secretnodes.com",
  "rest": "https://pulsar.lcd.secretnodes.com"
}
```

### **3. Obter Test Tokens**

**Faucet:**
- URL: https://faucet.pulsar.scrttestnet.com/
- Pedir SCRT
- Esperar confirmação (~30s)

### **4. Conectar à App**

1. Abrir http://localhost:3000
2. Click "Connect Wallet" (se houver botão)
3. Aprovar conexão no Keplr
4. ? Conectado!

---

## ?? **TESTAR SWAPS (15 min)**

### **Teste 1: Verificar UI**

**Checklist:**
- [ ] Página de swap carrega
- [ ] Tokens aparecem nos dropdowns
- [ ] Input de quantidade funciona
- [ ] Estimação aparece quando digitas valor

### **Teste 2: Direct Swap** (Mais Simples)

**Cenário:**
```
PAY: 1 sSCRT
RECEIVE: ? sATOM
```

**Passos:**
1. Selecionar "sSCRT" em PAY token
2. Selecionar "sATOM" em RECEIVE token
3. Digitar "1" no amount
4. Verificar estimação aparece
5. Verificar route display mostra "Direct"
6. (OPCIONAL) Click "Swap" e confirmar

**Expected:**
- ? Estimação aparece rapidamente
- ? Route display: "sSCRT ? sATOM (Direct)"
- ? Price impact calculado
- ? TX fee mostrado
- ? Min receive calculado

### **Teste 3: Multihop Swap** (Mais Complexo)

**Cenário:**
```
PAY: 1 sATOM
RECEIVE: ? USDC.nbl
PATH: sATOM ? sSCRT ? USDC.nbl (2 hops)
```

**Passos:**
1. Selecionar "sATOM" em PAY token
2. Selecionar "USDC.nbl" em RECEIVE token
3. Digitar "1" no amount
4. Verificar estimação aparece
5. **VERIFICAR ROUTE DISPLAY:**
   - Deve mostrar: "sATOM ? sSCRT ? USDC.nbl"
   - Deve dizer "2 hops"
   - Deve mostrar "via sSCRT"

**Expected:**
- ? Estimação aparece (pode demorar ~1-2s)
- ? Route display mostra path multihop
- ? Price impact pode ser maior (2 swaps)
- ? TX fee maior (~0.06 SCRT para 2 hops)

### **Teste 4: No Liquidity** (Edge Case)

**Cenário:** Selecionar par sem liquidez

**Passos:**
1. Tentar selecionar par não listado
2. Verificar warning aparece

**Expected:**
- ? "No liquidity" ou "No path found"
- ? Swap button desativado

---

## ?? **VERIFICAR LOGS**

### **Browser Console**

Abrir DevTools (F12) ? Console

**Logs esperados:**
```
?? Finding routing path for: { from: "secret1...", to: "secret1..." }
?? Routing path result: { isDirectPath: false, totalHops: 2 }
? Using routing path: { ... }
?? Starting multihop calculation: { ... }
```

**Se houver erros:**
- ? "Router contract not properly configured" ? Verificar config
- ? "No routing path found" ? Par não suportado
- ? "Network error" ? Verificar RPC

### **Network Tab**

Verificar chamadas:
- ? Calls para RPC endpoint
- ? Query de pools
- ? Simulation queries

---

## ? **CHECKLIST DE SUCESSO**

### **Setup**
- [ ] Node.js >= 22.0.0 instalado
- [ ] pnpm instalado
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Build completo (`pnpm build:web`)
- [ ] Dev server running (`pnpm dev:web`)

### **Wallet**
- [ ] Keplr instalado
- [ ] Pulsar-3 adicionado
- [ ] Test tokens obtidos
- [ ] Wallet conectado à app

### **Funcionalidade**
- [ ] Direct swap estima corretamente
- [ ] Multihop swap estima corretamente
- [ ] Route display mostra path correto
- [ ] Price impact calculado
- [ ] TX fee correto (0.02 direct, 0.03/hop multihop)
- [ ] Warnings aparecem quando apropriado

### **Opcional: Executar Swap**
- [ ] Viewing key configurada (se necessário)
- [ ] Swap direct executou com sucesso
- [ ] Swap multihop executou com sucesso
- [ ] TX hash recebido
- [ ] Tokens transferidos

---

## ?? **TROUBLESHOOTING**

### **Problema: Build Failed**

**Erro:**
```
Error: Cannot find module 'next'
```

**Solução:**
```powershell
# Reinstalar dependências
rm -rf node_modules
pnpm install
```

### **Problema: Dev Server Não Inicia**

**Erro:**
```
Port 3000 is already in use
```

**Solução:**
```powershell
# Mudar porta
PORT=3001 pnpm dev:web

# Ou matar processo na porta 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### **Problema: Keplr Não Conecta**

**Soluções:**
1. Refresh da página
2. Desconectar e reconectar wallet
3. Verificar Keplr está unlocked
4. Verificar Pulsar-3 está selecionado

### **Problema: No Liquidity**

**Erro:**
```
?? Pool has no liquidity
```

**Causas:**
- Par não tem liquidez na testnet
- Selecionar outros pares com liquidez

### **Problema: Estimação Não Aparece**

**Checklist:**
1. Verificar console para erros
2. Verificar RPC endpoint está acessível
3. Verificar tokens selecionados são válidos
4. Verificar amount > 0

---

## ?? **PRÓXIMO PASSO**

### **Se Tudo Funcionou:** ?

Parabéns! O sistema está funcional. Próximos passos:

1. **Executar swaps reais** (com pequenas quantidades)
2. **Documentar resultados**
3. **Implementar SDK** (ver NEXT_STEPS.md)
4. **Integrar aggregator V5**

### **Se Houve Problemas:** ??

1. Documentar os erros encontrados
2. Verificar logs completos
3. Criar issues para fixes necessários
4. Consultar INTEGRATION_STATUS.md

---

## ?? **DOCUMENTAÇÃO ADICIONAL**

- **INTEGRATION_STATUS.md** - Status completo do projeto
- **NEXT_STEPS.md** - Roadmap detalhado
- **EXECUTIVE_SUMMARY.md** - Resumo executivo
- **apps/web/multihop-backup/** - Documentação técnica

---

## ?? **BOA SORTE!**

Se precisares de ajuda:
1. Verificar console logs
2. Verificar documentação em `/multihop-backup/`
3. Verificar configuração em `/config/`

**Happy coding!** ??
