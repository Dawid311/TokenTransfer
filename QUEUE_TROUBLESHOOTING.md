# Queue System Troubleshooting

Diese Anleitung hilft bei der Diagnose und Lösung von Problemen mit dem Transaction Queue System.

## Schnell-Diagnose

### 1. Server Status prüfen
```bash
curl http://localhost:3000/health
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "status": "Server läuft",
  "timestamp": "2025-07-31T...",
  "tokenAddress": "0x69eFD833288605f320d77eB2aB99DDE62919BbC1",
  "senderAddress": "0x..."
}
```

### 2. Queue Status prüfen
```bash
curl http://localhost:3000/queue/status
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "queue": {
    "isProcessing": false,
    "pendingCount": 0,
    "processInterval": 10000,
    "isRunning": true
  }
}
```

## Häufige Probleme

### Problem 1: Server startet nicht

**Symptome:**
```bash
❌ Environment validation failed: Fehlende Umgebungsvariablen
❌ Google Sheets Authentifizierung fehlt
```

**Lösung:**
```bash
# 1. .env Datei prüfen
cat .env

# 2. Erforderliche Variablen prüfen
echo $GOOGLE_SERVICE_ACCOUNT_JSON
echo $GOOGLE_SPREADSHEET_ID

# 3. JSON Syntax validieren
node -e "JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)"
```

**Checkliste:**
- [ ] `.env` Datei existiert
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` ist gültiges JSON
- [ ] `GOOGLE_SPREADSHEET_ID` ist korrekt
- [ ] `RPC_URL` ist erreichbar
- [ ] `PRIVATE_KEY` ist gültig

### Problem 2: Queue verarbeitet keine Transaktionen

**Symptome:**
```bash
📋 0 unverarbeitete Transaktionen gefunden
⏳ Queue wird bereits verarbeitet, überspringe...
```

**Diagnose:**
```bash
# 1. Manuell Queue triggern
curl -X POST http://localhost:3000/queue/process

# 2. Google Sheets direkt prüfen
# Öffnen Sie die Tabelle im Browser und prüfen Sie:
# - Gibt es Zeilen mit processed=false?
# - Sind die Daten korrekt formatiert?
# - Hat der Service Account Zugriff?
```

**Lösung:**
```bash
# 1. Service Account Berechtigungen prüfen
# - Google Sheets öffnen
# - "Teilen" klicken
# - Service Account E-Mail suchen
# - "Bearbeiter" Berechtigung sicherstellen

# 2. Spreadsheet ID validieren
# Aus URL extrahieren:
# https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

### Problem 3: Transaktionen schlagen fehl

**Symptome:**
```bash
❌ Versuch 1/3 fehlgeschlagen: insufficient funds
❌ Token-Transfer fehlgeschlagen: transfer amount exceeds balance
```

**Diagnose:**
```bash
# 1. Wallet Balance prüfen
curl http://localhost:3000/balance

# 2. ETH Balance prüfen (für Gas)
# In Web3 Console oder Block Explorer

# 3. Network Status prüfen
# Base Network Status: https://status.base.org/
```

**Lösung:**
```bash
# 1. ETH für Gas aufladen
# Mindestens 0.01 ETH empfohlen

# 2. Token Balance prüfen
# Stellen Sie sicher, dass genügend Tokens vorhanden sind

# 3. Gas Price anpassen
# In .env: GAS_PRICE=0.001
```

### Problem 4: Google Sheets API Fehler

**Symptome:**
```bash
❌ Google Sheets API error: 403 Forbidden
❌ Spreadsheet not found
❌ The caller does not have permission
```

**Lösung:**
```bash
# 1. Service Account neu erstellen
# - Google Cloud Console öffnen
# - APIs & Services > Credentials
# - Neuen Service Account erstellen
# - JSON Key herunterladen

# 2. API aktivieren
# - Google Cloud Console
# - APIs & Services > Library
# - "Google Sheets API" suchen und aktivieren

# 3. Berechtigungen neu setzen
# - Google Sheets Tabelle öffnen
# - Service Account E-Mail hinzufügen
# - "Bearbeiter" Berechtigung geben
```

### Problem 5: Vercel Deployment Probleme

**Symptome:**
```bash
Queue läuft nicht in Vercel
Environment Variables nicht verfügbar
```

**Lösung:**
```bash
# 1. Environment Variables in Vercel setzen
# Dashboard > Project > Settings > Environment Variables

# 2. JSON escaping prüfen
# GOOGLE_SERVICE_ACCOUNT_JSON muss als String eingegeben werden
# Verwendung eines JSON Validators empfohlen

# 3. Vercel Logs prüfen
vercel logs
```

## Debug-Befehle

### Umgebungsvariablen testen
```bash
node -e "
require('dotenv').config();
console.log('RPC_URL:', !!process.env.RPC_URL);
console.log('PRIVATE_KEY:', !!process.env.PRIVATE_KEY);
console.log('GOOGLE_SPREADSHEET_ID:', !!process.env.GOOGLE_SPREADSHEET_ID);
console.log('GOOGLE_SERVICE_ACCOUNT_JSON:', !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
"
```

### Google Sheets Zugriff testen
```bash
node -e "
require('dotenv').config();
const GoogleSheetsManager = require('./googleSheets');
const sheets = new GoogleSheetsManager();
sheets.validateConfiguration().then(console.log).catch(console.error);
"
```

### Web3 Verbindung testen
```bash
node -e "
require('dotenv').config();
const { Web3 } = require('web3');
const web3 = new Web3(process.env.RPC_URL);
web3.eth.getBlockNumber().then(console.log).catch(console.error);
"
```

## Monitoring Setup

### PM2 Logs
```bash
# Logs verfolgen
pm2 logs token-transfer

# Log-Rotation aktivieren
pm2 install pm2-logrotate
```

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

ENDPOINT="http://localhost:3000"

# Server Health
curl -f $ENDPOINT/health > /dev/null
if [ $? -ne 0 ]; then
    echo "ALERT: Server not responding"
    exit 1
fi

# Queue Health
PENDING=$(curl -s $ENDPOINT/queue/status | jq '.queue.pendingCount')
if [ $PENDING -gt 10 ]; then
    echo "WARNING: High pending count: $PENDING"
fi

echo "OK: System healthy"
```

### Alerting
```bash
# Crontab für regelmäßige Checks
# */5 * * * * /path/to/health-check.sh

# Bei Fehlern E-Mail senden
if [ $? -ne 0 ]; then
    echo "Queue system error" | mail -s "Alert" admin@example.com
fi
```

## Performance Optimierung

### Queue Intervall anpassen
```bash
# Für höheren Durchsatz
QUEUE_PROCESS_INTERVAL_MS=5000  # 5 Sekunden

# Für niedrigere Server-Last
QUEUE_PROCESS_INTERVAL_MS=30000  # 30 Sekunden
```

### Gas Optimierung
```bash
# Niedrigere Gas-Preise für Base Network
GAS_PRICE=0.0001  # 0.0001 Gwei

# Automatische Gas-Schätzung aktivieren
# (GAS_PRICE nicht setzen)
```

### Batch-Processing
```javascript
// Zukünftige Erweiterung: Mehrere Transaktionen parallel
const BATCH_SIZE = 3;
const CONCURRENT_TRANSACTIONS = 2;
```

## Support

### Log-Analyse
```bash
# Letzte 100 Zeilen
tail -n 100 /var/log/token-transfer.log

# Nur Fehler
grep "❌" /var/log/token-transfer.log

# Queue-spezifische Logs
grep "Queue\|🔄\|📋" /var/log/token-transfer.log
```

### Backup & Recovery
```bash
# Google Sheets Backup
# - Datei > Herunterladen > .xlsx
# - Regelmäßige Backups empfohlen

# Database Export (falls erweitert)
# - Implementierung abhängig von gewählter DB
```

### Kontakt
Bei persistenten Problemen:
1. Logs sammeln (`pm2 logs` oder `vercel logs`)
2. Umgebungsvariablen anonymisieren
3. Fehlermeldungen dokumentieren
4. System-Setup beschreiben

---

**Letzte Aktualisierung:** Juli 2025
