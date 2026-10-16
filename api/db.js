// File: api/db.js
// Centralized, high-performance PostgreSQL connection pool for CyberShield
import pkg from 'pg';
const { Pool } = pkg;

// Supabase Transaction Pooler (port 6543) with fallback to session pooler (port 5432)
const CONNECTION_STRING = process.env.DATABASE_URL || 
  `postgresql://postgres.qjvpdrdfbmblfhprnbbf:${encodeURIComponent('S!ddeeq5696')}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`;

export const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
  max: 20,                          // Maximum connections in pool
  min: 2,                           // Keep at least 2 warm connections permanently open
  idleTimeoutMillis: 300000,        // Keep idle connections open for 5 minutes (prevents cold re-connects)
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
    console.log(`⚡ [DB Pool] Database connection established & pre-warmed in ${Date.now() - t0}ms`);
  } catch (err) {
    console.warn('⚠️ [DB Pool] Startup pre-warm warning:', err.message);
  }
})();

export default pool;
