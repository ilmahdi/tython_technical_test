import { pool } from '../config/db.js';
import * as appointmentRepo from '../repositories/appointment.repository.js';
import * as patientRepo from '../repositories/patient.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export const createAppointment = async ({
  patientId,
  appointmentDate,
  reason,
  notes,
  status = 'pending',
  createdBy,
}) => {
  // 1. Verify patient exists
  const patient = await patientRepo.findById(patientId);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }

  // 2. If status is 'confirmed', execute with transaction and row-level locking
  if (status === 'confirmed') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock patient row to serialize concurrent appointment creations for this patient
      await appointmentRepo.lockPatientForUpdate(patientId, client);

      // Check 30-minute window conflict rule (|t_new - t_existing| < 30 mins)
      const conflict = await appointmentRepo.findConflictingAppointment(
        patientId,
        appointmentDate,
        null,
        client
      );

      if (conflict) {
        throw new ConflictError(
          'A patient cannot have two confirmed appointments within a 30-minute window'
        );
      }

      const newAppointment = await appointmentRepo.create(
        { patientId, appointmentDate, reason, notes, status, createdBy },
        client
      );

      await client.query('COMMIT');
      return newAppointment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Pending and cancelled appointments do not trigger conflict checks
  return await appointmentRepo.create({
    patientId,
    appointmentDate,
    reason,
    notes,
    status,
    createdBy,
  });
};

export const listAppointments = async ({ date, status }) => {
  return await appointmentRepo.findAll({ date, status });
};

export const updateAppointmentStatus = async (id, newStatus) => {
  const existing = await appointmentRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Appointment not found');
  }

  // If transitioning to 'confirmed', enforce the 30-minute conflict rule under transaction lock
  if (newStatus === 'confirmed') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock patient row to serialize concurrent status confirmations
      await appointmentRepo.lockPatientForUpdate(existing.patientId, client);

      // Check conflict excluding current appointment ID
      const conflict = await appointmentRepo.findConflictingAppointment(
        existing.patientId,
        existing.appointmentDate,
        id,
        client
      );

      if (conflict) {
        throw new ConflictError(
          'A patient cannot have two confirmed appointments within a 30-minute window'
        );
      }

      const updated = await appointmentRepo.updateStatus(id, newStatus, client);
      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Other status changes (e.g. cancelled, pending) do not require conflict checks
  return await appointmentRepo.updateStatus(id, newStatus);
};
