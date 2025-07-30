# TokenTransfer

Eine Node.js-Anwendung, die automatisch ERC-20 Tokens über Webhooks versendet.

## Features

- 🔗 Webhook-Endpunkt für automatische Token-Transfers
- 🔐 Sichere Private Key Verwaltung über Umgebungsvariablen
- 💰 ERC-20 Token Support (konfiguriert für Token mit 2 Dezimalstellen)
- ⛽ Automatische Gas-Schätzung und -Optimierung
- 📊 Balance-Check und Health-Check Endpunkte
- 🛡️ Input-Validierung und Fehlerbehandlung

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Kopieren Sie `.env.example` zu `.env` und konfigurieren Sie die Werte:

```bash
cp .env.example .env
```

Bearbeiten Sie `.env` und setzen Sie:
- `RPC_URL`: Ihre Ethereum RPC URL (z.B. Alchemy, Infura)
- `PRIVATE_KEY`: Der private Key Ihres Wallets (ohne 0x Präfix)
- `PORT`: Server Port (Standard: 3000)

### 3. Anwendung starten

```bash
# Produktions-Modus
npm start

# Entwicklungs-Modus (mit Auto-Reload)
npm run dev
```

## API Endpunkte

### POST /transfer-token

Sendet Tokens an eine angegebene Wallet-Adresse.

**Request Body:**
```json
{
  "amount": "10.5",
  "wallet": "0x1234567890123456789012345678901234567890"
}
```

**Response (Erfolg):**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "amount": "10.5",
  "recipient": "0x1234567890123456789012345678901234567890",
  "gasUsed": "21000",
  "blockNumber": "12345678"
}
```

**Response (Fehler):**
```json
{
  "success": false,
  "error": "Fehlermeldung"
}
```

### GET /balance

Zeigt das Token-Guthaben des Sender-Wallets an.

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "balance": 1000.50,
  "rawBalance": "100050"
}
```

### GET /health

Health-Check Endpunkt für Monitoring.

**Response:**
```json
{
  "success": true,
  "status": "Server läuft",
  "timestamp": "2025-07-30T10:00:00.000Z",
  "tokenAddress": "0x69eFD833288605f320d77eB2aB99DDE62919BbC1",
  "senderAddress": "0x..."
}
```

## Token-Konfiguration

Die Anwendung ist für folgenden Token konfiguriert:
- **Adresse:** `0x69eFD833288605f320d77eB2aB99DDE62919BbC1`
- **Dezimalstellen:** 2

## Sicherheitshinweise

⚠️ **Wichtige Sicherheitsmaßnahmen:**

1. **Private Key Sicherheit:** Niemals den Private Key in den Code committen oder öffentlich teilen
2. **HTTPS verwenden:** In Produktion nur über HTTPS betreiben
3. **Webhook-Authentifizierung:** Implementieren Sie Webhook-Signatur-Verifikation für zusätzliche Sicherheit
4. **Rate Limiting:** Implementieren Sie Rate Limiting für den Webhook-Endpunkt
5. **Monitoring:** Überwachen Sie Transaktionen und Wallet-Balance regelmäßig

## Entwicklung

### Struktur
```
├── index.js          # Haupt-Anwendung
├── package.json      # Dependencies und Scripts
├── .env.example      # Beispiel-Umgebungsvariablen
├── .gitignore        # Git-Ignore-Regeln
└── README.md         # Diese Dokumentation
```

### Debugging

Logs werden in der Konsole ausgegeben. Bei Fehlern wird zusätzlich der vollständige Error-Stack geloggt.

## Deployment

1. Stellen Sie sicher, dass alle Umgebungsvariablen korrekt gesetzt sind
2. Verwenden Sie einen Process Manager wie PM2 für Produktions-Deployments
3. Konfigurieren Sie einen Reverse Proxy (nginx) für HTTPS
4. Implementieren Sie Monitoring und Alerting

## Lizenz

MIT