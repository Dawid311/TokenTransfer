require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Web3 } = require('web3');
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

// Hilfsfunktionen
function validateAddress(address) {
    return isValidEthereumAddress(address);
}

function parseAmount(amount, decimals = TOKEN_DECIMALS) {
    return formatTokenAmount(amount, decimals);
}

// Webhook-Endpunkt für Token-Transfer
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

        console.log(`Token-Transfer initiiert: ${amount} Tokens an ${wallet}`);

        // Amount in Token-Units konvertieren (mit 2 Decimals)
        const tokenAmount = parseAmount(amount);

        // Gas-Schätzung für die Transaktion
        const gasEstimate = await tokenContract.methods
            .transfer(wallet, tokenAmount)
            .estimateGas({ from: account.address });

        // Transaktion vorbereiten
        const tx = {
            from: account.address,
            to: TOKEN_ADDRESS,
            data: tokenContract.methods.transfer(wallet, tokenAmount).encodeABI(),
            gas: Math.floor(gasEstimate * 1.2), // 20% Puffer
            gasPrice: process.env.GAS_PRICE ? 
                web3.utils.toWei(process.env.GAS_PRICE, 'gwei') : 
                await web3.eth.getGasPrice()
        };

        // Transaktion signieren und senden
        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log(`Transaktion erfolgreich: ${receipt.transactionHash}`);

        res.json({
            success: true,
            transactionHash: receipt.transactionHash,
            amount: amount,
            recipient: wallet,
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber.toString()
        });

    } catch (error) {
        console.error('Fehler beim Token-Transfer:', error);
        
        const errorMessage = handleWeb3Error(error);
        
        res.status(500).json({
            success: false,
            error: errorMessage
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
            rawBalance: balance
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

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 Token-Transfer-Server läuft auf Port ${PORT}`);
    console.log(`⛓️  Base Chain Network`);
    console.log(`📝 Token-Adresse: ${TOKEN_ADDRESS}`);
    console.log(`💰 Sender-Adresse: ${account.address}`);
    console.log(`🔗 RPC URL: ${process.env.RPC_URL}`);
});

module.exports = app;
