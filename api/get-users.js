// File: api/get-users.js
// Place this in your 'api' folder

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: "cyber-awareness-b470b",
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Use GET request' });
  }

  try {
    // Get all users
    const snapshot = await db.collection('users').get();

    if (snapshot.empty) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'No data found'
      });
    }

    // Extract data
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({ 
      success: true, 
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to get data'
    });
  }
}