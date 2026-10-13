// File: api/get-users.js
// Fetches users from Supabase PostgreSQL (with optional Firebase fallback)

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: `postgresql://postgres.qjvpdrdfbmblfhprnbbf:${encodeURIComponent('S!ddeeq5696')}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Use GET request' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id,
          "userName",
          score,
          level,
          accuracy,
          "videoCompleted",
          "videoMarks",
          "quizMarks",
          "correctAnswers",
          "totalQuestions",
          activity,
          "completionDate",
          "createdAt"
        FROM public.users
        ORDER BY "createdAt" DESC, score DESC
      `);

      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (supabaseError) {
    console.error('Supabase get-users error:', supabaseError);

    // Fallback to Firebase if configured
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
        const snapshot = await db.collection('users').get();
        const users = [];
        snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

        return res.status(200).json({
          success: true,
          data: users,
          count: users.length
        });
      }
    } catch (fbError) {
      console.error('Firebase fallback error:', fbError);
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve users'
    });
  }
}