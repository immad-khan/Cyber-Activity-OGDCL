// File: api/delete-video.js
// Handles deleting or unlinking video files and clearing module video configurations

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEOS_DIR = path.resolve(__dirname, '..', 'public', 'videos');
const FALLBACK_FILE = path.resolve(__dirname, '..', 'site-settings-fallback.json');

// Helper to read fallback file
function readFallbackFile() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading fallback file:', e);
  }
  return {};
}

// Helper to write fallback file
function writeFallbackFile(data) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing fallback file:', e);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Verify admin token
  const adminToken = req.headers['x-admin-token'] || req.query.token || req.body?.token;
  if (adminToken !== 'cybershield-admin-2024' && adminToken !== 'ogdcl-admin-2026') {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin token' });
  }

  try {
    const { moduleId, filename, deleteFile } = req.body || {};
    let fileDeleted = false;
    let fileError = null;

    // 1. Physically delete file from public/videos/ if requested and specified
    if (deleteFile && filename) {
      let cleanName = filename.replace(/^videos[\/\\]/, '');
      cleanName = path.basename(cleanName); // Prevents directory traversal like ../../
      
      const targetFilePath = path.join(VIDEOS_DIR, cleanName);

      if (fs.existsSync(targetFilePath)) {
        try {
          fs.unlinkSync(targetFilePath);
          fileDeleted = true;
        } catch (err) {
          console.error(`Failed to delete file ${cleanName}:`, err);
          fileError = err.message;
        }
      }
    }

    // 2. Clear module video in settings if moduleId is provided
    if (moduleId) {
      const fb = readFallbackFile();
      const curVideos = fb.moduleVideos || {};

      if (curVideos[moduleId]) {
        curVideos[moduleId] = {
          ...curVideos[moduleId],
          url: '',
          poster: '',
          sourceType: 'mp4',
          updatedAt: new Date().toISOString()
        };
      } else {
        curVideos[moduleId] = {
          id: moduleId,
          url: '',
          poster: '',
          sourceType: 'mp4',
          updatedAt: new Date().toISOString()
        };
      }

      fb.moduleVideos = curVideos;
      writeFallbackFile(fb);

      // Attempt to save to database if available
      try {
        await pool.query(
          `INSERT INTO site_settings (key, value, updated_at)
           VALUES ('module_videos', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
          [JSON.stringify(curVideos)]
        );
      } catch (dbErr) {
        // Fallback file already saved
      }

      return res.status(200).json({
        success: true,
        message: `Video successfully deleted for ${moduleId}`,
        moduleId,
        fileDeleted,
        fileError,
        moduleVideos: curVideos
      });
    }

    return res.status(200).json({
      success: true,
      message: fileDeleted ? 'Video file deleted from storage' : 'No changes performed',
      fileDeleted,
      fileError
    });

  } catch (error) {
    console.error('Delete video error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to delete video' });
  }
}
