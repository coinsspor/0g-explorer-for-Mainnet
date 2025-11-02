import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import Database from 'better-sqlite3';
import fetch from 'node-fetch';

const app = express();

// 🎯 5 RPC ENDPOINT (Auto-rotation)
const RPC_ENDPOINTS = [
  'http://152.53.150.180:59545',
  'http://5.104.81.255:8545',
  'http://199.254.199.233:47545',
  'http://103.75.118.178:59545',
  'http://178.249.213.229:8545'
];

let currentRPCIndex = 0;
let provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[0]);

function switchRPC() {
  const oldIndex = currentRPCIndex;
  currentRPCIndex = (currentRPCIndex + 1) % RPC_ENDPOINTS.length;
  provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[currentRPCIndex]);
  console.log(`🔄 RPC: ${oldIndex + 1} → ${currentRPCIndex + 1}`);
  return provider;
}

async function rpcCall(operation, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries * RPC_ENDPOINTS.length; attempt++) {
    try {
      return await operation(provider);
    } catch (err) {
      lastError = err;
      if (err.message.includes('rate') || err.message.includes('429') || err.message.includes('timeout')) {
        switchRPC();
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

const db = new Database('explorer.db');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = OFF');
db.pragma('cache_size = 10000');
db.pragma('temp_store = MEMORY');

app.use(cors());
app.use(express.json());

const analyticsCache = new Map();

const ipfsFix = (uri) => {
  if (!uri) return null;
  if (uri.startsWith('ipfs://')) {
    return [
      `https://ipfs.io/ipfs/${uri.slice(7)}`,
      `https://cloudflare-ipfs.com/ipfs/${uri.slice(7)}`
    ];
  }
  return [uri];
};

async function fetchJsonWithFallback(urls, timeout = 4000) {
  const supportsAbortTimeout = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal;
  for (const url of urls) {
    try {
      const response = await fetch(url, supportsAbortTimeout ? { signal: AbortSignal.timeout(timeout) } : undefined);
      if (response.ok) return await response.json();
    } catch {}
  }
  return null;
}

// Health check
app.get('/health', async (_req, res) => {
  try {
    const blockNumber = await rpcCall(async (p) => await p.getBlockNumber());
    res.json({
      ok: true,
      blockNumber,
      network: 'mainnet',
      rpc: RPC_ENDPOINTS[currentRPCIndex],
      rpcIndex: currentRPCIndex + 1,
      totalRPCs: RPC_ENDPOINTS.length
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message });
  }
});

// Token list
app.get('/api/tokens', (req, res) => {
  const { type = 'all', search = '' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM tokens WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as count FROM tokens WHERE 1=1';
  const params = [];
  const countParams = [];
  
  if (type !== 'all') {
    query += ' AND type = ?';
    countQuery += ' AND type = ?';
    params.push(type);
    countParams.push(type);
  }
  
  if (search) {
    const searchCondition = ' AND (name LIKE ? OR symbol LIKE ? OR address LIKE ?)';
    query += searchCondition;
    countQuery += searchCondition;
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
    countParams.push(searchParam, searchParam, searchParam);
  }
  
  query += ' COLLATE NOCASE ORDER BY transfer_count DESC LIMIT ? OFFSET ?';
  
  const tokens = db.prepare(query).all(...params, limit, offset);
  const total = db.prepare(countQuery).get(...countParams).count;
  
  const stats = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type='erc20' THEN 1 ELSE 0 END), 0) as erc20_count,
      COALESCE(SUM(CASE WHEN type='erc721' THEN 1 ELSE 0 END), 0) as erc721_count,
      COALESCE(SUM(CASE WHEN type='erc1155' THEN 1 ELSE 0 END), 0) as erc1155_count
    FROM tokens
  `).get();
  
  res.json({
    tokens: tokens || [],
    stats: stats || { erc20_count: 0, erc721_count: 0, erc1155_count: 0 },
    totalPages: Math.max(1, Math.ceil(total / limit)),
    currentPage: page
  });
});

// Token detail
app.get('/api/tokens/:address', async (req, res) => {
  const { address } = req.params;
  
  let token = db.prepare('SELECT * FROM tokens WHERE address = ? COLLATE NOCASE').get(address);
  if (!token) {
    return res.status(404).json({ error: 'Token not found' });
  }
  
  const holders = db.prepare(`
    SELECT holder_address as address, balance, percentage, rank 
    FROM holders 
    WHERE token_address = ? COLLATE NOCASE
    ORDER BY rank ASC 
    LIMIT 10
  `).all(address);
  
  let transfers = [];
  
  try {
    const currentBlock = await rpcCall(async (p) => await p.getBlockNumber());
    
    const logs = await rpcCall(async (p) => await p.getLogs({
      address,
      topics: [ethers.id('Transfer(address,address,uint256)')],
      fromBlock: Math.max(0, currentBlock - 500),
      toBlock: currentBlock
    }));
    
    transfers = logs.slice(0, 20).map(log => {
      try {
        const from = '0x' + log.topics[1].slice(26);
        const to = '0x' + log.topics[2].slice(26);
        const value = log.topics.length === 4 ? BigInt(log.topics[3]).toString() : '0';
        return {
          tx_hash: log.transactionHash,
          from_address: from,
          to_address: to,
          value: value,
          block_number: log.blockNumber
        };
      } catch {
        return null;
      }
    }).filter(t => t !== null);
  } catch (err) {
    console.error(`Token detail error: ${err.message}`);
  }
  
  res.json({
    token: { ...token, address: token.address || address },
    holders: holders || [],
    transfers: transfers || []
  });
});

// Token holders
app.get('/api/tokens/:address/holders', (req, res) => {
  const { address } = req.params;
  const holders = db.prepare(`
    SELECT holder_address as address, balance, percentage, rank 
    FROM holders 
    WHERE token_address = ? COLLATE NOCASE
    ORDER BY rank ASC 
    LIMIT 50
  `).all(address);
  res.json({ holders: holders || [] });
});

// Token analysis
app.get('/api/tokens/:address/analysis', async (req, res) => {
  const { address } = req.params;
  
  try {
    const cacheKey = `analysis_${address}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) {
      return res.json(cached.data);
    }
    
    const token = db.prepare('SELECT * FROM tokens WHERE address = ? COLLATE NOCASE').get(address);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const currentBlock = await rpcCall(async (p) => await p.getBlockNumber());
    const logs = await rpcCall(async (p) => await p.getLogs({
      address,
      topics: [ethers.id('Transfer(address,address,uint256)')],
      fromBlock: Math.max(0, currentBlock - 2000),
      toBlock: currentBlock
    }));
    
    const dayGroups = new Map();
    const senders = new Set();
    const receivers = new Set();
    
    logs.forEach(log => {
      const from = '0x' + log.topics[1].slice(26);
      const to = '0x' + log.topics[2].slice(26);
      senders.add(from);
      receivers.add(to);
      
      const day = Math.floor((currentBlock - log.blockNumber) / 1000);
      if (!dayGroups.has(day)) {
        dayGroups.set(day, { count: 0, senders: new Set(), receivers: new Set() });
      }
      const group = dayGroups.get(day);
      group.count++;
      group.senders.add(from);
      group.receivers.add(to);
    });
    
    const history = Array.from(dayGroups.entries())
      .map(([day, data]) => ({
        date: `Day ${day}`,
        transfer_count: data.count,
        unique_senders: data.senders.size,
        unique_receivers: data.receivers.size
      }))
      .slice(0, 7);
    
    const response = {
      history,
      summary: {
        total_transfers: logs.length,
        unique_senders: senders.size,
        unique_receivers: receivers.size
      }
    };
    
    analyticsCache.set(cacheKey, { data: response, timestamp: Date.now() });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NFT Detail
app.get('/api/tokens/:address/nft/:tokenId', async (req, res) => {
  const { address, tokenId } = req.params;
  
  try {
    const token = db.prepare('SELECT * FROM tokens WHERE address = ? COLLATE NOCASE').get(address);
    if (!token || token.type === 'erc20') {
      return res.status(400).json({ error: 'Not an NFT' });
    }
    
    const contract = new ethers.Contract(address, [
      token.type === 'erc721' ? 'function tokenURI(uint256) view returns (string)' : 'function uri(uint256) view returns (string)',
      'function ownerOf(uint256) view returns (address)'
    ], provider);
    
    let uri = await rpcCall(async () => {
      if (token.type === 'erc721') {
        return await contract.tokenURI(tokenId).catch(() => null);
      } else {
        const u = await contract.uri(tokenId).catch(() => null);
        return u ? u.replace('{id}', tokenId.toString(16).padStart(64, '0')) : null;
      }
    });
    
    let owner;
    try {
      owner = await rpcCall(async () => await contract.ownerOf(tokenId));
    } catch {}
    
    let metadata = {};
    let imageUrl = 'https://via.placeholder.com/400';
    
    if (uri) {
      const urls = ipfsFix(uri);
      metadata = await fetchJsonWithFallback(urls, 5000) || {};
      if (metadata.image) {
        const imageUrls = ipfsFix(metadata.image);
        imageUrl = imageUrls[0];
      }
    }
    
    const currentBlock = await rpcCall(async (p) => await p.getBlock('latest'));
    const mintedTime = new Date(currentBlock.timestamp * 1000).toLocaleString();
    
    res.json({
      tokenId,
      name: metadata.name || `${token.symbol} #${tokenId}`,
      description: metadata.description || `${token.name} NFT`,
      image: imageUrl,
      originalContentUrl: uri,
      owner: owner || ethers.ZeroAddress,
      tokenStandard: token.type.toUpperCase(),
      contractAddress: address,
      contractInfo: `${token.name} (${token.symbol})`,
      creator: token.deployer || 'Unknown',
      mintedTime,
      metadata
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NFT Inventory
app.get('/api/tokens/:address/inventory', async (req, res) => {
  const { address } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  
  try {
    const token = db.prepare('SELECT type FROM tokens WHERE address = ? COLLATE NOCASE').get(address);
    if (!token || token.type === 'erc20') {
      return res.status(400).json({ error: 'Not an NFT collection' });
    }
    
    const currentBlock = await rpcCall(async (p) => await p.getBlockNumber());
    const nftMap = new Map();
    
    const logs = await rpcCall(async (p) => await p.getLogs({
      address,
      fromBlock: Math.max(0, currentBlock - 3000),
      toBlock: currentBlock
    }));
    
    logs.forEach(log => {
      const topic0 = log.topics[0];
      
      if (token.type === 'erc721' && log.topics.length === 4) {
        const tokenId = BigInt(log.topics[3]).toString();
        const to = '0x' + log.topics[2].slice(26);
        if (to !== ethers.ZeroAddress) {
          nftMap.set(tokenId, { owner: to, block: log.blockNumber });
        }
      } else if (token.type === 'erc1155') {
        const sig1155s = ethers.id('TransferSingle(address,address,address,uint256,uint256)');
        if (topic0 === sig1155s) {
          const to = '0x' + log.topics[3].slice(26);
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256', 'uint256'], log.data);
          const tokenId = decoded[0].toString();
          if (to !== ethers.ZeroAddress) {
            nftMap.set(tokenId, { owner: to, block: log.blockNumber });
          }
        }
      }
    });
    
    const contract = new ethers.Contract(address, [
      token.type === 'erc721' ? 'function tokenURI(uint256) view returns (string)' : 'function uri(uint256) view returns (string)'
    ], provider);
    
    const nfts = [];
    const nftEntries = Array.from(nftMap).slice(0, limit);
    
    const metadataPromises = nftEntries.map(async ([tokenId, data]) => {
      try {
        let uri = await rpcCall(async () => {
          if (token.type === 'erc721') {
            return await contract.tokenURI(tokenId).catch(() => null);
          } else {
            const u = await contract.uri(tokenId).catch(() => null);
            return u ? u.replace('{id}', tokenId.toString(16).padStart(64, '0')) : null;
          }
        });
        
        let metadata = {};
        let imageUrl = 'https://via.placeholder.com/400';
        
        if (uri) {
          const urls = ipfsFix(uri);
          metadata = await fetchJsonWithFallback(urls, 2000) || {};
          if (metadata.image) {
            const imageUrls = ipfsFix(metadata.image);
            imageUrl = imageUrls[0];
          }
        }
        
        return {
          tokenId,
          name: metadata.name || `NFT #${tokenId}`,
          image: imageUrl,
          owner: data.owner,
          attributes: metadata.attributes || []
        };
      } catch {
        return {
          tokenId,
          name: `NFT #${tokenId}`,
          image: 'https://via.placeholder.com/400',
          owner: data.owner,
          attributes: []
        };
      }
    });
    
    const results = await Promise.all(metadataPromises);
    nfts.push(...results);
    
    res.json({ nfts, total: nftMap.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-update
async function autoUpdate() {
  console.log('🔄 Auto-update: Checking...');
  try {
    const currentBlock = await rpcCall(async (p) => await p.getBlockNumber());
    const tokens = db.prepare('SELECT address, type, transfer_count FROM tokens ORDER BY transfer_count DESC LIMIT 10').all();
    
    for (const token of tokens) {
      try {
        const logs = await rpcCall(async (p) => await p.getLogs({
          address: token.address,
          topics: [ethers.id('Transfer(address,address,uint256)')],
          fromBlock: Math.max(0, currentBlock - 50),
          toBlock: currentBlock
        }));
        
        if (logs.length > 0) {
          const holders = new Set();
          logs.forEach(log => {
            const to = '0x' + log.topics[2].slice(26);
            if (to !== ethers.ZeroAddress) holders.add(to);
          });
          
          db.prepare(`
            UPDATE tokens 
            SET transfer_count = transfer_count + ?, 
                holder_count = holder_count + ?,
                last_update = ? 
            WHERE address = ?
          `).run(logs.length, holders.size, Date.now(), token.address);
          
          console.log(`  ✅ ${token.address.slice(0, 10)}: +${logs.length} tx`);
        }
      } catch (err) {
        console.error(`  ⚠️  ${token.address}: ${err.message.slice(0, 30)}`);
      }
      await new Promise(r => setTimeout(r, 100));
    }
    console.log('✅ Auto-update done');
  } catch (err) {
    console.error('❌ Auto-update error:', err.message);
  }
}

setInterval(autoUpdate, 60000);
setTimeout(autoUpdate, 10000);

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of analyticsCache.entries()) {
    if (now - value.timestamp > 600000) {
      analyticsCache.delete(key);
    }
  }
  console.log('🧹 Cache cleaned');
}, 600000);

const PORT = 3101;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 0G Token Explorer API - MAINNET');
  console.log('='.repeat(60));
  console.log(`✅ Server: http://0.0.0.0:${PORT}`);
  console.log(`📡 RPC: ${RPC_ENDPOINTS[currentRPCIndex]}`);
  console.log(`🔄 Pool: ${RPC_ENDPOINTS.length} endpoints`);
  console.log(`⏱️  Auto-update: Every 60 sec`);
  console.log('\n📊 Features:');
  console.log('   ✓ ERC20/ERC721/ERC1155');
  console.log('   ✓ Smart RPC rotation');
  console.log('   ✓ Live updates');
  console.log('   ✓ NFT support');
  console.log('='.repeat(60) + '\n');
});
