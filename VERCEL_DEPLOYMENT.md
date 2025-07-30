# Vercel Deployment für Token Transfer

## Problem: "NOT_FOUND" Fehler

Der Fehler tritt auf, weil Vercel nicht weiß, wie es mit den API-Routen umgehen soll.

## Lösung: vercel.json konfigurieren

Die `vercel.json` Datei wurde erstellt mit:
- Node.js Build-Konfiguration
- Route-Weiterleitung an index.js

## Deployment-Schritte

### 1. Änderungen committen und pushen
```bash
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

### 2. Erneut auf Vercel deployen
- Gehen Sie zu https://vercel.com/dashboard
- Wählen Sie Ihr TokenTransfer-Projekt
- Klicken Sie auf "Redeploy"

### 3. Umgebungsvariablen in Vercel setzen

**Wichtig:** Sie müssen die Umgebungsvariablen in Vercel konfigurieren:

1. Gehen Sie zu Ihrem Vercel-Projekt
2. Settings → Environment Variables
3. Fügen Sie hinzu:
   - `RPC_URL` = `https://mainnet.base.org`
   - `PRIVATE_KEY` = `ihr_private_key_ohne_0x`
   - `TOKEN_CONTRACT_ADDRESS` = `0x69eFD833288605f320d77eB2aB99DDE62919BbC1`
   - `NODE_ENV` = `production`

### 4. Nach dem Deployment testen

```bash
# Gesundheitsprüfung
curl https://token-transfer-ashen.vercel.app/health

# Balance prüfen
curl https://token-transfer-ashen.vercel.app/balance

# Token senden
curl -X POST https://token-transfer-ashen.vercel.app/transfer-token \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "5",
    "wallet": "0xeF54a1003C7BcbC5706B96B2839A76D2A4C68bCF"
  }'
```

## Alternative: API-Routen-Struktur verwenden

Falls das Problem weiterhin besteht, können wir die Vercel API-Routen-Struktur verwenden:

1. Erstellen Sie einen `api/` Ordner
2. Verschieben Sie die Routen in separate Dateien
3. Verwenden Sie die Vercel-spezifische API-Struktur

## Debugging

Falls weiterhin Probleme auftreten:

1. **Logs prüfen:**
   - Gehen Sie zu Vercel Dashboard → Functions
   - Prüfen Sie die Logs für Fehler

2. **URL testen:**
   ```bash
   # Basis-URL testen
   curl https://token-transfer-ashen.vercel.app/
   
   # Sollte eine Antwort geben, auch wenn es ein 404 ist
   ```

3. **Environment Variables prüfen:**
   - Stellen Sie sicher, dass alle Umgebungsvariablen in Vercel gesetzt sind
