import { query } from '../config/db.js';

const mapPatientRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    cin: row.cin,
    phone: row.phone,
    birthDate: row.birth_date ? new Date(row.birth_date).toISOString().split('T')[0] : null,
    address: row.address,
    createdAt: row.created_at,
    deletedAt: row.deleted_at || null,
  };
};

export const create = async ({ fullName, cin, phone, birthDate, address }) => {
  const sql = `
    INSERT INTO patients (full_name, cin, phone, birth_date, address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, full_name, cin, phone, birth_date, address, created_at;
  `;
  const result = await query(sql, [fullName.trim(), cin.trim(), phone.trim(), birthDate, address ? address.trim() : null]);
  return mapPatientRow(result.rows[0]);
};

export const findAll = async ({ search = '', page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (search && search.trim() !== '') {
    const escapedSearch = search.trim().replace(/[%_\\]/g, '\\$&');
    params.push(`%${escapedSearch}%`);
    conditions.push(`(full_name ILIKE $${params.length} OR cin ILIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count for pagination metadata
  const countSql = `SELECT COUNT(*)::int AS total FROM patients ${whereClause};`;
  const countResult = await query(countSql, params);
  const total = countResult.rows[0].total;

  // Query paginated rows
  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT id, full_name, cin, phone, birth_date, address, created_at
    FROM patients
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
  `;
  const dataResult = await query(dataSql, dataParams);
  const patients = dataResult.rows.map(mapPatientRow);

  return { patients, total };
};

export const findById = async (id) => {
  const sql = `
    SELECT id, full_name, cin, phone, birth_date, address, created_at, deleted_at
    FROM patients
    WHERE id = $1 AND deleted_at IS NULL
    LIMIT 1;
  `;
  const result = await query(sql, [id]);
  return mapPatientRow(result.rows[0]);
};

export const findByIdWithAppointments = async (id) => {
  const patient = await findById(id);
  if (!patient) return null;

  const appointmentsSql = `
    SELECT 
      a.id, 
      a.appointment_date AS "appointmentDate", 
      a.status, 
      a.reason, 
      a.notes, 
      a.created_at AS "createdAt",
      u.name AS "createdByName",
      u.email AS "createdByEmail"
    FROM appointments a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.patient_id = $1
    ORDER BY a.appointment_date DESC;
  `;
  const appointmentsResult = await query(appointmentsSql, [id]);

  return {
    ...patient,
    appointments: appointmentsResult.rows,
  };
};

export const findByCin = async (cin, excludeId = null) => {
  let sql = `
    SELECT id, full_name, cin
    FROM patients
    WHERE LOWER(cin) = LOWER($1) AND deleted_at IS NULL
  `;
  const params = [cin.trim()];

  if (excludeId) {
    params.push(excludeId);
    sql += ` AND id != $2`;
  }

  sql += ` LIMIT 1;`;
  const result = await query(sql, params);
  return mapPatientRow(result.rows[0]);
};

export const update = async (id, { fullName, cin, phone, birthDate, address }) => {
  const sql = `
    UPDATE patients
    SET 
      full_name = $1,
      cin = $2,
      phone = $3,
      birth_date = $4,
      address = $5
    WHERE id = $6 AND deleted_at IS NULL
    RETURNING id, full_name, cin, phone, birth_date, address, created_at;
  `;
  const result = await query(sql, [
    fullName.trim(),
    cin.trim(),
    phone.trim(),
    birthDate,
    address ? address.trim() : null,
    id,
  ]);
  return mapPatientRow(result.rows[0]);
};

export const softDelete = async (id) => {
  const sql = `
    UPDATE patients
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id;
  `;
  const result = await query(sql, [id]);
  return result.rowCount > 0;
};
