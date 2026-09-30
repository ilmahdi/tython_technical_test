import request from 'supertest';
import { app } from '../src/server.js';
import { pool } from '../src/config/db.js';

describe('Patient Management API (/api/patients)', () => {
  let adminToken;
  let staffToken;

  beforeAll(async () => {
    // Acquire tokens for both roles
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

  describe('Authentication and Authorization Guarding', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/patients');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/patients', () => {
    it('should allow staff to create a valid patient', async () => {
      const dynamicCin = `TU${Date.now().toString().slice(-6)}`;
      const newPatient = {
        fullName: 'Test Patient Unique',
        cin: dynamicCin,
        phone: '+212699887766',
        birthDate: '1992-06-15',
        address: '10 Test Street, Casablanca',
      };

      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(newPatient);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patient).toMatchObject({
        fullName: 'Test Patient Unique',
        cin: dynamicCin,
        phone: '+212699887766',
        birthDate: '1992-06-15',
      });
      expect(res.body.data.patient.id).toBeDefined();
    });

    it('should reject creating patient with duplicate CIN with 409 Conflict', async () => {
      // 'AB123456' is pre-seeded for Amine El Amrani
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'Duplicate CIN Person',
          cin: 'AB123456',
          phone: '+212600000000',
          birthDate: '1990-01-01',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already exists');
    });

    it('should reject invalid input data with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'X', // too short (<2)
          cin: '',
          phone: '123',
          birthDate: 'not-a-date',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toBeDefined();
    });
  });

  describe('GET /api/patients', () => {
    it('should return paginated list of patients with metadata', async () => {
      const res = await request(app)
        .get('/api/patients?page=1&limit=2')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('should search patients by fullName', async () => {
      const res = await request(app)
        .get('/api/patients?search=Amine')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].fullName).toContain('Amine');
    });

    it('should search patients by CIN', async () => {
      const res = await request(app)
        .get('/api/patients?search=BK987654')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].cin).toBe('BK987654');
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should return patient profile with appointment history', async () => {
      // 11111111-1111-1111-1111-111111111111 is Amine El Amrani
      const res = await request(app)
        .get('/api/patients/11111111-1111-1111-1111-111111111111')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patient).toMatchObject({
        id: '11111111-1111-1111-1111-111111111111',
        fullName: 'Amine El Amrani',
        cin: 'AB123456',
      });
      expect(Array.isArray(res.body.data.patient.appointments)).toBe(true);
      expect(res.body.data.patient.appointments.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 404 for non-existent patient UUID', async () => {
      const res = await request(app)
        .get('/api/patients/ffffffff-ffff-ffff-ffff-ffffffffffff')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Patient not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app)
        .get('/api/patients/not-a-valid-uuid')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/patients/:id', () => {
    it('should update patient details successfully', async () => {
      const res = await request(app)
        .put('/api/patients/22222222-2222-2222-2222-222222222222')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'Fatima Zahra Mansouri Updated',
          cin: 'BK987654', // Keep own CIN
          phone: '+212699999999',
          birthDate: '1995-09-23',
          address: 'Updated Address, Rabat',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patient.fullName).toBe('Fatima Zahra Mansouri Updated');
      expect(res.body.data.patient.phone).toBe('+212699999999');
    });

    it('should reject updating CIN to one already in use by another patient', async () => {
      // Trying to take patient 1's CIN ('AB123456') for patient 2
      const res = await request(app)
        .put('/api/patients/22222222-2222-2222-2222-222222222222')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'Fatima Zahra Mansouri',
          cin: 'AB123456',
          phone: '+212623456789',
          birthDate: '1995-09-23',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Another patient already uses CIN');
    });
  });

  describe('DELETE /api/patients/:id', () => {
    let patientToDeleteId;

    beforeEach(async () => {
      // Create a temporary patient to delete
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Temporary Delete Candidate',
          cin: `DEL${Date.now().toString().slice(-6)}`,
          phone: '+212688888888',
          birthDate: '1999-01-01',
        });
      patientToDeleteId = res.body.data.patient.id;
    });

    it('should forbid staff from deleting a patient with 403', async () => {
      const res = await request(app)
        .delete(`/api/patients/${patientToDeleteId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('restricted to: admin');
    });

    it('should allow admin to delete a patient', async () => {
      const res = await request(app)
        .delete(`/api/patients/${patientToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify patient is now soft-deleted (returns 404 on get)
      const checkRes = await request(app)
        .get(`/api/patients/${patientToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkRes.status).toBe(404);
    });
  });
});
