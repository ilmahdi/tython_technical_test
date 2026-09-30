import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Dashboard stats endpoint requires authentication
router.use(authenticate);

router.get('/stats', dashboardController.getStats);

export default router;
