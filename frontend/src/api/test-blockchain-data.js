// test-blockchain-data.js
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://evmrpc.0g.ai');

// Test edilecek adresler
const TEST_ADDRESSES = {
  usdt: '0x3ec8a8705be1d5ca90066b37ba62c4183b024ebf',
  // Başka bilinen token varsa ekle
};

// ABI'ler
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const ERC721_ABI = [
  'function supportsInterface(bytes4) view returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

const ERC1155_ABI = [
  'function supportsInterface(bytes4) view returns (bool)',
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
];

// Test Fonksiyonları
console.log('🚀 Blockchain Data Test Başlıyor...\n');

// 1. TOKEN LİSTESİ İÇİN GEREKLİ VERİLER
async function testTokenListData() {
  console.log('📋 TEST 1: Token List için Gerekli Veriler');
  console.log('==========================================');
  
  const address = TEST_ADDRESSES.usdt;
  const contract = new ethers.Contract(address, ERC20_ABI, provider);
  
  try {
    // ContractChecker.tsx Token List'te gösterilen veriler:
    // - name, symbol, address, transfers count, holders count
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);
    
    console.log('✅ Token Temel Bilgileri:');
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
    
    // Transfer sayısını bul
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = latestBlock - 5000; // Son 5000 blok
    
    const transferEvents = await contract.queryFilter(
      contract.filters.Transfer(),
      fromBlock,
      latestBlock
    );
    
    console.log(`✅ Transfer Count (son 5000 blok): ${transferEvents.length}`);
    
    // Unique holder sayısı
    const uniqueAddresses = new Set();
    transferEvents.forEach(event => {
      uniqueAddresses.add(event.args.from);
      uniqueAddresses.add(event.args.to);
    });
    
    console.log(`✅ Unique Addresses (tahmini holder): ${uniqueAddresses.size}`);
    
    return { name, symbol, decimals, totalSupply, transferCount: transferEvents.length, holderCount: uniqueAddresses.size };
    
  } catch (error) {
    console.error('❌ Token List Data Error:', error.message);
    return null;
  }
}

// 2. TOKEN DETAY SAYFASI İÇİN GEREKLİ VERİLER
async function testTokenDetailData() {
  console.log('\n📋 TEST 2: Token Detail için Gerekli Veriler');
  console.log('============================================');
  
  const address = TEST_ADDRESSES.usdt;
  const contract = new ethers.Contract(address, ERC20_ABI, provider);
  
  try {
    // ContractChecker.tsx Token Detail'de gösterilen veriler:
    // - Tüm token bilgileri
    // - Son transferler (txHash, from, to, value, age)
    // - Top holders
    // - Analysis için data points
    
    console.log('\n📊 Transfer Listesi için:');
    const latestBlock = await provider.getBlockNumber();
    const transfers = await contract.queryFilter(
      contract.filters.Transfer(),
      latestBlock - 100,
      latestBlock
    );
    
    console.log(`✅ Son ${transfers.length} transfer bulundu`);
    
    if (transfers.length > 0) {
      const sampleTransfer = transfers[0];
      const block = await provider.getBlock(sampleTransfer.blockNumber);
      
      console.log('   Örnek Transfer:');
      console.log(`   - TxHash: ${sampleTransfer.transactionHash.slice(0,10)}...`);
      console.log(`   - From: ${sampleTransfer.args.from.slice(0,10)}...`);
      console.log(`   - To: ${sampleTransfer.args.to.slice(0,10)}...`);
      console.log(`   - Value: ${ethers.formatUnits(sampleTransfer.args.value, 18)}`);
      console.log(`   - Block: ${sampleTransfer.blockNumber}`);
      console.log(`   - Timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
    }
    
    console.log('\n👥 Holder Hesaplama için:');
    const balances = new Map();
    
    // Transfer'lerden balance hesapla
    transfers.forEach(event => {
      const from = event.args.from;
      const to = event.args.to;
      const value = event.args.value;
      
      if (from !== ethers.ZeroAddress) {
        const current = balances.get(from) || 0n;
        balances.set(from, current - value);
      }
      
      if (to !== ethers.ZeroAddress) {
        const current = balances.get(to) || 0n;
        balances.set(to, current + value);
      }
    });
    
    console.log(`✅ ${balances.size} unique adres bulundu`);
    
    // Top 5 holder
    const holders = Array.from(balances.entries())
      .filter(([_, balance]) => balance > 0n)
      .sort((a, b) => Number(b[1] - a[1]))
      .slice(0, 5);
    
    console.log('   Top 5 Holder:');
    holders.forEach(([address, balance], i) => {
      console.log(`   ${i+1}. ${address.slice(0,10)}... : ${ethers.formatUnits(balance, 18)}`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Token Detail Data Error:', error.message);
    return false;
  }
}

// 3. TOKEN TİP TESPİTİ
async function testTokenTypeDetection() {
  console.log('\n📋 TEST 3: Token Tip Tespiti');
  console.log('==============================');
  
  const address = TEST_ADDRESSES.usdt;
  
  try {
    const code = await provider.getCode(address);
    console.log(`✅ Contract code length: ${code.length} bytes`);
    
    // ERC-165 interface check
    const interfaceContract = new ethers.Contract(address, [
      'function supportsInterface(bytes4) view returns (bool)'
    ], provider);
    
    // Test for ERC-721
    try {
      const is721 = await interfaceContract.supportsInterface('0x80ac58cd');
      console.log(`   ERC-721: ${is721 ? '✅' : '❌'}`);
    } catch {
      console.log('   ERC-721: ❌ (no supportsInterface)');
    }
    
    // Test for ERC-1155
    try {
      const is1155 = await interfaceContract.supportsInterface('0xd9b67a26');
      console.log(`   ERC-1155: ${is1155 ? '✅' : '❌'}`);
    } catch {
      console.log('   ERC-1155: ❌ (no supportsInterface)');
    }
    
    // Test for ERC-20
    try {
      const erc20 = new ethers.Contract(address, ERC20_ABI, provider);
      await erc20.totalSupply();
      await erc20.decimals();
      console.log('   ERC-20: ✅');
      return 'erc20';
    } catch {
      console.log('   ERC-20: ❌');
    }
    
    return 'unknown';
    
  } catch (error) {
    console.error('❌ Type Detection Error:', error.message);
    return null;
  }
}

// 4. YENİ TOKEN KEŞFİ
async function testTokenDiscovery() {
  console.log('\n📋 TEST 4: Yeni Token Keşfi');
  console.log('=============================');
  
  try {
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = latestBlock - 1000; // Son 1000 blok
    
    console.log(`🔍 Blok ${fromBlock} - ${latestBlock} aranıyor...`);
    
    // Transfer eventlerini ara
    const logs = await provider.getLogs({
      fromBlock,
      toBlock: latestBlock,
      topics: [ethers.id('Transfer(address,address,uint256)')]
    });
    
    const uniqueContracts = new Set(logs.map(log => log.address.toLowerCase()));
    console.log(`✅ ${uniqueContracts.size} unique contract bulundu`);
    
    // İlk 3 kontratı kontrol et
    const contracts = Array.from(uniqueContracts).slice(0, 3);
    for (const addr of contracts) {
      try {
        const contract = new ethers.Contract(addr, ERC20_ABI, provider);
        const symbol = await contract.symbol();
        console.log(`   ✅ ${addr.slice(0,10)}... : ${symbol}`);
      } catch {
        console.log(`   ❌ ${addr.slice(0,10)}... : Not a token`);
      }
    }
    
    return uniqueContracts;
    
  } catch (error) {
    console.error('❌ Token Discovery Error:', error.message);
    return null;
  }
}

// 5. DB İÇİN GEREKLİ ALAN TESTİ
async function testRequiredDBFields() {
  console.log('\n📋 TEST 5: Database için Gerekli Alanlar');
  console.log('==========================================');
  
  console.log('\n✅ tokens tablosu için gerekli alanlar:');
  console.log('   - address (VARCHAR)');
  console.log('   - type (erc20/erc721/erc1155)');
  console.log('   - name');
  console.log('   - symbol');
  console.log('   - decimals');
  console.log('   - total_supply');
  console.log('   - transfer_count');
  console.log('   - holder_count');
  console.log('   - deploy_block');
  console.log('   - last_updated');
  
  console.log('\n✅ transfers tablosu için gerekli alanlar:');
  console.log('   - token_address');
  console.log('   - tx_hash');
  console.log('   - from_address');
  console.log('   - to_address');
  console.log('   - value (veya token_id)');
  console.log('   - block_number');
  console.log('   - timestamp');
  console.log('   - log_index');
  
  console.log('\n✅ holders tablosu için gerekli alanlar:');
  console.log('   - token_address');
  console.log('   - holder_address');
  console.log('   - balance');
  console.log('   - last_updated');
  
  console.log('\n✅ daily_stats tablosu için (Analysis grafiği):');
  console.log('   - token_address');
  console.log('   - date');
  console.log('   - transfer_count');
  console.log('   - unique_senders');
  console.log('   - unique_receivers');
  console.log('   - volume');
}

// Tüm testleri çalıştır
async function runAllTests() {
  await testTokenListData();
  await testTokenDetailData();
  await testTokenTypeDetection();
  await testTokenDiscovery();
  await testRequiredDBFields();
  
  console.log('\n🎉 TÜM TESTLER TAMAMLANDI!');
  console.log('DB şeması bu test sonuçlarına göre oluşturulabilir.');
}

// Testleri başlat
runAllTests().catch(console.error);
