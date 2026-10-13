// File: api/admin-settings.js
// Manages site lock state stored in Supabase PostgreSQL

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: `postgresql://postgres.qjvpdrdfbmblfhprnbbf:${encodeURIComponent('S!ddeeq5696')}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false }
});

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // Seed default lock state if not present
  await client.query(`
    INSERT INTO site_settings (key, value)
    VALUES ('site_locked', 'false')
    ON CONFLICT (key) DO NOTHING
  `);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = await pool.connect();
  try {
    await ensureTable(client);

    if (req.method === 'GET') {
      const result = await client.query(
        "SELECT value FROM site_settings WHERE key = 'site_locked'"
      );
      const locked = result.rows[0]?.value === 'true';
      return res.status(200).json({ success: true, locked });
    }

    if (req.method === 'POST') {
      // Verify admin token
      const adminToken = req.headers['x-admin-token'];
      if (adminToken !== 'cybershield-admin-2024') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { locked } = req.body;
      if (typeof locked !== 'boolean') {
        return res.status(400).json({ success: false, error: 'Invalid payload' });
      }

      await client.query(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES ('site_locked', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [locked.toString()]
      );

      return res.status(200).json({ success: true, locked });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('admin-settings error:', error);
    return res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    client.release();
  }
}
