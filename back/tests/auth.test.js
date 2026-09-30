import request from 'supertest';
import { app } from '../src/server.js';
import { pool } from '../src/config/db.js';

describe('Authentication API (POST /api/auth/login & GET /api/auth/me)', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in pre-seeded admin user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@clinicflow.local',
          password: 'Admin123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toMatchObject({
        email: 'admin@clinicflow.local',
        name: 'Admin Director',
        role: 'admin',
      });
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('should successfully log in pre-seeded staff user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dr.sarah@clinicflow.local',
          password: 'Staff123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toMatchObject({
        email: 'dr.sarah@clinicflow.local',
        name: 'Dr. Sarah Smith',
        role: 'staff',
      });
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@clinicflow.local',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('should reject login for non-existent user email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown.user@clinicflow.local',
          password: 'AnyPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('should reject request with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation failed');
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });

    it('should reject request with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@clinicflow.local',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/me', () => {
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

    it('should return profile for authenticated admin', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        email: 'admin@clinicflow.local',
        name: 'Admin Director',
        role: 'admin',
      });
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('should return profile for authenticated staff', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        email: 'dr.sarah@clinicflow.local',
        name: 'Dr. Sarah Smith',
        role: 'staff',
      });
    });

    it('should reject when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Authorization token required');
    });

    it('should reject invalid or manipulated JWT token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid or expired authentication token');
    });
  });
});
