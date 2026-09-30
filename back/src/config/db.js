import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

export const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();
