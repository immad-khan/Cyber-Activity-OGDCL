// File: server.js
// Production Web Server for CyberShield / OGDCL Cybersecurity Platform
// Serves static assets, video streaming, and routes backend API requests.

import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// Import database connection pool & API handlers
import './api/db.js';
import getUsersHandler from './api/get-users.js';
import saveUsernameHandler from './api/save-username.js';
import adminSettingsHandler from './api/admin-settings.js';
import uploadVideoHandler from './api/upload-video.js';
import listVideosHandler from './api/list-videos.js';
import deleteVideoHandler from './api/delete-video.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

// Middleware: Body parsing (supports large video uploads up to 100mb)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Middleware: High-performance Gzip / Deflate compression for text, HTML, JS, CSS, JSON
app.use(compression({
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Never compress video byte streams
    if (req.headers['range'] || (res.getHeader('Content-Type') && String(res.getHeader('Content-Type')).startsWith('video/'))) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware: Global CORS & Security Headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, x-filename, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Helper wrapper for async API handlers
const wrapHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error(`[API Error] ${req.method} ${req.url}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
};

// API Endpoints
app.all('/api/get-users', wrapHandler(getUsersHandler));
app.all('/api/save-username', wrapHandler(saveUsernameHandler));
app.all('/api/admin-settings', wrapHandler(adminSettingsHandler));
app.all('/api/upload-video', wrapHandler(uploadVideoHandler));
app.all('/api/list-videos', wrapHandler(listVideosHandler));
app.all('/api/delete-video', wrapHandler(deleteVideoHandler));

// Health check endpoint for load balancers / monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date() });
});

// Serve static assets with HTML extension auto-resolution & video streaming support
app.use(
  express.static(publicDir, {
    extensions: ['html'], // e.g. /mfa-week automatically resolves to /mfa-week.html
    maxAge: 0,
    setHeaders: (res, filePath) => {
      // 1. Video files: Long-term cache with byte-range support
      if (filePath.endsWith('.mp4') || filePath.endsWith('.webm')) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // 2. Images: Cache for 7 days with revalidation
      else if (/\.(png|jpe?g|webp|svg|ico|gif)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
      }
      // 3. JavaScript & CSS: Cache with stale-while-revalidate (HTML query params ?v=X bust cache on deploy)
      else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      }
      // 4. HTML: Validate with server (returns 304 if unchanged, avoiding full download)
      else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  })
);

// Fallback: If route not found, redirect to index.html (SPA fallback)
app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Helper to get local network IPv4 addresses
function getNetworkIps() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`🚀 CyberShield Server is LIVE and Running!`);
  console.log(`👉 Local:   http://localhost:${PORT}`);
  const ips = getNetworkIps();
  if (ips.length > 0) {
    ips.forEach((ip) => {
      console.log(`👉 Network: http://${ip}:${PORT}`);
    });
  } else {
    console.log(`👉 Network: http://<SERVER-IP>:${PORT}`);
  }
  console.log('========================================================');
});
