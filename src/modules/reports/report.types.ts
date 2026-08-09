export interface VehicleReportItem {
  id: number;
  name: string;
  plate_number: string;
  category: string;
  total_bookings: number;
  days_rented: number;
  revenue: number;
}

export interface MonthlyReportResponse {
  month: string;
  vehicles: VehicleReportItem[];
  top_vehicle: {
    id: number;
    name: string;
    revenue: number;
  } | null;
}

export interface ReportQueryFilter {
  month: string; // YYYY-MM
  vehicle_id?: number;
}
