// test-blockchain-data-fixed.js
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://evmrpc.0g.ai');

// Log limit sorunu için küçük blok aralıkları kullan
async function getLogsInBatches(filter, fromBlock, toBlock, batchSize = 500) {
  const allLogs = [];
  
  for (let start = fromBlock; start <= toBlock; start += batchSize) {
    const end = Math.min(start + batchSize - 1, toBlock);
    try {
      const logs = await provider.getLogs({
        ...filter,
        fromBlock: start,
        toBlock: end
      });
      allLogs.push(...logs);
      console.log(`   Blok ${start}-${end}: ${logs.length} log`);
    } catch (error) {
      console.log(`   Blok ${start}-${end}: Hata, daha küçük batch dene`);
      // Daha küçük batch ile tekrar dene
      if (batchSize > 100) {
        const subLogs = await getLogsInBatches(filter, start, end, Math.floor(batchSize / 2));
        allLogs.push(...subLogs);
      }
    }
  }
  
  return allLogs;
}

// Token Discovery - Düzeltilmiş
async function findAllTokens() {
  console.log('\n🔍 TÜM TOKENLAR ARANIYOR...');
  
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = latestBlock - 1000;
  
  // Transfer topic
  const transferTopic = ethers.id('Transfer(address,address,uint256)');
  
  // Batch halinde logları al
  const logs = await getLogsInBatches(
    { topics: [transferTopic] },
    fromBlock,
    latestBlock,
    300 // 300 blokluk batch'ler
  );
  
  // Unique contract adresleri
  const uniqueContracts = new Set(logs.map(log => log.address.toLowerCase()));
  console.log(`✅ Toplam ${uniqueContracts.size} unique contract bulundu`);
  
  // Token bilgilerini topla
  const tokens = [];
  for (const addr of uniqueContracts) {
    try {
      const contract = new ethers.Contract(addr, [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)'
      ], provider);
      
      const [name, symbol] = await Promise.all([
        contract.name().catch(() => null),
        contract.symbol().catch(() => null)
      ]);
      
      if (name && symbol) {
        tokens.push({ address: addr, name, symbol });
        console.log(`   ✅ ${symbol}: ${name}`);
      }
    } catch {}
  }
  
  return tokens;
}

// Holder hesaplama - Düzeltilmiş
async function calculateHolders(tokenAddress, blockRange = 2000) {
  console.log('\n👥 HOLDER HESAPLAMA (Optimized)');
  
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = latestBlock - blockRange;
  
  const contract = new ethers.Contract(tokenAddress, [
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ], provider);
  
  // Batch halinde transfer'leri al
  const transfers = await getLogsInBatches(
    {
      address: tokenAddress,
      topics: [ethers.id('Transfer(address,address,uint256)')]
    },
    fromBlock,
    latestBlock,
    500
  );
  
  // Balance hesapla
  const balances = new Map();
  
  for (const log of transfers) {
    const decoded = contract.interface.parseLog(log);
    const from = decoded.args.from;
    const to = decoded.args.to;
    const value = decoded.args.value;
    
    // FROM
    if (from !== ethers.ZeroAddress) {
      const current = balances.get(from) || 0n;
      balances.set(from, current - value);
    }
    
    // TO
    if (to !== ethers.ZeroAddress) {
      const current = balances.get(to) || 0n;
      balances.set(to, current + value);
    }
  }
  
  // Pozitif balance'ları filtrele
  const holders = Array.from(balances.entries())
    .filter(([_, balance]) => balance > 0n)
    .sort((a, b) => {
      if (b[1] > a[1]) return 1;
      if (b[1] < a[1]) return -1;
      return 0;
    });
  
  console.log(`✅ ${holders.length} holder bulundu`);
  
  return holders;
}

// Ana test
async function runOptimizedTests() {
  console.log('🚀 OPTİMİZE TEST BAŞLIYOR...\n');
  
  // 1. Token bul
  const tokens = await findAllTokens();
  console.log(`\n📊 BULUNAN TOKENLAR: ${tokens.length}`);
  
  // 2. İlk token için holder hesapla
  if (tokens.length > 0) {
    const testToken = tokens[0];
    console.log(`\n📈 ${testToken.symbol} için holder analizi...`);
    const holders = await calculateHolders(testToken.address);
    
    console.log('\nTop 5 Holder:');
    holders.slice(0, 5).forEach(([addr, balance], i) => {
      console.log(`${i+1}. ${addr}: ${ethers.formatUnits(balance, 18)}`);
    });
  }
  
  console.log('\n✅ TEST TAMAMLANDI!');
  console.log('DB kurulumu için hazırız.');
}

runOptimizedTests().catch(console.error);
