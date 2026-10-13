// File: api/save-username.js
// Place this file in the 'api' folder in your Vercel project root

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: "cyber-awareness-b470b",
      // You'll need to add your service account credentials as environment variables
      // In Vercel dashboard: Settings > Environment Variables
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName, score, level, accuracy, date } = req.body;

    // Validate username
    if (!userName || userName.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Sanitize username
    const sanitizedName = userName.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').trim();

    // Prepare data to save
    const userData = {
      userName: sanitizedName,
      score: score || 0,
      level: level || 'Beginner',
      accuracy: accuracy || 0,
      completionDate: date || new Date().toLocaleDateString(),
      timestamp: new Date().toISOString(),
      createdAt: new Date()
    };

    // Save to Firestore
    const docRef = await db.collection('users').add(userData);

    return res.status(200).json({ 
      success: true, 
      message: 'Username saved successfully to Firebase',
      id: docRef.id,
      data: userData
    });

  } catch (error) {
    console.error('Error saving to Firebase:', error);
    return res.status(500).json({ 
      error: 'Failed to save username',
      details: error.message 
    });
  }
}