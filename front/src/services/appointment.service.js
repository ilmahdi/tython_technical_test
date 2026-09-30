import { api } from './api.js';

export const appointmentService = {
  getAppointments: async ({ date, status } = {}) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (status) params.append('status', status);

    const qs = params.toString();
    const endpoint = qs ? `/appointments?${qs}` : '/appointments';
    const res = await api.get(endpoint);
    return res.data;
  },

  createAppointment: async (appointmentData) => {
    const res = await api.post('/appointments', appointmentData);
    return res.data.appointment;
  },

  updateStatus: async (id, status) => {
    const res = await api.patch(`/appointments/${id}/status`, { status });
    return res.data.appointment;
  },
};
