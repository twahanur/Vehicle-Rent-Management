import { reportRepository, ReportRepository } from './report.repository.js';
import { MonthlyReportResponse, ReportQueryFilter } from './report.types.js';

export class ReportService {
  constructor(private repository: ReportRepository = reportRepository) {}

  async getMonthlyReport(filter: ReportQueryFilter): Promise<MonthlyReportResponse> {
    const vehicles = await this.repository.getMonthlyReportData(filter);

    let topVehicle = null;
    if (vehicles.length > 0 && vehicles[0].revenue > 0) {
      topVehicle = {
        id: vehicles[0].id,
        name: vehicles[0].name,
        revenue: vehicles[0].revenue,
      };
    }

    return {
      month: filter.month,
      vehicles,
      top_vehicle: topVehicle,
    };
  }
}

export const reportService = new ReportService();
