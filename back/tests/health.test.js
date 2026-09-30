import request from 'supertest';
import { app } from '../src/server.js';
import { pool } from '../src/config/db.js';

describe('API Health Endpoints', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /health should return database ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('ok');
  });

  it('GET /api/unknown should return 404 with standard error structure', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Route not found');
  });
});
