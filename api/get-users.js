// Returns participant records to an authenticated administrator.
import { pool } from './db.js';
import { requireAdmin } from './admin-auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Use GET request' });
  }
  if (!requireAdmin(req, res)) return;

  try {
    const result = await pool.query(`
      SELECT id, "userName", email, "certificateId", "employeeId", department,
        designation, score, level, accuracy, "videoCompleted", "videoMarks",
        "quizMarks", "correctAnswers", "totalQuestions", activity,
        "completionDate", "createdAt", "deviceId"
      FROM public.users
      ORDER BY "createdAt" DESC, score DESC
    `);

    return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('PostgreSQL get-users error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
}
