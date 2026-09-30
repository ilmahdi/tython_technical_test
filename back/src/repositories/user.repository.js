import { query } from '../config/db.js';

export const findByEmail = async (email) => {
  const sql = `
    SELECT id, name, email, password_hash, role, created_at
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1;
  `;
  const result = await query(sql, [email.trim()]);
  return result.rows[0] || null;
};

export const findById = async (id) => {
  const sql = `
    SELECT id, name, email, role, created_at
    FROM users
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};
