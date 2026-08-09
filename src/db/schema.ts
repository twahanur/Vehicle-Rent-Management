/**
 * Centralized PostgreSQL Database Schema Definitions
 * 
 * Single Source of Truth for Database Tables, Types, Enums, and Constants.
 */

export const TABLES = {
  STAFF: 'staff',
  VEHICLES: 'vehicles',
  RENTALS: 'rentals',
} as const;

export const RENTAL_STATUS = {
  BOOKED: 'booked',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type RentalStatus = (typeof RENTAL_STATUS)[keyof typeof RENTAL_STATUS];

export interface StaffTable {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface VehiclesTable {
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

export interface RentalsTable {
  id: number;
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: RentalStatus;
  created_at: Date;
  updated_at: Date;
}

// Augment Knex module to map database tables automatically
declare module 'knex/types/tables' {
  interface Tables {
    staff: StaffTable;
    vehicles: VehiclesTable;
    rentals: RentalsTable;
  }
}
