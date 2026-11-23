import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { isAdminAuthenticated, requireAdmin } from '../api/admin-auth.js';

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; }
  };
}

test('admin login issues a server-verified HttpOnly session; invalid credentials are rejected', async t => {
  const original = Object.fromEntries(['ADMIN_EMAILS', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET'].map(key => [key, process.env[key]]));
  t.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  process.env.ADMIN_EMAILS = 'admin@example.test';
  process.env.ADMIN_PASSWORD = 'offline-test-password';
  process.env.ADMIN_SESSION_SECRET = 'a-test-secret-that-is-at-least-32-characters';

  const loginRes = mockResponse();
  await handler({ method: 'POST', body: { email: 'ADMIN@example.test', password: 'offline-test-password' }, headers: {} }, loginRes);
  assert.equal(loginRes.statusCode, 200);
  assert.match(loginRes.headers['Set-Cookie'], /HttpOnly/);
  assert.match(loginRes.headers['Set-Cookie'], /SameSite=Strict/);

  const cookie = loginRes.headers['Set-Cookie'].split(';')[0];
  assert.equal(isAdminAuthenticated({ headers: { cookie } }), true);
  assert.equal(isAdminAuthenticated({ headers: {} }), false);

  const invalidRes = mockResponse();
  await handler({ method: 'POST', body: { email: 'admin@example.test', password: 'wrong' }, headers: {} }, invalidRes);
  assert.equal(invalidRes.statusCode, 401);

  const deniedRes = mockResponse();
  assert.equal(requireAdmin({ headers: {} }, deniedRes), false);
  assert.equal(deniedRes.statusCode, 401);
});
