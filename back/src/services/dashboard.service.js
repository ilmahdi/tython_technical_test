import * as dashboardRepo from '../repositories/dashboard.repository.js';

export const getDashboardStats = async () => {
  return await dashboardRepo.getStatistics();
};
