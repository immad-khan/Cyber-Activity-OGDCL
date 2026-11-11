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
  activity_1: false, // Activity 1: Password
  activity_2: false, // Activity 2: Email Security
  activity_3: false, // Activity 3: Data Protection
  activity_4: false  // Activity 4: QR Code
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
    title: 'Activity 1: Password',
    desc: 'Password policy, Bitwarden vault security, and multi-factor authentication defense.',
    sourceType: 'mp4',
    url: 'videos/Password_policy.mp4',
    poster: 'videos/Password_policy_poster.jpg',
    pageUrl: 'mfa-week.html',
    pageName: 'Activity 1: Password'
  },
  activity_2: {
    id: 'activity_2',
    name: 'Activity 2',
    title: 'Activity 2: Email Security',
    desc: 'Recognize phishing, spear-phishing, business email compromise, and verify senders.',
    sourceType: 'mp4',
    url: 'videos/phishing-awareness.mp4',
    poster: 'videos/phishing-awareness_poster.jpg',
    pageUrl: 'phishing-week.html',
    pageName: 'Activity 2: Email Security'
  },
  activity_3: {
    id: 'activity_3',
    name: 'Activity 3',
    title: 'Activity 3: Data Protection',
    desc: 'Safeguard sensitive corporate information, clean desk policies, and data privacy.',
    sourceType: 'youtube',
    url: 'https://www.youtube.com/embed/uvKTMgWRPw4?enablejsapi=1&rel=0',
    poster: '',
    pageUrl: 'privacy-week.html',
    pageName: 'Activity 3: Data Protection'
  },
  activity_4: {
    id: 'activity_4',
    name: 'Activity 4',
    title: 'Activity 4: QR Code',
    desc: 'Pretexting, quishing, human manipulation defenses, and QR code security.',
    sourceType: 'youtube',
    url: '',
    poster: '',
    pageUrl: 'social-engineering-week.html',
    pageName: 'Activity 4: QR Code'
  },
  activity_1_banner: {
    id: 'activity_1_banner', name: 'Activity 1 Banner Video', title: 'Activity 1 Video Briefing',
    desc: 'Watch this video briefing before starting Activity 1.', sourceType: 'mp4', url: '', poster: '',
    pageUrl: 'mfa-week.html', pageName: 'Activity 1: Hero video banner', enabled: true
  },
  activity_2_banner: {
    id: 'activity_2_banner', name: 'Activity 2 Banner Video', title: 'Activity 2 Video Briefing',
    desc: 'Watch this video briefing before starting Activity 2.', sourceType: 'mp4', url: '', poster: '',
    pageUrl: 'phishing-week.html', pageName: 'Activity 2: Hero video banner', enabled: true
  },
  activity_3_banner: {
    id: 'activity_3_banner', name: 'Activity 3 Banner Video', title: 'Activity 3 Video Briefing',
    desc: 'Watch this video briefing before starting Activity 3.', sourceType: 'mp4', url: '', poster: '',
    pageUrl: 'privacy-week.html', pageName: 'Activity 3: Hero video banner', enabled: true
  },
  activity_4_banner: {
    id: 'activity_4_banner', name: 'Activity 4 Banner Video', title: 'Activity 4 Video Briefing',
    desc: 'Watch this video briefing before starting Activity 4.', sourceType: 'mp4', url: '', poster: '',
    pageUrl: 'social-engineering-week.html', pageName: 'Activity 4: Hero video banner', enabled: true
  }
};

const DEFAULT_MODULE_MCQS = {
  activity_1: [
    {
      question: "Which password is the most secure?",
      options: [
        "Welcome@2026",
        "OGDCL123!",
        "Password#1",
        "MyD0gL0ves2Run!"
      ],
      correct: 3,
      explanation: "Passphrases like 'MyD0gL0ves2Run!' are long, complex, and memorable while being highly resistant to dictionary and brute-force attacks."
    },
    {
      question: "Which provides the strongest protection for a corporate account?",
      options: [
        "A complex password only",
        "A simple password with MFA",
        "A unique strong password combined with MFA",
        "Changing the same password every month"
      ],
      correct: 2,
      explanation: "Combining a unique strong password with multi-factor authentication (MFA) provides defense-in-depth against unauthorized access."
    },
    {
      question: "An employee creates the password 'Winter2026!' and updates only the year every time it expires (Winter2027!, Winter2028!, etc.). Is this secure?",
      options: [
        "Yes, because it changes regularly",
        "No, attackers can predict the pattern",
        "Yes, because it contains numbers and symbols",
        "No, because seasons should never be used"
      ],
      correct: 1,
      explanation: "Predictable pattern substitutions (such as incrementing years or seasons) are routinely tested by automated password-cracking tools and password spraying."
    },
    {
      question: "An employee uses a strong password and enables Multi-Factor Authentication (MFA). Later, they receive an unexpected MFA approval request on their phone. What is the safest action?",
      options: [
        "Approve it because MFA requests are generated by the company",
        "Approve it if it appears during office hours",
        "Deny the request and immediately report it to IT Helpdesk",
        "Ignore it and take no action"
      ],
      correct: 2,
      explanation: "An unexpected MFA prompt indicates your password has been compromised. Deny the prompt immediately and report it to the IT Helpdesk."
    },
    {
      question: "You use a strong password for your personal social media account and the same password for your corporate email account. Which statement is most accurate?",
      options: [
        "A breach of the personal account could expose the corporate account through credential-stuffing attacks.",
        "It is acceptable because the password is complex.",
        "It is safe if MFA is enabled on one account only.",
        "There is no risk if the password contains special characters."
      ],
      correct: 0,
      explanation: "Password reuse across personal and corporate accounts enables attackers to use credentials leaked from external breaches to access corporate systems (credential stuffing)."
    }
  ],
  activity_2: [
    {
      question: "You receive an email from a known contractor claiming that their bank account details have changed and requesting immediate payment to a new account. What should you do?",
      options: [
        "Update the account details and process the payment immediately",
        "Reply to the email asking for confirmation",
        "Verify the request through an official phone call or approved business channel before taking any action",
        "Forward the email to colleagues for advice"
      ],
      correct: 2,
      explanation: "Always verify bank account detail changes through an official, established phone call or trusted out-of-band communication channel before taking action."
    },
    {
      question: "An attacker compromises a vendor's mailbox and replies to an existing legitimate email conversation with a malicious attachment. Why is this attack particularly dangerous?",
      options: [
        "The email comes from a trusted and familiar conversation thread",
        "The attachment is always malware-free",
        "The email bypasses all security controls automatically",
        "Vendor emails cannot be inspected"
      ],
      correct: 0,
      explanation: "Thread hijacking is dangerous because the attacker replies within an existing, trusted email thread from a compromised legitimate account, bypassing natural suspicion."
    },
    {
      question: "An email claims to be from the IT Department and asks you to verify your VPN credentials due to 'security upgrades' by clicking a link. What is the safest action?",
      options: [
        "Enter your credentials immediately",
        "Share your password with the sender",
        "Access the official company portal directly and report the email if suspicious",
        "Forward your credentials to your supervisor"
      ],
      correct: 2,
      explanation: "Never click verification links in unexpected emails to enter credentials. Always navigate directly to official company portals and report suspicious requests."
    },
    {
      question: "An external email contains a link to download engineering drawings related to a pipeline project. Before opening the link, what should you verify?",
      options: [
        "Whether the sender is trusted and the link points to a legitimate approved domain",
        "Whether the email contains a company logo",
        "Whether the email says 'confidential'",
        "Whether other employees were copied"
      ],
      correct: 0,
      explanation: "Always verify that the sender is legitimate and that the destination URL points to an approved, legitimate corporate file-sharing domain before clicking."
    },
    {
      question: "Why are AI-generated phishing emails considered more dangerous?",
      options: [
        "They cannot be detected",
        "They often contain fewer spelling and grammar mistakes and can be highly personalized",
        "They automatically bypass firewalls",
        "They are sent only to executives"
      ],
      correct: 1,
      explanation: "Generative AI allows attackers to craft persuasive, grammatically flawless, and highly contextual spear-phishing messages at scale."
    }
  ],

  activity_3: [
    {
      question: "You are preparing a presentation for senior management and plan to include Employee’s Technical & Financial Information, CNIC numbers and contact details because they make the report more informative and productive.",
      options: [
        "Include all details for completeness.",
        "Include only information necessary for the business purpose and mask sensitive data where possible.",
        "Share the presentation only verbally.",
        "Add a confidentiality footer and include all data."
      ],
      correct: 1,
      explanation: "Include only information necessary for the business purpose and mask sensitive data where possible. Data minimization and protecting personal information such as CNIC numbers are essential."
    },
    {
      question: "While visiting a gas processing plant, you notice a contractor connecting an engineering laptop directly to the OT network. The contractor claims it was used at another site earlier that day for maintenance activities.",
      options: [
        "Ensure the device follows OT onboarding, verification and approval procedures before connection.",
        "Allow the connection because the contractor is authorized.",
        "Permit access if the laptop has antivirus installed.",
        "Allow temporary access and disconnect it afterward."
      ],
      correct: 0,
      explanation: "Ensure the device follows OT onboarding, verification and approval procedures before connection to prevent introducing threats into critical operational networks."
    },
    {
      question: "At midnight, you receive a WhatsApp message from a Field Manager stating that he is unable to access an OT monitoring system. He explains that a production issue is escalating and requests your VPN credentials so that operations are not disrupted.",
      options: [
        "Provide your VPN credentials because maintaining operational continuity is a business priority.",
        "Share a temporary password and request that it be changed immediately after the issue is resolved.",
        "Escalate the issue to the Service Desk and authorize them to share your credentials with the Field Manager for emergency use.",
        "Verify the request through authorized communication channels and follow established access management procedures."
      ],
      correct: 3,
      explanation: "Never share individual VPN credentials or passwords. Always verify requests through official authorized channels and follow established access management procedures."
    },
    {
      question: "An employee uses a public AI tool to summarize a contract and uploads the complete agreement containing confidential commercial information.",
      options: [
        "Acceptable because the intent was productivity.",
        "Acceptable if the employee does not share the output.",
        "Potentially a privacy and confidentiality violation if the AI platform is not approved.",
        "Acceptable because AI tools automatically protect all uploaded data."
      ],
      correct: 2,
      explanation: "Uploading confidential commercial contracts to unapproved public AI tools exposes proprietary corporate data and may constitute a serious privacy and confidentiality violation."
    },
    {
      question: "A cybersecurity policy is preventing an urgent business activity from being completed on time. Senior management is under pressure, operational deadlines are approaching, and bypassing the control would save significant time and effort. There is no evidence of an active cyber threat.",
      options: [
        "Temporarily bypass the control because the business impact outweighs the security risk.",
        "Follow the organization's approved exception and risk management process before any control is modified or bypassed.",
        "Bypass the control after receiving verbal approval from management.",
        "Disable the control and restore it once the activity is completed."
      ],
      correct: 1,
      explanation: "Security controls must never be bypassed informally. Any modification or exemption must follow the organization's approved exception and risk management process."
    }
  ],
  activity_4: [
    {
      question: "What is the biggest cybersecurity risk of scanning an unknown QR code displayed in a public place or received via email?",
      options: [
        "It consumes mobile battery",
        "It can redirect users to a malicious website that steals credentials",
        "It improves internet speed",
        "It updates the phone operating system"
      ],
      correct: 1,
      explanation: "Malicious QR codes (quishing) can stealthily redirect users to phishing websites designed to harvest credentials or install malware."
    },
    {
      question: "After scanning a QR code from an email, you are redirected to a webpage requesting your corporate email address, password, and MFA verification code.",
      options: [
        "Stop immediately and report the incident through the approved reporting process.",
        "Proceed if the webpage displays the organization's logo.",
        "Enter your credentials because MFA provides additional protection.",
        "Enter only your username to verify the legitimacy of the website."
      ],
      correct: 0,
      explanation: "Never enter corporate credentials or MFA codes on pages reached via QR codes. Stop immediately and report the incident to IT Security."
    },
    {
      question: "During an international oil and gas conference, a QR code displayed at a vendor booth offers access to exclusive technical reports and industry insights.",
      options: [
        "Scan the QR code because it is displayed at a professional event.",
        "Scan the QR code using a personal device rather than a corporate device.",
        "Verify the vendor and destination website before accessing or providing information.",
        "Access the content if the vendor is a recognized industry partner."
      ],
      correct: 2,
      explanation: "Always verify the vendor's authenticity and inspect the destination URL before scanning QR codes or submitting sensitive details at public events."
    },
    {
      question: "An employee at Gas Field/Plant receives a QR code claiming to provide updated HSE procedures. What should they do first?",
      options: [
        "Scan the QR code immediately",
        "Share it with colleagues",
        "Download all linked files",
        "Verify its authenticity with the HSE or IT department"
      ],
      correct: 3,
      explanation: "Always verify unexpected or unsolicited QR codes claiming to contain operational or safety policies directly with the relevant department."
    },
    {
      question: "Why are QR code attacks particularly concerning in the oil and gas sector?",
      options: [
        "They can be used to gain unauthorized access to corporate systems, operational information or employee accounts",
        "QR codes reduce network performance",
        "QR codes automatically damage industrial equipment",
        "QR codes prevent software updates"
      ],
      correct: 0,
      explanation: "In critical energy infrastructure, QR code attacks can compromise credentials to gain unauthorized entry into corporate environments and sensitive operational systems."
    }
  ],
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
  // Prefer the most recently written copy. On read-only/serverless hosts the
  // writable temp copy can be newer than the bundled file after an admin save.
  const candidates = [FALLBACK_FILE, TMP_FALLBACK_FILE]
    .filter((file) => fs.existsSync(file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const file of candidates) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      return {
        locked: data.locked ?? false,
        activityLocks: { ...DEFAULT_ACTIVITY_LOCKS, ...(data.activityLocks || {}) },
        moduleVideos: mergeModuleVideos(data.moduleVideos),
        moduleMcqs: { ...DEFAULT_MODULE_MCQS, ...(data.moduleMcqs || {}) }
      };
    } catch (e) {
      console.warn(`⚠️ Could not read settings fallback file ${file}:`, e.message);
    }
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
