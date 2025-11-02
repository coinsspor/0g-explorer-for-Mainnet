# Setup Guide

Complete installation and configuration guide for 0G Explorer.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher (or yarn/pnpm)
- **Git**: Latest version

### Optional (for production)

- **NGINX**: v1.18.0 or higher
- **PM2**: Latest version
- **SSL Certificate**: From Let's Encrypt or Cloudflare

### System Requirements

**Minimum:**
- 2 CPU cores
- 4 GB RAM
- 20 GB disk space
- Ubuntu 20.04+ or equivalent

**Recommended:**
- 4 CPU cores
- 8 GB RAM
- 50 GB SSD
- Ubuntu 22.04 LTS

---

## Quick Start

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/0g-explorer.git
cd 0g-explorer

# Project structure
0g-explorer/
├── frontend/           # React frontend
├── backend/           # All API services
│   ├── validator-api/
│   ├── main-api-v2/
│   ├── transaction-api/
│   ├── uptime-tracking/
│   ├── blocks-api/
│   ├── token-explorer/
│   └── storage-api/
└── nginx/             # NGINX configuration
```

### 2. Quick Installation Script

```bash
# Install all dependencies at once
./scripts/install-all.sh

# Or manually:
cd frontend && npm install
cd ../backend/validator-api && npm install
cd ../main-api-v2 && npm install
# ... repeat for other services
```

### 3. Quick Start (Development)

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2-8: Backend services
cd backend/validator-api && node Validator_API_3001.js
cd backend/main-api-v2 && node Main_API_v2_3002.js
cd backend/transaction-api && node WalletTransaction_API_3003.mjs
cd backend/uptime-tracking && node Uptime_Tracking_3004.js
cd backend/blocks-api && node Blocks_API_3005.mjs
cd backend/token-explorer && node Token_Explorer_3101.js
cd backend/storage-api && node Storage_API_3301.js
```

Access the application at: `http://localhost:5174`

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install

# If you encounter issues, try:
npm install --legacy-peer-deps
```

**Key Dependencies:**
- React 18.3.1
- Vite 5.4.19
- TailwindCSS 4.1.12
- wagmi 2.16.8
- ethers.js 6.15.0
- RainbowKit 2.2.8

### Step 3: Create Environment File

Create `.env` file in the frontend directory:

```bash
touch .env
```

Add the following configuration:

```env
# .env (Frontend)

# RPC Configuration
VITE_RPC_URL=https://evmrpc.0g.ai
VITE_CHAIN_ID=16600
VITE_CHAIN_NAME=0G Network

# API Base URLs
VITE_API_BASE_URL=http://localhost:3001
VITE_API_V2_URL=http://localhost:3002

# Contract Addresses (Mainnet)
VITE_STAKING_CONTRACT=0xea224dBB52F57752044c0C86aD50930091F561B9
VITE_DELEGATION_CONTRACT=0xE37bfc9e900bC5cC3279952B90f6Be9A53ED6949
VITE_STORAGE_FLOW_CONTRACT=0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526
VITE_STORAGE_MINE_CONTRACT=0xCd01c5Cd953971CE4C2c9bFb95610236a7F414fe

# WalletConnect Project ID (optional - get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Application Settings
VITE_APP_NAME=0G Explorer
VITE_APP_DESCRIPTION=Blockchain Explorer for 0G Network
```

### Step 4: Build (Optional)

For production build:

```bash
npm run build

# Output will be in ./dist directory
# You can preview the build:
npm run preview
```

### Step 5: Development Server

```bash
npm run dev

# Server will start at http://localhost:5174
```

---

## Backend Setup

Each backend service needs to be set up individually.

### General Backend Setup Pattern

For each service in the `backend/` directory:

```bash
cd backend/[service-name]
npm init -y  # If package.json doesn't exist
npm install express cors axios ethers
npm install --save-dev nodemon
```

### Service-Specific Setup

#### 1. Validator API (Port 3001)

```bash
cd backend/validator-api

# Install dependencies
npm install express cors axios ethers fs

# Create .env file
cat > .env << EOF
PORT=3001
RPC_URL=https://evmrpc.0g.ai
STAKING_CONTRACT=0xea224dBB52F57752044c0C86aD50930091F561B9
DELEGATION_CONTRACT=0xE37bfc9e900bC5cC3279952B90f6Be9A53ED6949
UPDATE_INTERVAL=7200000
NODE_ENV=development
EOF

# Start service
node Validator_API_3001.js
```

#### 2. Main API v2 (Port 3002)

```bash
cd backend/main-api-v2

# Install dependencies
npm install express helmet compression express-rate-limit cors

# Create config structure
mkdir -p config middleware routes services utils

# Create .env file
cat > .env << EOF
PORT=3002
NODE_ENV=development
RPC_URL=https://evmrpc.0g.ai
CHAIN_ID=16600
CHAIN_NAME=0G Network
CACHE_TTL_BLOCKS=60
CACHE_TTL_VALIDATORS=300
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Start service
node Main_API_v2_3002.js
```

#### 3. Transaction API (Port 3003)

```bash
cd backend/transaction-api

# Install dependencies (ESM)
npm install express cors ethers

# Create .env file
cat > .env << EOF
PORT=3003
RPC_URL=https://evmrpc.0g.ai
NODE_ENV=development
EOF

# Start service (ESM)
node WalletTransaction_API_3003.mjs
```

#### 4. Uptime Tracking API (Port 3004)

```bash
cd backend/uptime-tracking

# Install dependencies
npm install express cors ethers better-sqlite3

# Create .env file
cat > .env << EOF
PORT=3004
RPC_URL=https://evmrpc.0g.ai
DB_PATH=./uptime.db
SCAN_INTERVAL=30000
NODE_ENV=development
EOF

# Start service
node Uptime_Tracking_3004.js
```

#### 5. Blocks API (Port 3005)

```bash
cd backend/blocks-api

# Install dependencies (ESM)
npm install express cors ethers

# Create .env file
cat > .env << EOF
PORT=3005
RPC_URL=http://199.254.199.233:47545
NODE_ENV=development
EOF

# Start service (ESM)
node Blocks_API_3005.mjs
```

#### 6. Token Explorer API (Port 3101)

```bash
cd backend/token-explorer

# Install dependencies (ESM)
npm install express cors ethers better-sqlite3 node-fetch

# Create .env file
cat > .env << EOF
PORT=3101
RPC_ENDPOINTS=https://evmrpc.0g.ai,https://og-jsonrpc.noders.services
DB_PATH=./explorer.db
SCAN_FROM_BLOCK=0
NODE_ENV=development
EOF

# Initialize database
node Token_Explorer_3101.js --init-db

# Start service
node Token_Explorer_3101.js
```

#### 7. Storage API (Port 3301)

```bash
cd backend/storage-api

# Install dependencies
npm install express cors ethers

# Create .env file
cat > .env << EOF
PORT=3301
RPC_URL=https://og-jsonrpc.noders.services
FLOW_CONTRACT=0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526
MINE_CONTRACT=0xCd01c5Cd953971CE4C2c9bFb95610236a7F414fe
START_BLOCK=2387557
CACHE_DURATION=600000
NODE_ENV=development
EOF

# Start service
node Storage_API_3301.js
```

---

## Configuration

### Frontend Configuration

**RPC Endpoints:**
Update RPC URLs in `.env` if needed:

```env
VITE_RPC_URL=https://evmrpc.0g.ai

# Alternative RPC endpoints:
# VITE_RPC_URL=https://og-jsonrpc.noders.services
# VITE_RPC_URL=http://your-local-node:8545
```

**API Endpoints:**
Configure API base URLs:

```env
# For local development
VITE_API_BASE_URL=http://localhost:3001
VITE_API_V2_URL=http://localhost:3002

# For production
VITE_API_BASE_URL=https://0g-explorer.com/api
VITE_API_V2_URL=https://0g-explorer.com/api/v2
```

### Backend Configuration

**Common Environment Variables:**

```env
# Server
PORT=3001
NODE_ENV=development  # or 'production'

# RPC
RPC_URL=https://evmrpc.0g.ai
CHAIN_ID=16600

# Caching
CACHE_TTL=600000  # 10 minutes

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

**Multiple RPC Endpoints:**

Some services support multiple RPC endpoints:

```env
RPC_ENDPOINTS=https://evmrpc.0g.ai,https://og-jsonrpc.noders.services,http://your-node:8545
```

---

## Running the Application

### Development Mode

**Option 1: Manual (Multiple Terminals)**

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Validator API
cd backend/validator-api
node Validator_API_3001.js

# Terminal 3: Main API v2
cd backend/main-api-v2
node Main_API_v2_3002.js

# ... Continue for all services
```

**Option 2: Using PM2 (Recommended)**

Install PM2:
```bash
npm install -g pm2
```

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      watch: false
    },
    {
      name: 'api-validator',
      script: './Validator_API_3001.js',
      cwd: './backend/validator-api',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    },
    {
      name: 'api-main-v2',
      script: './Main_API_v2_3002.js',
      cwd: './backend/main-api-v2',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      }
    },
    {
      name: 'api-transaction',
      script: './WalletTransaction_API_3003.mjs',
      cwd: './backend/transaction-api',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3003
      }
    },
    {
      name: 'api-uptime',
      script: './Uptime_Tracking_3004.js',
      cwd: './backend/uptime-tracking',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3004
      }
    },
    {
      name: 'api-blocks',
      script: './Blocks_API_3005.mjs',
      cwd: './backend/blocks-api',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3005
      }
    },
    {
      name: 'api-token',
      script: './Token_Explorer_3101.js',
      cwd: './backend/token-explorer',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3101
      }
    },
    {
      name: 'api-storage',
      script: './Storage_API_3301.js',
      cwd: './backend/storage-api',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3301
      }
    }
  ]
};
```

Run all services:
```bash
pm2 start ecosystem.config.js

# Monitor all services
pm2 monit

# View logs
pm2 logs

# Stop all services
pm2 stop all

# Restart all services
pm2 restart all
```

**Option 3: Using tmux/screen**

```bash
# Create tmux session
tmux new -s 0g-explorer

# Split windows and run services
# Ctrl+B then % (vertical split)
# Ctrl+B then " (horizontal split)
# Ctrl+B then arrow keys (navigate)
```

---

## Production Deployment

### Step 1: Build Frontend

```bash
cd frontend
npm run build

# Output: frontend/dist/
```

### Step 2: NGINX Configuration

Install NGINX:
```bash
sudo apt update
sudo apt install nginx
```

Create NGINX config file:
```bash
sudo nano /etc/nginx/sites-available/0g-explorer
```

Add configuration (see `nginx/0g-explorer.conf`):

```nginx
server {
    listen 80;
    server_name 0g-explorer.com www.0g-explorer.com;

    # Frontend (built files)
    location / {
        root /var/www/0g-explorer/frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # API Proxy
    location /api/v1/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/v2/ {
        proxy_pass http://localhost:3002/api/v2/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ... other API routes
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/0g-explorer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 3: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d 0g-explorer.com -d www.0g-explorer.com

# Auto-renewal (check)
sudo certbot renew --dry-run
```

### Step 4: PM2 Production Setup

```bash
# Install PM2 globally
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it gives you
```

### Step 5: Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow SSH (if not already allowed)
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=3011
```

#### Issue 2: RPC Connection Failed

**Error:**
```
Error: could not detect network
```

**Solution:**
- Check RPC URL in `.env`
- Verify RPC endpoint is accessible
- Try alternative RPC endpoints
- Check network connectivity

```bash
# Test RPC endpoint
curl -X POST https://evmrpc.0g.ai \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### Issue 3: Module Not Found

**Error:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Issue 4: Database Locked (SQLite)

**Error:**
```
Error: SQLITE_BUSY: database is locked
```

**Solution:**
```bash
# Stop all services accessing the DB
pm2 stop all

# Remove WAL files
rm explorer.db-wal explorer.db-shm

# Restart services
pm2 restart all
```

#### Issue 5: CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:3001' has been blocked by CORS policy
```

**Solution:**

Update CORS configuration in backend service:

```javascript
app.use(cors({
  origin: ['http://localhost:5174', 'https://0g-explorer.com'],
  credentials: true
}));
```

### Health Checks

**Check if services are running:**

```bash
# Frontend
curl http://localhost:5174

# Backend APIs
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/api/transactions
curl http://localhost:3004/api/v2/uptime/stats
curl http://localhost:3005/api/blocks
curl http://localhost:3101/health
curl http://localhost:3301/api/storage/stats
```

### Log Files

**PM2 Logs:**
```bash
# View all logs
pm2 logs

# View specific service
pm2 logs api-validator

# Clear logs
pm2 flush
```

**NGINX Logs:**
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Issues

**High Memory Usage:**
```bash
# Check memory
free -h

# PM2 memory monitoring
pm2 list

# Restart service with high memory
pm2 restart api-validator
```

**Slow RPC Response:**
- Use multiple RPC endpoints
- Implement caching
- Use local RPC node if possible

---

## Development Tips

### Hot Reload

Frontend has hot reload by default (Vite HMR).

For backend, use nodemon:

```bash
npm install -g nodemon

# Run with nodemon
nodemon Validator_API_3001.js
```

### Debugging

**Frontend:**
- Use React DevTools browser extension
- Console logging: `console.log()`
- Network tab in browser DevTools

**Backend:**
- Use Node.js debugger
- Add breakpoints in VS Code
- Console logging

```javascript
// Debug mode
node --inspect Validator_API_3001.js

// In Chrome: chrome://inspect
```

### Code Organization

Keep code clean and organized:

```
backend/service-name/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
├── .env            # Environment variables
├── package.json
└── server.js       # Main entry point
```

---

## Next Steps

After successful setup:

1. ✅ Test all features locally
2. ✅ Configure production environment
3. ✅ Set up monitoring
4. ✅ Configure backups
5. ✅ Set up CI/CD (optional)

For production deployment details, see [DEPLOYMENT.md](./DEPLOYMENT.md).

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review logs for error messages
3. Check GitHub issues
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - System information
   - Relevant logs

---

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# PM2
pm2 start <script>       # Start service
pm2 stop <name>          # Stop service
pm2 restart <name>       # Restart service
pm2 delete <name>        # Delete service
pm2 logs <name>          # View logs
pm2 monit                # Monitor all services

# NGINX
sudo nginx -t            # Test configuration
sudo systemctl restart nginx   # Restart NGINX
sudo systemctl status nginx    # Check status

# System
netstat -tulpn           # Check ports
htop                     # System monitor
df -h                    # Disk usage
```

### Default Ports

| Service | Port |
|---------|------|
| Frontend | 5174 |
| Validator API | 3001 |
| Main API v2 | 3002 |
| Transaction API | 3003 |
| Uptime Tracking | 3004 |
| Blocks API | 3005 |
| Token Explorer | 3101 |
| Storage API | 3301 |

---

**Happy Coding! 🚀**
