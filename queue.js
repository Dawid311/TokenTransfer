const { Web3 } = require('web3');
const GoogleSheetsManager = require('./googleSheets');
const { 
    isValidEthereumAddress, 
    formatTokenAmount, 
    parseTokenAmount,
    handleWeb3Error 
} = require('./utils');

class TransactionQueue {
    constructor(web3Instance, tokenContract, account, privateKey) {
        this.web3 = web3Instance;
        this.tokenContract = tokenContract;
        this.account = account;
        this.privateKey = privateKey;
        this.sheetsManager = new GoogleSheetsManager();
        this.isProcessing = false;
        this.processInterval = null;
        this.TOKEN_DECIMALS = 2;
        this.TOKEN_ADDRESS = process.env.TOKEN_CONTRACT_ADDRESS || '0x69eFD833288605f320d77eB2aB99DDE62919BbC1';
        
        // Konfiguration
        this.PROCESS_INTERVAL_MS = process.env.QUEUE_PROCESS_INTERVAL_MS || 10000; // 10 Sekunden Standard
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY_MS = 5000; // 5 Sekunden
    }

    /**
     * Startet die Queue-Verarbeitung
     */
    async startQueue() {
        try {
            console.log('🚀 Starte Transaction Queue...');
            
            // Validiere Google Sheets Konfiguration
            const isValid = await this.sheetsManager.validateConfiguration();
            if (!isValid) {
                throw new Error('Google Sheets Konfiguration ist ungültig');
            }

            // Stelle sicher, dass die Kopfzeile existiert
            await this.sheetsManager.ensureHeaderRow();

            // Starte periodische Verarbeitung
            this.processInterval = setInterval(() => {
                this.processQueue();
            }, this.PROCESS_INTERVAL_MS);

            // Führe sofort eine Verarbeitung durch
            await this.processQueue();

            console.log(`✅ Transaction Queue gestartet (Intervall: ${this.PROCESS_INTERVAL_MS}ms)`);
        } catch (error) {
            console.error('❌ Fehler beim Starten der Transaction Queue:', error.message);
            throw error;
        }
    }

    /**
     * Stoppt die Queue-Verarbeitung
     */
    stopQueue() {
        if (this.processInterval) {
            clearInterval(this.processInterval);
            this.processInterval = null;
            console.log('🛑 Transaction Queue gestoppt');
        }
    }

    /**
     * Fügt eine neue Transaktion zur Queue hinzu
     */
    async addTransaction(amount, wallet) {
        try {
            // Validierung
            if (!isValidEthereumAddress(wallet)) {
                throw new Error('Ungültige Wallet-Adresse');
            }

            if (isNaN(amount) || amount <= 0) {
                throw new Error('Ungültiger Amount-Wert');
            }

            // Zur Google Sheets hinzufügen
            const result = await this.sheetsManager.addTransactionToQueue(amount, wallet);
            
            console.log(`📝 Transaktion zur Queue hinzugefügt: ${amount} Tokens an ${wallet}`);
            return result;
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen zur Queue:', error.message);
            throw error;
        }
    }

    /**
     * Verarbeitet alle pending Transaktionen
     */
    async processQueue() {
        if (this.isProcessing) {
            console.log('⏳ Queue wird bereits verarbeitet, überspringe...');
            return;
        }

        this.isProcessing = true;

        try {
            const pendingTransactions = await this.sheetsManager.getPendingTransactions();
            
            if (pendingTransactions.length === 0) {
                console.log('✅ Keine pending Transaktionen vorhanden');
                return;
            }

            console.log(`🔄 Verarbeite ${pendingTransactions.length} pending Transaktionen...`);

            for (const transaction of pendingTransactions) {
                try {
                    await this.processTransaction(transaction);
                    
                    // Kurze Pause zwischen Transaktionen
                    await this.delay(2000);
                } catch (error) {
                    console.error(`❌ Fehler bei Transaktion ${transaction.rowIndex}:`, error.message);
                    // Fahre mit der nächsten Transaktion fort
                }
            }

            console.log('✅ Queue-Verarbeitung abgeschlossen');
        } catch (error) {
            console.error('❌ Fehler bei Queue-Verarbeitung:', error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Verarbeitet eine einzelne Transaktion
     */
    async processTransaction(transaction) {
        const { rowIndex, amount, wallet } = transaction;
        
        console.log(`🔄 Verarbeite Transaktion: ${amount} Tokens an ${wallet} (Zeile ${rowIndex})`);

        let retries = 0;
        
        while (retries < this.MAX_RETRIES) {
            try {
                // Token-Transfer durchführen
                const tokenResult = await this.sendTokens(amount, wallet);
                
                // ETH-Transfer durchführen
                const ethResult = await this.sendEth(wallet);
                
                // Als verarbeitet markieren
                await this.sheetsManager.markTransactionAsProcessed(rowIndex);
                
                console.log(`✅ Transaktion erfolgreich verarbeitet (Zeile ${rowIndex})`);
                console.log(`   Token TX: ${tokenResult.transactionHash}`);
                console.log(`   ETH TX: ${ethResult.transactionHash}`);
                
                return {
                    success: true,
                    tokenTransaction: tokenResult,
                    ethTransaction: ethResult
                };
                
            } catch (error) {
                retries++;
                console.error(`❌ Versuch ${retries}/${this.MAX_RETRIES} fehlgeschlagen für Transaktion ${rowIndex}:`, error.message);
                
                if (retries < this.MAX_RETRIES) {
                    console.log(`⏳ Warte ${this.RETRY_DELAY_MS}ms vor nächstem Versuch...`);
                    await this.delay(this.RETRY_DELAY_MS);
                } else {
                    throw new Error(`Transaktion nach ${this.MAX_RETRIES} Versuchen fehlgeschlagen: ${error.message}`);
                }
            }
        }
    }

    /**
     * Sendet Tokens an eine Adresse
     */
    async sendTokens(amount, wallet) {
        try {
            // Amount in Token-Units konvertieren (mit 2 Decimals)
            const tokenAmount = formatTokenAmount(amount, this.TOKEN_DECIMALS);

            // Gas-Schätzung für die Transaktion
            const gasEstimate = await this.tokenContract.methods
                .transfer(wallet, tokenAmount)
                .estimateGas({ from: this.account.address });

            // Transaktion vorbereiten
            const gasPrice = process.env.GAS_PRICE ? 
                this.web3.utils.toWei(process.env.GAS_PRICE, 'gwei') : 
                await this.web3.eth.getGasPrice();

            const tx = {
                from: this.account.address,
                to: this.TOKEN_ADDRESS,
                data: this.tokenContract.methods.transfer(wallet, tokenAmount).encodeABI(),
                gas: Math.floor(Number(gasEstimate) * 1.2), // 20% Puffer
                gasPrice: gasPrice.toString()
            };

            // Transaktion signieren und senden
            const signedTx = await this.web3.eth.accounts.signTransaction(tx, '0x' + this.privateKey);
            const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

            return {
                transactionHash: receipt.transactionHash,
                amount: amount,
                recipient: wallet,
                gasUsed: Number(receipt.gasUsed).toString(),
                blockNumber: Number(receipt.blockNumber).toString()
            };
        } catch (error) {
            throw new Error(`Token-Transfer fehlgeschlagen: ${handleWeb3Error(error)}`);
        }
    }

    /**
     * Sendet ETH an eine Adresse
     */
    async sendEth(wallet) {
        try {
            const ethAmount = this.web3.utils.toWei('0.000001', 'ether');
            const gasEstimate = await this.web3.eth.estimateGas({
                from: this.account.address,
                to: wallet,
                value: ethAmount
            });

            const gasPrice = process.env.GAS_PRICE ? 
                this.web3.utils.toWei(process.env.GAS_PRICE, 'gwei') : 
                await this.web3.eth.getGasPrice();

            const ethTx = {
                from: this.account.address,
                to: wallet,
                value: ethAmount,
                gas: Math.floor(Number(gasEstimate) * 1.2), // 20% Puffer
                gasPrice: gasPrice.toString()
            };

            const signedEthTx = await this.web3.eth.accounts.signTransaction(ethTx, '0x' + this.privateKey);
            const ethReceipt = await this.web3.eth.sendSignedTransaction(signedEthTx.rawTransaction);

            return {
                transactionHash: ethReceipt.transactionHash,
                amount: "0.000001",
                recipient: wallet,
                gasUsed: Number(ethReceipt.gasUsed).toString(),
                blockNumber: Number(ethReceipt.blockNumber).toString()
            };
        } catch (error) {
            throw new Error(`ETH-Transfer fehlgeschlagen: ${handleWeb3Error(error)}`);
        }
    }

    /**
     * Hilfsfunktion für Delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gibt Queue-Status zurück
     */
    async getQueueStatus() {
        try {
            const pendingTransactions = await this.sheetsManager.getPendingTransactions();
            
            return {
                isProcessing: this.isProcessing,
                pendingCount: pendingTransactions.length,
                processInterval: this.PROCESS_INTERVAL_MS,
                isRunning: this.processInterval !== null
            };
        } catch (error) {
            return {
                isProcessing: this.isProcessing,
                pendingCount: 'unknown',
                processInterval: this.PROCESS_INTERVAL_MS,
                isRunning: this.processInterval !== null,
                error: error.message
            };
        }
    }
}

module.exports = TransactionQueue;
