require('dotenv').config();
const { Web3 } = require('web3');
const { validateEnvironmentVariables, isValidPrivateKey } = require('./utils');

async function testConnection() {
    try {
        console.log('🔧 Testing Token Transfer Application Setup...\n');
        
        // 1. Umgebungsvariablen prüfen
        console.log('1. Checking environment variables...');
        validateEnvironmentVariables();
        console.log('✅ Environment variables are valid\n');
        
        // 2. Web3 Verbindung testen
        console.log('2. Testing Web3 connection to Base Chain...');
        const web3 = new Web3(process.env.RPC_URL);
        const blockNumber = await web3.eth.getBlockNumber();
        const chainId = await web3.eth.getChainId();
        
        // Base Chain IDs: 8453 (Mainnet), 84532 (Sepolia Testnet)
        const networkName = chainId === 8453n ? 'Base Mainnet' : 
                           chainId === 84532n ? 'Base Sepolia Testnet' : 
                           `Unknown Base Network (Chain ID: ${chainId})`;
        
        console.log(`✅ Connected to ${networkName}. Current block: ${blockNumber}\n`);
        
        // 3. Wallet-Setup testen
        console.log('3. Testing wallet setup...');
        const privateKey = process.env.PRIVATE_KEY;
        const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
        console.log(`✅ Wallet address: ${account.address}\n`);
        
        // 4. ETH Balance prüfen
        console.log('4. Checking ETH balance on Base...');
        const ethBalance = await web3.eth.getBalance(account.address);
        const ethBalanceInEth = web3.utils.fromWei(ethBalance, 'ether');
        console.log(`💰 ETH Balance: ${ethBalanceInEth} ETH`);
        
        // Base hat niedrigere Gas-Kosten als Ethereum Mainnet
        if (parseFloat(ethBalanceInEth) < 0.0001) {
            console.log('⚠️  Warning: Very low ETH balance - consider adding more for gas fees\n');
        } else {
            console.log('✅ ETH balance looks good for Base transactions\n');
        }
        
        // 5. Token Contract testen
        console.log('5. Testing token contract...');
        const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS;
        
        const ERC20_ABI = [
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
            },
            {
                "constant": true,
                "inputs": [],
                "name": "symbol",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function"
            }
        ];
        
        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
        
        try {
            const tokenBalance = await tokenContract.methods.balanceOf(account.address).call();
            const tokenDecimals = await tokenContract.methods.decimals().call();
            const tokenSymbol = await tokenContract.methods.symbol().call();
            
            const readableBalance = parseFloat(tokenBalance) / Math.pow(10, tokenDecimals);
            
            console.log(`✅ Token contract accessible`);
            console.log(`🪙 Token: ${tokenSymbol}`);
            console.log(`🔢 Decimals: ${tokenDecimals}`);
            console.log(`💎 Token Balance: ${readableBalance} ${tokenSymbol}\n`);
            
            if (readableBalance === 0) {
                console.log('⚠️  Warning: No tokens in wallet - transfers will fail until tokens are added\n');
            }
            
        } catch (contractError) {
            console.log(`❌ Token contract error: ${contractError.message}`);
            console.log('Please verify the TOKEN_CONTRACT_ADDRESS is correct\n');
        }
        
        // 6. Setup Summary
        console.log('🎉 Setup Test Complete!');
        console.log('📋 Summary:');
        console.log(`   - Network: ${networkName} (Block ${blockNumber})`);
        console.log(`   - Wallet: ${account.address}`);
        console.log(`   - ETH Balance: ${ethBalanceInEth} ETH`);
        console.log(`   - Token Contract: ${tokenAddress}`);
        
        console.log('\n🚀 Your application is ready to receive webhook requests!');
        console.log('Start the server with: npm start');
        
    } catch (error) {
        console.error('❌ Setup test failed:', error.message);
        
        if (error.message.includes('Fehlende Umgebungsvariablen')) {
            console.log('\n💡 Fix: Copy .env.example to .env and configure your values');
        } else if (error.message.includes('Invalid RPC URL')) {
            console.log('\n💡 Fix: Check your RPC_URL in .env file');
        } else if (error.message.includes('Private Key')) {
            console.log('\n💡 Fix: Check your PRIVATE_KEY in .env file (without 0x prefix)');
        }
        
        process.exit(1);
    }
}

// Script ausführen
testConnection();
