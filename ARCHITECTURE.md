# Architecture Documentation

## Table of Contents
- [System Overview](#system-overview)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [Security Considerations](#security-considerations)
- [Performance Optimizations](#performance-optimizations)

---

## System Overview

0G Explorer follows a **microservices architecture** with a React frontend and multiple specialized Node.js backend services. This design enables:

- **Scalability**: Each service can scale independently
- **Maintainability**: Services are isolated and easier to update
- **Reliability**: Failure in one service doesn't affect others
- **Performance**: Specialized services optimized for specific tasks

### High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Users / Browsers                     │
└────────────────┬──────────────────────────────────────┘
                 │ HTTPS
                 ▼
┌────────────────────────────────────────────────────────┐
│             Cloudflare CDN + SSL/TLS                    │
└────────────────┬──────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│          NGINX Reverse Proxy (Port 80/443)             │
│  • SSL Termination                                      │
│  • Load Balancing                                       │
│  • Request Routing                                      │
└───┬──────────────────────────────────────────────┬────┘
    │                                               │
    │ Frontend                                      │ API Routes
    ▼                                               ▼
┌─────────────────┐                    ┌──────────────────────┐
│  Vite Dev Server│                    │   Backend Services   │
│   (Port 5174)   │                    │   (Ports 3001-3301)  │
│                 │                    │                      │
│  React Frontend │                    │  • Validator API     │
│  • TypeScript   │                    │  • Main API v2       │
│  • TailwindCSS  │                    │  • Transaction API   │
│  • wagmi/viem   │                    │  • Uptime Tracking   │
│  • RainbowKit   │                    │  • Blocks API        │
└─────────────────┘                    │  • Token Explorer    │
                                       │  • Storage API       │
                                       └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │   0G Network Layer   │
                                       │  • Mainnet RPC       │
                                       │  • Smart Contracts   │
                                       │  • Storage Network   │
                                       └──────────────────────┘
```

---

## Frontend Architecture

### Technology Stack

**Core Framework:**
- React 18.3.1 with TypeScript
- Vite 5.4.19 (build tool)
- React Router (client-side routing)

**UI Components:**
- TailwindCSS 4.1.12 (styling)
- shadcn/ui (component library)
- Radix UI primitives
- Lucide React (icons)

**Blockchain Integration:**
- wagmi 2.16.8 (React hooks for Ethereum)
- viem 2.36.0 (TypeScript blockchain library)
- ethers.js 6.15.0 (Ethereum library)
- RainbowKit 2.2.8 (wallet connection)

**State Management & Data Fetching:**
- React Query (@tanstack/react-query 5.85.5)
- React hooks for local state
- Context API for global state

**Charts & Visualization:**
- Recharts 2.15.2 (data visualization)
- Custom chart components

### Component Structure

```
src/
├── components/
│   ├── Dashboard.tsx              # Main dashboard with analytics
│   ├── Validators.tsx             # Validator list & details
│   ├── ValidatorDetail.tsx        # Individual validator page
│   ├── Storage.tsx                # 0G Storage main page
│   ├── StorageOverview.tsx        # Storage stats & metrics
│   ├── StorageAccounts.tsx        # Storage account management
│   ├── StorageFiles.tsx           # File explorer
│   ├── Blocks.tsx                 # Block explorer
│   ├── BlockDetail.tsx            # Block details page
│   ├── Transactions.tsx           # Transaction list
│   ├── TransactionDetail.tsx      # Transaction details
│   ├── WalletDetail.tsx           # Wallet information
│   ├── Staking.tsx                # Staking interface
│   ├── Governance.tsx             # Governance dashboard
│   ├── RPCMonitoring.tsx          # RPC health checker
│   ├── ContractChecker.tsx        # Contract verification tool
│   ├── ContractDeployment.tsx     # Contract deployment UI
│   ├── AlignmentRewards.tsx       # Rewards tracking
│   ├── Header.tsx                 # Navigation header
│   ├── ConnectWalletButton.tsx    # Wallet connection
│   ├── StakeModal.tsx             # Staking modal
│   └── ui/                        # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       └── ... (40+ components)
│
├── services/
│   └── api.ts                     # API client utilities
│
├── utils/
│   └── validatorCache.ts          # Caching utilities
│
├── providers.tsx                  # React Query & Wagmi setup
├── App.tsx                        # Main application component
└── main.tsx                       # Application entry point
```

### State Management

**Local State (useState, useReducer):**
- Component-specific UI state
- Form inputs
- Modal visibility

**React Query:**
- Blockchain data fetching
- API responses
- Automatic caching and refetching
- Optimistic updates

**Context API:**
- Wallet connection state (via RainbowKit)
- Theme settings
- Global configuration

### Routing Strategy

Single-page application with client-side routing:

```typescript
// Current page state managed in App.tsx
const [currentPage, setCurrentPage] = useState('dashboard');

// Dynamic rendering based on route
const renderPage = () => {
  switch (currentPage) {
    case 'dashboard': return <Dashboard />;
    case 'validators': return <Validators />;
    case 'storage': return <Storage />;
    case 'blocks': return <Blocks />;
    // ... etc
  }
};
```

### API Integration

**REST API Calls:**
```typescript
// Example: Fetching validators
const { data, isLoading, error } = useQuery({
  queryKey: ['validators'],
  queryFn: async () => {
    const response = await fetch('/api/v1/validators');
    return response.json();
  },
  staleTime: 60000, // 1 minute
  refetchInterval: 120000, // 2 minutes
});
```

**Blockchain Calls:**
```typescript
// Using wagmi hooks
const { data: balance } = useBalance({
  address: walletAddress,
  watch: true, // Real-time updates
});

const { write } = useContractWrite({
  address: STAKING_CONTRACT,
  abi: STAKING_ABI,
  functionName: 'delegate',
});
```

---

## Backend Architecture

### Microservices Design

Each backend service is a standalone Express.js application with its own:
- Port and routing
- Database/cache (if needed)
- RPC connection pool
- Error handling
- Rate limiting

### Service Descriptions

#### 1. Validator API (Port 3001)
**Purpose:** Validator data aggregation and staking information

**Key Features:**
- Fetches validator list from staking contract
- Extracts metadata from transaction history
- Caches validator information
- Provides delegation data
- Monitors validator performance

**Tech Stack:**
- Express.js
- ethers.js
- File-based caching
- Multi-RPC fallback

**Endpoints:**
```
GET /api/validators              # List all validators
GET /api/validator/:address      # Validator details
GET /api/delegations/:address    # User delegations
GET /api/validator-stats         # Aggregate stats
```

#### 2. Main API v2 (Port 3002)
**Purpose:** Core blockchain analytics and comprehensive data

**Key Features:**
- Blockchain statistics
- Advanced validator information
- Staking analytics
- Governance data
- Uptime tracking
- Wallet information

**Tech Stack:**
- Express.js with TypeScript
- Redis/Memory caching
- Rate limiting
- Compression middleware
- Helmet security

**Endpoints:**
```
GET /api/v2/blockchain/stats     # Network statistics
GET /api/v2/validators           # Enhanced validator data
GET /api/v2/staking/info         # Staking information
GET /api/v2/governance/proposals # Governance proposals
GET /api/v2/uptime/:validator    # Validator uptime
GET /api/v2/wallet/:address      # Wallet details
```

#### 3. Transaction API (Port 3003)
**Purpose:** Transaction and wallet data

**Key Features:**
- Transaction history
- Transaction details
- Wallet balance tracking
- Address search
- Transaction parsing

**Tech Stack:**
- Express.js (ESM)
- ethers.js
- In-memory caching

**Endpoints:**
```
GET /api/transactions            # Recent transactions
GET /api/transaction/:hash       # Transaction details
GET /api/wallet/:address         # Wallet information
GET /api/search/:query           # Address/tx search
```

#### 4. Uptime Tracking API (Port 3004)
**Purpose:** Validator uptime monitoring

**Key Features:**
- Block production tracking
- Missed block detection
- Historical uptime data
- Performance metrics

**Tech Stack:**
- Express.js
- SQLite database
- Scheduled jobs

**Endpoints:**
```
GET /api/v2/uptime/:validator    # Validator uptime
GET /api/v2/uptime/stats         # Overall stats
```

#### 5. Blocks API (Port 3005)
**Purpose:** Block data and exploration

**Key Features:**
- Latest blocks
- Block details with transactions
- Gas price analytics
- Block time tracking

**Tech Stack:**
- Express.js (ESM)
- ethers.js
- Result caching

**Endpoints:**
```
GET /api/blocks                  # Recent blocks
GET /api/blocks/:number          # Block details
GET /api/blocks/range/:from/:to  # Block range
```

#### 6. Token Explorer API (Port 3101)
**Purpose:** ERC-20 token tracking and analytics

**Key Features:**
- Token discovery
- Token holder tracking
- Transfer history
- Token metadata
- Price information

**Tech Stack:**
- Express.js (ESM)
- SQLite with WAL mode
- Multi-RPC with auto-rotation
- Event scanning

**Endpoints:**
```
GET /api/tokens                  # Token list
GET /api/tokens/:address         # Token details
GET /api/tokens/:address/holders # Token holders
GET /api/tokens/:address/transfers # Transfer history
```

#### 7. Storage API (Port 3301)
**Purpose:** 0G Storage Network integration

**Key Features:**
- File upload tracking
- Storage event monitoring
- Uploader statistics
- Miner tracking
- File metadata

**Tech Stack:**
- Express.js
- ethers.js
- Event topic-based scanning
- Progressive cache updates

**Smart Contracts:**
```javascript
FLOW_CONTRACT: '0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526'
MINE_CONTRACT: '0xCd01c5Cd953971CE4C2c9bFb95610236a7F414fe'
```

**Endpoints:**
```
GET /api/storage/stats           # Storage statistics
GET /api/storage/uploaders       # Top uploaders
GET /api/storage/miners          # Miner list
GET /api/storage/files           # File list
GET /api/storage/scan-progress   # Scan status
```

---

## Data Flow

### 1. User Interaction Flow

```
User Action
    ↓
React Component
    ↓
Event Handler
    ↓
API Call (fetch/wagmi)
    ↓
Backend Service
    ↓
RPC Call / Smart Contract
    ↓
0G Network
    ↓
Response ← ← ← ← ← ←
    ↓
Component Update
    ↓
UI Re-render
```

### 2. Real-time Data Update Flow

```
Initial Load:
├─ Fetch from API
├─ Display data
└─ Start polling (React Query)

Periodic Updates:
├─ React Query refetch (every 2 min)
├─ Backend cache check
├─ If stale → Fetch from RPC
└─ Update UI

WebSocket (Future):
├─ Subscribe to events
├─ Receive real-time updates
└─ Update UI immediately
```

### 3. Blockchain Interaction Flow

**Read Operations:**
```
Component → wagmi/viem → RPC Endpoint → Smart Contract → Return Data
```

**Write Operations:**
```
Component → Wallet Signature → Transaction → Smart Contract → Event Emission
    ↓
Wait for confirmation
    ↓
Query transaction receipt
    ↓
Update UI
```

---

## Security Considerations

### Frontend Security

1. **XSS Protection:**
   - React auto-escapes JSX
   - No `dangerouslySetInnerHTML` usage
   - Content Security Policy headers

2. **Wallet Security:**
   - RainbowKit secure wallet connection
   - No private key handling
   - User confirmation for all transactions

3. **Input Validation:**
   - Address format validation
   - Amount validation
   - Sanitized user inputs

### Backend Security

1. **Rate Limiting:**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});
```

2. **CORS Configuration:**
```javascript
app.use(cors({
  origin: 'https://0g-explorer.com',
  methods: ['GET', 'POST'],
  credentials: true
}));
```

3. **Helmet Security Headers:**
```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
```

4. **Input Sanitization:**
   - Address validation
   - Query parameter filtering
   - SQL injection prevention (prepared statements)

### Infrastructure Security

1. **SSL/TLS:**
   - HTTPS only
   - Cloudflare SSL
   - Certificate auto-renewal

2. **NGINX Configuration:**
   - Reverse proxy
   - Request size limits
   - Timeout configurations

3. **RPC Security:**
   - Multiple endpoint fallback
   - Request signing when needed
   - API key rotation (if applicable)

---

## Performance Optimizations

### Frontend Optimizations

1. **Code Splitting:**
   - Vite automatic code splitting
   - Lazy loading of heavy components
   - Dynamic imports

2. **React Query Caching:**
```typescript
queryClient.setDefaultOptions({
  queries: {
    staleTime: 60000,      // 1 minute
    cacheTime: 300000,     // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  }
});
```

3. **Component Optimization:**
   - React.memo for expensive components
   - useCallback for function memoization
   - useMemo for computed values

4. **Asset Optimization:**
   - Image optimization
   - Vite build optimizations
   - Tree shaking
   - Minification

### Backend Optimizations

1. **Caching Strategy:**
```javascript
// Example: Validator cache
const CACHE_TTL = 600000; // 10 minutes
let cache = {
  validators: null,
  lastUpdate: 0
};

if (Date.now() - cache.lastUpdate > CACHE_TTL) {
  cache.validators = await fetchValidators();
  cache.lastUpdate = Date.now();
}
```

2. **Connection Pooling:**
   - Persistent RPC connections
   - HTTP keep-alive
   - Connection reuse

3. **Batch Processing:**
   - Batch RPC calls where possible
   - Bulk database operations
   - Event scanning in chunks

4. **Database Optimization:**
```sql
-- SQLite optimizations
PRAGMA journal_mode = WAL;
PRAGMA synchronous = OFF;
PRAGMA cache_size = 10000;
```

5. **Compression:**
```javascript
app.use(compression()); // gzip compression
```

### Network Optimizations

1. **CDN Usage:**
   - Cloudflare CDN
   - Static asset caching
   - Geographic distribution

2. **Response Compression:**
   - Gzip compression
   - Brotli compression (future)

3. **HTTP/2:**
   - Multiplexing
   - Header compression
   - Server push (future)

### RPC Optimization

1. **Multi-RPC Strategy:**
```javascript
const RPC_ENDPOINTS = [
  'https://evmrpc.0g.ai',
  'https://og-jsonrpc.noders.services',
  // ... more endpoints
];

// Auto-rotation on failure
async function callWithRetry(fn) {
  for (let endpoint of RPC_ENDPOINTS) {
    try {
      return await fn(endpoint);
    } catch (error) {
      continue; // Try next endpoint
    }
  }
  throw new Error('All RPC endpoints failed');
}
```

2. **Request Batching:**
   - Batch multiple RPC calls
   - Reduce network overhead
   - Faster response times

---

## Scalability Considerations

### Horizontal Scaling

Each backend service can run multiple instances:

```
NGINX Load Balancer
    ↓
┌───┴───┬───────┬───────┐
│       │       │       │
API1-1  API1-2  API1-3  ...
API2-1  API2-2  API2-3  ...
```

### Vertical Scaling

- Increase server resources
- Optimize queries and caching
- Database optimization

### Future Enhancements

1. **Redis for Shared Cache:**
   - Centralized cache across instances
   - Pub/sub for real-time updates

2. **Message Queue:**
   - RabbitMQ or Redis Queue
   - Async job processing
   - Event-driven architecture

3. **Database Sharding:**
   - Distribute data across multiple DBs
   - Improved query performance

4. **GraphQL Layer:**
   - Efficient data fetching
   - Reduce over-fetching
   - Client-specified queries

---

## Monitoring & Logging

### Current Implementation

```javascript
// Logger utility
const logger = {
  api: (message, data) => console.log(`[API] ${message}`, data),
  error: (message, error) => console.error(`[ERROR] ${message}`, error)
};

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.api('Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});
```

### Future Enhancements

1. **Application Performance Monitoring (APM):**
   - New Relic / DataDog
   - Performance metrics
   - Error tracking

2. **Structured Logging:**
   - Winston or Pino
   - Log aggregation
   - Centralized logging

3. **Health Checks:**
   - Endpoint monitoring
   - Uptime tracking
   - Alert system

---

## Deployment Architecture

### Current Setup

```
Server (Ubuntu/Debian)
├── NGINX (Port 80/443)
│   ├── SSL certificates
│   └── Reverse proxy config
│
├── Frontend (Port 5174)
│   └── Vite dev server
│
└── Backend Services
    ├── API 3001 (Validator)
    ├── API 3002 (Main v2)
    ├── API 3003 (Transactions)
    ├── API 3004 (Uptime)
    ├── API 3005 (Blocks)
    ├── API 3101 (Tokens)
    └── API 3301 (Storage)
```

### Process Management

**Recommended: PM2**
```bash
pm2 start ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend'
    },
    {
      name: 'api-validator',
      script: './backend/Validator_API_3001.js',
      instances: 2,
      exec_mode: 'cluster'
    },
    // ... other services
  ]
};
```

---

## Conclusion

The 0G Explorer architecture is designed with:
- **Scalability** in mind through microservices
- **Performance** through caching and optimization
- **Security** through best practices and middleware
- **Reliability** through error handling and fallbacks
- **Maintainability** through clean code and documentation

This architecture allows for easy expansion and modification as the platform grows and evolves with the 0G Network ecosystem.
