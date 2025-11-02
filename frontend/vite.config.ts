// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.svg'],
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: ['0g-explorer.com'],
    hmr: {
      protocol: 'ws',
      host: '0g-explorer.com',
      port: 5174,
      overlay: false,
    },
    fs: {
      strict: false,
      allow: ['..']
    },
    proxy: {
      '/api/blocks': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
      },
      '/api/rpc-scanner': {
        bypass: function(req, res) {
          try {
            const filePath = path.join(process.cwd(), 'public', 'rpc_data.json');
            const content = fs.readFileSync(filePath, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(content);
            return true;
          } catch (error) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'File not found' }));
            return true;
          }
        }
      },
      '/api/v2/uptime': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false,
      },
      '/api/v2': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/wallet': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      },
      '/api/transaction': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      },
      '/api/transactions': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      },
      '/api/search': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      },
      '/api/tokens': {
        target: 'http://localhost:3101',
        changeOrigin: true,
        secure: false,
      },
      // ⭐ STORAGE API PROXY (PORT 3301)
      '/api/storage': {
        target: 'http://localhost:3301',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
  },
});