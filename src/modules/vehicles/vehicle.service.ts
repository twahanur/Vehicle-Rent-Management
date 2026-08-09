import { vehicleRepository, VehicleRepository } from './vehicle.repository.js';
import { rentalRepository, RentalRepository } from '../rentals/rental.repository.js';
import { Vehicle, CreateVehicleBody, UpdateVehicleBody, VehicleQueryFilter } from './vehicle.types.js';
import { NotFoundError, ConflictError, ValidationError } from '../../common/errors/index.js';
import { PaginatedResult } from '../../common/utils/pagination.js';

export class VehicleService {
  constructor(
    private repository: VehicleRepository = vehicleRepository,
    private rRepository: RentalRepository = rentalRepository,
  ) {}

  async getAllVehicles(filter: VehicleQueryFilter): Promise<PaginatedResult<Vehicle>> {
    return this.repository.findAll(filter);
  }

  async getVehicleById(id: number): Promise<Vehicle> {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async getFleetSummary() {
    return this.repository.getFleetSummary();
  }

  async checkAvailability(id: number, startDateStr: string, endDateStr: string) {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid start_date or end_date format');
    }
    if (start > end) {
      throw new ValidationError('start_date cannot be after end_date');
    }

    const overlaps = await this.rRepository.findOverlapping(id, startDateStr, endDateStr);
    const isAvailable = overlaps.length === 0;

    return {
      vehicle_id: vehicle.id,
      vehicle_name: vehicle.name,
      daily_rate: vehicle.daily_rate,
      start_date: startDateStr,
      end_date: endDateStr,
      is_available: isAvailable,
      conflicting_rentals_count: overlaps.length,
    };
  }

  async createVehicle(data: CreateVehicleBody, photoPath?: string): Promise<Vehicle> {
    const existing = await this.repository.findByPlateNumber(data.plate_number);
    if (existing) {
      throw new ConflictError(`Vehicle with plate number '${data.plate_number}' already exists`);
    }

    return this.repository.create({
      ...data,
      photo_path: photoPath || null,
    });
  }

  async updateVehicle(id: number, data: UpdateVehicleBody, photoPath?: string): Promise<Vehicle> {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }

    if (data.plate_number && data.plate_number !== vehicle.plate_number) {
      const existing = await this.repository.findByPlateNumber(data.plate_number, id);
      if (existing) {
        throw new ConflictError(`Vehicle with plate number '${data.plate_number}' already exists`);
      }
    }

    const updatePayload: UpdateVehicleBody & { photo_path?: string | null } = { ...data };
    if (photoPath !== undefined) {
      updatePayload.photo_path = photoPath;
    }

    const updated = await this.repository.update(id, updatePayload);
    if (!updated) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }
    return updated;
  }

  async deleteVehicle(id: number): Promise<void> {
    const deleted = await this.repository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }
  }
}

export const vehicleService = new VehicleService();
