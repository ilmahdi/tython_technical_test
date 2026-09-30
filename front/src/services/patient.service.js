import { api } from './api.js';

export const patientService = {
  getPatients: async ({ search = '', page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const res = await api.get(`/patients?${params.toString()}`);
    return {
      patients: res.data,
      pagination: res.pagination,
    };
  },

  getPatientById: async (id) => {
    const res = await api.get(`/patients/${id}`);
    return res.data.patient;
  },

  createPatient: async (patientData) => {
    const res = await api.post('/patients', patientData);
    return res.data.patient;
  },

  updatePatient: async (id, patientData) => {
    const res = await api.put(`/patients/${id}`, patientData);
    return res.data.patient;
  },

  deletePatient: async (id) => {
    const res = await api.delete(`/patients/${id}`);
    return res;
  },
};
