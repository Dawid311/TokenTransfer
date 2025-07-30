# Dual-Transaction Feature

## Übersicht

Die Anwendung führt jetzt automatisch **zwei Transaktionen** für jeden Webhook-Aufruf durch:

1. **Token-Transfer**: Sendet die angegebene Anzahl von Tokens
2. **ETH-Transfer**: Sendet automatisch 0.000001 ETH an dieselbe Adresse

## Warum zwei Transaktionen?

- **Token-Aktivierung**: Kleine ETH-Beträge können dazu beitragen, Wallets zu "aktivieren"
- **Gas-Bereitstellung**: Empfänger erhält einen kleinen ETH-Betrag für zukünftige Transaktionen
- **Benachrichtigung**: ETH-Transfer kann als Benachrichtigung dienen
- **Wallet-Sichtbarkeit**: Beide Transaktionen erscheinen in der Wallet-Historie

## Technische Details

### Gas-Kosten auf Base Chain
- **Token-Transfer**: ~50,000 Gas (≈ $0.001)
- **ETH-Transfer**: ~21,000 Gas (≈ $0.0005)
- **Gesamt**: ~71,000 Gas (≈ $0.0015)

### Ablauf
1. Token-Transaktion wird vorbereitet und gesendet
2. Nach erfolgreichem Token-Transfer
3. ETH-Transaktion wird vorbereitet und gesendet
4. Beide Transaction Hashes werden zurückgegeben

### Fehlerbehandlung
- Falls Token-Transfer fehlschlägt: Kein ETH-Transfer
- Falls ETH-Transfer fehlschlägt: Token-Transfer bleibt erfolgreich
- Beide Transaktionen haben separate Gas-Schätzungen

## Beispiel-Response

```json
{
  "success": true,
  "tokenTransaction": {
    "transactionHash": "0xa1b2c3d4e5f6...",
    "amount": "5",
    "recipient": "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF",
    "gasUsed": "52341",
    "blockNumber": "12345678"
  },
  "ethTransaction": {
    "transactionHash": "0xf6e5d4c3b2a1...",
    "amount": "0.000001",
    "recipient": "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF",
    "gasUsed": "21000",
    "blockNumber": "12345679"
  }
}
```

## Monitoring

### BaseScan Links
Beide Transaktionen können auf BaseScan verfolgt werden:

- **Token-Transfer**: https://basescan.org/tx/TOKEN_TRANSACTION_HASH
- **ETH-Transfer**: https://basescan.org/tx/ETH_TRANSACTION_HASH

### Wallet-Ansicht
Im Empfänger-Wallet erscheinen:
1. Eingehende Tokens (ERC-20)
2. Eingehende ETH (0.000001 ETH)

## Konfiguration

Der ETH-Betrag ist fest auf 0.000001 ETH eingestellt. Um ihn zu ändern, bearbeiten Sie in `index.js`:

```javascript
// Aktuell: 0.000001 ETH
const ethAmount = web3.utils.toWei('0.000001', 'ether');

// Für anderen Betrag, z.B. 0.000005 ETH:
const ethAmount = web3.utils.toWei('0.000005', 'ether');
```
