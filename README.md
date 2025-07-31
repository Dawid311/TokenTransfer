# TokenTransfer

Eine Node.js-Anwendung, die automatisch ERC-20 Tokens über Webhooks auf der Base Chain versendet.

## Features

- 🔗 Webhook-Endpunkt für automatische Token-Transfers
- ⛓️ Base Chain Integration (Coinbase's Layer 2)
- 🔐 Sichere Private Key Verwaltung über Umgebungsvariablen
- 💰 ERC-20 Token Support (konfiguriert für Token mit 2 Dezimalstellen)
- ⛽ Automatische Gas-Schätzung und -Optimierung (Base-optimiert)
- 📊 Balance-Check und Health-Check Endpunkte
- 🛡️ Input-Validierung und Fehlerbehandlung
- 📝 Google Sheets Integration für Transaction Queue
- 🔄 Automatische sequentielle Verarbeitung von Transaktionen
- ⏱️ Konfigurierbare Queue-Verarbeitungsintervalle

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
- `RPC_URL`: Base Chain RPC URL (z.B. https://mainnet.base.org oder Alchemy/Infura Base)
- `PRIVATE_KEY`: Der private Key Ihres Wallets (ohne 0x Präfix)
- `PORT`: Server Port (Standard: 3000)
- `GOOGLE_SERVICE_ACCOUNT_JSON`: Service Account JSON für Google Sheets API (empfohlen)
- `GOOGLE_SPREADSHEET_ID`: Die ID Ihrer Google Sheets Tabelle
- `GOOGLE_SHEET_NAME`: Name des Sheets (optional, Standard: "Sheet1")
- `QUEUE_PROCESS_INTERVAL_MS`: Intervall für Queue-Verarbeitung in ms (Standard: 10000)

### 3. Anwendung starten

```bash
# Produktions-Modus
npm start

# Entwicklungs-Modus (mit Auto-Reload)
npm run dev
```

## API Endpunkte

### POST /transfer-token

Fügt eine Token-Transfer-Anfrage zur Verarbeitungsqueue hinzu. Die Transaktion wird automatisch der Reihe nach verarbeitet.

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
  "message": "Transaktion wurde zur Verarbeitungsqueue hinzugefügt",
  "queueResult": {
    "success": true,
    "updatedRows": 1,
    "range": "Sheet1!A2:C2"
  },
  "amount": "10.5",
  "wallet": "0x1234567890123456789012345678901234567890"
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

### GET /queue/status

Zeigt den aktuellen Status der Transaction Queue an.

**Response:**
```json
{
  "success": true,
  "queue": {
    "isProcessing": false,
    "pendingCount": 3,
    "processInterval": 10000,
    "isRunning": true
  }
}
```

### POST /queue/process

Startet die Queue-Verarbeitung manuell (zusätzlich zum automatischen Intervall).

**Response:**
```json
{
  "success": true,
  "message": "Queue-Verarbeitung manuell gestartet"
}
```

## Token-Konfiguration

Die Anwendung ist für folgenden Token auf Base Chain konfiguriert:
- **Adresse:** `0x69eFD833288605f320d77eB2aB99DDE62919BbC1`
- **Dezimalstellen:** 2
- **Network:** Base Chain (Chain ID: 8453)

📖 **Weitere Base Chain Informationen:** Siehe [BASE_SETUP.md](./BASE_SETUP.md)

## Google Sheets Integration

Die Anwendung verwendet Google Sheets als Transaction Queue:

### Setup der Google Sheets API

1. **Google Cloud Console Setup:**
   - Gehen Sie zur [Google Cloud Console](https://console.cloud.google.com/)
   - Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes aus
   - Aktivieren Sie die Google Sheets API

2. **Service Account erstellen (empfohlen):**
   - Navigieren Sie zu "APIs & Services" > "Credentials"
   - Klicken Sie auf "Create Credentials" > "Service Account"
   - Laden Sie die JSON-Schlüsseldatei herunter
   - Kopieren Sie den gesamten JSON-Inhalt in die `GOOGLE_SERVICE_ACCOUNT_JSON` Umgebungsvariable

3. **Google Sheets Tabelle konfigurieren:**
   - Öffnen Sie Ihre Google Sheets Tabelle
   - Stellen Sie sicher, dass die Tabelle 3 Spalten hat: `amount`, `wallet`, `processed`
   - Geben Sie der Service Account E-Mail-Adresse Bearbeitungsrechte für die Tabelle
   - Kopieren Sie die Spreadsheet-ID aus der URL in `GOOGLE_SPREADSHEET_ID`

### Queue-System

- **Automatische Verarbeitung:** Alle 10 Sekunden (konfigurierbar über `QUEUE_PROCESS_INTERVAL_MS`)
- **Sequentielle Verarbeitung:** Transaktionen werden der Reihe nach abgearbeitet
- **Retry-Mechanismus:** Fehlgeschlagene Transaktionen werden bis zu 3x wiederholt
- **Status-Tracking:** Verarbeitete Transaktionen werden in der Tabelle markiert

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
├── queue.js          # Transaction Queue System
├── googleSheets.js   # Google Sheets Integration
├── utils.js          # Hilfsfunktionen
├── package.json      # Dependencies und Scripts
├── .env.example      # Beispiel-Umgebungsvariablen
├── .gitignore        # Git-Ignore-Regeln
└── README.md         # Diese Dokumentation
```

### Debugging

Logs werden in der Konsole ausgegeben. Bei Fehlern wird zusätzlich der vollständige Error-Stack geloggt.

## Deployment

### Vercel Deployment mit Google Sheets Queue

1. **Google Cloud Setup:**
   - Service Account für Google Sheets API erstellen
   - Google Sheets Tabelle mit Service Account teilen
   - Spreadsheet-ID aus URL extrahieren

2. **Vercel Environment Variables:**
   ```bash
   RPC_URL=https://mainnet.base.org
   PRIVATE_KEY=ihr_private_key_ohne_0x
   TOKEN_CONTRACT_ADDRESS=0x69eFD833288605f320d77eB2aB99DDE62919BbC1
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   GOOGLE_SPREADSHEET_ID=159BP31mnBsZXyseTP36tBooaeCnVCHSoI3kvrV-UntQ
   GOOGLE_SHEET_NAME=Sheet1
   QUEUE_PROCESS_INTERVAL_MS=10000
   NODE_ENV=production
   ```

3. **Repository auf Vercel deployen:**
   - GitHub Repository mit Vercel verbinden
   - Automatisches Deployment bei Git Push

📖 **Detaillierte Deployment-Anleitung:** Siehe [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
📖 **Queue-System Dokumentation:** Siehe [QUEUE_SYSTEM.md](./QUEUE_SYSTEM.md)
📖 **Troubleshooting:** Siehe [QUEUE_TROUBLESHOOTING.md](./QUEUE_TROUBLESHOOTING.md)

## Lizenz

MIT