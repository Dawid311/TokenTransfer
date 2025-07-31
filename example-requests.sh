# Beispiel-Anfragen für die Token-Transfer-API

## 1. Health Check
curl -X GET http://localhost:3000/health

## 2. Balance Check
curl -X GET http://localhost:3000/balance

## 3. Token Transfer
curl -X POST http://localhost:3000/transfer-token \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10.50",
    "wallet": "0x1234567890123456789012345678901234567890"
  }'

## 4. Token Transfer mit verschiedenen Amounts
curl -X POST http://localhost:3000/transfer-token \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1",
    "wallet": "0xRecipientAddressHere"
  }'

## 5. Fehlerhafte Anfrage (ungültige Adresse)
curl -X POST http://localhost:3000/transfer-token \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10",
    "wallet": "invalid_address"
  }'

## 6. Fehlerhafte Anfrage (fehlende Parameter)
curl -X POST http://localhost:3000/transfer-token \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "5"
  }'
