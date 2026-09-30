import { query } from '../config/db.js';

export const getStatistics = async () => {
  const sql = `
    SELECT
      (SELECT COUNT(*)::int FROM patients WHERE deleted_at IS NULL) AS "totalPatients",
      (SELECT COUNT(*)::int FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE) AS "todayAppointments",
      (SELECT COUNT(*)::int FROM appointments WHERE status = 'pending') AS "pendingAppointments",
      (SELECT COUNT(*)::int FROM appointments WHERE status = 'confirmed') AS "confirmedAppointments";
  `;
  const result = await query(sql);
  const row = result.rows[0];

  return {
    totalPatients: Number(row.totalPatients) || 0,
    todayAppointments: Number(row.todayAppointments) || 0,
    pendingAppointments: Number(row.pendingAppointments) || 0,
    confirmedAppointments: Number(row.confirmedAppointments) || 0,
  };
};
