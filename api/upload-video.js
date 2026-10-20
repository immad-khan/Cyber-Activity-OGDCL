// File: api/upload-video.js
// Handles video file and poster image uploads directly into public/videos/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEOS_DIR = path.resolve(__dirname, '..', 'public', 'videos');

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token, x-filename');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Verify admin token
  const adminToken = req.headers['x-admin-token'] || req.query.token;
  if (adminToken !== 'cybershield-admin-2024' && adminToken !== 'ogdcl-admin-2026') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    let filename = req.headers['x-filename'] || req.query.filename;
    
    // Check if body is JSON (e.g. base64 payload)
    if (req.body && (req.body.base64Data || req.body.fileData)) {
      const originalName = req.body.filename || filename || 'uploaded_video.mp4';
      const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = path.join(VIDEOS_DIR, cleanName);

      const base64Str = (req.body.base64Data || req.body.fileData).replace(/^data:([A-Za-z-+/]+);base64,/, '');
      const buffer = Buffer.from(base64Str, 'base64');

      fs.writeFileSync(targetPath, buffer);

      return res.status(200).json({
        success: true,
        url: `videos/${cleanName}`,
        filename: cleanName,
        sizeBytes: buffer.length
      });
    }

    // Otherwise handle stream / raw binary body
    if (!filename) {
      filename = `video_${Date.now()}.mp4`;
    }
    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetPath = path.join(VIDEOS_DIR, cleanName);

    // If express body-parser parsed it into a Buffer or string
    if (Buffer.isBuffer(req.body)) {
      fs.writeFileSync(targetPath, req.body);
      return res.status(200).json({
        success: true,
        url: `videos/${cleanName}`,
        filename: cleanName,
        sizeBytes: req.body.length
      });
    }

    // Stream from request
    const writeStream = fs.createWriteStream(targetPath);
    let bytesReceived = 0;

    req.on('data', chunk => {
      bytesReceived += chunk.length;
    });

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      return res.status(200).json({
        success: true,
        url: `videos/${cleanName}`,
        filename: cleanName,
        sizeBytes: bytesReceived
      });
    });

    writeStream.on('error', err => {
      console.error('Video upload write stream error:', err);
      return res.status(500).json({ success: false, error: 'Failed to write video file' });
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Video upload failed' });
  }
}
