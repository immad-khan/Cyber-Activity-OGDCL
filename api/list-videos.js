// File: api/list-videos.js
// Lists available video and poster files in public/videos/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEOS_DIR = path.resolve(__dirname, '..', 'public', 'videos');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (!fs.existsSync(VIDEOS_DIR)) {
      return res.status(200).json({ success: true, files: [] });
    }

    const allFiles = fs.readdirSync(VIDEOS_DIR);
    const files = allFiles
      .filter(f => !f.startsWith('.'))
      .map(f => {
        const full = path.join(VIDEOS_DIR, f);
        const stats = fs.statSync(full);
        const ext = path.extname(f).toLowerCase();
        const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
        const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

        return {
          filename: f,
          path: `videos/${f}`,
          sizeBytes: stats.size,
          sizeFormatted: (stats.size / (1024 * 1024)).toFixed(1) + ' MB',
          isVideo,
          isImage,
          modifiedAt: stats.mtime
        };
      });

    return res.status(200).json({ success: true, files });
  } catch (error) {
    console.error('List videos error:', error);
    return res.status(500).json({ success: false, error: 'Could not list videos' });
  }
}
