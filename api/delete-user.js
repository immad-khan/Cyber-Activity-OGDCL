// File: api/delete-user.js
// Handles deleting a user / quiz completion record by admin from PostgreSQL (and optional Firebase fallback)

import { pool } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Admin authentication check
  const adminToken = req.headers['x-admin-token'] || req.query.token || req.body?.token;
  if (adminToken !== 'cybershield-admin-2024' && adminToken !== 'ogdcl-admin-2026') {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin token' });
  }

  const { id, deviceId } = req.body || {};
  if (!id && !deviceId) {
    return res.status(400).json({ success: false, error: 'User record ID or device ID is required' });
  }

  try {
    let deletedFromPostgres = false;
    let deletedUser = null;

    // 1. Fetch user record before deletion to retrieve deviceId, userName, and activity details
    try {
      if (id) {
        const uRes = await pool.query(
          'SELECT id, "userName", email, "certificateId", "deviceId", activity FROM public.users WHERE id::text = $1::text',
          [String(id)]
        );
        deletedUser = uRes.rows[0] || null;
      } else if (deviceId) {
        const uRes = await pool.query(
          'SELECT id, "userName", email, "certificateId", "deviceId", activity FROM public.users WHERE "deviceId" = $1',
          [String(deviceId)]
        );
        deletedUser = uRes.rows[0] || null;
      }
    } catch (fetchErr) {
      console.warn('Error fetching user before delete:', fetchErr.message);
    }

    // 2. Delete from PostgreSQL (clearing user record, certificate and stored device ID)
    try {
      let result;
      if (id) {
        result = await pool.query('DELETE FROM public.users WHERE id::text = $1::text', [String(id)]);
      } else if (deviceId) {
        result = await pool.query('DELETE FROM public.users WHERE "deviceId" = $1', [String(deviceId)]);
      }
      deletedFromPostgres = (result?.rowCount || 0) > 0;
    } catch (dbErr) {
      console.warn('PostgreSQL delete user error:', dbErr.message);
    }

    // 3. Fallback / Sync delete from Firebase if configured
    try {
      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');

        if (!getApps().length) {
          initializeApp({
            credential: cert({
              projectId: 'cyber-awareness-b470b',
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            })
          });
        }

        const db = getFirestore();
        const targetId = id || deletedUser?.id;
        if (targetId) {
          await db.collection('users').doc(String(targetId)).delete();
        }
      }
    } catch (fbErr) {
      console.warn('Firebase fallback delete user error:', fbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'User record and device ID authorization deleted successfully',
      id: id || deletedUser?.id,
      deletedUser
    });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user record'
    });
  }
}
