import { pool, query } from '../config/db.js';

const mapAppointmentRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    appointmentDate: row.appointment_date,
    status: row.status,
    reason: row.reason,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    patientName: row.patient_name || undefined,
    patientCin: row.patient_cin || undefined,
    createdByName: row.created_by_name || undefined,
  };
};

export const lockPatientForUpdate = async (patientId, client) => {
  const sql = `
    SELECT id FROM patients 
    WHERE id = $1 AND deleted_at IS NULL 
    FOR UPDATE;
  `;
  const result = await client.query(sql, [patientId]);
  return result.rows[0] || null;
};

export const findConflictingAppointment = async (
  patientId,
  appointmentDate,
  excludeAppointmentId = null,
  client = null
) => {
  const runner = client || { query };
  let sql = `
    SELECT id, appointment_date, status, reason
    FROM appointments
    WHERE patient_id = $1
      AND status = 'confirmed'
      AND ABS(EXTRACT(EPOCH FROM (appointment_date - $2::timestamptz))) < 1800
  `;
  const params = [patientId, appointmentDate];

  if (excludeAppointmentId) {
    params.push(excludeAppointmentId);
    sql += ` AND id != $3`;
  }

  sql += ` LIMIT 1;`;
  const result = await runner.query(sql, params);
  return result.rows[0] || null;
};

export const create = async (
  { patientId, appointmentDate, reason, notes, status, createdBy },
  client = null
) => {
  const runner = client || { query };
  const sql = `
    INSERT INTO appointments (patient_id, appointment_date, reason, notes, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, patient_id, appointment_date, status, reason, notes, created_by, created_at;
  `;
  const result = await runner.query(sql, [
    patientId,
    appointmentDate,
    reason.trim(),
    notes ? notes.trim() : null,
    status || 'pending',
    createdBy,
  ]);
  return mapAppointmentRow(result.rows[0]);
};

export const findById = async (id, client = null) => {
  const runner = client || { query };
  const sql = `
    SELECT 
      a.id, a.patient_id, a.appointment_date, a.status, a.reason, a.notes, a.created_by, a.created_at,
      p.full_name AS patient_name, p.cin AS patient_cin,
      u.name AS created_by_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.id = $1
    LIMIT 1;
  `;
  const result = await runner.query(sql, [id]);
  return mapAppointmentRow(result.rows[0]);
};

export const findAll = async ({ date, status }) => {
  const conditions = [];
  const params = [];

  if (date) {
    params.push(date);
    conditions.push(`DATE(a.appointment_date) = $${params.length}::date`);
  }

  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      a.id, a.patient_id, a.appointment_date, a.status, a.reason, a.notes, a.created_by, a.created_at,
      p.full_name AS patient_name, p.cin AS patient_cin,
      u.name AS created_by_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users u ON a.created_by = u.id
    ${whereClause}
    ORDER BY a.appointment_date ASC;
  `;

  const result = await query(sql, params);
  return result.rows.map(mapAppointmentRow);
};

export const updateStatus = async (id, status, client = null) => {
  const runner = client || { query };
  const sql = `
    UPDATE appointments
    SET status = $1
    WHERE id = $2
    RETURNING id, patient_id, appointment_date, status, reason, notes, created_by, created_at;
  `;
  const result = await runner.query(sql, [status, id]);
  return mapAppointmentRow(result.rows[0]);
};
