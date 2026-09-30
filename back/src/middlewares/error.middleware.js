import { config } from '../config/env.js';

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = config.nodeEnv === 'production';

  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(err.details && { details: err.details }),
      ...(!isProduction && statusCode === 500 && { stack: err.stack }),
    },
  };

  if (statusCode === 500) {
    console.error('Unhandled Application Error:', err);
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    },
  });
};
