import { db } from '../../config/knex.js';
import { acquireLock, releaseLock } from '../../config/redis.js';
import { rentalRepository, RentalRepository } from './rental.repository.js';
import { vehicleRepository, VehicleRepository } from '../vehicles/vehicle.repository.js';
import { Rental, CreateRentalBody, UpdateRentalBody, RentalQueryFilter } from './rental.types.js';
import { NotFoundError, ConflictError, ValidationError } from '../../common/errors/index.js';
import { PaginatedResult } from '../../common/utils/pagination.js';

export class RentalService {
  constructor(
    private repository: RentalRepository = rentalRepository,
    private vRepository: VehicleRepository = vehicleRepository,
  ) {}

  async getAllRentals(filter: RentalQueryFilter): Promise<PaginatedResult<Rental>> {
    return this.repository.findAll(filter);
  }

  async getRentalById(id: number): Promise<Rental> {
    const rental = await this.repository.findById(id);
    if (!rental) {
      throw new NotFoundError(`Rental with ID ${id} not found`);
    }
    return rental;
  }

  async createRental(data: CreateRentalBody): Promise<Rental> {
    this.validateDates(data.start_date, data.end_date);

    const vehicle = await this.vRepository.findById(data.vehicle_id);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID ${data.vehicle_id} not found`);
    }

    const totalAmount = this.calculateTotalAmount(data.start_date, data.end_date, vehicle.daily_rate);

    // 1. Acquire Redis Distributed Lock for the targeted vehicle
    const lockKey = `lock:vehicle:${data.vehicle_id}`;
    const lockVal = await acquireLock(lockKey, 5000);

    if (!lockVal) {
      throw new ConflictError('Vehicle is currently being booked by another process. Please try again.');
    }

    try {
      // 2. Perform DB Transaction with Overlap Check & Execution
      return await db.transaction(async (trx) => {
        const conflicts = await this.repository.findOverlapping(
          data.vehicle_id,
          data.start_date,
          data.end_date,
          undefined,
          trx,
        );

        if (conflicts.length > 0) {
          throw new ConflictError('Vehicle is already booked for the selected date range');
        }

        return this.repository.create(
          {
            ...data,
            total_amount: totalAmount,
            status: 'booked',
          },
          trx,
        );
      });
    } finally {
      // 3. Always release Redis Lock
      await releaseLock(lockKey, lockVal);
    }
  }

  async updateRental(id: number, data: UpdateRentalBody): Promise<Rental> {
    const currentRental = await this.repository.findById(id);
    if (!currentRental) {
      throw new NotFoundError(`Rental with ID ${id} not found`);
    }

    const vehicleId = data.vehicle_id || currentRental.vehicle_id;
    const startDate = data.start_date || currentRental.start_date;
    const endDate = data.end_date || currentRental.end_date;
    const status = data.status || currentRental.status;

    this.validateDates(startDate, endDate);

    const vehicle = await this.vRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID ${vehicleId} not found`);
    }

    const datesOrVehicleChanged =
      vehicleId !== currentRental.vehicle_id ||
      startDate !== currentRental.start_date ||
      endDate !== currentRental.end_date ||
      status !== currentRental.status;

    const totalAmount = this.calculateTotalAmount(startDate, endDate, vehicle.daily_rate);

    const lockKey = `lock:vehicle:${vehicleId}`;
    const lockVal = await acquireLock(lockKey, 5000);

    if (!lockVal) {
      throw new ConflictError('Vehicle is currently being updated by another process. Please try again.');
    }

    try {
      return await db.transaction(async (trx) => {
        if (datesOrVehicleChanged && (status === 'booked' || status === 'ongoing')) {
          const conflicts = await this.repository.findOverlapping(
            vehicleId,
            startDate,
            endDate,
            id,
            trx,
          );

          if (conflicts.length > 0) {
            throw new ConflictError('Vehicle is already booked for the selected date range');
          }
        }

        const updated = await this.repository.update(
          id,
          {
            ...data,
            total_amount: totalAmount,
          },
          trx,
        );

        if (!updated) {
          throw new NotFoundError(`Rental with ID ${id} not found`);
        }
        return updated;
      });
    } finally {
      await releaseLock(lockKey, lockVal);
    }
  }

  async updateRentalStatus(id: number, status: string): Promise<Rental> {
    const currentRental = await this.repository.findById(id);
    if (!currentRental) {
      throw new NotFoundError(`Rental with ID ${id} not found`);
    }

    const updated = await this.repository.update(id, { status: status as any });
    if (!updated) {
      throw new NotFoundError(`Rental with ID ${id} not found`);
    }
    return updated;
  }

  async deleteRental(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Rental with ID ${id} not found`);
    }
  }

  private validateDates(startDateStr: string, endDateStr: string): void {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid date format provided');
    }

    if (start > end) {
      throw new ValidationError('start_date cannot be after end_date');
    }
  }

  private calculateTotalAmount(startDateStr: string, endDateStr: string, dailyRate: number): number {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.round(days * dailyRate * 100) / 100;
  }
}

export const rentalService = new RentalService();
