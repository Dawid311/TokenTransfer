# Transaction Queue System

Dieses Dokument erklärt das Queue-System der TokenTransfer-Anwendung, das Google Sheets als Backend verwendet.

## Überblick

Das Queue-System ermöglicht es, Token-Transfer-Anfragen zu sammeln und sequenziell zu verarbeiten. Dadurch werden Race Conditions vermieden und eine zuverlässige Reihenfolge der Transaktionen gewährleistet.

## Architektur

### Komponenten

1. **GoogleSheetsManager** (`googleSheets.js`)
   - Verwaltet die Verbindung zur Google Sheets API
   - Fügt neue Transaktionen hinzu
   - Ruft pending Transaktionen ab
   - Markiert Transaktionen als verarbeitet

2. **TransactionQueue** (`queue.js`)
   - Orchestriert die Queue-Verarbeitung
   - Führt Token- und ETH-Transfers durch
   - Implementiert Retry-Logik
   - Verwaltet Timing und Intervalle

3. **Hauptanwendung** (`index.js`)
   - Bietet API-Endpunkte
   - Initialisiert und startet die Queue
   - Verwaltet Server-Lifecycle

## Workflow

### 1. Transaktion hinzufügen
```
POST /transfer-token
├── Validierung der Input-Parameter
├── Hinzufügen zur Google Sheets Tabelle
└── Sofortige Antwort an Client
```

### 2. Queue-Verarbeitung
```
Automatisches Intervall (alle 10s)
├── Abrufen aller pending Transaktionen
├── Sequenzielle Verarbeitung
│   ├── Token-Transfer senden
│   ├── ETH-Transfer senden
│   └── Als verarbeitet markieren
└── Logging und Fehlerbehandlung
```

## Google Sheets Schema

Die Tabelle muss folgende Spalten haben:

| Spalte A | Spalte B | Spalte C |
|----------|----------|----------|
| amount   | wallet   | processed|
| 10.5     | 0x123... | false    |
| 5.0      | 0x456... | true     |

- **amount**: Token-Betrag (String/Number)
- **wallet**: Ziel-Wallet-Adresse (String)
- **processed**: Verarbeitungsstatus (boolean als String: "true"/"false")

## Konfiguration

### Umgebungsvariablen

```bash
# Google Sheets Authentifizierung
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEET_NAME=Sheet1

# Queue-Einstellungen
QUEUE_PROCESS_INTERVAL_MS=10000  # 10 Sekunden
```

### Google Sheets Setup

1. **API aktivieren:**
   ```bash
   # In Google Cloud Console
   1. Neues Projekt erstellen
   2. Google Sheets API aktivieren
   3. Service Account erstellen
   4. JSON-Schlüssel herunterladen
   ```

2. **Berechtigungen:**
   ```bash
   # Service Account E-Mail zur Tabelle hinzufügen
   1. Google Sheets Tabelle öffnen
   2. "Teilen" klicken
   3. Service Account E-Mail eingeben
   4. "Bearbeiter"-Berechtigung geben
   ```

## API-Endpunkte

### Queue-Status abrufen
```bash
GET /queue/status
```

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

### Manuelle Queue-Verarbeitung
```bash
POST /queue/process
```

Startet sofort eine Queue-Verarbeitung, zusätzlich zum automatischen Intervall.

## Fehlerbehandlung

### Retry-Mechanismus
- **Max Retries:** 3 Versuche pro Transaktion
- **Retry Delay:** 5 Sekunden zwischen Versuchen
- **Fehler-Logging:** Vollständige Error-Stacks werden geloggt

### Häufige Fehler

1. **Insufficient funds:**
   ```
   Lösung: ETH-Balance des Sender-Wallets prüfen
   ```

2. **Transfer amount exceeds balance:**
   ```
   Lösung: Token-Balance des Sender-Wallets prüfen
   ```

3. **Google Sheets API Fehler:**
   ```
   Lösung: Service Account Berechtigungen prüfen
   ```

## Monitoring

### Logs
```bash
# Queue-Start
🚀 Starte Transaction Queue...
✅ Transaction Queue gestartet (Intervall: 10000ms)

# Verarbeitung
🔄 Verarbeite 3 pending Transaktionen...
🔄 Verarbeite Transaktion: 10.5 Tokens an 0x123... (Zeile 2)
✅ Transaktion erfolgreich verarbeitet (Zeile 2)

# Fehler
❌ Versuch 1/3 fehlgeschlagen für Transaktion 2: Insufficient funds
⏳ Warte 5000ms vor nächstem Versuch...
```

### Health Check
```bash
GET /health
# Überprüft Server-Status

GET /queue/status
# Überprüft Queue-Zustand
```

## Performance

### Optimierungen
- **Batch-Processing:** Mehrere Transaktionen in einem Durchlauf
- **Gas-Optimierung:** Automatische Gas-Schätzung mit 20% Puffer
- **Connection Pooling:** Wiederverwendung von Web3-Connections

### Timing
- **Standard Intervall:** 10 Sekunden
- **Pause zwischen Transaktionen:** 2 Sekunden
- **Retry Delay:** 5 Sekunden

## Deployment

### Vercel
```bash
# In Vercel Environment Variables eintragen:
GOOGLE_SERVICE_ACCOUNT_JSON
GOOGLE_SPREADSHEET_ID
GOOGLE_SHEET_NAME
QUEUE_PROCESS_INTERVAL_MS
```

### PM2 (Server)
```bash
# PM2 Ecosystem File
module.exports = {
  apps: [{
    name: 'token-transfer',
    script: 'index.js',
    env: {
      NODE_ENV: 'production',
      QUEUE_PROCESS_INTERVAL_MS: 10000
    }
  }]
}
```

## Troubleshooting

### Debug-Schritte

1. **Queue läuft nicht:**
   ```bash
   # Logs prüfen
   console.log('✅ Transaction Queue gestartet')
   
   # Umgebungsvariablen prüfen
   validateEnvironmentVariables()
   ```

2. **Google Sheets Zugriff fehlschlägt:**
   ```bash
   # Service Account JSON validieren
   JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
   
   # Spreadsheet ID prüfen
   GET /queue/status
   ```

3. **Transaktionen hängen:**
   ```bash
   # Manuell triggern
   POST /queue/process
   
   # Gas-Preise prüfen
   # Network-Status prüfen
   ```

## Sicherheit

### Best Practices
- Service Account mit minimalen Berechtigungen
- Regelmäßige Rotation der API-Schlüssel
- Monitoring der Queue-Aktivität
- Rate Limiting für API-Endpunkte

### Zugriffskontrolle
- Google Sheets nur für Service Account freigegeben
- Keine öffentlichen Sharing-Links
- Audit-Trail über Google Cloud Console
