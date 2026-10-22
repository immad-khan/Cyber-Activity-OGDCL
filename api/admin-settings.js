// File: api/admin-settings.js
// Manages global site lock, individual activity locks, dynamic module videos & MCQs (Index, Activity 1-4)

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_FILE = path.resolve(__dirname, '..', 'site-settings-fallback.json');
const TMP_FALLBACK_FILE = path.join(os.tmpdir(), 'site-settings-fallback.json');

const DEFAULT_ACTIVITY_LOCKS = {
  activity_1: false, // Activity 1: Password Protection & MFA
  activity_2: false, // Activity 2: Social Engineering
  activity_3: false, // Activity 3: Data Privacy
  activity_4: false  // Activity 4: The Executive Target (Phishing)
};

const DEFAULT_MODULE_VIDEOS = {
  index: {
    id: 'index',
    name: 'Index',
    title: 'Cybersecurity Awareness Overview',
    desc: 'Master foundational cybersecurity awareness to protect yourself and OGDCL digital assets.',
    sourceType: 'mp4',
    url: 'videos/phishing-awareness.mp4',
    poster: 'videos/phishing-awareness_poster.jpg',
    pageUrl: 'index.html',
    pageName: 'Home / Index Page',
    enabled: true
  },
  activity_1: {
    id: 'activity_1',
    name: 'Activity 1',
    title: 'Password Security & Multi-Factor Authentication',
    desc: 'Password policy, Bitwarden vault security, and multi-factor authentication defense.',
    sourceType: 'mp4',
    url: 'videos/Password_policy.mp4',
    poster: 'videos/Password_policy_poster.jpg',
    pageUrl: 'mfa-week.html',
    pageName: 'Activity 1: Password Protection'
  },
  activity_2: {
    id: 'activity_2',
    name: 'Activity 2',
    title: 'Social Engineering Defense Training',
    desc: 'Recognize manipulation, verify identity, and defend against pretexting and human attacks.',
    sourceType: 'mp4',
    url: '',
    poster: '',
    pageUrl: 'social-engineering-week.html',
    pageName: 'Activity 2: Social Engineering'
  },
  activity_3: {
    id: 'activity_3',
    name: 'Activity 3',
    title: 'Data Privacy & Corporate Asset Protection',
    desc: 'Safeguard sensitive corporate information, master PII standards, and defend company data.',
    sourceType: 'mp4',
    url: '',
    poster: '',
    pageUrl: 'privacy-week.html',
    pageName: 'Activity 3: Data Privacy'
  },
  activity_4: {
    id: 'activity_4',
    name: 'Activity 4',
    title: 'The Executive Target & Phishing Defense',
    desc: 'Executive spear-phishing, business email compromise, deepfakes, and verification protocols.',
    sourceType: 'mp4',
    url: 'videos/phishing-awareness.mp4',
    poster: 'videos/phishing-awareness_poster.jpg',
    pageUrl: 'phishing-week.html',
    pageName: 'Activity 4: The Executive Target'
  },
  activity_banner: {
    id: 'activity_banner',
    name: 'Shared Activity Video',
    title: 'Activity Video Briefing',
    desc: 'Watch this shared cybersecurity briefing before starting the activities.',
    sourceType: 'mp4',
    url: '',
    poster: '',
    pageUrl: 'mfa-week.html',
    pageName: 'Activities 1–4: Shared video above hero sections',
    enabled: true
  }
};

const DEFAULT_MODULE_MCQS = {
  index: [
    {
      question: "Which of these makes the strongest password?",
      options: ["Password123", "mypassword", "M7$kL9#pR2@qN8!", "123456789"],
      correct: 2,
      explanation: "Complex passwords with mixed characters, symbols, and adequate length are exponentially more secure and virtually impossible to crack through brute force attacks."
    },
    {
      question: "What is the safest way to connect to public Wi-Fi?",
      options: ["Connect directly", "Use a VPN", "Share your hotspot", "Disable firewall"],
      correct: 1,
      explanation: "A VPN encrypts your internet traffic, protecting your data from potential eavesdroppers on public networks."
    },
    {
      question: "How often should you update your software?",
      options: ["Never", "Once a year", "When prompted/available", "Only when broken"],
      correct: 2,
      explanation: "Regular updates patch security vulnerabilities that hackers could exploit to gain unauthorized access to your system."
    },
    {
      question: "What should you do with suspicious emails?",
      options: ["Click all links", "Forward to friends", "Delete and report", "Reply with info"],
      correct: 2,
      explanation: "Deleting suspicious emails and reporting them helps protect you and others from potential phishing attacks."
    },
    {
      question: "What makes two-factor authentication effective?",
      options: ["Uses two passwords", "Requires something you know + something you have", "Takes twice as long", "Works on two devices"],
      correct: 1,
      explanation: "2FA combines something you know (password) with something you have (phone/token), making unauthorized access extremely difficult."
    }
  ],
  activity_1: [
    {
      question: "What makes a password strong according to best practices?",
      options: [
        "Using your birthday and name",
        "At least 12 characters with mixed case, numbers, and symbols",
        "A simple word that's easy to remember",
        "Your favorite sports team name"
      ],
      correct: 1,
      explanation: "Strong passwords require at least 12 characters combining uppercase, lowercase, numbers, and symbols to resist brute-force attacks."
    },
    {
      question: "What percentage of breaches involve weak or stolen passwords?",
      options: [
        "Over 80%",
        "About 50%",
        "Less than 30%",
        "Around 60%"
      ],
      correct: 0,
      explanation: "Over 80% of security breaches involve weak or stolen passwords, making password security critical for everyone."
    },
    {
      question: "What is the main benefit of using a password manager like Bitwarden or 1Password?",
      options: [
        "It's free",
        "It stores passwords securely and generates strong unique passwords",
        "It works only on one device",
        "It shares passwords with friends"
      ],
      correct: 1,
      explanation: "Password managers securely store all passwords in one encrypted place and automatically generate strong, unique passwords for each account."
    },
    {
      question: "Why should you enable Two-Factor Authentication (2FA)?",
      options: [
        "It makes login twice as slow",
        "It blocks 99% of unauthorized access even if password is stolen",
        "It's required by law",
        "It replaces your password"
      ],
      correct: 1,
      explanation: "2FA provides an additional security layer that blocks 99% of automated attacks, even when passwords are compromised."
    },
    {
      question: "What should you do if you receive an unexpected MFA/2FA prompt?",
      options: [
        "Approve it quickly",
        "Ignore it",
        "Deny it and report to IT security immediately",
        "Approve it and change password later"
      ],
      correct: 2,
      explanation: "Unexpected MFA prompts indicate someone has your password. Deny immediately and report to IT security to prevent account takeover."
    }
  ],
  activity_2: [
    {
      question: "According to the video (Chapter 0:30), what is Social Engineering?",
      options: [
        "Writing complex software scripts to crack firewall ports directly",
        "A manipulation technique that exploits human psychology, trust, and emotions to trick victims into handing over confidential data or access",
        "An automatic software update sent by your operating system",
        "A marketing discipline for managing corporate social media accounts"
      ],
      correct: 1,
      explanation: "Social engineering targets the human element rather than technical software vulnerabilities—manipulating human psychology, curiosity, and trust to breach security."
    },
    {
      question: "As highlighted in the video (Chapter 1:09), what are the core traits that social engineers weaponize?",
      options: [
        "Patiently waiting months without contacting the victim",
        "Triggering heightened emotions, creating artificial urgency, and exploiting trust or authority",
        "Sending complex mathematical formulas that only computers can read",
        "Offering free printed textbooks and physical user manuals"
      ],
      correct: 1,
      explanation: "Social engineering attacks rely on triggering heightened emotional states combined with artificial urgency so targets act on impulse before thinking critically."
    },
    {
      question: "Why do attackers specifically rely on creating 'Heightened Emotions' and 'Urgency' (Chapter 1:35)?",
      options: [
        "To give the target sufficient time to consult with IT Security",
        "Because pressure and heightened emotions cloud logical judgment and prevent the victim from pausing to verify the request",
        "To ensure their emails comply with corporate spam transmission filters",
        "Because security firewalls can only detect slowly delivered messages"
      ],
      correct: 1,
      explanation: "When you are stressed, hurried, or alarmed, your rational cognitive defense drops. Attackers manufacture urgent deadlines so you won't pause to verify."
    },
    {
      question: "Where do social engineering attacks happen according to the video (Chapter 2:19)?",
      options: [
        "Exclusively through personal spam email folders",
        "Across multiple communication channels including emails, phone calls (vishing), SMS/messaging, social networks, and in-person physical spaces",
        "Only on dark web chat forums",
        "Strictly inside physical server rooms by cutting network wires"
      ],
      correct: 1,
      explanation: "Social engineering attacks occur everywhere: via emails (phishing), phone calls (vishing), text messages (smishing), social platforms (LinkedIn), and in-person interactions (tailgating)."
    },
    {
      question: "What is the recommended action if you think you are being targeted by a social engineering attack?",
      options: [
        "Reply to the attacker and demand that they prove their identity",
        "Slow down, do not click links or share credentials, verify through an independent official channel, and notify IT Security immediately",
        "Forward the message to all department colleagues to see if anyone wants to click it",
        "Comply with the urgent instructions immediately just to avoid potential trouble"
      ],
      correct: 1,
      explanation: "Always slow down and pause. Never use phone numbers or links provided in the suspicious message. Verify independently through official channels and report it immediately."
    }
  ],
  activity_3: [
    {
      question: "Which of the following is considered Personally Identifiable Information (PII) and corporate confidential data that must be strictly protected under OGDCL's privacy policy?",
      options: [
        "Public press releases published on the official company website",
        "Employee CNIC numbers, payroll records, and proprietary exploration well logs",
        "General public holiday announcements",
        "Marketing brochures distributed at public energy conferences"
      ],
      correct: 1,
      explanation: "Employee CNIC numbers, payroll details, health records, and proprietary exploration files constitute sensitive personal and corporate data requiring strict confidentiality and encryption."
    },
    {
      question: "When working in public environments (airports, cafes, or public transit), what is the best security measure against 'Shoulder Surfing'?",
      options: [
        "Turn screen brightness to maximum so everyone can see you are working",
        "Use a physical privacy screen filter, position your screen away from bystanders, and connect via corporate VPN",
        "Share your mobile hotspot with nearby travelers without a password",
        "Leave your laptop unlocked while visiting the restroom for just one minute"
      ],
      correct: 1,
      explanation: "A physical privacy filter prevents onlookers from reading your screen from side angles. Combined with a secure VPN and discreet positioning, it protects sensitive company data from visual snooping."
    },
    {
      question: "According to the Clean Desk and Clear Screen Policy, what should an employee do whenever leaving their workstation unattended?",
      options: [
        "Leave all physical files open on the desk so colleagues know you are returning soon",
        "Lock the computer screen immediately (Win + L) and secure confidential physical documents in locked drawers",
        "Turn off only the computer monitor while leaving the PC unlocked",
        "Place a sticky note with your password on the keyboard for emergencies"
      ],
      correct: 1,
      explanation: "Always lock your computer workstation immediately (Windows key + L) and lock physical files away when stepping away, even briefly, to prevent unauthorized physical access."
    },
    {
      question: "How should physical documents containing customer or employee personal data be disposed of when no longer needed?",
      options: [
        "Tossed into the standard office wastepaper recycling bin",
        "Taken home for domestic paper recycling",
        "Deposited into locked, dedicated shredder bins or securely shredded using cross-cut shredders",
        "Kept stacked in open cardboard boxes in unmonitored hallways"
      ],
      correct: 2,
      explanation: "Sensitive paper records must be destroyed using approved cross-cut shredders or placed into locked disposal bins to prevent dumpster diving and physical data breaches."
    },
    {
      question: "What is the 'Principle of Least Privilege' (PoLP) in data privacy and access management?",
      options: [
        "Granting users only the minimum access rights necessary to perform their specific job responsibilities",
        "Granting every employee full administrative access to all files to maximize team collaboration",
        "Allowing contractors to view all employee payroll records without verification",
        "Never granting anyone access to any computer systems at all"
      ],
      correct: 0,
      explanation: "The Principle of Least Privilege ensures that users and applications are provided only the minimum level of access necessary for their legitimate business duties, drastically minimizing exposure risks."
    }
  ],
  activity_4: [
    {
      question: "You receive an urgent email appearing to be from the CEO requesting an immediate wire transfer. What should you do?",
      options: [
        "Process immediately",
        "Reply to email",
        "Call CEO using known number",
        "Forward to finance"
      ],
      correct: 2,
      explanation: "Always verify high-stakes requests through a separate communication channel. Business Email Compromise is one of the most costly attacks."
    },
    {
      question: "You notice an MFA prompt on your phone but you're not trying to log in. What's the best action?",
      options: [
        "Approve it",
        "Ignore it",
        "Deny and report to IT security",
        "Approve and change password later"
      ],
      correct: 2,
      explanation: "Unexpected MFA prompts indicate someone has your password. Deny immediately and report to IT security to prevent account takeover."
    },
    {
      question: "A LinkedIn connection requests your work email. What should you do?",
      options: [
        "Share it",
        "Share personal email instead",
        "Politely decline",
        "Share but ask not to spam"
      ],
      correct: 2,
      explanation: "Work email addresses are valuable for targeted phishing attacks. Protect your corporate identity by not sharing it publicly."
    },
    {
      question: "You receive a video call from your CFO on Teams with poor quality. They're requesting urgent credentials. What do you do?",
      options: [
        "Provide credentials",
        "Ask for email request",
        "End call and verify through another channel",
        "Share screen instead"
      ],
      correct: 2,
      explanation: "Deepfake technology can impersonate executives. Always verify through established channels, especially for sensitive requests."
    },
    {
      question: "What's the most secure type of multi-factor authentication for executives?",
      options: [
        "SMS codes",
        "Email codes",
        "Hardware security keys",
        "Authenticator app"
      ],
      correct: 2,
      explanation: "Hardware security keys provide the highest protection against phishing and credential theft. They're immune to social engineering attacks."
    }
  ]
};

// In-memory cache for ultra-fast page loads (<1ms)
let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 2500;


function mergeModuleVideos(savedVideos) {
  const result = {};
  for (const [key, def] of Object.entries(DEFAULT_MODULE_VIDEOS)) {
    result[key] = { ...def, ...(savedVideos?.[key] || {}) };
  }
  return result;
}

// Read settings from local fallback JSON file (with /tmp support for serverless like Vercel)
function readFallbackFile() {
  // Try main file first (works on local servers, always has the latest data)
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return {
        locked: data.locked ?? false,
        activityLocks: { ...DEFAULT_ACTIVITY_LOCKS, ...(data.activityLocks || {}) },
        moduleVideos: mergeModuleVideos(data.moduleVideos),
        moduleMcqs: { ...DEFAULT_MODULE_MCQS, ...(data.moduleMcqs || {}) }
      };
    }
  } catch (e) {
    console.warn('⚠️ Could not read main settings fallback file:', e.message);
  }
  // Try /tmp fallback (for serverless environments like Vercel where main file is read-only)
  try {
    if (fs.existsSync(TMP_FALLBACK_FILE)) {
      const raw = fs.readFileSync(TMP_FALLBACK_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return {
        locked: data.locked ?? false,
        activityLocks: { ...DEFAULT_ACTIVITY_LOCKS, ...(data.activityLocks || {}) },
        moduleVideos: mergeModuleVideos(data.moduleVideos),
        moduleMcqs: { ...DEFAULT_MODULE_MCQS, ...(data.moduleMcqs || {}) }
      };
    }
  } catch (e) {
    console.warn('⚠️ Could not read tmp settings fallback file:', e.message);
  }
  return {
    locked: false,
    activityLocks: { ...DEFAULT_ACTIVITY_LOCKS },
    moduleVideos: { ...DEFAULT_MODULE_VIDEOS },
    moduleMcqs: { ...DEFAULT_MODULE_MCQS }
  };
}

// Write settings to local fallback JSON file
function writeFallbackFile(data) {
  const jsonStr = JSON.stringify(data, null, 2);
  let wrote = false;
  try {
    fs.writeFileSync(FALLBACK_FILE, jsonStr, 'utf-8');
    wrote = true;
  } catch (e) {
    // Expected on read-only serverless filesystems (e.g. Vercel)
  }
  try {
    fs.writeFileSync(TMP_FALLBACK_FILE, jsonStr, 'utf-8');
    wrote = true;
  } catch (e) {
    // Ignore /tmp write errors
  }
  if (!wrote) {
    console.warn('⚠️ Could not write settings fallback file to disk or tmp');
  }
}

let isTableInitialized = false;
let isDbReachable = true;
let lastDbFailure = 0;
const DB_RETRY_INTERVAL_MS = 60000; // Only retry connecting once every 60 seconds

function shouldAttemptDb() {
  if (!isDbReachable && (Date.now() - lastDbFailure < DB_RETRY_INTERVAL_MS)) {
    return false;
  }
  return true;
}

function markDbFailed(err) {
  isDbReachable = false;
  lastDbFailure = Date.now();
  console.warn('⚠️ [Settings] Database unavailable, using file fallback:', err?.message || 'Connection failed');
}

async function ensureTableOnce() {
  if (isTableInitialized || !shouldAttemptDb()) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Seed default global lock state if not present
    await pool.query(`
      INSERT INTO site_settings (key, value)
      VALUES ('site_locked', 'false')
      ON CONFLICT (key) DO NOTHING
    `);

    // Seed default per-activity locks if not present
    await pool.query(`
      INSERT INTO site_settings (key, value)
      VALUES ('activity_locks', $1)
      ON CONFLICT (key) DO NOTHING
    `, [JSON.stringify(DEFAULT_ACTIVITY_LOCKS)]);

    // Seed default module videos if not present
    await pool.query(`
      INSERT INTO site_settings (key, value)
      VALUES ('module_videos', $1)
      ON CONFLICT (key) DO NOTHING
    `, [JSON.stringify(DEFAULT_MODULE_VIDEOS)]);

    // Seed default module mcqs if not present
    await pool.query(`
      INSERT INTO site_settings (key, value)
      VALUES ('module_mcqs', $1)
      ON CONFLICT (key) DO NOTHING
    `, [JSON.stringify(DEFAULT_MODULE_MCQS)]);

    isTableInitialized = true;
    isDbReachable = true;
  } catch (err) {
    markDbFailed(err);
  }
}

// Kick off initialization once in background
ensureTableOnce();

async function saveDbSetting(key, value) {
  if (!isDbReachable) return;
  try {
    await pool.query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );
  } catch (e) {
    markDbFailed(e);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const now = Date.now();
      // Serve from cache if fresh (<1ms response)
      if (cachedSettings && (now - cacheTimestamp < CACHE_TTL_MS)) {
        return res.status(200).json(cachedSettings);
      }

      let globalLocked = false;
      let activityLocks = { ...DEFAULT_ACTIVITY_LOCKS };
      let moduleVideos = { ...DEFAULT_MODULE_VIDEOS };
      let moduleMcqs = { ...DEFAULT_MODULE_MCQS };
      let dbLoaded = false;

      if (shouldAttemptDb()) {
        try {
          await ensureTableOnce();
          const result = await pool.query(
            "SELECT key, value FROM site_settings WHERE key IN ('site_locked', 'activity_locks', 'module_videos', 'module_mcqs')"
          );

          result.rows.forEach(row => {
            if (row.key === 'site_locked') {
              globalLocked = row.value === 'true';
            } else if (row.key === 'activity_locks') {
              try {
                activityLocks = { ...DEFAULT_ACTIVITY_LOCKS, ...JSON.parse(row.value) };
              } catch (e) {
                console.warn('Error parsing activity_locks json', e);
              }
            } else if (row.key === 'module_videos') {
              try {
                moduleVideos = mergeModuleVideos(JSON.parse(row.value));
              } catch (e) {
                console.warn('Error parsing module_videos json', e);
              }
            } else if (row.key === 'module_mcqs') {
              try {
                moduleMcqs = { ...DEFAULT_MODULE_MCQS, ...JSON.parse(row.value) };
              } catch (e) {
                console.warn('Error parsing module_mcqs json', e);
              }
            }
          });
          dbLoaded = true;
          isDbReachable = true;
        } catch (dbErr) {
          markDbFailed(dbErr);
        }
      }

      if (!dbLoaded) {
        // Database not reachable, use fallback file
        const fb = readFallbackFile();
        globalLocked = fb.locked ?? false;
        activityLocks = { ...DEFAULT_ACTIVITY_LOCKS, ...(fb.activityLocks || {}) };
        moduleVideos = fb.moduleVideos || { ...DEFAULT_MODULE_VIDEOS };
        moduleMcqs = { ...DEFAULT_MODULE_MCQS, ...(fb.moduleMcqs || {}) };
      }

      cachedSettings = {
        success: true,
        locked: globalLocked,
        activityLocks,
        moduleVideos,
        moduleMcqs
      };
      cacheTimestamp = now;

      // Keep fallback file in sync
      if (dbLoaded) {
        writeFallbackFile({ locked: globalLocked, activityLocks, moduleVideos, moduleMcqs });
      }

      return res.status(200).json(cachedSettings);
    }

    if (req.method === 'POST') {
      // Verify admin token
      const adminToken = req.headers['x-admin-token'];
      if (adminToken !== 'cybershield-admin-2024' && adminToken !== 'ogdcl-admin-2026') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const body = req.body || {};
      const fb = readFallbackFile();
      let curGlobal = fb.locked ?? false;
      let curActivityLocks = { ...DEFAULT_ACTIVITY_LOCKS, ...(fb.activityLocks || {}) };
      let curModuleVideos = fb.moduleVideos || { ...DEFAULT_MODULE_VIDEOS };
      let curModuleMcqs = { ...DEFAULT_MODULE_MCQS, ...(fb.moduleMcqs || {}) };

      // Load latest values from database if available
      if (shouldAttemptDb()) {
        try {
          await ensureTableOnce();
          const result = await pool.query(
            "SELECT key, value FROM site_settings WHERE key IN ('site_locked', 'activity_locks', 'module_videos', 'module_mcqs')"
          );
          result.rows.forEach(row => {
            if (row.key === 'site_locked') curGlobal = row.value === 'true';
            else if (row.key === 'activity_locks') {
              try { curActivityLocks = { ...DEFAULT_ACTIVITY_LOCKS, ...JSON.parse(row.value) }; } catch (e) {}
            } else if (row.key === 'module_videos') {
              try { curModuleVideos = mergeModuleVideos(JSON.parse(row.value)); } catch (e) {}
            } else if (row.key === 'module_mcqs') {
              try { curModuleMcqs = { ...DEFAULT_MODULE_MCQS, ...JSON.parse(row.value) }; } catch (e) {}
            }
          });
          isDbReachable = true;
        } catch (dbErr) {
          markDbFailed(dbErr);
        }
      }

      // 1. Update Global Lock if provided
      if (typeof body.locked === 'boolean') {
        curGlobal = body.locked;
        await saveDbSetting('site_locked', curGlobal.toString());
      }

      // 2. Update Specific Activity Lock if provided: { activityId: 'activity_1', activityLocked: true/false }
      if (body.activityId && typeof body.activityLocked === 'boolean') {
        curActivityLocks[body.activityId] = body.activityLocked;
        await saveDbSetting('activity_locks', JSON.stringify(curActivityLocks));
      }

      // 3. Bulk Activity Locks if provided: { activityLocks: { activity_1: true, ... } }
      if (body.activityLocks && typeof body.activityLocks === 'object') {
        curActivityLocks = { ...curActivityLocks, ...body.activityLocks };
        await saveDbSetting('activity_locks', JSON.stringify(curActivityLocks));
      }

      // 4. Update Specific Module Video: { moduleId: 'index' | 'activity_1'..4, video: { ... } }
      if (body.moduleId && body.video && typeof body.video === 'object') {
        const modKey = body.moduleId;
        curModuleVideos[modKey] = {
          ...(curModuleVideos[modKey] || DEFAULT_MODULE_VIDEOS[modKey] || {}),
          ...body.video,
          id: modKey,
          updatedAt: new Date().toISOString()
        };
        await saveDbSetting('module_videos', JSON.stringify(curModuleVideos));
      }

      // 5. Bulk Module Videos if provided: { moduleVideos: { index: {...}, ... } }
      if (body.moduleVideos && typeof body.moduleVideos === 'object') {
        curModuleVideos = { ...curModuleVideos, ...body.moduleVideos };
        await saveDbSetting('module_videos', JSON.stringify(curModuleVideos));
      }

      // 6b. Delete / Clear Module Video if requested: { deleteModuleVideo: 'activity_1' }
      if (body.deleteModuleVideo && (curModuleVideos[body.deleteModuleVideo] || DEFAULT_MODULE_VIDEOS[body.deleteModuleVideo])) {
        const modKey = body.deleteModuleVideo;
        curModuleVideos[modKey] = {
          ...(curModuleVideos[modKey] || DEFAULT_MODULE_VIDEOS[modKey] || {}),
          url: '',
          poster: '',
          sourceType: 'mp4',
          updatedAt: new Date().toISOString()
        };
        await saveDbSetting('module_videos', JSON.stringify(curModuleVideos));
      }

      // 7. Update Specific Module MCQs: { moduleId: 'index' | 'activity_1'..4, mcqs: [ ... ] }
      if (body.moduleId && Array.isArray(body.mcqs)) {
        const modKey = body.moduleId;
        curModuleMcqs[modKey] = body.mcqs.map((q, idx) => ({
          question: String(q.question || `Question ${idx + 1}`).trim(),
          options: Array.isArray(q.options) && q.options.length ? q.options.map(o => String(o).trim()) : ["Option 1", "Option 2", "Option 3", "Option 4"],
          correct: Number(q.correct) >= 0 ? Number(q.correct) : 0,
          explanation: String(q.explanation || "").trim()
        }));
        await saveDbSetting('module_mcqs', JSON.stringify(curModuleMcqs));
      }

      // 8. Bulk Module MCQs if provided: { moduleMcqs: { index: [...], ... } }
      if (body.moduleMcqs && typeof body.moduleMcqs === 'object') {
        curModuleMcqs = { ...curModuleMcqs, ...body.moduleMcqs };
        await saveDbSetting('module_mcqs', JSON.stringify(curModuleMcqs));
      }

      // Always write to fallback file
      writeFallbackFile({
        locked: curGlobal,
        activityLocks: curActivityLocks,
        moduleVideos: curModuleVideos,
        moduleMcqs: curModuleMcqs
      });

      // Update in-memory cache immediately
      cachedSettings = {
        success: true,
        locked: curGlobal,
        activityLocks: curActivityLocks,
        moduleVideos: curModuleVideos,
        moduleMcqs: curModuleMcqs
      };
      cacheTimestamp = Date.now();

      return res.status(200).json(cachedSettings);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('admin-settings error:', error);
    const fb = readFallbackFile();
    return res.status(200).json({
      success: true,
      locked: fb.locked ?? false,
      activityLocks: fb.activityLocks || DEFAULT_ACTIVITY_LOCKS,
      moduleVideos: fb.moduleVideos || DEFAULT_MODULE_VIDEOS,
      moduleMcqs: fb.moduleMcqs || DEFAULT_MODULE_MCQS,
      warning: 'Served from resilient storage'
    });
  }
}
