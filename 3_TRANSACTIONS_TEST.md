# 3 Transaktionen Test

## ❌ Problem: Google Sheets Integration noch nicht deployed

**Root Cause:** Die neue Version mit Google Sheets Integration ist noch nicht auf Vercel deployed.

### Aktueller Status:
- ✅ Health Check funktioniert
- ❌ Queue-Endpunkte existieren nicht (`/queue/status` → 404)
- ❌ Google Sheets Integration fehlt

## 🚀 Lösung: Deployment der neuen Version

### 1. Code zu GitHub pushen
```bash
git add .
git commit -m "Add Google Sheets queue system"
git push origin main
```

### 2. Environment Variables in Vercel setzen

**Gehen Sie zu Vercel Dashboard → Ihr Projekt → Settings → Environment Variables**

Fügen Sie hinzu:
```bash
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_SPREADSHEET_ID=159BP31mnBsZXyseTP36tBooaeCnVCHSoI3kvrV-UntQ
GOOGLE_SHEET_NAME=Sheet1
QUEUE_PROCESS_INTERVAL_MS=10000
```

### 3. Automatisches Redeploy abwarten
- Vercel deployed automatisch nach Git Push
- Prüfen Sie den Deploy-Status im Dashboard

### 4. Nach Deployment testen
```bash
# Queue Status sollte dann funktionieren
curl -s https://token-transfer-ashen.vercel.app/queue/status

# Test-Transaktionen
curl -X POST https://token-transfer-ashen.vercel.app/transfer-token \
  -H "Content-Type: application/json" \
  -d '{"amount": "1.0", "wallet": "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF"}'
```

## ⚠️ Wichtig: Google Sheets Setup

Stellen Sie sicher, dass:
1. Service Account JSON in Vercel Environment Variables steht
2. Google Sheets Tabelle die richtigen Spalten hat: `amount`, `wallet`, `processed`
3. Service Account Berechtigung für die Tabelle hat

## 📋 Erwartetes Verhalten nach Deployment:

1. **POST /transfer-token** → Fügt Zeile zu Google Sheets hinzu
2. **Queue-Worker** → Verarbeitet Einträge alle 10 Sekunden
3. **Google Sheets** → Zeigt Transaktionen mit Status an