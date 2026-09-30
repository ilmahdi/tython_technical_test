import * as patientRepo from '../repositories/patient.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export const createPatient = async (patientData) => {
  const existing = await patientRepo.findByCin(patientData.cin);
  if (existing) {
    throw new ConflictError(`A patient with CIN '${patientData.cin}' already exists`);
  }

  return await patientRepo.create(patientData);
};

export const listPatients = async ({ search, page = 1, limit = 10 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const { patients, total } = await patientRepo.findAll({
    search,
    page: pageNum,
    limit: limitNum,
  });
  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    patients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
  };
};

export const getPatientById = async (id) => {
  const patient = await patientRepo.findByIdWithAppointments(id);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }

  return patient;
};

export const updatePatient = async (id, updateData) => {
  const existingPatient = await patientRepo.findById(id);
  if (!existingPatient) {
    throw new NotFoundError('Patient not found');
  }

  const cinConflict = await patientRepo.findByCin(updateData.cin, id);
  if (cinConflict) {
    throw new ConflictError(`Another patient already uses CIN '${updateData.cin}'`);
  }

  return await patientRepo.update(id, updateData);
};

export const deletePatient = async (id) => {
  const existingPatient = await patientRepo.findById(id);
  if (!existingPatient) {
    throw new NotFoundError('Patient not found');
  }

  await patientRepo.softDelete(id);
  return { message: 'Patient deleted successfully' };
};
