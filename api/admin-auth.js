import './env.js';
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'ogdcl_admin_session';
const SESSION_SECONDS = 8 * 60 * 60;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  return secret.length >= 32 ? secret : null;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(expires, secret) {
  return createHmac('sha256', secret).update(`admin:${expires}`).digest('hex');
}

function readCookie(req, name) {
  const header = req.headers?.cookie || '';
  for (const item of header.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(item.slice(separator + 1).trim());
      } catch {
        return '';
      }
    }
  }
  return '';
}

export function isAdminAuthenticated(req) {
  const secret = sessionSecret();
  if (!secret) return false;
  const [expiresText, providedSignature] = readCookie(req, COOKIE_NAME).split('.');
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000) || !providedSignature) return false;
  return safeEqual(providedSignature, signature(expires, secret));
}

export function requireAdmin(req, res) {
  if (isAdminAuthenticated(req)) return true;
  res.status(401).json({ success: false, error: 'Admin authentication required' });
  return false;
}

function setSessionCookie(res, value, maxAge) {
  const secure = process.env.ADMIN_COOKIE_SECURE === 'true' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return isAdminAuthenticated(req)
      ? res.status(200).json({ authenticated: true })
      : res.status(401).json({ authenticated: false });
  }

  if (req.method === 'DELETE') {
    setSessionCookie(res, '', 0);
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const secret = sessionSecret();
  const configuredEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  const configuredPassword = process.env.ADMIN_PASSWORD || '';
  if (!secret || configuredEmails.length === 0 || configuredPassword.length === 0) {
    return res.status(503).json({ success: false, error: 'Admin authentication is not configured on this server' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const emailValid = configuredEmails.some(configured => safeEqual(email, configured));
  const passwordValid = safeEqual(password, configuredPassword);
  if (!emailValid || !passwordValid) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  setSessionCookie(res, `${expires}.${signature(expires, secret)}`, SESSION_SECONDS);
  return res.status(200).json({ success: true });
}
