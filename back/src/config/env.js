import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'app-db',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.POSTGRES_DB || 'app_db',
    user: process.env.POSTGRES_USER || 'app_user',
    password: process.env.POSTGRES_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'clinicflow_super_secret_jwt_key_2026_dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
};
