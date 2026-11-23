// File: api/db.js
// Centralized, high-performance PostgreSQL connection pool for CyberShield
import pkg from 'pg';
import './env.js';

const { Pool } = pkg;

// Connection string: use DATABASE_URL when configured, otherwise the local PostgreSQL instance.
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
    await pool.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "deviceId" TEXT').catch(() => {});
    await pool.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "certificateId" TEXT').catch(() => {});
    await pool.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT').catch(() => {});
    await pool.query('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "certificateClaimed" BOOLEAN DEFAULT FALSE').catch(() => {});
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_deviceid ON public.users ("deviceId")').catch(() => {});
    const maskedConn = CONNECTION_STRING.replace(/:([^:@]+)@/, ':****@');
    console.log(`⚡ [DB Pool] Database connection established to ${maskedConn} in ${Date.now() - t0}ms (SSL: ${sslConfig ? 'enabled' : 'disabled'})`);
  } catch (err) {
    console.warn('⚠️ [DB Pool] Startup pre-warm warning:', err.message);
    console.warn('👉 Ensure PostgreSQL service is started and database "cybershield" exists.');
  }
})();

export default pool;
