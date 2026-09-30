import * as appointmentService from '../services/appointment.service.js';

export const create = async (req, res, next) => {
  try {
    const appointmentData = {
      ...req.body,
      createdBy: req.user.id,
    };
    const appointment = await appointmentService.createAppointment(appointmentData);
    res.status(201).json({
      success: true,
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const { date, status } = req.query;
    const appointments = await appointmentService.listAppointments({ date, status });
    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const appointment = await appointmentService.updateAppointmentStatus(id, status);
    res.status(200).json({
      success: true,
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};
