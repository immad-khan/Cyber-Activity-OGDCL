// File: api/admin-settings.js
// Manages global site lock and individual activity locks stored in Supabase PostgreSQL

import { pool } from './db.js';

const DEFAULT_ACTIVITY_LOCKS = {
  activity_1: false, // Activity 1: The Executive Target (Phishing)
  activity_2: false, // Activity 2: Password Protection & MFA
  activity_3: false, // Activity 3: Social Engineering
  activity_4: false  // Activity 4: Data Privacy
};

// In-memory cache for ultra-fast page loads (<1ms instead of 4000ms round trips)
let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 4000; // 4 seconds TTL for near-instant multi-user synchronization

let isTableInitialized = false;

async function ensureTableOnce() {
  if (isTableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Seed default global lock state if not present
    await pool.query(`
      INSERT INTO site_settings (key, value)
      VALUES ('site_locked', 'false')
      ON CONFLICT (key) DO NOTHING
    `);

    // Seed default per-activity locks if not present
    await pool.query(`
      INSERT INTO site_settings (key, value)
      VALUES ('activity_locks', $1)
      ON CONFLICT (key) DO NOTHING
    `, [JSON.stringify(DEFAULT_ACTIVITY_LOCKS)]);

    isTableInitialized = true;
  } catch (err) {
    console.warn('⚠️ [Settings] Table init warning:', err.message);
  }
}

// Kick off initialization once in background
ensureTableOnce();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const now = Date.now();
      // Serve from cache if fresh (super fast <1ms response)
      if (cachedSettings && (now - cacheTimestamp < CACHE_TTL_MS)) {
        return res.status(200).json(cachedSettings);
      }

      await ensureTableOnce();
      const result = await pool.query(
        "SELECT key, value FROM site_settings WHERE key IN ('site_locked', 'activity_locks')"
      );

      let globalLocked = false;
      let activityLocks = { ...DEFAULT_ACTIVITY_LOCKS };

      result.rows.forEach(row => {
        if (row.key === 'site_locked') {
          globalLocked = row.value === 'true';
        } else if (row.key === 'activity_locks') {
          try {
            activityLocks = { ...DEFAULT_ACTIVITY_LOCKS, ...JSON.parse(row.value) };
          } catch (e) {
            console.warn('Error parsing activity_locks json', e);
          }
        }
      });

      cachedSettings = {
        success: true,
        locked: globalLocked,
        activityLocks
      };
      cacheTimestamp = now;

      return res.status(200).json(cachedSettings);
    }

    if (req.method === 'POST') {
      // Verify admin token
      const adminToken = req.headers['x-admin-token'];
      if (adminToken !== 'cybershield-admin-2024' && adminToken !== 'ogdcl-admin-2026') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      await ensureTableOnce();
      const body = req.body || {};

      // 1. Update Global Lock if provided
      if (typeof body.locked === 'boolean') {
        await pool.query(
          `INSERT INTO site_settings (key, value, updated_at)
           VALUES ('site_locked', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
          [body.locked.toString()]
        );
      }

      // 2. Update Specific Activity Lock if provided: { activityId: 'activity_1', locked: true/false }
      if (body.activityId && typeof body.activityLocked === 'boolean') {
        const curRes = await pool.query(
          "SELECT value FROM site_settings WHERE key = 'activity_locks'"
        );
        let curLocks = { ...DEFAULT_ACTIVITY_LOCKS };
        if (curRes.rows[0]?.value) {
          try {
            curLocks = { ...curLocks, ...JSON.parse(curRes.rows[0].value) };
          } catch (e) {}
        }

        curLocks[body.activityId] = body.activityLocked;

        await pool.query(
          `INSERT INTO site_settings (key, value, updated_at)
           VALUES ('activity_locks', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
          [JSON.stringify(curLocks)]
        );
      }

      // 3. Bulk Activity Locks if provided: { activityLocks: { activity_1: true, ... } }
      if (body.activityLocks && typeof body.activityLocks === 'object') {
        const curRes = await pool.query(
          "SELECT value FROM site_settings WHERE key = 'activity_locks'"
        );
        let curLocks = { ...DEFAULT_ACTIVITY_LOCKS };
        if (curRes.rows[0]?.value) {
          try {
            curLocks = { ...curLocks, ...JSON.parse(curRes.rows[0].value) };
          } catch (e) {}
        }

        const merged = { ...curLocks, ...body.activityLocks };

        await pool.query(
          `INSERT INTO site_settings (key, value, updated_at)
           VALUES ('activity_locks', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
          [JSON.stringify(merged)]
        );
      }

      // Fetch and cache updated state immediately
      const updatedRes = await pool.query(
        "SELECT key, value FROM site_settings WHERE key IN ('site_locked', 'activity_locks')"
      );
      let updatedGlobal = false;
      let updatedActivities = { ...DEFAULT_ACTIVITY_LOCKS };

      updatedRes.rows.forEach(row => {
        if (row.key === 'site_locked') {
          updatedGlobal = row.value === 'true';
        } else if (row.key === 'activity_locks') {
          try {
            updatedActivities = { ...DEFAULT_ACTIVITY_LOCKS, ...JSON.parse(row.value) };
          } catch (e) {}
        }
      });

      // Update cache
      cachedSettings = {
        success: true,
        locked: updatedGlobal,
        activityLocks: updatedActivities
      };
      cacheTimestamp = Date.now();

      return res.status(200).json(cachedSettings);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('admin-settings error:', error);
    return res.status(500).json({ success: false, error: 'Database error' });
  }
}
