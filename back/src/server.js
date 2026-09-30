import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { pool } from './config/db.js';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './docs/openapi.js';

import apiRoutes from './routes/index.js';

export const app = express();

// Security and standard middlewares
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '1mb' }));

// Base healthcheck for container health check
app.get('/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'ok' });
  } catch (_error) {
    response.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

// Swagger Interactive API Documentation
app.get('/api/docs.json', (_req, res) => res.json(openApiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// API Routes (including /api/health and /api/auth)
app.use('/api', apiRoutes);

// 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if not imported by test runner
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`ClinicFlow backend listening on port ${config.port}`);
  });

  const shutdown = async () => {
    if (server) server.close();
    await pool.end();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
