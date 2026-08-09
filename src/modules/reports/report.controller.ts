import { Request, Response } from 'express';
import { reportService, ReportService } from './report.service.js';
import { MonthlyReportResponse, ReportQueryFilter } from './report.types.js';
import { ApiSuccess } from '../../common/types/api-response.types.js';

export class ReportController {
  constructor(private service: ReportService = reportService) {}

  getMonthlyReport = async (
    req: Request,
    res: Response<ApiSuccess<MonthlyReportResponse>>,
  ): Promise<void> => {
    const filter: ReportQueryFilter = {
      month: req.query.month as string,
      vehicle_id: req.query.vehicle_id ? Number(req.query.vehicle_id) : undefined,
    };
    const report = await this.service.getMonthlyReport(filter);
    res.status(200).json({
      success: true,
      data: report,
    });
  };
}

export const reportController = new ReportController();
