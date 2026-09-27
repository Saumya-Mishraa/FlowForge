const request = require('supertest');
const app = require('../src/app');

describe('Auth routes — validation and access control', () => {
  it('rejects registration with a weak password and mismatched confirmation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short', confirmPassword: 'different' });

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toEqual(
      expect.arrayContaining(['name', 'email', 'password', 'confirmPassword'])
    );
  });

  it('rejects login with a missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('rejects /auth/me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects /auth/me with a malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });

  it('reports Google OAuth as disabled when no credentials are configured', async () => {
    const res = await request(app).get('/api/auth/google/status');
    expect(res.status).toBe(200);
    expect(res.body.data.enabled).toBe(false);
  });

  it('returns 503 (not a crash) when hitting /auth/google while unconfigured', async () => {
    const res = await request(app).get('/api/auth/google');
    expect(res.status).toBe(503);
  });
});

describe('Protected routes require auth', () => {
  it.each([
    ['GET', '/api/projects'],
    ['GET', '/api/collections?project=x'],
    ['GET', '/api/environments?project=x'],
    ['GET', '/api/history'],
    ['POST', '/api/requests/execute'],
    ['GET', '/api/dashboard/summary'],
  ])('%s %s returns 401 without a token', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path);
    expect(res.status).toBe(401);
  });
});
