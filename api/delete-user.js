// Delete a PostgreSQL completion record after validating the server-side admin session.
import { pool } from './db.js';
import { requireAdmin } from './admin-auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const { id, deviceId } = req.body || {};
  if (!id && !deviceId) {
    return res.status(400).json({ success: false, error: 'User record ID or device ID is required' });
  }

  try {
    const result = id
      ? await pool.query(
          'DELETE FROM public.users WHERE id::text = $1::text RETURNING id, "userName", email, "certificateId", "deviceId", activity',
          [String(id)]
        )
      : await pool.query(
          'DELETE FROM public.users WHERE "deviceId" = $1 RETURNING id, "userName", email, "certificateId", "deviceId", activity',
          [String(deviceId)]
        );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'No matching user record found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User record and device authorization deleted successfully',
      id: id || result.rows[0]?.id,
      deletedCount: result.rowCount,
      deletedUser: result.rows[0]
    });
  } catch (error) {
    console.error('PostgreSQL delete user error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete user record' });
  }
}
