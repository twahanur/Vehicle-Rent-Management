export interface Vehicle {
  id: number;
  name: string;
  plate_number: string;
  category: string;
  daily_rate: number;
  photo_path: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVehicleBody {
  name: string;
  plate_number: string;
  category: string;
  daily_rate: number;
}

export interface UpdateVehicleBody {
  name?: string;
  plate_number?: string;
  category?: string;
  daily_rate?: number;
}

export interface VehicleQueryFilter {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}
