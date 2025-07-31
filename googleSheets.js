const { google } = require('googleapis');

class GoogleSheetsManager {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        this.sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
        
        // Initialize authentication
        this.initAuth();
    }

    initAuth() {
        try {
            // Service Account authentication (recommended for server applications)
            if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
                const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
                this.auth = new google.auth.GoogleAuth({
                    credentials: serviceAccount,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets']
                });
            }
            // API Key authentication (read-only access)
            else if (process.env.GOOGLE_API_KEY) {
                this.auth = process.env.GOOGLE_API_KEY;
            }
            else {
                throw new Error('Google Sheets Authentifizierung fehlt. Benötigt GOOGLE_SERVICE_ACCOUNT_JSON oder GOOGLE_API_KEY');
            }

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('✅ Google Sheets API erfolgreich initialisiert');
        } catch (error) {
            console.error('❌ Fehler bei Google Sheets Initialisierung:', error.message);
            throw error;
        }
    }

    /**
     * Fügt eine neue Zeile zur Google Sheets Tabelle hinzu
     * @param {string} amount - Der Token-Betrag
     * @param {string} wallet - Die Wallet-Adresse
     * @returns {Promise<object>} - Das Ergebnis der Operation
     */
    async addTransactionToQueue(amount, wallet) {
        try {
            const values = [
                [amount, wallet, 'false'] // amount, wallet, processed
            ];

            const request = {
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A:C`,
                valueInputOption: 'RAW',
                resource: {
                    values: values
                }
            };

            const response = await this.sheets.spreadsheets.values.append(request);
            
            console.log(`✅ Transaktion zur Queue hinzugefügt: ${amount} Tokens an ${wallet}`);
            
            return {
                success: true,
                updatedRows: response.data.updates.updatedRows,
                range: response.data.updates.updatedRange
            };
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen zur Google Sheets Queue:', error.message);
            throw error;
        }
    }

    /**
     * Ruft alle unverarbeiteten Transaktionen aus der Tabelle ab
     * @returns {Promise<Array>} - Array von unverarbeiteten Transaktionen
     */
    async getPendingTransactions() {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A:C`
            });

            const rows = response.data.values || [];
            const pendingTransactions = [];

            // Skip header row (if exists) and find unprocessed transactions
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row.length >= 3) {
                    const [amount, wallet, processed] = row;
                    
                    // Check if this is a valid transaction row and not processed
                    if (amount && wallet && (processed === 'false' || processed === false || processed === '')) {
                        pendingTransactions.push({
                            rowIndex: i + 1, // Google Sheets is 1-indexed
                            amount: amount,
                            wallet: wallet,
                            processed: processed
                        });
                    }
                }
            }

            console.log(`📋 ${pendingTransactions.length} unverarbeitete Transaktionen gefunden`);
            return pendingTransactions;
        } catch (error) {
            console.error('❌ Fehler beim Abrufen der pending Transaktionen:', error.message);
            throw error;
        }
    }

    /**
     * Markiert eine Transaktion als verarbeitet
     * @param {number} rowIndex - Der Zeilenindex in der Tabelle (1-basiert)
     * @returns {Promise<object>} - Das Ergebnis der Operation
     */
    async markTransactionAsProcessed(rowIndex) {
        try {
            const range = `${this.sheetName}!C${rowIndex}`;
            
            const request = {
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                resource: {
                    values: [['true']]
                }
            };

            const response = await this.sheets.spreadsheets.values.update(request);
            
            console.log(`✅ Transaktion in Zeile ${rowIndex} als verarbeitet markiert`);
            
            return {
                success: true,
                updatedRows: response.data.updatedRows,
                range: response.data.updatedRange
            };
        } catch (error) {
            console.error(`❌ Fehler beim Markieren der Transaktion (Zeile ${rowIndex}) als verarbeitet:`, error.message);
            throw error;
        }
    }

    /**
     * Validiert die Google Sheets Konfiguration
     * @returns {Promise<boolean>} - True wenn die Konfiguration gültig ist
     */
    async validateConfiguration() {
        try {
            if (!this.spreadsheetId) {
                throw new Error('GOOGLE_SPREADSHEET_ID ist nicht gesetzt');
            }

            // Test-Zugriff auf die Tabelle
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            console.log(`✅ Google Sheets Zugriff erfolgreich: "${response.data.properties.title}"`);
            return true;
        } catch (error) {
            console.error('❌ Google Sheets Konfiguration ungültig:', error.message);
            return false;
        }
    }

    /**
     * Erstellt die Kopfzeile der Tabelle falls sie nicht existiert
     */
    async ensureHeaderRow() {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A1:C1`
            });

            const firstRow = response.data.values && response.data.values[0];
            
            // Check if header exists
            if (!firstRow || firstRow[0] !== 'amount' || firstRow[1] !== 'wallet' || firstRow[2] !== 'processed') {
                console.log('📝 Erstelle Kopfzeile in Google Sheets...');
                
                const headerRequest = {
                    spreadsheetId: this.spreadsheetId,
                    range: `${this.sheetName}!A1:C1`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [['amount', 'wallet', 'processed']]
                    }
                };

                await this.sheets.spreadsheets.values.update(headerRequest);
                console.log('✅ Kopfzeile erfolgreich erstellt');
            }
        } catch (error) {
            console.error('❌ Fehler beim Erstellen der Kopfzeile:', error.message);
            // Don't throw here, as this is not critical
        }
    }
}

module.exports = GoogleSheetsManager;
