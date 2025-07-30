# Base Chain Konfiguration

## Netzwerk-Details

### Base Mainnet
- **Chain ID:** 8453
- **RPC URL:** https://mainnet.base.org
- **Block Explorer:** https://basescan.org
- **Symbol:** ETH

### Base Sepolia Testnet
- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org
- **Block Explorer:** https://sepolia.basescan.org
- **Symbol:** ETH
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## Empfohlene RPC Anbieter

### 1. Public RPC (kostenlos)
```bash
# Mainnet
RPC_URL=https://mainnet.base.org

# Testnet
RPC_URL=https://sepolia.base.org
```

### 2. Alchemy (empfohlen für Produktion)
```bash
# Registrierung: https://www.alchemy.com/
RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### 3. Infura
```bash
# Registrierung: https://infura.io/
RPC_URL=https://base-mainnet.infura.io/v3/YOUR_PROJECT_ID
```

### 4. QuickNode
```bash
# Registrierung: https://www.quicknode.com/
RPC_URL=https://your-endpoint.base-mainnet.quiknode.pro/YOUR_TOKEN/
```

## Gas-Optimierungen für Base

Base bietet deutlich niedrigere Gas-Kosten als Ethereum Mainnet:

- **Typische Gas-Preise:** 0.001 - 0.01 Gwei
- **ERC-20 Transfer:** ~21,000 Gas (ca. $0.001 - $0.01)
- **Contract Interaction:** ~50,000 - 100,000 Gas

## Wallet-Setup für Base

1. **MetaMask konfigurieren:**
   - Netzwerk hinzufügen: Base Mainnet
   - Chain ID: 8453
   - RPC URL: https://mainnet.base.org

2. **ETH für Gas-Gebühren:**
   - Bridge ETH von Ethereum Mainnet über https://bridge.base.org
   - Oder kaufe ETH direkt auf Base über Coinbase

3. **Token hinzufügen:**
   - Token-Adresse: 0x69eFD833288605f320d77eB2aB99DDE62919BbC1
   - Decimals: 2

## Monitoring und Debugging

### Block Explorer
- Mainnet: https://basescan.org
- Testnet: https://sepolia.basescan.org

### Transaction Status
```bash
# Prüfen Sie Ihre Transaktionen auf BaseScan
https://basescan.org/tx/YOUR_TRANSACTION_HASH
```

### Häufige Base-spezifische Probleme

1. **"Insufficient funds"**
   - Stellen Sie sicher, dass Sie ETH auf Base haben (nicht Ethereum Mainnet)
   - Bridge ETH über https://bridge.base.org

2. **"Network mismatch"**
   - Überprüfen Sie, dass Ihr Wallet auf Base Chain eingestellt ist
   - Chain ID muss 8453 (Mainnet) oder 84532 (Testnet) sein

3. **RPC Errors**
   - Public RPC kann manchmal überlastet sein
   - Verwenden Sie Alchemy oder Infura für bessere Zuverlässigkeit
