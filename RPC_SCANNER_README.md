# RPC Scanner Scripts

Automated RPC discovery and monitoring system for 0G Network.

## 📁 Files

- **`aggressive_scanner.py`** - Main RPC discovery script
- **`hourly_update.py`** - Automated hourly update script

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip3 install requests
```

### 2. Run Scanner Manually

```bash
# Run the scanner
python3 aggressive_scanner.py

# Check results
cat aggressive_scan_results.txt
cat all_rpcs_combined.json
```

### 3. Setup Automated Updates

```bash
# Run update script
python3 hourly_update.py

# Add to crontab for hourly updates
crontab -e

# Add this line:
0 * * * * cd /path/to/scripts && /usr/bin/python3 hourly_update.py >> /var/log/rpc-scanner.log 2>&1
```

## 📊 How It Works

### Phase 1: Peer Discovery
1. Connects to Cosmos RPC endpoints
2. Gets list of connected peers
3. Recursively discovers more peers (up to 5 levels deep)
4. Result: 100-300+ unique IP addresses

### Phase 2: RPC Scanning
1. Tests each IP on 60+ potential RPC ports
2. Validates chain ID (must be 0x4115)
3. Measures response latency
4. Gets peer count
5. Result: 20-50 working RPC endpoints

### Phase 3: Export & Update
1. Sorts RPCs by latency
2. Exports to JSON format
3. Updates public web directory
4. Frontend automatically uses new data

## 🔧 Configuration

### Scanner Settings

Edit `aggressive_scanner.py`:

```python
EXPECTED_CHAIN_ID = "0x4115"  # 0G Mainnet
TIMEOUT = 2                   # Request timeout
THREADS = 100                 # Concurrent threads
MAX_DEPTH = 5                 # Peer discovery depth
```

### Starting Points

Add more Cosmos RPC endpoints:

```python
COSMOS_RPCS = [
    "http://199.254.199.233:47657",
    "http://your-node:26657",
]
```

## 📈 Output Format

### JSON Output
```json
{
  "network": "0G Mainnet",
  "chainId": "0x4115",
  "lastUpdate": "2024-11-02T10:00:00.000Z",
  "totalRpcs": 45,
  "rpcs": [
    {
      "url": "http://199.254.199.233:47545",
      "latency": 12,
      "peers": 45
    }
  ]
}
```

### Text Output
```
# Aggressive Scan - 45 RPCs
#======================================================================

  12ms | http://199.254.199.233:47545            | Peers: 45
  15ms | http://152.53.150.180:59545             | Peers: 42
  18ms | http://5.104.81.255:8545                | Peers: 38
```

## 🎯 Features

- ✅ Automated RPC discovery
- ✅ Deep peer network traversal (5 levels)
- ✅ Tests 60+ ports per IP
- ✅ Concurrent scanning (100 threads)
- ✅ Chain ID validation
- ✅ Latency measurement
- ✅ Peer count tracking
- ✅ Auto-ranking by performance
- ✅ Hourly updates via cron
- ✅ Public API endpoint

## 📊 Performance

**Typical Results:**
- IPs discovered: 100-300
- RPCs found: 20-50
- Scan duration: 5-10 minutes
- Average latency: 10-50ms

## 🔍 Troubleshooting

### No RPCs Found

1. Check if starting Cosmos RPC is accessible:
```bash
curl http://199.254.199.233:47657/net_info
```

2. Verify network connectivity
3. Try different starting RPCs
4. Check firewall rules

### Permission Errors

```bash
# Fix output directory permissions
sudo chmod 755 /var/www/0g-data
sudo chown $USER:$USER /var/www/0g-data
```

### High CPU Usage

Reduce concurrent operations:
```python
THREADS = 50  # Instead of 100
```



## 🤝 Contributing

Improvements welcome! Areas for contribution:
- Geographic location detection
- Historical performance tracking
- Better ranking algorithms
- Multi-region scanning

## 📞 Support

- GitHub Issues: [Create an issue]
- Twitter: [@coinsspor](https://x.com/coinsspor)
- Documentation: Full docs in `/docs/RPC_MONITORING.md`

---

**Part of 0G Explorer - Built for 0G WaveHack 2024 🚀**
