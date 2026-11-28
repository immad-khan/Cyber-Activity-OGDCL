// File: api/save-username.js
// Saves user completion and certificate-claim data to PostgreSQL.

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
    const qName = String(req.query?.userName || req.query?.name || '').trim();
    const qDeviceId = String(req.query?.deviceId || '').trim();
    const qActivity = String(req.query?.activity || '').trim();
    const clientLocalClaimed = req.query?.localClaimed === 'true';

    try {
      const actFilterClause = `
        ($2 = '' OR activity = $2 
          OR (($2 ILIKE '%activity 4%' OR $2 ILIKE '%qr%' OR $2 ILIKE '%social%') AND (activity ILIKE '%activity 4%' OR activity ILIKE '%qr%' OR activity ILIKE '%social%'))
          OR (($2 ILIKE '%activity 1%' OR $2 ILIKE '%password%') AND (activity ILIKE '%activity 1%' OR activity ILIKE '%password%'))
          OR (($2 ILIKE '%activity 2%' OR $2 ILIKE '%email%' OR $2 ILIKE '%phishing%') AND (activity ILIKE '%activity 2%' OR activity ILIKE '%email%' OR activity ILIKE '%phishing%'))
          OR (($2 ILIKE '%activity 3%' OR $2 ILIKE '%privacy%' OR $2 ILIKE '%data%') AND (activity ILIKE '%activity 3%' OR activity ILIKE '%privacy%' OR activity ILIKE '%data%'))
        )
      `;

      let checkRes = { rows: [] };
      // 1. Check by deviceId first if provided
      if (qDeviceId) {
        checkRes = await pool.query(
          `SELECT id, "certificateId", "completionDate", score, "userName", "certificateClaimed" FROM public.users 
           WHERE "deviceId" = $1 
             AND ${actFilterClause}
           ORDER BY "certificateClaimed" DESC, id DESC
           LIMIT 5`,
          [qDeviceId, qActivity]
        );
      }
      // 2. Check by email
      if (checkRes.rows.length === 0 && qEmail) {
        checkRes = await pool.query(
          `SELECT id, "certificateId", "completionDate", score, "userName", "certificateClaimed" FROM public.users 
           WHERE LOWER(email) = LOWER($1) 
             AND ${actFilterClause}
           ORDER BY "certificateClaimed" DESC, id DESC
           LIMIT 5`,
          [qEmail, qActivity]
        );
      }
      // 3. Check by userName
      if (checkRes.rows.length === 0 && qName) {
        checkRes = await pool.query(
          `SELECT id, "certificateId", "completionDate", score, "userName", "certificateClaimed" FROM public.users 
           WHERE LOWER("userName") = LOWER($1) 
             AND ${actFilterClause}
           ORDER BY "certificateClaimed" DESC, id DESC
           LIMIT 5`,
          [qName, qActivity]
        );
      }

      const userExists = checkRes.rows.length > 0;
      let hasCert = checkRes.rows.some(r => r.certificateClaimed === true);

      // Auto-sync: If user exists in DB and device had already claimed, ensure DB is marked claimed
      if (userExists && clientLocalClaimed && !hasCert) {
        const targetRow = checkRes.rows[0];
        await pool.query(
          `UPDATE public.users SET "certificateClaimed" = TRUE WHERE id = $1`,
          [targetRow.id]
        ).catch(() => {});
        hasCert = true;
      }

      const bestRow = checkRes.rows.find(r => r.certificateClaimed === true) || checkRes.rows[0];

      return res.status(200).json({
        userExists,
        alreadyGenerated: hasCert,
        claimed: hasCert,
        certificateId: bestRow?.certificateId || null,
        completionDate: bestRow?.completionDate || null,
        userName: bestRow?.userName || null
      });
    } catch (e) {
      console.error('Error checking cert status:', e);
      return res.status(500).json({ error: 'Could not verify certificate status' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Atomically claim the certificate before the browser creates the PDF.
  if (req.body?.claimCertificate) {
    const cName = String(req.body.userName || req.body.username || req.body.name || '').trim();
    const cEmail = String(req.body.email || '').trim().toLowerCase();
    const cDevice = String(req.body.deviceId || '').trim();
    const cAct = String(req.body.activity || '').trim();

    if (!cAct || (!cDevice && !cEmail && !cName)) {
      return res.status(400).json({ success: false, error: 'Activity and participant identity are required' });
    }

    const identityClause = `(
      ($1 <> '' AND "deviceId" = $1)
      OR ($2 <> '' AND LOWER(email) = LOWER($2))
      OR ($3 <> '' AND LOWER("userName") = LOWER($3))
    )`;
    const activityClause = `(
      activity = $4
      OR (($4 ILIKE '%activity 4%' OR $4 ILIKE '%qr%' OR $4 ILIKE '%social%') AND (activity ILIKE '%activity 4%' OR activity ILIKE '%qr%' OR activity ILIKE '%social%'))
      OR (($4 ILIKE '%activity 1%' OR $4 ILIKE '%password%') AND (activity ILIKE '%activity 1%' OR activity ILIKE '%password%'))
      OR (($4 ILIKE '%activity 2%' OR $4 ILIKE '%email%' OR $4 ILIKE '%phishing%') AND (activity ILIKE '%activity 2%' OR activity ILIKE '%email%' OR activity ILIKE '%phishing%'))
      OR (($4 ILIKE '%activity 3%' OR $4 ILIKE '%privacy%' OR $4 ILIKE '%data%') AND (activity ILIKE '%activity 3%' OR activity ILIKE '%privacy%' OR activity ILIKE '%data%'))
    )`;

    try {
      const values = [cDevice, cEmail, cName, cAct];
      const claimed = await pool.query(
        `UPDATE public.users SET "certificateClaimed" = TRUE
         WHERE ${identityClause} AND ${activityClause}
           AND "certificateClaimed" IS DISTINCT FROM TRUE
         RETURNING "certificateId"`,
        values
      );
      if (claimed.rowCount > 0) {
        return res.status(200).json({ success: true, claimed: true, certificateId: claimed.rows[0].certificateId });
      }

      const existing = await pool.query(
        `SELECT "certificateClaimed", "certificateId" FROM public.users
         WHERE ${identityClause} AND ${activityClause}
         LIMIT 1`,
        values
      );
      if (existing.rows[0]?.certificateClaimed) {
        return res.status(409).json({ success: false, alreadyGenerated: true, error: 'Certificate has already been generated' });
      }
      return res.status(404).json({ success: false, error: 'No matching completion record found' });
    } catch (claimErr) {
      console.error('Error claiming certificate:', claimErr);
      return res.status(500).json({ success: false, error: 'Could not claim certificate' });
    }
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
      deviceId = '',
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
    const sanitizedEmail = String(email || '').trim().toLowerCase();
    const sanitizedDeviceId = String(deviceId || '').trim();

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

    // ── Check for existing record for this email, deviceId, or username + activity ──
    const actFilterClause = `
      ($2 = '' OR activity = $2 
        OR (($2 ILIKE '%activity 4%' OR $2 ILIKE '%qr%' OR $2 ILIKE '%social%') AND (activity ILIKE '%activity 4%' OR activity ILIKE '%qr%' OR activity ILIKE '%social%'))
        OR (($2 ILIKE '%activity 1%' OR $2 ILIKE '%password%') AND (activity ILIKE '%activity 1%' OR activity ILIKE '%password%'))
        OR (($2 ILIKE '%activity 2%' OR $2 ILIKE '%email%' OR $2 ILIKE '%phishing%') AND (activity ILIKE '%activity 2%' OR activity ILIKE '%email%' OR activity ILIKE '%phishing%'))
        OR (($2 ILIKE '%activity 3%' OR $2 ILIKE '%privacy%' OR $2 ILIKE '%data%') AND (activity ILIKE '%activity 3%' OR activity ILIKE '%privacy%' OR activity ILIKE '%data%'))
      )
    `;

    let existingCheck = { rows: [] };
    if (sanitizedDeviceId) {
      existingCheck = await pool.query(
        `SELECT id, "certificateId", "completionDate", score, "certificateClaimed" FROM public.users 
         WHERE "deviceId" = $1 
           AND ${actFilterClause}
         ORDER BY "certificateClaimed" DESC, id DESC
         LIMIT 1`,
        [sanitizedDeviceId, activity]
      );
    }
    if (existingCheck.rows.length === 0 && sanitizedEmail) {
      existingCheck = await pool.query(
        `SELECT id, "certificateId", "completionDate", score, "certificateClaimed" FROM public.users 
         WHERE LOWER(email) = LOWER($1) 
           AND ${actFilterClause}
         ORDER BY "certificateClaimed" DESC, id DESC
         LIMIT 1`,
        [sanitizedEmail, activity]
      );
    }
    if (existingCheck.rows.length === 0 && sanitizedName) {
      existingCheck = await pool.query(
        `SELECT id, "certificateId", "completionDate", score, "certificateClaimed" FROM public.users 
         WHERE LOWER("userName") = LOWER($1) 
           AND ${actFilterClause}
         ORDER BY "certificateClaimed" DESC, id DESC
         LIMIT 1`,
        [sanitizedName, activity]
      );
    }

    const clientClaimed = Boolean(generateCertificate || req.body?.certificateClaimed);

    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0];
      const isAlreadyClaimed = existing.certificateClaimed === true || clientClaimed;
      // Update score and details if higher or retaken, strictly preserving certificateClaimed = true
      await pool.query(
        `UPDATE public.users 
         SET "userName" = $1,
             score = GREATEST(score, $2),
             "quizMarks" = $3,
             "correctAnswers" = $4,
             level = $5,
             accuracy = $6,
             "completionDate" = $7,
             "deviceId" = COALESCE(NULLIF($8, ''), "deviceId"),
             "certificateClaimed" = CASE WHEN "certificateClaimed" = TRUE THEN TRUE ELSE $9 END
         WHERE id = $10`,
        [sanitizedName, finalScore, finalQuizMarks, finalCorrect, level, parseInt(accuracy, 10) || 0, date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), sanitizedDeviceId, isAlreadyClaimed, existing.id]
      );
      return res.status(200).json({
        success: true,
        userExists: true,
        alreadyGenerated: isAlreadyClaimed,
        claimed: isAlreadyClaimed,
        certificateId: existing.certificateId,
        message: 'Saved successfully',
        id: existing.id,
        data: {
          id: existing.id,
          userName: sanitizedName,
          certificateId: existing.certificateId,
          score: Math.max(existing.score || 0, finalScore),
          level: level,
          completionDate: existing.completionDate,
          deviceId: sanitizedDeviceId,
          certificateClaimed: isAlreadyClaimed
        }
      });
    }

    const certificateId = `OGDCL-${new Date().getFullYear()}-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const completionDate = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Save to PostgreSQL using pre-warmed connection pool
    const isCertClaimed = Boolean(generateCertificate || req.body?.certificateClaimed);
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
        "completionDate",
        "deviceId",
        "certificateClaimed"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, "userName", email, "certificateId", "employeeId", department, designation, score, level, "deviceId", "createdAt", "certificateClaimed";
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
      completionDate,
      sanitizedDeviceId,
      isCertClaimed
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
    console.error('PostgreSQL save-user error:', error);
    return res.status(500).json({ error: 'Failed to save user record' });
  }
}
