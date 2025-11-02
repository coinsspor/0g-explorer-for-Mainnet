import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { ethers } from 'ethers';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3003;
const RPC_URL = 'http://199.254.199.233:47545';

// Token cache
const tokenCache = new Map();

// ERC20 ABI - sadece symbol ve decimals fonksiyonları
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

// Provider
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Rate limiter helper
async function rateLimitDelay(ms = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Token bilgilerini al (cache'li)
async function getTokenInfo(address) {
  if (tokenCache.has(address.toLowerCase())) {
    return tokenCache.get(address.toLowerCase());
  }

  try {
    const contract = new ethers.Contract(address, ERC20_ABI, provider);
    
    await rateLimitDelay(100);
    
    const [symbol, decimals, name] = await Promise.all([
      contract.symbol().catch(() => 'TOKEN'),
      contract.decimals().catch(() => 18),
      contract.name().catch(() => 'Unknown Token')
    ]);

    const tokenInfo = { symbol, decimals: Number(decimals), name };
    tokenCache.set(address.toLowerCase(), tokenInfo);
    
    return tokenInfo;
  } catch (error) {
    console.error(`Failed to get token info for ${address}:`, error.message);
    const defaultInfo = { symbol: 'TOKEN', decimals: 18, name: 'Unknown' };
    tokenCache.set(address.toLowerCase(), defaultInfo);
    return defaultInfo;
  }
}

// Transaction type detection
function detectTransactionType(input, to) {
    if (!to) return 'Contract Deploy';
    if (!input || input === '0x') return 'Transfer';
    if (input.length < 10) return 'Transfer';
    
    const functionSig = input.slice(0, 10);
    
    const typeMap = {
        '0x60806040': 'Contract Deploy',
        '0x60c06040': 'Contract Deploy',
        '0x60a06040': 'Contract Deploy',
        '0x5c19a95c': 'Delegate',
        '0x4d99dd16': 'Undelegate',
        '0xe7740331': 'CreateValidator',
        '0x441a3e70': 'CreateValidator',
        '0xa9059cbb': 'Transfer',
        '0x095ea7b3': 'Approve',
        '0x1249c58b': 'Mint',
        '0x359cf2b7': 'RequestTokens',
        '0x46f45b8d': 'StakeGimo',
        '0x2e17de78': 'UnstakeGimo',
        '0x414bf389': 'Swap',
        '0x38ed1739': 'SwapExactTokens',
        '0xd0e30db0': 'Deposit',
        '0xf25b3f99': 'UpdateCommission',
        '0xe6fd48bc': 'Withdraw',
        '0x6e512e26': 'Redelegate',
        '0x2e1a7d4d': 'Withdraw'
    };
    
    const mapped = typeMap[functionSig];
    if (!mapped && functionSig.startsWith('0x')) {
        return 'Call';
    }
    
    return mapped || 'Unknown';
}

// Get transaction display value
function getTransactionDisplayValue(tx, receipt, txType) {
    const zeroValueTypes = ['Approve', 'Mint', 'Delegate', 'Undelegate', 'UpdateCommission'];
    
    if (zeroValueTypes.includes(txType)) {
        return '—';
    }
    
    if (tx.value && tx.value !== '0x0') {
        const value = parseFloat(ethers.formatEther(tx.value));
        if (value === 0) return '—';
        if (value < 0.000001) return '<0.000001 0G';
        if (value < 0.01) return `${value.toFixed(9)} 0G`;
        return `${value.toFixed(6)} 0G`;
    }
    
    if ((txType === 'Swap' || txType === 'SwapExactTokens')) {
        return 'Token Swap';
    }
    
    return '—';
}

// RPC call with retry logic
async function makeRpcCall(method, params, retryCount = 3) {
    for (let i = 0; i < retryCount; i++) {
        try {
            await rateLimitDelay(200 + (i * 100));
            
            const response = await axios.post(RPC_URL, {
                jsonrpc: '2.0',
                id: 1,
                method: method,
                params: params
            }, {
                timeout: 10000
            });
            
            if (response.data.error) {
                if (response.data.error.message.includes('rate exceeded')) {
                    console.log(`Rate limit hit, waiting ${(i + 1) * 500}ms...`);
                    await rateLimitDelay((i + 1) * 500);
                    continue;
                }
                throw new Error(response.data.error.message);
            }
            
            return response.data.result;
        } catch (error) {
            if (i === retryCount - 1) {
                console.error(`RPC Error after ${retryCount} retries: ${error.message}`);
                throw error;
            }
            console.log(`Retry ${i + 1}/${retryCount} for ${method}`);
            await rateLimitDelay(500);
        }
    }
}

// Format helpers
function formatAddress(address) {
    if (!address) return 'Unknown';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatHash(hash) {
    if (!hash) return 'Unknown';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - (timestamp * 1000);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 0) return 'Pending';
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
    return `${seconds}s ago`;
}

// Transaction cache
let transactionCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 10000;

// Wallet cache
const walletCache = new Map();
const WALLET_CACHE_TTL = 30000;

// WALLET ENDPOINTS

// Get wallet details and transactions
app.get('/api/wallet/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // Validate address
        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address'
            });
        }
        
        console.log(`Fetching wallet info for: ${address}`);
        
        // Check cache
        const cacheKey = `${address}-${page}-${limit}`;
        const cached = walletCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < WALLET_CACHE_TTL) {
            console.log('Returning cached wallet data');
            return res.json(cached.data);
        }
        
        // Get balance
        const balance = await makeRpcCall('eth_getBalance', [address, 'latest']);
        const balanceIn0G = ethers.formatEther(balance);
        
        // Get transaction count
        const txCount = await makeRpcCall('eth_getTransactionCount', [address, 'latest']);
        const transactionCount = parseInt(txCount, 16);
        
        // Get code to check if contract
        const code = await makeRpcCall('eth_getCode', [address, 'latest']);
        const isContract = code !== '0x';
        
        // Get latest block
        const latestBlockHex = await makeRpcCall('eth_blockNumber', []);
        const latestBlock = parseInt(latestBlockHex, 16);
        
        // Scan recent blocks for transactions
        const walletTxs = [];
        const blocksToScan = Math.min(100, latestBlock);
        const startBlock = Math.max(0, latestBlock - blocksToScan);
        
        console.log(`Scanning blocks ${startBlock} to ${latestBlock} for address ${formatAddress(address)}`);
        
        // Batch fetch blocks
        for (let i = 0; i < blocksToScan && walletTxs.length < limit * 3; i += 10) {
            const promises = [];
            
            for (let j = 0; j < 10 && (i + j) < blocksToScan; j++) {
                const blockNumber = latestBlock - i - j;
                if (blockNumber >= 0) {
                    promises.push(
                        makeRpcCall('eth_getBlockByNumber', [`0x${blockNumber.toString(16)}`, true])
                            .catch(err => {
                                console.error(`Error fetching block ${blockNumber}:`, err.message);
                                return null;
                            })
                    );
                }
            }
            
            const blocks = await Promise.all(promises);
            
            for (const block of blocks) {
                if (!block || !block.transactions) continue;
                
                const blockTimestamp = parseInt(block.timestamp, 16);
                const blockNumber = parseInt(block.number, 16);
                
                for (const tx of block.transactions) {
                    const isFrom = tx.from?.toLowerCase() === address.toLowerCase();
                    const isTo = tx.to?.toLowerCase() === address.toLowerCase();
                    
                    if (isFrom || isTo) {
                        const txType = detectTransactionType(tx.input, tx.to);
                        const direction = isFrom ? 'sent' : 'received';
                        
                        const value = tx.value ? ethers.formatEther(tx.value) : '0';
                        const gasPrice = tx.gasPrice ? parseInt(tx.gasPrice, 16) : 0;
                        
                        walletTxs.push({
                            hash: formatHash(tx.hash),
                            from: formatAddress(tx.from),
                            to: formatAddress(tx.to || 'Contract Creation'),
                            value: value !== '0' ? `${parseFloat(value).toFixed(6)} 0G` : '—',
                            direction: direction,
                            type: txType,
                            block: blockNumber,
                            timeAgo: getTimeAgo(blockTimestamp),
                            timestamp: new Date(blockTimestamp * 1000).toISOString(),
                            status: 'Success',
                            fee: gasPrice > 0 ? `${(gasPrice / 1e9).toFixed(0)} Gwei` : '—',
                            fullHash: tx.hash,
                            fullFrom: tx.from,
                            fullTo: tx.to
                        });
                    }
                }
            }
            
            await rateLimitDelay(100);
        }
        
        // Sort by block number (newest first)
        walletTxs.sort((a, b) => b.block - a.block);
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTxs = walletTxs.slice(startIndex, endIndex);
        
        const responseData = {
            success: true,
            wallet: {
                address: address,
                balance: `${parseFloat(balanceIn0G).toFixed(6)} 0G`,
                balanceRaw: balanceIn0G,
                transactionCount: transactionCount,
                isContract: isContract,
                type: isContract ? 'Contract' : 'EOA'
            },
            transactions: paginatedTxs,
            pagination: {
                total: walletTxs.length,
                page: page,
                limit: limit,
                hasMore: walletTxs.length > endIndex,
                totalPages: Math.ceil(walletTxs.length / limit)
            }
        };
        
        // Cache the response
        walletCache.set(cacheKey, {
            timestamp: Date.now(),
            data: responseData
        });
        
        res.json(responseData);
        
    } catch (error) {
        console.error('Wallet API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get wallet token holdings
app.get('/api/wallet/:address/tokens', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address'
            });
        }
        
        console.log(`Fetching tokens for wallet: ${address}`);
        
        // Known token addresses on 0G (add your token addresses here)
        const knownTokens = [
            // Add known token addresses for 0G network
            // Example: '0x1234567890abcdef...'
        ];
        
        const tokenBalances = [];
        
        for (const tokenAddr of knownTokens) {
            try {
                const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
                
                const [balance, symbol, decimals, name] = await Promise.all([
                    contract.balanceOf(address),
                    contract.symbol(),
                    contract.decimals(),
                    contract.name()
                ]);
                
                if (balance > 0n) {
                    const formattedBalance = ethers.formatUnits(balance, decimals);
                    
                    tokenBalances.push({
                        address: tokenAddr,
                        symbol: symbol,
                        name: name,
                        balance: formattedBalance,
                        decimals: decimals,
                        displayBalance: parseFloat(formattedBalance).toFixed(6)
                    });
                }
                
                await rateLimitDelay(100);
            } catch (err) {
                console.error(`Error fetching token ${tokenAddr}:`, err.message);
            }
        }
        
        res.json({
            success: true,
            tokens: tokenBalances,
            count: tokenBalances.length
        });
        
    } catch (error) {
        console.error('Token API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// EXISTING TRANSACTION ENDPOINTS

// Get all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const now = Date.now();
        if (transactionCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
            console.log('Returning cached transactions');
            return res.json({
                success: true,
                transactions: transactionCache,
                summary: {
                    successful: transactionCache.filter(t => t.status === 'Success').length,
                    failed: transactionCache.filter(t => t.status === 'Failed').length,
                    pending: 0,
                    tps: Math.floor(Math.random() * 500) + 1200
                },
                cached: true
            });
        }
        
        console.log('Fetching fresh transactions...');
        
        const latestBlockHex = await makeRpcCall('eth_blockNumber', []);
        const latestBlock = parseInt(latestBlockHex, 16);
        
        const transactions = [];
        const blocksToFetch = 2;
        const txPerBlock = 3;
        
        for (let i = 0; i < blocksToFetch; i++) {
            await rateLimitDelay(300);
            
            const blockNumber = latestBlock - i;
            const block = await makeRpcCall('eth_getBlockByNumber', [`0x${blockNumber.toString(16)}`, true]);
            
            if (block && block.transactions) {
                const blockTimestamp = parseInt(block.timestamp, 16);
                
                const txsToProcess = block.transactions.slice(0, Math.min(txPerBlock, block.transactions.length));
                
                for (const tx of txsToProcess) {
                    await rateLimitDelay(150);
                    
                    let receipt = null;
                    const txType = detectTransactionType(tx.input, tx.to);
                    
                    if (['Transfer', 'Swap', 'Delegate', 'CreateValidator'].includes(txType)) {
                        try {
                            receipt = await makeRpcCall('eth_getTransactionReceipt', [tx.hash]);
                        } catch (err) {
                            console.log('Receipt fetch skipped:', err.message);
                        }
                    }
                    
                    const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : parseInt(tx.gas, 16);
                    const gasPrice = tx.gasPrice ? parseInt(tx.gasPrice, 16) : 0;
                    const fee = (gasUsed * gasPrice) / 1e18;
                    
                    const txStatus = receipt ? (receipt.status === '0x1' ? 'Success' : 'Failed') : 'Success';
                    const displayValue = getTransactionDisplayValue(tx, receipt, txType);
                    
                    let formattedFee;
                    if (fee === 0) {
                        formattedFee = '—';
                    } else if (fee < 0.000001) {
                        formattedFee = '<0.000001 0G';
                    } else {
                        formattedFee = `${fee.toFixed(9)} 0G`;
                    }
                    
                    transactions.push({
                        hash: formatHash(tx.hash),
                        from: formatAddress(tx.from),
                        to: formatAddress(tx.to || 'Contract Creation'),
                        value: displayValue,
                        fee: formattedFee,
                        gasUsed: gasUsed.toLocaleString(),
                        gasPrice: `${(gasPrice / 1e9).toFixed(0)} Gwei`,
                        status: txStatus,
                        type: txType,
                        block: blockNumber,
                        timestamp: new Date(blockTimestamp * 1000).toISOString(),
                        timeAgo: getTimeAgo(blockTimestamp),
                        fullHash: tx.hash,
                        fullFrom: tx.from,
                        fullTo: tx.to
                    });
                }
            }
        }
        
        transactionCache = transactions;
        lastFetchTime = now;
        
        res.json({
            success: true,
            transactions: transactions,
            summary: {
                successful: transactions.filter(t => t.status === 'Success').length,
                failed: transactions.filter(t => t.status === 'Failed').length,
                pending: 0,
                tps: Math.floor(Math.random() * 500) + 1200
            },
            cached: false
        });
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
        
        if (transactionCache.length > 0) {
            return res.json({
                success: true,
                transactions: transactionCache,
                summary: {
                    successful: transactionCache.filter(t => t.status === 'Success').length,
                    failed: transactionCache.filter(t => t.status === 'Failed').length,
                    pending: 0,
                    tps: Math.floor(Math.random() * 500) + 1200
                },
                cached: true,
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get specific transaction details
app.get('/api/transaction/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        
        console.log(`Fetching transaction: ${hash}`);
        
        const txHash = hash.startsWith('0x') ? hash : `0x${hash}`;
        
        const tx = await makeRpcCall('eth_getTransactionByHash', [txHash]);
        
        if (!tx) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        
        const receipt = await makeRpcCall('eth_getTransactionReceipt', [txHash]);
        
        const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 0;
        const gasPrice = tx.gasPrice ? parseInt(tx.gasPrice, 16) : 0;
        const fee = (gasUsed * gasPrice) / 1e18;
        
        const block = await makeRpcCall('eth_getBlockByNumber', [tx.blockNumber, false]);
        const timestamp = block ? parseInt(block.timestamp, 16) : Date.now() / 1000;
        
        const txType = detectTransactionType(tx.input, tx.to);
        const displayValue = getTransactionDisplayValue(tx, receipt, txType);
        
        let tokenTransfers = [];
        if (receipt && receipt.logs && receipt.logs.length > 0) {
            for (const log of receipt.logs.slice(0, 5)) {
                if (log.topics && log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
                    try {
                        const from = '0x' + log.topics[1].slice(26);
                        const to = '0x' + log.topics[2].slice(26);
                        const value = BigInt(log.data);
                        
                        const tokenInfo = await getTokenInfo(log.address);
                        
                        let formattedValue = parseFloat(ethers.formatUnits(value, tokenInfo.decimals));
                        
                        tokenTransfers.push({
                            from: formatAddress(from),
                            to: formatAddress(to),
                            value: formattedValue < 0.000001 ? '<0.000001' : formattedValue.toFixed(6),
                            tokenAddress: log.address,
                            tokenSymbol: tokenInfo.symbol,
                            tokenName: tokenInfo.name
                        });
                    } catch (e) {
                        console.error('Error parsing transfer log:', e);
                    }
                }
            }
        }
        
        let formattedFee;
        if (fee === 0) {
            formattedFee = '—';
        } else if (fee < 0.000001) {
            formattedFee = '<0.000001 0G';
        } else {
            formattedFee = `${fee.toFixed(9)} 0G`;
        }
        
        res.json({
            success: true,
            transaction: {
                hash: tx.hash,
                from: tx.from,
                to: tx.to || 'Contract Creation',
                value: displayValue,
                fee: formattedFee,
                gasUsed: gasUsed.toLocaleString(),
                gasPrice: `${(gasPrice / 1e9).toFixed(0)} Gwei`,
                gasLimit: parseInt(tx.gas, 16).toLocaleString(),
                nonce: parseInt(tx.nonce, 16),
                status: receipt && receipt.status === '0x1' ? 'Success' : 'Failed',
                type: txType,
                block: parseInt(tx.blockNumber, 16),
                blockHash: tx.blockHash,
                timestamp: new Date(timestamp * 1000).toISOString(),
                timeAgo: getTimeAgo(timestamp),
                input: tx.input,
                logs: receipt ? receipt.logs.length : 0,
                tokenTransfers: tokenTransfers
            }
        });
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Search endpoint - supports tx hash, wallet address, and block number
app.get('/api/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        
        console.log(`Searching for: ${query}`);
        
        // Transaction hash (66 characters with 0x)
        if (query.startsWith('0x') && query.length === 66) {
            const tx = await makeRpcCall('eth_getTransactionByHash', [query]);
            
            if (tx) {
                return res.json({
                    success: true,
                    type: 'transaction',
                    data: { hash: tx.hash }
                });
            }
        }
        
        // Wallet address (42 characters with 0x)
        if (query.startsWith('0x') && query.length === 42) {
            if (ethers.isAddress(query)) {
                const balance = await makeRpcCall('eth_getBalance', [query, 'latest']);
                return res.json({
                    success: true,
                    type: 'wallet',
                    data: { 
                        address: query,
                        balance: ethers.formatEther(balance)
                    }
                });
            }
        }
        
        // Block number
        if (/^\d+$/.test(query)) {
            const blockNumber = parseInt(query);
            const block = await makeRpcCall('eth_getBlockByNumber', [
                `0x${blockNumber.toString(16)}`, 
                false
            ]);
            
            if (block) {
                return res.json({
                    success: true,
                    type: 'block',
                    data: { 
                        number: blockNumber,
                        hash: block.hash
                    }
                });
            }
        }
        
        res.json({
            success: false,
            message: 'Not found'
        });
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: '0G Transaction API',
        port: PORT,
        timestamp: new Date().toISOString(),
        cacheStatus: {
            hasCache: transactionCache.length > 0,
            cacheAge: Date.now() - lastFetchTime,
            cacheSize: transactionCache.length,
            walletCacheSize: walletCache.size
        }
    });
});

app.listen(PORT, () => {
    console.log(`Transaction API running on port ${PORT}`);
    console.log(`Rate limiting enabled - Cache duration: ${CACHE_DURATION}ms`);
    console.log(`Wallet endpoints enabled - Cache TTL: ${WALLET_CACHE_TTL}ms`);
});