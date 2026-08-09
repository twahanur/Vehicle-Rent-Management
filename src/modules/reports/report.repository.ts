import { db } from '../../config/knex.js';
import { TABLES, RENTAL_STATUS } from '../../db/schema.js';
import { VehicleReportItem, ReportQueryFilter } from './report.types.js';

export class ReportRepository {
  async getMonthlyReportData(filter: ReportQueryFilter): Promise<VehicleReportItem[]> {
    const monthDateStr = `${filter.month}-01`;

    const sql = `
      WITH month_bounds AS (
        SELECT
          date_trunc('month', :monthDate::date)::date AS month_start,
          (date_trunc('month', :monthDate::date) + interval '1 month - 1 day')::date AS month_end
      ),
      clipped AS (
        SELECT
          r.id,
          r.vehicle_id,
          r.total_amount,
          r.start_date,
          r.end_date,
          GREATEST(r.start_date, mb.month_start) AS clip_start,
          LEAST(r.end_date, mb.month_end) AS clip_end
        FROM ${TABLES.RENTALS} r
        CROSS JOIN month_bounds mb
        WHERE r.status IN ('${RENTAL_STATUS.BOOKED}', '${RENTAL_STATUS.ONGOING}', '${RENTAL_STATUS.COMPLETED}')
          AND r.start_date <= mb.month_end
          AND r.end_date >= mb.month_start
      ),
      per_rental AS (
        SELECT
          id,
          vehicle_id,
          (clip_end - clip_start + 1) AS days_in_month,
          total_amount * (clip_end - clip_start + 1)::decimal / NULLIF(end_date - start_date + 1, 0) AS revenue_in_month
        FROM clipped
      )
      SELECT
        v.id,
        v.name,
        v.plate_number,
        v.category,
        COUNT(pr.id)::int AS total_bookings,
        COALESCE(SUM(pr.days_in_month), 0)::int AS days_rented,
        COALESCE(ROUND(SUM(pr.revenue_in_month), 2), 0)::float AS revenue
      FROM ${TABLES.VEHICLES} v
      LEFT JOIN per_rental pr ON pr.vehicle_id = v.id
      WHERE v.deleted_at IS NULL
        AND (:vehicleId::int IS NULL OR v.id = :vehicleId)
      GROUP BY v.id, v.name, v.plate_number, v.category
      ORDER BY revenue DESC, days_rented DESC, v.id ASC;
    `;

    const result = await db.raw(sql, {
      monthDate: monthDateStr,
      vehicleId: filter.vehicle_id || null,
    });

    return result.rows.map((row: any) => ({
      id: Number(row.id),
      name: row.name,
      plate_number: row.plate_number,
      category: row.category,
      total_bookings: Number(row.total_bookings),
      days_rented: Number(row.days_rented),
      revenue: Number(row.revenue),
    }));
  }
}

export const reportRepository = new ReportRepository();
