# Base Chain Quick Start Beispiele

## 1. .env Konfiguration für Base Mainnet

```bash
# Base Mainnet (empfohlen für Produktion)
RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_private_key_without_0x_prefix
TOKEN_CONTRACT_ADDRESS=0x69eFD833288605f320d77eB2aB99DDE62919BbC1
PORT=3000
GAS_LIMIT=100000
```

## 2. .env Konfiguration für Base Testnet

```bash
# Base Sepolia Testnet (für Testing)
RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_without_0x_prefix
TOKEN_CONTRACT_ADDRESS=0x69eFD833288605f320d77eB2aB99DDE62919BbC1
PORT=3000
GAS_LIMIT=100000
```

## 3. Anwendung starten

```bash
# 1. Dependencies installieren
npm install

# 2. Umgebung konfigurieren
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Werten

# 3. Setup teste
node test-setup.js

# 4. Server starten
npm start
```

## 4. Webhook Testing auf Base

```bash
# Gesundheitsprüfung
curl https://token-transfer-ashen.vercel.app/health

# Token Balance prüfen
curl https://token-transfer-ashen.vercel.app/balance

# Token senden (5 Tokens an spezifische Adresse)
curl -X POST https://token-transfer-ashen.vercel.app/transfer-token \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "5",
    "wallet": "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF"
  }'
```

## 5. Erwartete Antworten

### Erfolgreiche Transaktion (mit ETH-Bonus):
```json
{
  "success": true,
  "tokenTransaction": {
    "transactionHash": "0x1234567890abcdef...",
    "amount": "5",
    "recipient": "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF",
    "gasUsed": "52341",
    "blockNumber": "12345678"
  },
  "ethTransaction": {
    "transactionHash": "0xabcdef1234567890...",
    "amount": "0.000001",
    "recipient": "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF",
    "gasUsed": "21000",
    "blockNumber": "12345679"
  }
}
```

### Balance-Antwort:
```json
{
  "success": true,
  "address": "0xYourWalletAddress...",
  "balance": 1000.50,
  "rawBalance": "100050"
}
```

## 6. Transaktions-Monitoring

Überprüfen Sie Ihre Transaktionen auf BaseScan:

- **Mainnet:** https://basescan.org/tx/YOUR_TRANSACTION_HASH
- **Testnet:** https://sepolia.basescan.org/tx/YOUR_TRANSACTION_HASH

## 7. Häufige Base-spezifische Kommandos

```bash
# Gas-Preise auf Base prüfen
curl -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'

# Aktuelle Block-Nummer
curl -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Chain ID prüfen (sollte 8453 für Mainnet sein)
curl -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

## 8. ETH auf Base Chain bekommen

### Option 1: Bridge von Ethereum
1. Gehen Sie zu https://bridge.base.org
2. Verbinden Sie Ihr Wallet
3. Bridge ETH von Ethereum Mainnet zu Base

### Option 2: Direkt kaufen
1. Verwenden Sie Coinbase
2. Kaufen Sie ETH direkt auf Base
3. Übertragen Sie zu Ihrem Wallet

### Option 3: Testnet Faucet
Für Base Sepolia Testnet:
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
