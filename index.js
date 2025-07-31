require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Web3 } = require('web3');
const TransactionQueue = require('./queue');
const { 
    isValidEthereumAddress, 
    formatTokenAmount, 
    parseTokenAmount,
    validateEnvironmentVariables,
    handleWeb3Error 
} = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate environment variables on startup
try {
    validateEnvironmentVariables();
    console.log('✅ Environment variables validated successfully');
} catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Web3 Setup
const web3 = new Web3(process.env.RPC_URL);
const privateKey = process.env.PRIVATE_KEY;
const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
web3.eth.accounts.wallet.add(account);

// Token Contract Details
const TOKEN_ADDRESS = process.env.TOKEN_CONTRACT_ADDRESS || '0x69eFD833288605f320d77eB2aB99DDE62919BbC1';
const TOKEN_DECIMALS = 2; // Wie angegeben

// ERC-20 ABI (minimale Version für Transfer)
const ERC20_ABI = [
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
];

// Token Contract Instanz
const tokenContract = new web3.eth.Contract(ERC20_ABI, TOKEN_ADDRESS);

// Transaction Queue initialisieren
const transactionQueue = new TransactionQueue(web3, tokenContract, account, privateKey);

// Queue starten (nur wenn nicht in Vercel)
if (process.env.NODE_ENV !== 'production') {
    transactionQueue.startQueue().catch(error => {
        console.error('❌ Fehler beim Starten der Transaction Queue:', error.message);
    });
}

// Hilfsfunktionen
function validateAddress(address) {
    return isValidEthereumAddress(address);
}

function parseAmount(amount, decimals = TOKEN_DECIMALS) {
    return formatTokenAmount(amount, decimals);
}

// Webhook-Endpunkt für Token-Transfer (fügt zur Queue hinzu)
app.post('/transfer-token', async (req, res) => {
    try {
        const { amount, wallet } = req.body;

        // Validierung der Input-Parameter
        if (!amount || !wallet) {
            return res.status(400).json({
                success: false,
                error: 'Fehlende Parameter: amount und wallet sind erforderlich'
            });
        }

        if (!validateAddress(wallet)) {
            return res.status(400).json({
                success: false,
                error: 'Ungültige Wallet-Adresse'
            });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Ungültiger Amount-Wert'
            });
        }

        console.log(`Token-Transfer zur Queue hinzugefügt: ${amount} Tokens an ${wallet}`);

        // Zur Transaction Queue hinzufügen
        const result = await transactionQueue.addTransaction(amount, wallet);

        res.json({
            success: true,
            message: 'Transaktion wurde zur Verarbeitungsqueue hinzugefügt',
            queueResult: result,
            amount: amount,
            wallet: wallet
        });

    } catch (error) {
        console.error('Fehler beim Hinzufügen zur Token-Transfer-Queue:', error);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Balance-Check Endpunkt
app.get('/balance', async (req, res) => {
    try {
        const balance = await tokenContract.methods.balanceOf(account.address).call();
        const readableBalance = parseTokenAmount(balance, TOKEN_DECIMALS);
        
        res.json({
            success: true,
            address: account.address,
            balance: readableBalance,
            rawBalance: balance.toString()
        });
    } catch (error) {
        console.error('Fehler beim Balance-Check:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health-Check Endpunkt
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'Server läuft',
        timestamp: new Date().toISOString(),
        tokenAddress: TOKEN_ADDRESS,
        senderAddress: account.address
    });
});

// Queue-Status Endpunkt
app.get('/queue/status', async (req, res) => {
    try {
        const status = await transactionQueue.getQueueStatus();
        res.json({
            success: true,
            queue: status
        });
    } catch (error) {
        console.error('Fehler beim Abrufen des Queue-Status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Manueller Queue-Trigger Endpunkt
app.post('/queue/process', async (req, res) => {
    try {
        // Trigger queue processing manually
        transactionQueue.processQueue();
        
        res.json({
            success: true,
            message: 'Queue-Verarbeitung manuell gestartet'
        });
    } catch (error) {
        console.error('Fehler beim manuellen Queue-Trigger:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpunkt nicht gefunden'
    });
});

// Error Handler
app.use((error, req, res, next) => {
    console.error('Unbehandelter Fehler:', error);
    res.status(500).json({
        success: false,
        error: 'Interner Server-Fehler'
    });
});

// Server starten (nur wenn nicht in Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Token-Transfer-Server läuft auf Port ${PORT}`);
        console.log(`⛓️  Base Chain Network`);
        console.log(`📝 Token-Adresse: ${TOKEN_ADDRESS}`);
        console.log(`💰 Sender-Adresse: ${account.address}`);
        console.log(`🔗 RPC URL: ${process.env.RPC_URL}`);
    });
}

module.exports = app;
