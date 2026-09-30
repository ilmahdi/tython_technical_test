import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createAppointmentSchema,
  listAppointmentsSchema,
  updateAppointmentStatusSchema,
} from '../validators/appointment.validator.js';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

router.post('/', validate(createAppointmentSchema), appointmentController.create);
router.get('/', validate(listAppointmentsSchema), appointmentController.list);
router.patch('/:id/status', validate(updateAppointmentStatusSchema), appointmentController.updateStatus);

export default router;
