import request from 'supertest';
import { app } from '../src/server.js';
import { pool } from '../src/config/db.js';

describe('Appointment Management API (/api/appointments)', () => {
  let adminToken;
  let staffToken;
  let testPatientId;
  let secondPatientId;

  beforeAll(async () => {
    // 1. Authenticate users
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinicflow.local', password: 'Admin123!' });
    adminToken = adminRes.body.data.token;

    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr.sarah@clinicflow.local', password: 'Staff123!' });
    staffToken = staffRes.body.data.token;

    // 2. Create isolated test patients for appointment rule testing
    const patient1Res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        fullName: 'Appointment Test Patient A',
        cin: `APTA${Date.now().toString().slice(-6)}`,
        phone: '+212611112222',
        birthDate: '1990-05-10',
      });
    testPatientId = patient1Res.body.data.patient.id;

    const patient2Res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        fullName: 'Appointment Test Patient B',
        cin: `APTB${Date.now().toString().slice(-6)}`,
        phone: '+212633334444',
        birthDate: '1985-10-20',
      });
    secondPatientId = patient2Res.body.data.patient.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Authentication & Basic Validation', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/appointments');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject appointment creation with non-existent patient with 404', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: '00000000-0000-0000-0000-000000000000',
          appointmentDate: new Date().toISOString(),
          reason: 'General consultation',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Patient not found');
    });

    it('should reject invalid input data with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: 'not-a-uuid',
          appointmentDate: 'invalid-date',
          reason: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toBeDefined();
    });
  });

  describe('Mandatory Business Rule: 30-Minute Conflict Window (±30 mins)', () => {
    // Choose a future base timestamp
    const baseTime = new Date(Date.now() + 10 * 24 * 3600 * 1000); // 10 days from now at noon
    baseTime.setHours(12, 0, 0, 0);

    it('should create initial confirmed appointment at base time', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: baseTime.toISOString(),
          status: 'confirmed',
          reason: 'Base appointment at 12:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.status).toBe('confirmed');
    });

    it('should REJECT another confirmed appointment less than 30 mins after (+15 mins) with 409', async () => {
      const after15 = new Date(baseTime.getTime() + 15 * 60 * 1000);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: after15.toISOString(),
          status: 'confirmed',
          reason: 'Conflicting appointment at 12:15',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('within a 30-minute window');
    });

    it('should REJECT another confirmed appointment less than 30 mins before (-20 mins) with 409', async () => {
      const before20 = new Date(baseTime.getTime() - 20 * 60 * 1000);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: before20.toISOString(),
          status: 'confirmed',
          reason: 'Conflicting appointment at 11:40',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('within a 30-minute window');
    });

    it('should ALLOW confirmed appointment EXACTLY 30 mins after (+30 mins)', async () => {
      const exactAfter30 = new Date(baseTime.getTime() + 30 * 60 * 1000);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: exactAfter30.toISOString(),
          status: 'confirmed',
          reason: 'Boundary appointment at 12:30 (+30 min exactly)',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should ALLOW confirmed appointment EXACTLY 30 mins before (-30 mins)', async () => {
      const exactBefore30 = new Date(baseTime.getTime() - 30 * 60 * 1000);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: exactBefore30.toISOString(),
          status: 'confirmed',
          reason: 'Boundary appointment at 11:30 (-30 min exactly)',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should ALLOW confirmed appointment MORE than 30 mins away (+60 mins)', async () => {
      const after60 = new Date(baseTime.getTime() + 60 * 60 * 1000);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: after60.toISOString(),
          status: 'confirmed',
          reason: 'Non-conflicting appointment at 13:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should ALLOW confirmed appointment for a DIFFERENT patient at the exact same time', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: secondPatientId,
          appointmentDate: baseTime.toISOString(),
          status: 'confirmed',
          reason: 'Different patient at 12:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should ALLOW appointment within 30 mins if existing appointment is PENDING', async () => {
      const pendingTime = new Date(baseTime.getTime() + 5 * 24 * 3600 * 1000);
      // Create pending appointment
      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: pendingTime.toISOString(),
          status: 'pending',
          reason: 'Pending appointment',
        });

      // Attempt confirmed appointment 10 mins apart
      const nearPending = new Date(pendingTime.getTime() + 10 * 60 * 1000);
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: nearPending.toISOString(),
          status: 'confirmed',
          reason: 'Confirmed appointment near pending',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should ALLOW appointment within 30 mins if existing appointment is CANCELLED', async () => {
      const cancelledTime = new Date(baseTime.getTime() + 6 * 24 * 3600 * 1000);
      // Create cancelled appointment
      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: cancelledTime.toISOString(),
          status: 'cancelled',
          reason: 'Cancelled appointment',
        });

      // Attempt confirmed appointment 10 mins apart
      const nearCancelled = new Date(cancelledTime.getTime() + 10 * 60 * 1000);
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: nearCancelled.toISOString(),
          status: 'confirmed',
          reason: 'Confirmed appointment near cancelled',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    let pendingAppointmentId;
    let confirmedSlotTime;

    beforeAll(async () => {
      confirmedSlotTime = new Date(Date.now() + 20 * 24 * 3600 * 1000);

      // Create a confirmed appointment at confirmedSlotTime
      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: confirmedSlotTime.toISOString(),
          status: 'confirmed',
          reason: 'Anchor confirmed slot',
        });

      // Create a pending appointment 15 minutes away from confirmedSlotTime
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: testPatientId,
          appointmentDate: new Date(confirmedSlotTime.getTime() + 15 * 60 * 1000).toISOString(),
          status: 'pending',
          reason: 'Pending appointment 15m away',
        });
      pendingAppointmentId = res.body.data.appointment.id;
    });

    it('should REJECT confirming a pending appointment if it conflicts with another confirmed one (409)', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${pendingAppointmentId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('within a 30-minute window');
    });

    it('should allow updating appointment status to cancelled (200)', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${pendingAppointmentId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.status).toBe('cancelled');
    });
  });

  describe('GET /api/appointments (Listing & Filtering)', () => {
    it('should list all appointments with patient and creator details', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(10);
      expect(res.body.data[0]).toHaveProperty('patientName');
      expect(res.body.data[0]).toHaveProperty('patientCin');
    });

    it('should filter appointments by status', async () => {
      const res = await request(app)
        .get('/api/appointments?status=confirmed')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((a) => a.status === 'confirmed')).toBe(true);
    });

    it('should filter appointments by date', async () => {
      const todayDate = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/appointments?date=${todayDate}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Concurrency Race Condition Safety', () => {
    it('should prevent concurrent booking collisions on the same patient at the exact same time', async () => {
      const concurrentSlotTime = new Date(Date.now() + 30 * 24 * 3600 * 1000);

      // Fire 2 concurrent requests simultaneously for the same patient at the same time
      const [req1, req2] = await Promise.all([
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${staffToken}`)
          .send({
            patientId: testPatientId,
            appointmentDate: concurrentSlotTime.toISOString(),
            status: 'confirmed',
            reason: 'Concurrent Attempt 1',
          }),
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${staffToken}`)
          .send({
            patientId: testPatientId,
            appointmentDate: concurrentSlotTime.toISOString(),
            status: 'confirmed',
            reason: 'Concurrent Attempt 2',
          }),
      ]);

      const statuses = [req1.status, req2.status].sort();
      // Exactly one must succeed (201) and the other must be rejected due to conflict (409)
      expect(statuses).toEqual([201, 409]);
    });
  });
});
