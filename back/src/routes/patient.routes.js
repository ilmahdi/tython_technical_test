import { Router } from 'express';
import * as patientController from '../controllers/patient.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createPatientSchema,
  listPatientsSchema,
  patientIdParamSchema,
  updatePatientSchema,
} from '../validators/patient.validator.js';

const router = Router();

// All patient endpoints require an authenticated user
router.use(authenticate);

router.post('/', validate(createPatientSchema), patientController.create);
router.get('/', validate(listPatientsSchema), patientController.list);
router.get('/:id', validate(patientIdParamSchema), patientController.getById);
router.put('/:id', validate(updatePatientSchema), patientController.update);
router.delete('/:id', authorize('admin'), validate(patientIdParamSchema), patientController.remove);

export default router;
