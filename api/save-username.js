// File: api/save-username.js
// Saves user completion data to Supabase PostgreSQL (with optional Firebase fallback)

import { pool } from './db.js';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawName = req.body?.userName || req.body?.username || req.body?.name;
    if (!rawName || String(rawName).trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const {
      score,
      level = 'Beginner',
      accuracy = 0,
      videoCompleted = false,
      videoMarks,
      quizMarks,
      correctAnswers = 0,
      totalQuestions = 0,
      activity = 'Cybersecurity Awareness',
      date
    } = req.body || {};

    const sanitizedName = String(rawName).replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').trim();
    const completionDate = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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

    // Save to Supabase using pre-warmed connection pool
    const insertQuery = `
      INSERT INTO public.users (
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
        "completionDate"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, "userName", score, level, "createdAt";
    `;

    const values = [
      sanitizedName,
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
      message: 'Saved successfully to Supabase',
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