import * as dashboardService from '../services/dashboard.service.js';

export const getStats = async (_req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
