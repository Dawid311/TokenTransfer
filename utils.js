const { Web3 } = require('web3');

// Hilfsfunktion zur Validierung einer Ethereum-Adresse
function isValidEthereumAddress(address) {
    return Web3.utils.isAddress(address);
}

// Hilfsfunktion zur Validierung eines Private Keys
function isValidPrivateKey(privateKey) {
    try {
        const key = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
        return key.length === 66 && /^0x[a-fA-F0-9]{64}$/.test(key);
    } catch (error) {
        return false;
    }
}

// Hilfsfunktion zur Formatierung von Token-Amounts
function formatTokenAmount(amount, decimals = 2) {
    const result = (parseFloat(amount) * Math.pow(10, decimals)).toString();
    return result;
}

// Hilfsfunktion zur Konvertierung von Token-Amounts zurück zu lesbarem Format
function parseTokenAmount(amount, decimals = 2) {
    // Explizite Konvertierung zu Number um BigInt-Probleme zu vermeiden
    const numAmount = typeof amount === 'bigint' ? Number(amount) : parseFloat(amount);
    return numAmount / Math.pow(10, decimals);
}

// Hilfsfunktion zur Überprüfung der erforderlichen Umgebungsvariablen
function validateEnvironmentVariables() {
    const required = ['RPC_URL', 'PRIVATE_KEY', 'TOKEN_CONTRACT_ADDRESS'];
    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
        throw new Error(`Fehlende Umgebungsvariablen: ${missing.join(', ')}`);
    }
    
    if (!isValidPrivateKey(process.env.PRIVATE_KEY)) {
        throw new Error('Ungültiger Private Key in PRIVATE_KEY Umgebungsvariable');
    }
    
    if (!isValidEthereumAddress(process.env.TOKEN_CONTRACT_ADDRESS)) {
        throw new Error('Ungültige Token-Adresse in TOKEN_CONTRACT_ADDRESS Umgebungsvariable');
    }
}

// Error Handler für spezifische Web3-Fehler
function handleWeb3Error(error) {
    if (error.message.includes('insufficient funds')) {
        return 'Unzureichende ETH für Gas-Gebühren';
    } else if (error.message.includes('nonce too low')) {
        return 'Nonce-Fehler: Transaktion bereits verarbeitet';
    } else if (error.message.includes('gas price too low')) {
        return 'Gas-Preis zu niedrig';
    } else if (error.message.includes('exceeds allowance')) {
        return 'Unzureichende Token-Berechtigung';
    } else if (error.message.includes('transfer amount exceeds balance')) {
        return 'Unzureichende Token-Balance';
    } else {
        return error.message;
    }
}

module.exports = {
    isValidEthereumAddress,
    isValidPrivateKey,
    formatTokenAmount,
    parseTokenAmount,
    validateEnvironmentVariables,
    handleWeb3Error
};
