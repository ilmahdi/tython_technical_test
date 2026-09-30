import * as patientService from '../services/patient.service.js';

export const create = async (req, res, next) => {
  try {
    const patient = await patientService.createPatient(req.body);
    res.status(201).json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const result = await patientService.listPatients({ search, page, limit });
    res.status(200).json({
      success: true,
      data: result.patients,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    res.status(200).json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await patientService.deletePatient(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
