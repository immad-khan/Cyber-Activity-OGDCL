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

  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ success: false, error: 'User record ID is required' });
  }

  try {
    let deletedFromPostgres = false;

    // 1. Delete from PostgreSQL
    try {
      const result = await pool.query('DELETE FROM public.users WHERE id::text = $1::text', [String(id)]);
      deletedFromPostgres = (result.rowCount || 0) > 0;
    } catch (dbErr) {
      console.warn('PostgreSQL delete user error:', dbErr.message);
    }

    // 2. Fallback / Sync delete from Firebase if configured
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
        await db.collection('users').doc(String(id)).delete();
      }
    } catch (fbErr) {
      console.warn('Firebase fallback delete user error:', fbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'User record deleted successfully',
      id
    });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user record'
    });
  }
}
