import request from 'supertest';
import { app } from '../src/server.js';
import { pool } from '../src/config/db.js';

describe('Dashboard Statistics API (GET /api/dashboard/stats)', () => {
  let adminToken;
  let staffToken;

  beforeAll(async () => {
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinicflow.local', password: 'Admin123!' });
    adminToken = adminRes.body.data.token;

    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr.sarah@clinicflow.local', password: 'Staff123!' });
    staffToken = staffRes.body.data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should allow staff to fetch dashboard statistics', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totalPatients: expect.any(Number),
      todayAppointments: expect.any(Number),
      pendingAppointments: expect.any(Number),
      confirmedAppointments: expect.any(Number),
    });
    expect(res.body.data.totalPatients).toBeGreaterThanOrEqual(5);
    expect(res.body.data.pendingAppointments).toBeGreaterThanOrEqual(1);
    expect(res.body.data.confirmedAppointments).toBeGreaterThanOrEqual(1);
  });

  it('should allow admin to fetch dashboard statistics', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalPatients).toBeGreaterThanOrEqual(5);
  });
});
