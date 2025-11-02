# API Documentation

Complete API reference for 0G Explorer backend services.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Validator API](#validator-api-port-3001)
- [Main API v2](#main-api-v2-port-3002)
- [Transaction API](#transaction-api-port-3003)
- [Uptime Tracking API](#uptime-tracking-api-port-3004)
- [Blocks API](#blocks-api-port-3005)
- [Token Explorer API](#token-explorer-api-port-3101)
- [Storage API](#storage-api-port-3301)
- [Error Handling](#error-handling)
- [Response Format](#response-format)

---

## Overview

0G Explorer provides 7 specialized API services, each handling specific blockchain data needs. All APIs are RESTful and return JSON responses.

### Base URLs

**Production:**
```
https://0g-explorer.com/api/v1/    # Validator API
https://0g-explorer.com/api/v2/    # Main API v2
https://0g-explorer.com/api/       # Other APIs
```

**Local Development:**
```
http://localhost:3001/api/    # Validator API
http://localhost:3002/api/v2/ # Main API v2
http://localhost:3003/api/    # Transaction API
http://localhost:3004/api/v2/ # Uptime API
http://localhost:3005/api/    # Blocks API
http://localhost:3101/api/    # Token Explorer
http://localhost:3301/api/    # Storage API
```

---

## Authentication

Currently, all APIs are **publicly accessible** without authentication.

Future versions will support:
- API key authentication
- Rate limit tiers
- OAuth 2.0

---

## Rate Limiting

### Default Limits

| Service | Window | Max Requests |
|---------|--------|--------------|
| Validator API | 15 min | 100 |
| Main API v2 | 15 min | 100 |
| Transaction API | 15 min | 100 |
| Other APIs | 15 min | 100 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

### Rate Limit Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "retryAfter": 900
}
```

---

## Validator API (Port 3001)

Base path: `/api/` or `/api/v1/`

### Get All Validators

```http
GET /api/validators
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validators": [
      {
        "address": "0x1234...5678",
        "moniker": "Validator Name",
        "identity": "keybase_id",
        "website": "https://validator.com",
        "securityContact": "security@validator.com",
        "details": "Description",
        "commissionRate": 500,
        "tokens": "1000000000000000000000",
        "delegatorShares": "1000000000000000000000",
        "status": "active",
        "delegatorCount": 150,
        "ownerAddress": "0xabcd...efgh"
      }
    ],
    "totalValidators": 118,
    "activeValidators": 118,
    "totalStaked": "49934150000000000000000000"
  }
}
```

### Get Single Validator

```http
GET /api/validator/:address
```

**Parameters:**
- `address` (string) - Validator address

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x1234...5678",
    "moniker": "Validator Name",
    "tokens": "1000000000000000000000",
    "delegators": [
      {
        "address": "0xdele...gator",
        "amount": "100000000000000000000"
      }
    ]
  }
}
```

### Get Validator Stats

```http
GET /api/validator-stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValidators": 118,
    "activeValidators": 118,
    "totalStaked": "49934150000000000000000000",
    "averageCommission": 5.2,
    "totalDelegators": 5420
  }
}
```

### Get User Delegations

```http
GET /api/delegations/:address
```

**Parameters:**
- `address` (string) - User wallet address

**Response:**
```json
{
  "success": true,
  "data": {
    "delegations": [
      {
        "validator": "0x1234...5678",
        "amount": "1000000000000000000000",
        "shares": "1000000000000000000000"
      }
    ],
    "totalDelegated": "5000000000000000000000"
  }
}
```

---

## Main API v2 (Port 3002)

Base path: `/api/v2/`

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "API2 is healthy",
  "timestamp": "2024-11-02T10:00:00.000Z",
  "uptime": 86400,
  "version": "2.0.0"
}
```

### API Status

```http
GET /api/status
```

**Response:**
```json
{
  "success": true,
  "api": "API2 - Advanced 0G Explorer",
  "version": "2.0.0",
  "status": "operational",
  "cache": {
    "hits": 1234,
    "misses": 56,
    "hitRate": 95.6
  },
  "rpc": {
    "healthy": true,
    "latency": 45
  }
}
```

### Blockchain Statistics

```http
GET /api/v2/blockchain/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "latestBlock": 5560502,
    "avgBlockTime": 1.8,
    "tps": 1895,
    "totalTransactions": 5200000,
    "activeAccounts": 45678,
    "totalContracts": 1234,
    "gasPrice": "6826760"
  }
}
```

### Validator Information

```http
GET /api/v2/validators
GET /api/v2/validators/:address
```

**Response:** Similar to Validator API but with additional analytics

### Staking Information

```http
GET /api/v2/staking/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStaked": "49934150000000000000000000",
    "stakingRatio": 68.5,
    "totalValidators": 118,
    "apr": 12.5
  }
}
```

### Governance Proposals

```http
GET /api/v2/governance/proposals
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": 1,
        "title": "Proposal Title",
        "description": "Proposal description",
        "status": "active",
        "votes": {
          "yes": 1000000,
          "no": 50000,
          "abstain": 10000
        }
      }
    ]
  }
}
```

---

## Transaction API (Port 3003)

Base path: `/api/`

### Get Recent Transactions

```http
GET /api/transactions?limit=20&offset=0
```

**Query Parameters:**
- `limit` (number) - Number of transactions (default: 20, max: 100)
- `offset` (number) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "hash": "0xabcd...1234",
        "from": "0x1234...5678",
        "to": "0x5678...9012",
        "value": "1000000000000000000",
        "gasPrice": "6826760",
        "gasUsed": "21000",
        "blockNumber": 5560502,
        "timestamp": 1699000000,
        "status": "success"
      }
    ],
    "total": 5200000,
    "limit": 20,
    "offset": 0
  }
}
```

### Get Transaction Details

```http
GET /api/transaction/:hash
```

**Parameters:**
- `hash` (string) - Transaction hash

**Response:**
```json
{
  "success": true,
  "data": {
    "hash": "0xabcd...1234",
    "from": "0x1234...5678",
    "to": "0x5678...9012",
    "value": "1000000000000000000",
    "gasPrice": "6826760",
    "gasUsed": "21000",
    "blockNumber": 5560502,
    "timestamp": 1699000000,
    "status": "success",
    "input": "0x",
    "logs": []
  }
}
```

### Get Wallet Information

```http
GET /api/wallet/:address
```

**Parameters:**
- `address` (string) - Wallet address

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x1234...5678",
    "balance": "10000000000000000000",
    "transactionCount": 150,
    "firstSeen": 1698000000,
    "lastActivity": 1699000000,
    "transactions": []
  }
}
```

### Search

```http
GET /api/search/:query
```

**Parameters:**
- `query` (string) - Address, transaction hash, or block number

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "address|transaction|block",
    "result": {}
  }
}
```

---

## Uptime Tracking API (Port 3004)

Base path: `/api/v2/uptime/`

### Get Validator Uptime

```http
GET /api/v2/uptime/:validator
```

**Parameters:**
- `validator` (string) - Validator address

**Response:**
```json
{
  "success": true,
  "data": {
    "validator": "0x1234...5678",
    "uptime": 99.8,
    "blocksProduced": 15420,
    "blocksMissed": 30,
    "lastActive": 1699000000,
    "history": [
      {
        "date": "2024-11-01",
        "uptime": 99.9,
        "blocksProduced": 1440,
        "blocksMissed": 1
      }
    ]
  }
}
```

### Get Overall Stats

```http
GET /api/v2/uptime/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "averageUptime": 99.5,
    "totalBlocks": 5560502,
    "totalValidators": 118,
    "activeValidators": 118
  }
}
```

---

## Blocks API (Port 3005)

Base path: `/api/blocks`

### Get Recent Blocks

```http
GET /api/blocks?limit=20
```

**Query Parameters:**
- `limit` (number) - Number of blocks (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "blocks": [
      {
        "number": 5560502,
        "hash": "0xblock...hash",
        "timestamp": 1699000000,
        "transactions": 24,
        "gasUsed": "16721884",
        "gasLimit": "30000000",
        "miner": "0xminer...address",
        "size": 12345
      }
    ]
  }
}
```

### Get Block Details

```http
GET /api/blocks/:numberOrHash
```

**Parameters:**
- `numberOrHash` (string|number) - Block number or hash

**Response:**
```json
{
  "success": true,
  "data": {
    "number": 5560502,
    "hash": "0xblock...hash",
    "parentHash": "0xparent...hash",
    "timestamp": 1699000000,
    "transactions": [
      {
        "hash": "0xtx...hash",
        "from": "0xfrom...address",
        "to": "0xto...address",
        "value": "1000000000000000000"
      }
    ],
    "gasUsed": "16721884",
    "gasLimit": "30000000",
    "miner": "0xminer...address"
  }
}
```

### Get Block Range

```http
GET /api/blocks/range/:from/:to
```

**Parameters:**
- `from` (number) - Start block number
- `to` (number) - End block number (max range: 100 blocks)

**Response:**
```json
{
  "success": true,
  "data": {
    "blocks": [],
    "from": 5560400,
    "to": 5560500
  }
}
```

---

## Token Explorer API (Port 3101)

Base path: `/api/tokens`

### Health Check

```http
GET /health
```

### Get All Tokens

```http
GET /api/tokens?limit=50&offset=0
```

**Query Parameters:**
- `limit` (number) - Tokens per page (default: 50)
- `offset` (number) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "address": "0xtoken...address",
        "name": "Token Name",
        "symbol": "TKN",
        "decimals": 18,
        "totalSupply": "1000000000000000000000000",
        "holders": 1234,
        "transfers": 5678
      }
    ],
    "total": 1234,
    "limit": 50,
    "offset": 0
  }
}
```

### Get Token Details

```http
GET /api/tokens/:address
```

**Parameters:**
- `address` (string) - Token contract address

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0xtoken...address",
    "name": "Token Name",
    "symbol": "TKN",
    "decimals": 18,
    "totalSupply": "1000000000000000000000000",
    "holders": 1234,
    "transfers": 5678,
    "price": "1.25",
    "marketCap": "1250000"
  }
}
```

### Get Token Holders

```http
GET /api/tokens/:address/holders?limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "holders": [
      {
        "address": "0xholder...address",
        "balance": "100000000000000000000",
        "percentage": 10.5
      }
    ]
  }
}
```

### Get Token Transfers

```http
GET /api/tokens/:address/transfers?limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transfers": [
      {
        "hash": "0xtx...hash",
        "from": "0xfrom...address",
        "to": "0xto...address",
        "value": "1000000000000000000",
        "timestamp": 1699000000,
        "blockNumber": 5560502
      }
    ]
  }
}
```

---

## Storage API (Port 3301)

Base path: `/api/storage`

### Get Storage Statistics

```http
GET /api/storage/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 1234,
    "totalUploaders": 567,
    "totalMiners": 89,
    "totalSize": "12345678901234",
    "averageFileSize": "10000000",
    "totalCost": "123.45"
  }
}
```

### Get Top Uploaders

```http
GET /api/storage/uploaders?limit=50
```

**Query Parameters:**
- `limit` (number) - Number of uploaders (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "uploaders": [
      {
        "address": "0xuploader...address",
        "fileCount": 150,
        "totalSize": "1234567890",
        "totalCost": "12.34",
        "lastUpload": 1699000000
      }
    ]
  }
}
```

### Get Miners List

```http
GET /api/storage/miners
```

**Response:**
```json
{
  "success": true,
  "data": {
    "miners": [
      {
        "address": "0xminer...address",
        "filesStored": 500,
        "totalStorage": "5000000000",
        "earnings": "50.00"
      }
    ]
  }
}
```

### Get Files List

```http
GET /api/storage/files?limit=50&offset=0
```

**Query Parameters:**
- `limit` (number) - Files per page (default: 50)
- `offset` (number) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "root": "0xfile...root",
        "uploader": "0xuploader...address",
        "size": "1000000",
        "timestamp": 1699000000,
        "cost": "0.01",
        "transactionHash": "0xtx...hash"
      }
    ],
    "total": 1234,
    "limit": 50,
    "offset": 0
  }
}
```

### Get Scan Progress

```http
GET /api/storage/scan-progress
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentBlock": 5560502,
    "totalBlocks": 3172945,
    "percentage": 100,
    "status": "completed"
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_ADDRESS` | 400 | Invalid Ethereum address format |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `RPC_ERROR` | 503 | RPC endpoint unavailable |

### Example Errors

**Invalid Address:**
```json
{
  "success": false,
  "message": "Invalid address format",
  "error": {
    "code": "INVALID_ADDRESS",
    "details": "Address must be a valid Ethereum address"
  }
}
```

**Not Found:**
```json
{
  "success": false,
  "message": "Transaction not found",
  "error": {
    "code": "NOT_FOUND",
    "details": "No transaction found with hash 0x..."
  }
}
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2024-11-02T10:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "total": 1234,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## Best Practices

### Caching

Implement client-side caching for:
- Validator list (TTL: 5 minutes)
- Block data (TTL: 1 minute)
- Transaction data (immutable, cache forever)

### Pagination

Use `limit` and `offset` for pagination:
```http
GET /api/transactions?limit=20&offset=40  # Get page 3
```

### Rate Limiting

- Monitor rate limit headers
- Implement exponential backoff
- Cache responses when possible

### Error Handling

```javascript
try {
  const response = await fetch('/api/validators');
  const data = await response.json();
  
  if (!data.success) {
    // Handle error
    console.error(data.message);
  }
} catch (error) {
  // Handle network error
  console.error('Network error:', error);
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
// Fetch validators
async function getValidators() {
  const response = await fetch('https://0g-explorer.com/api/v1/validators');
  const data = await response.json();
  return data.data.validators;
}

// Get transaction details
async function getTransaction(hash: string) {
  const response = await fetch(`https://0g-explorer.com/api/transaction/${hash}`);
  const data = await response.json();
  return data.data;
}

// Search
async function search(query: string) {
  const response = await fetch(`https://0g-explorer.com/api/search/${query}`);
  const data = await response.json();
  return data.data;
}
```

### Python

```python
import requests

# Fetch validators
def get_validators():
    response = requests.get('https://0g-explorer.com/api/v1/validators')
    return response.json()['data']['validators']

# Get transaction
def get_transaction(tx_hash):
    url = f'https://0g-explorer.com/api/transaction/{tx_hash}'
    response = requests.get(url)
    return response.json()['data']
```

### cURL

```bash
# Get validators
curl https://0g-explorer.com/api/v1/validators

# Get transaction
curl https://0g-explorer.com/api/transaction/0xabcd...1234

# Get storage stats
curl https://0g-explorer.com/api/storage/stats
```

---

## WebSocket API (Coming Soon)

Real-time updates via WebSocket:

```javascript
const ws = new WebSocket('wss://0g-explorer.com/ws');

ws.on('message', (data) => {
  const update = JSON.parse(data);
  
  switch(update.type) {
    case 'new_block':
      // Handle new block
      break;
    case 'new_transaction':
      // Handle new transaction
      break;
  }
});
```

---

## Support

For API support and questions:
- GitHub Issues: [Create an issue]
- Twitter: [@coinsspor](https://x.com/coinsspor)
- Documentation: [https://0g-explorer.com/docs](https://0g-explorer.com/docs)

---

## Changelog

### v2.0.0 (Current)
- Full mainnet deployment
- 7 specialized APIs
- Storage API added
- Enhanced caching
- Rate limiting improved

### v1.0.0
- Initial release
- Basic explorer features
- Validator API
- Transaction API

---

**API Version:** 2.0.0  

**Base URL:** https://0g-explorer.com/api
