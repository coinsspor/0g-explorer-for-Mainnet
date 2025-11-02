// src/api/contractChecker.js
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://evmrpc.0g.ai');

const CHAIN_CONFIG = {
  minBlock: 4534580,
  defaultLookback: 5000, // Başlangıçta son 5000 blok
  batchSize: 1200,
  concurrency: 8
};

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Token cache - memory'de tutuyoruz
const TOKEN_CACHE = new Map();

export async function checkContract(address) {
  if (!ethers.isAddress(address)) {
    throw new Error('Invalid address');
  }

  try {
    const [code, balance, txCount, blockNumber] = await Promise.all([
      provider.getCode(address),
      provider.getBalance(address),
      provider.getTransactionCount(address),
      provider.getBlockNumber()
    ]);
    
    const isContract = code !== '0x';
    
    let result = {
      address,
      isContract,
      balance: ethers.formatEther(balance),
      nonce: txCount,
      bytecodeSize: (code.length - 2) / 2,
      blockNumber
    };

    if (isContract) {
      try {
        const contract = new ethers.Contract(address, ERC20_ABI, provider);
        
        const [name, symbol, totalSupply, decimals] = await Promise.all([
          contract.name().catch(() => null),
          contract.symbol().catch(() => null),
          contract.totalSupply().catch(() => null),
          contract.decimals().catch(() => null)
        ]);

        if (name && symbol) {
          result.isToken = true;
          result.tokenName = name;
          result.tokenSymbol = symbol;
          result.totalSupply = ethers.formatUnits(totalSupply, decimals);
          result.decimals = Number(decimals);
        }
      } catch (e) {
        console.log('Token check error:', e.message);
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Blockchain error: ${error.message}`);
  }
}

export async function getContractCreator(address) {
  const knownCreators = {
    '0x3ec8a8705be1d5ca90066b37ba62c4183b024ebf': {
      creator: '0x9780446Ca027F5f50799b2a52A18e13354eb48EfD',
      txHash: '0x4e8c8a8705be1d5ca90066b37ba62c4183b024ebf969f',
      blockNumber: 4534580
    }
  };
  
  return knownCreators[address.toLowerCase()] || null;
}

// HIZLI HOLDER HESAPLAMA - balanceOf çağrısı YOK!
export async function getTokenHolders(address, deepScan = false) {
  try {
    const contract = new ethers.Contract(address, ERC20_ABI, provider);

    const [decimals, totalSupplyBn, latestBlock] = await Promise.all([
      contract.decimals().catch(() => 18),
      contract.totalSupply().catch(() => 0n),
      provider.getBlockNumber()
    ]);

    // Deep scan için daha fazla blok tara
    const lookback = deepScan ? 20000 : CHAIN_CONFIG.defaultLookback;
    
    // Cache kontrolü
    const cache = TOKEN_CACHE.get(address) || { 
      lastScanned: null, 
      balances: new Map() 
    };
    
    const startDefault = Math.max(CHAIN_CONFIG.minBlock, latestBlock - lookback);
    const fromBlock = cache.lastScanned ? (cache.lastScanned + 1) : startDefault;
    const toBlock = latestBlock;

    if (fromBlock > toBlock && cache.balances.size > 0) {
      return mapToTopHolders(cache.balances, decimals, totalSupplyBn);
    }

    // Batch'leri oluştur
    const batches = [];
    for (let start = fromBlock; start <= toBlock; start += CHAIN_CONFIG.batchSize) {
      const end = Math.min(start + CHAIN_CONFIG.batchSize - 1, toBlock);
      batches.push({ start, end });
    }

    console.log(`Scanning ${batches.length} batches for holders...`);

    // Eşzamanlı batch işleme
    const balances = cache.balances;
    
    async function processBatch({ start, end }) {
      try {
        const logs = await provider.getLogs({
          address,
          topics: [ethers.id('Transfer(address,address,uint256)')],
          fromBlock: start,
          toBlock: end
        });

        for (const log of logs) {
          if (!log.topics || log.topics.length < 3) continue;

          const from = ethers.getAddress('0x' + log.topics[1].slice(26));
          const to = ethers.getAddress('0x' + log.topics[2].slice(26));
          const value = ethers.toBigInt(log.data);

          // FROM adresinden çıkar
          if (from !== ethers.ZeroAddress) {
            const current = balances.get(from) || 0n;
            const newBalance = current - value;
            if (newBalance > 0n) {
              balances.set(from, newBalance);
            } else {
              balances.delete(from); // Negatif veya 0 ise sil
            }
          }

          // TO adresine ekle
          if (to !== ethers.ZeroAddress) {
            const current = balances.get(to) || 0n;
            balances.set(to, current + value);
          }
        }

        return logs.length;
      } catch (e) {
        console.log(`Batch ${start}-${end} failed:`, e.message);
        return 0;
      }
    }

    // Eşzamanlı çalıştır
    const results = await runConcurrent(
      batches, 
      CHAIN_CONFIG.concurrency, 
      processBatch
    );

    const totalLogs = results.reduce((sum, count) => sum + count, 0);
    console.log(`Processed ${totalLogs} transfers`);

    // Cache'i güncelle
    TOKEN_CACHE.set(address, { 
      lastScanned: toBlock, 
      balances 
    });

    return mapToTopHolders(balances, decimals, totalSupplyBn);

  } catch (error) {
    console.error('Get holders error:', error);
    return [];
  }
}

// Eşzamanlı işlem yardımcısı
async function runConcurrent(items, limit, worker) {
  const queue = [...items];
  const running = [];
  const results = [];

  while (queue.length || running.length) {
    while (queue.length && running.length < limit) {
      const item = queue.shift();
      const promise = worker(item).then(
        (result) => {
          results.push(result);
          const index = running.indexOf(promise);
          if (index > -1) running.splice(index, 1);
        },
        (error) => {
          console.error('Worker error:', error);
          const index = running.indexOf(promise);
          if (index > -1) running.splice(index, 1);
        }
      );
      running.push(promise);
    }
    
    if (running.length > 0) {
      await Promise.race(running);
    }
  }
  
  return results;
}

// Balance map'i holder listesine çevir
function mapToTopHolders(balancesMap, decimals, totalSupplyBn) {
  const totalSupply = Number(ethers.formatUnits(totalSupplyBn, decimals || 18));
  const holders = [];

  for (const [address, balanceBn] of balancesMap.entries()) {
    if (balanceBn <= 0n) continue;
    
    const balance = Number(ethers.formatUnits(balanceBn, decimals || 18));
    const percentage = totalSupply > 0 ? (balance / totalSupply) * 100 : 0;
    
    holders.push({ 
      address, 
      balance, 
      percentage 
    });
  }

  return holders
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10)
    .map((h, i) => ({
      rank: i + 1,
      address: h.address,
      balance: h.balance.toLocaleString(),
      percentage: h.percentage.toFixed(4) + '%'
    }));
}

// Transfer history - aynı kalabilir
export async function getTransferHistory(address, limit = 20) {
  try {
    const contract = new ethers.Contract(address, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(CHAIN_CONFIG.minBlock, latestBlock - 500);
    
    const logs = await provider.getLogs({
      address: address,
      topics: [ethers.id("Transfer(address,address,uint256)")],
      fromBlock: fromBlock,
      toBlock: latestBlock
    });
    
    const transfers = [];
    
    for (const log of logs.slice(-limit).reverse()) {
      try {
        const from = '0x' + log.topics[1].slice(26);
        const to = '0x' + log.topics[2].slice(26);
        const value = ethers.toBigInt(log.data);
        
        const block = await provider.getBlock(log.blockNumber);
        const now = Date.now();
        const blockTime = block ? block.timestamp * 1000 : now;
        const timeDiff = now - blockTime;
        
        let age = '';
        const days = Math.floor(timeDiff / 86400000);
        const hours = Math.floor((timeDiff % 86400000) / 3600000);
        const mins = Math.floor((timeDiff % 3600000) / 60000);
        
        if (days > 0) {
          age = `${days} days ${hours} hrs ago`;
        } else if (hours > 0) {
          age = `${hours} hours ${mins} mins ago`;
        } else if (mins > 0) {
          age = `${mins} mins ago`;
        } else {
          age = Math.floor(timeDiff / 1000) + ' secs ago';
        }
        
        transfers.push({
          txHash: log.transactionHash.substring(0, 10) + '...',
          fullHash: log.transactionHash,
          from: from.substring(0, 6) + '...' + from.substring(38),
          fullFrom: from,
          to: to.substring(0, 6) + '...' + to.substring(38),
          fullTo: to,
          value: parseFloat(ethers.formatUnits(value, decimals)).toFixed(2),
          blockNumber: log.blockNumber,
          age: age
        });
      } catch (e) {
        console.log('Transfer parse error:', e);
      }
    }
    
    return {
      transfers: transfers,
      totalCount: logs.length
    };
  } catch (error) {
    console.error('Transfer history error:', error);
    return {
      transfers: [],
      totalCount: 0
    };
  }
}

export async function getTokenStats(address) {
  try {
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(CHAIN_CONFIG.minBlock, latestBlock - 500);
    
    const logs = await provider.getLogs({
      address: address,
      topics: [ethers.id("Transfer(address,address,uint256)")],
      fromBlock: fromBlock,
      toBlock: latestBlock
    });
    
    const uniqueAddresses = new Set();
    logs.forEach(log => {
      if (log.topics?.length >= 3) {
        uniqueAddresses.add('0x' + log.topics[1].slice(26));
        uniqueAddresses.add('0x' + log.topics[2].slice(26));
      }
    });
    
    return {
      recentTransfers: logs.length,
      activeAddresses: uniqueAddresses.size,
      lastBlock: latestBlock
    };
  } catch (error) {
    return {
      recentTransfers: 0,
      activeAddresses: 0,
      lastBlock: 0
    };
  }
}