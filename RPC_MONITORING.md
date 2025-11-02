# RPC Monitoring System

## Overview

0G Explorer includes an **automated RPC discovery and monitoring system** that continuously scans for and tests available 0G Network RPC endpoints. This system ensures the explorer always has access to the fastest and most reliable RPC endpoints.

---

## 🎯 Features

### Automatic RPC Discovery
- **Deep peer discovery** - Recursively finds peers up to 5 levels deep
- **Aggressive port scanning** - Tests 60+ potential RPC ports per IP
- **Concurrent scanning** - Uses 100 threads for fast discovery
- **Chain validation** - Verifies correct chain ID (0x4115)

### Health Monitoring
- **Latency testing** - Measures response time for each endpoint
- **Peer count tracking** - Monitors network connectivity
- **Automated updates** - Runs via cron job every hour
- **Public data exposure** - Results available via API and web interface

### Smart Endpoint Management
- **Auto-ranking** - Sorts RPCs by latency
- **Failover support** - Multiple endpoints for reliability
- **Load distribution** - Rotates through available RPCs
- **Quality scoring** - Considers latency and peer count

---

## 📁 System Components

### 1. aggressive_scanner.py

Main RPC discovery script with advanced features:

**Key Functions:**
```python
def get_peers_recursive(depth=0, seen_ips=None):
    """
    Recursively discover peers from Cosmos RPC endpoints
    - Max depth: 5 levels
    - Tests multiple port combinations
    - Returns set of unique IPs
    """

def scan_ip_aggressive(ip):
    """
    Aggressively scan an IP for RPC endpoints
    - Tests 60+ ports per IP
    - Validates chain ID
    - Measures latency
    - Gets peer count
    """

def main():
    """
    Main scanning workflow:
    1. Deep peer discovery (5 levels)
    2. Port scanning (200 IPs with 100 threads)
    3. Results sorting and export
    """
```

**Scanning Strategy:**

**Phase 1: Peer Discovery**
```
Cosmos RPC (26657)
    ↓
Get connected peers
    ↓
For each peer IP:
    ↓
Test multiple Cosmos ports (26657, 46657, etc.)
    ↓
Get their peers (recursive up to 5 levels)
    ↓
Result: 100-300+ unique IPs
```

**Phase 2: RPC Port Scanning**
```
For each discovered IP:
    ↓
Test 60+ EVM RPC ports concurrently
    ↓
Ports tested:
- 8545, 8546 (standard)
- 10545-19545 (10k range)
- 20545-29545 (20k range)
- 30545-39545 (30k range)
- 40545-49545 (40k range)
- 50545-59545 (50k range)
- 60545-65545 (60k range)
    ↓
For each successful connection:
    ↓
Validate chain ID (must be 0x4115)
Measure latency
Get peer count
    ↓
Save results
```

**Output Files:**
1. `aggressive_scan_results.txt` - Human-readable results
2. `all_rpcs_combined.json` - Machine-readable JSON

---

### 2. hourly_update.py

Automated update script that runs via cron:

**Workflow:**
```python
def run_scanner():
    """
    1. Execute aggressive_scanner.py
    2. Read results from all_rpcs_combined.json
    3. Format data for web interface
    4. Update multiple locations:
       - /root/yeniexplorer2/public/rpc_data.json
       - /var/www/0g-data/rpc_data.json
    5. Set proper permissions
    """
```

**Output Format:**
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

---

## ⚙️ Setup & Configuration

### Installation

**1. Install Dependencies:**
```bash
# Install Python 3
sudo apt update
sudo apt install python3 python3-pip

# Install required packages
pip3 install requests
```

**2. Place Scripts:**
```bash
# Create scanner directory
mkdir -p /root/0g-rpc-scanner
cd /root/0g-rpc-scanner

# Copy scripts
cp aggressive_scanner.py .
cp hourly_update.py .

# Make executable
chmod +x aggressive_scanner.py hourly_update.py
```

**3. Create Output Directories:**
```bash
# Create nginx web directory
sudo mkdir -p /var/www/0g-data
sudo chmod 755 /var/www/0g-data

# Create frontend public directory (if not exists)
mkdir -p /root/yeniexplorer2/public
```

**4. Test Manual Run:**
```bash
# Run scanner manually
python3 aggressive_scanner.py

# Check output
cat aggressive_scan_results.txt
cat all_rpcs_combined.json

# Run update script
python3 hourly_update.py

# Verify files were created
ls -la /var/www/0g-data/rpc_data.json
ls -la /root/yeniexplorer2/public/rpc_data.json
```

---

## 🕐 Cron Job Setup

### Automated Hourly Updates

**1. Edit Crontab:**
```bash
crontab -e
```

**2. Add Cron Entry:**
```bash
# RPC Scanner - Runs every hour
0 * * * * cd /root/0g-rpc-scanner && /usr/bin/python3 hourly_update.py >> /var/log/rpc-scanner.log 2>&1
```

**Alternative Schedules:**

```bash
# Every 30 minutes
*/30 * * * * cd /root/0g-rpc-scanner && /usr/bin/python3 hourly_update.py >> /var/log/rpc-scanner.log 2>&1

# Every 2 hours
0 */2 * * * cd /root/0g-rpc-scanner && /usr/bin/python3 hourly_update.py >> /var/log/rpc-scanner.log 2>&1

# Every 6 hours
0 */6 * * * cd /root/0g-rpc-scanner && /usr/bin/python3 hourly_update.py >> /var/log/rpc-scanner.log 2>&1
```

**3. Verify Cron Job:**
```bash
# List cron jobs
crontab -l

# Check cron logs
tail -f /var/log/rpc-scanner.log

# Check system cron logs
sudo tail -f /var/log/syslog | grep CRON
```

---

## 🔧 Configuration

### Scanner Settings

**aggressive_scanner.py:**
```python
# Scanning parameters
EXPECTED_CHAIN_ID = "0x4115"  # 0G Mainnet chain ID
TIMEOUT = 2                   # RPC request timeout (seconds)
THREADS = 100                 # Concurrent scanning threads
MAX_DEPTH = 5                 # Peer discovery depth

# Cosmos RPC endpoints (starting points)
COSMOS_RPCS = [
    "http://199.254.199.233:47657",
    # Add more Cosmos RPC endpoints here
]

# Port ranges to scan
ports = [
    8545, 8546,           # Standard ports
    10545-19545,          # 10k range
    20545-29545,          # 20k range
    # ... up to 65545
]
```

**Customization Options:**

1. **More aggressive scanning:**
```python
THREADS = 200  # More threads (be careful with rate limits)
MAX_DEPTH = 7  # Deeper peer discovery
```

2. **Faster updates:**
```python
TIMEOUT = 1    # Shorter timeout for faster scanning
```

3. **More starting points:**
```python
COSMOS_RPCS = [
    "http://199.254.199.233:47657",
    "http://additional-cosmos-rpc:26657",
    "http://another-node:26657",
]
```

---

## 📊 Frontend Integration

### RPCMonitoring Component

The frontend displays real-time RPC status:

**Data Source:**
```javascript
// Fetch RPC data
const response = await fetch('/rpc_data.json');
const data = await response.json();
```

**Features:**
- Real-time RPC list with latency
- Health status indicators
- Auto-refresh every 60 seconds
- Sortable by latency/peers
- Visual health indicators

**Component Location:**
```
frontend/src/components/RPCMonitoring.tsx
```

---

## 📈 Monitoring & Maintenance

### Log Monitoring

**View Scanner Logs:**
```bash
# Real-time log monitoring
tail -f /var/log/rpc-scanner.log

# View last 100 lines
tail -n 100 /var/log/rpc-scanner.log

# Search for errors
grep -i error /var/log/rpc-scanner.log

# View successful scans
grep -i "completed successfully" /var/log/rpc-scanner.log
```

### Health Checks

**Check if data is up-to-date:**
```bash
# Check last update time
cat /var/www/0g-data/rpc_data.json | grep lastUpdate

# Compare file timestamps
ls -la /var/www/0g-data/rpc_data.json
ls -la /root/yeniexplorer2/public/rpc_data.json

# Verify data is accessible via web
curl http://localhost/rpc_data.json
curl https://0g-explorer.com/rpc_data.json
```

**Manual Trigger:**
```bash
# Run scanner immediately
cd /root/0g-rpc-scanner
python3 hourly_update.py

# Check results
cat /var/log/rpc-scanner.log | tail -20
```

### Performance Metrics

**Typical Scan Results:**
- **IPs discovered:** 100-300
- **RPCs found:** 20-50
- **Scan duration:** 5-10 minutes
- **Average latency:** 10-50ms

**Performance Tips:**
1. Use servers geographically close to RPC nodes
2. Increase THREADS for faster scanning (max 200)
3. Reduce TIMEOUT for quicker checks (min 1s)
4. Filter low-quality RPCs (high latency, low peers)

---

## 🔍 Troubleshooting

### Common Issues

**1. Scanner Returns No Results**

**Problem:** No RPCs found
```bash
# Check starting Cosmos RPC
curl http://199.254.199.233:47657/net_info

# Test chain ID validation
curl -X POST http://test-ip:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

**Solution:**
- Verify Cosmos RPC is accessible
- Check network connectivity
- Try different starting RPCs
- Reduce MAX_DEPTH if timeout issues

**2. Cron Job Not Running**

**Problem:** Updates not happening
```bash
# Check cron service
sudo systemctl status cron

# Verify cron job syntax
crontab -l

# Check cron logs
sudo grep CRON /var/log/syslog
```

**Solution:**
- Restart cron: `sudo systemctl restart cron`
- Fix crontab syntax
- Check script permissions
- Verify Python path

**3. Permission Errors**

**Problem:** Cannot write to output directories
```bash
# Fix permissions
sudo chown -R $USER:$USER /var/www/0g-data
sudo chmod 755 /var/www/0g-data
sudo chmod 644 /var/www/0g-data/rpc_data.json
```

**4. High CPU Usage**

**Problem:** Scanner uses too much CPU
```python
# Reduce threads in aggressive_scanner.py
THREADS = 50  # Instead of 100

# Reduce concurrent operations
ips_to_scan = list(all_ips)[:100]  # Instead of 200
```

---

## 📊 Output Format

### aggressive_scan_results.txt

```
# Aggressive Scan - 45 RPCs
#======================================================================

  12ms | http://199.254.199.233:47545            | Peers: 45
  15ms | http://152.53.150.180:59545             | Peers: 42
  18ms | http://5.104.81.255:8545                | Peers: 38
  ...
```

### all_rpcs_combined.json

```json
[
  {
    "url": "http://199.254.199.233:47545",
    "latency": 12,
    "peers": 45
  },
  {
    "url": "http://152.53.150.180:59545",
    "latency": 15,
    "peers": 42
  }
]
```

### rpc_data.json (Public)

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

---

## 🚀 Advanced Features

### Multi-Region Scanning

Deploy scanners in multiple regions:

```bash
# Region 1: US East
server1: cron → scan → upload to central storage

# Region 2: Europe
server2: cron → scan → upload to central storage

# Region 3: Asia
server3: cron → scan → upload to central storage

# Aggregator: Merge all results
aggregator: download → merge → deduplicate → publish
```

### Webhook Notifications

Add notifications when RPC quality changes:

```python
def notify_webhook(rpcs):
    """Send notification if too few healthy RPCs"""
    if len(rpcs) < 10:
        requests.post(WEBHOOK_URL, json={
            "alert": "Low RPC count",
            "count": len(rpcs),
            "timestamp": datetime.now().isoformat()
        })
```

### Historical Tracking

Track RPC performance over time:

```python
def save_historical_data(rpcs):
    """Save RPC data with timestamp for historical analysis"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"rpc_history/scan_{timestamp}.json"
    with open(filename, 'w') as f:
        json.dump(rpcs, f, indent=2)
```

---

## 📚 API Endpoints

The RPC data is accessible via multiple endpoints:

### Public API

```http
GET /rpc_data.json
GET /api/rpc-scanner
```

**Response:**
```json
{
  "network": "0G Mainnet",
  "chainId": "0x4115",
  "lastUpdate": "2024-11-02T10:00:00.000Z",
  "totalRpcs": 45,
  "rpcs": [...]
}
```

### Frontend Usage

```typescript
// Fetch RPC data
const getRPCData = async () => {
  const response = await fetch('/rpc_data.json');
  return await response.json();
};

// Use in component
const { data } = useQuery(['rpc-data'], getRPCData, {
  refetchInterval: 60000, // Refresh every minute
});
```

---

## 🎯 Benefits

### For Users
- **Fast connections** - Always use the fastest RPC
- **High reliability** - Automatic failover to working RPCs
- **Transparency** - See all available endpoints
- **Up-to-date** - Fresh data every hour

### For Developers
- **Easy integration** - Simple JSON API
- **Automated** - No manual endpoint management
- **Scalable** - Handles hundreds of endpoints
- **Extensible** - Easy to add custom metrics

### For Network
- **Load distribution** - Spread load across nodes
- **Node discovery** - Find new network nodes
- **Health monitoring** - Track network topology
- **Quality assurance** - Validate endpoint reliability

---

## 📝 Best Practices

1. **Regular Updates** - Run scanner at least every hour
2. **Multiple Starting Points** - Use diverse Cosmos RPCs
3. **Reasonable Threading** - Don't overload network (50-100 threads)
4. **Log Everything** - Keep logs for debugging
5. **Monitor Health** - Check if updates are working
6. **Backup Data** - Keep historical RPC data
7. **Rate Limiting** - Respect node rate limits
8. **Error Handling** - Gracefully handle failures

---



## 📞 Support

For issues or questions:
- Check logs: `/var/log/rpc-scanner.log`
- GitHub Issues: [Create an issue]
- Twitter: [@coinsspor](https://x.com/coinsspor)

---

## 📄 Files

**Scanner Scripts:**
- `aggressive_scanner.py` - Main RPC discovery script
- `hourly_update.py` - Automated update script

**Output Files:**
- `aggressive_scan_results.txt` - Human-readable results
- `all_rpcs_combined.json` - Complete RPC list
- `/var/www/0g-data/rpc_data.json` - Public web data
- `/root/yeniexplorer2/public/rpc_data.json` - Frontend data

**Logs:**
- `/var/log/rpc-scanner.log` - Scanner execution logs
- `/var/log/syslog` - System cron logs

---

**This automated RPC monitoring system ensures 0G Explorer always has access to the best available RPC endpoints, providing users with the fastest and most reliable blockchain data! 🚀**
