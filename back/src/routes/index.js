import { Router } from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import appointmentRoutes from './appointment.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

// Health check under /api/health
router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Authentication routes
router.use('/auth', authRoutes);

// Patient management routes
router.use('/patients', patientRoutes);

// Appointment management routes
router.use('/appointments', appointmentRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

export default router;
