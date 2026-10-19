// File: api/db.js
// Centralized, high-performance PostgreSQL connection pool for CyberShield
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatic .env loader for local offline deployment (without requiring external dotenv package)
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
} catch (e) {
  // Silent fallback
}

// Connection string: checks environment variable, then falls back to local PostgreSQL or remote Supabase
const CONNECTION_STRING = process.env.DATABASE_URL || 
  `postgresql://postgres:azeema01@localhost:5432/cybershield`;

// Determine SSL requirement:
// Local connections (localhost, 127.0.0.1) or explicit DB_SSL=false must NOT use SSL (avoids "server does not support SSL" error)
const isLocal = CONNECTION_STRING.includes('localhost') || 
                CONNECTION_STRING.includes('127.0.0.1') || 
                process.env.DB_SSL === 'false' ||
                CONNECTION_STRING.includes('sslmode=disable');

const sslConfig = isLocal ? false : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: sslConfig,
  max: 20,                          // Maximum connections in pool
  min: 2,                           // Keep at least 2 warm connections permanently open
  idleTimeoutMillis: 300000,        // Keep idle connections open for 5 minutes
  connectionTimeoutMillis: 10000,   // Fail fast if connection cannot be made in 10s
  keepAlive: true,                  // TCP KeepAlive prevents intermediate firewalls from dropping idle sockets
  keepAliveInitialDelayMillis: 10000
});

// Handle pool-level unexpected errors without crashing the node process
pool.on('error', (err) => {
  console.warn('⚠️ Unexpected error on idle database client:', err.message);
});

// Immediately pre-warm the connection pool at startup so user requests never encounter cold handshakes
(async function prewarm() {
  try {
    const t0 = Date.now();
    await pool.query('SELECT 1');
    const maskedConn = CONNECTION_STRING.replace(/:([^:@]+)@/, ':****@');
    console.log(`⚡ [DB Pool] Database connection established to ${maskedConn} in ${Date.now() - t0}ms (SSL: ${sslConfig ? 'enabled' : 'disabled'})`);
  } catch (err) {
    console.warn('⚠️ [DB Pool] Startup pre-warm warning:', err.message);
    console.warn('👉 Ensure PostgreSQL service is started and database "cybershield" exists.');
  }
})();

export default pool;
