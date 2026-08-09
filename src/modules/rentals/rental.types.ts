export type RentalStatus = 'booked' | 'ongoing' | 'completed' | 'cancelled';

export interface Rental {
  id: number;
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  total_amount: number;
  status: RentalStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRentalBody {
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
}

export interface UpdateRentalBody {
  vehicle_id?: number;
  customer_name?: string;
  customer_phone?: string;
  start_date?: string;
  end_date?: string;
  status?: RentalStatus;
}

export interface RentalQueryFilter {
  vehicle_id?: number;
  status?: RentalStatus;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}
