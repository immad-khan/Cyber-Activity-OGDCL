// File: api/save-username.js
// Saves user completion data to Supabase PostgreSQL (with optional Firebase fallback)

import { pool } from './db.js';
import { randomUUID } from 'node:crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const qEmail = String(req.query?.email || '').trim().toLowerCase();
    const qActivity = String(req.query?.activity || '').trim();
    if (!qEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }
    try {
      const checkRes = await pool.query(
        `SELECT "certificateId", "completionDate", score FROM public.users 
         WHERE LOWER(email) = LOWER($1) 
           AND ($2 = '' OR activity = $2)
           AND "certificateId" IS NOT NULL 
         LIMIT 1`,
        [qEmail, qActivity]
      );
      if (checkRes.rows.length > 0) {
        return res.status(200).json({
          alreadyGenerated: true,
          certificateId: checkRes.rows[0].certificateId,
          completionDate: checkRes.rows[0].completionDate
        });
      }
      return res.status(200).json({ alreadyGenerated: false });
    } catch (e) {
      console.error('Error checking cert status:', e);
      return res.status(200).json({ alreadyGenerated: false });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawName = req.body?.userName || req.body?.username || req.body?.name;
    if (!rawName || String(rawName).trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const {
      email = '',
      employeeId = '',
      department = '',
      designation = '',
      score,
      level = 'Beginner',
      accuracy = 0,
      videoCompleted = false,
      videoMarks,
      quizMarks,
      correctAnswers = 0,
      totalQuestions = 0,
      activity = 'Cybersecurity Awareness',
      generateCertificate = false,
      date
    } = req.body || {};

    const sanitizedName = String(rawName).replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').trim();
    const sanitizedEmpId = String(employeeId).replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').trim();
    const sanitizedDept = String(department).replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').trim();
    const sanitizedDesig = String(designation).replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').trim();
    const sanitizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!sanitizedEmail.endsWith('@ogdcl.com')) {
      return res.status(403).json({ error: 'Only official @ogdcl.com email addresses are permitted.' });
    }

    const finalCorrect = parseInt(correctAnswers, 10) || 0;
    const finalVideoCompleted = Boolean(videoCompleted);
    const finalVideoMarks = (videoMarks !== undefined && videoMarks !== null) 
      ? parseInt(videoMarks, 10) 
      : (finalVideoCompleted ? 50 : 0);
    const finalQuizMarks = (quizMarks !== undefined && quizMarks !== null) 
      ? parseInt(quizMarks, 10) 
      : (finalCorrect * 20);
    const finalScore = (score !== undefined && score !== null)
      ? parseInt(score, 10)
      : (finalVideoMarks + finalQuizMarks);

    // ── Check for existing certificate for this email + activity ──
    const existingCheck = await pool.query(
      `SELECT id, "certificateId", "completionDate", score FROM public.users 
       WHERE LOWER(email) = LOWER($1) 
         AND activity = $2 
         AND "certificateId" IS NOT NULL 
       LIMIT 1`,
      [sanitizedEmail, activity]
    );

    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0];
      if (generateCertificate) {
        // Hard block: Certificate can only be generated ONCE per activity
        return res.status(409).json({
          success: false,
          alreadyGenerated: true,
          certificateId: existing.certificateId,
          message: 'Certificate already generated for this activity. Re-generation is not permitted even after retaking the quiz.'
        });
      } else {
        // Retake quiz without generating a new certificate: update score
        await pool.query(
          `UPDATE public.users 
           SET score = GREATEST(score, $1), "quizMarks" = $2, "correctAnswers" = $3 
           WHERE id = $4`,
          [finalScore, finalQuizMarks, finalCorrect, existing.id]
        );
        return res.status(200).json({
          success: true,
          alreadyGenerated: true,
          certificateId: existing.certificateId,
          message: 'Quiz retake recorded. Original certificate preserved.',
          id: existing.id
        });
      }
    }

    const certificateId = `OGDCL-${new Date().getFullYear()}-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const completionDate = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Save to PostgreSQL using pre-warmed connection pool
    const insertQuery = `
      INSERT INTO public.users (
        "userName",
        email,
        "certificateId",
        "employeeId",
        department,
        designation,
        score,
        level,
        accuracy,
        "videoCompleted",
        "videoMarks",
        "quizMarks",
        "correctAnswers",
        "totalQuestions",
        activity,
        "completionDate"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, "userName", email, "certificateId", "employeeId", department, designation, score, level, "createdAt";
    `;

    const values = [
      sanitizedName,
      sanitizedEmail,
      certificateId,
      sanitizedEmpId,
      sanitizedDept,
      sanitizedDesig,
      finalScore,
      level,
      parseInt(accuracy, 10) || 0,
      finalVideoCompleted,
      finalVideoMarks,
      finalQuizMarks,
      finalCorrect,
      parseInt(totalQuestions, 10) || 0,
      activity,
      completionDate
    ];

    const result = await pool.query(insertQuery, values);
    const savedUser = result.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Saved successfully to database',
      id: savedUser.id,
      data: savedUser
    });

  } catch (error) {
    console.error('Error saving user to Supabase:', error);

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
        const userData = {
          userName: req.body?.userName,
          email: sanitizedEmail,
          score: req.body?.score || 0,
          level: req.body?.level || 'Beginner',
          accuracy: req.body?.accuracy || 0,
          completionDate: req.body?.date || new Date().toLocaleDateString(),
          timestamp: new Date().toISOString()
        };
        const docRef = await db.collection('users').add(userData);
        return res.status(200).json({
          success: true,
          message: 'Saved to Firebase fallback',
          id: docRef.id
        });
      }
    } catch (fbErr) {
      console.error('Firebase fallback failed:', fbErr);
    }

    return res.status(500).json({
      error: 'Failed to save username',
      details: error.message
    });
  }
}
